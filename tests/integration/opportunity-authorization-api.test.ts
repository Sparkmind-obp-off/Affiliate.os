import { describe, expect, it } from 'vitest'
import { createApp } from '../../src/app/create-app.js'
import { AppError } from '../../src/shared/errors/app-error.js'
import type {
  ExternalIdentityAuthenticator,
  IdentityContextRepository,
  MembershipRole,
  ResolvedIdentityContext,
} from '@modules/module-15-identity'
import type {
  CreateOpportunityRecord,
  OpportunityRepository,
  StoredOpportunity,
} from '@modules/module-05-opportunity'
import { SPEC_CARD_CANDIDATE } from '../fixtures/opportunity-candidates.js'

const app = createApp()
const WORKSPACE_A = '22222222-2222-4222-8222-222222222222'
const WORKSPACE_B = '55555555-5555-4555-8555-555555555555'

function identityContext(role: MembershipRole = 'owner'): ResolvedIdentityContext {
  const accountId = `account-${role}`
  return {
    authenticatedIdentity: { provider: 'clerk', subject: `user_${role}` },
    account: { id: accountId, displayName: role, status: 'active', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
    workspace: { id: WORKSPACE_A, name: 'Workspace A', slug: 'workspace-a', ownerAccountId: role === 'owner' ? accountId : 'account-owner', status: 'active', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
    membership: { id: `membership-${role}`, workspaceId: WORKSPACE_A, accountId, role, status: 'active', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  }
}

class TenantRepository implements OpportunityRepository {
  records: StoredOpportunity[] = []

  async create(record: CreateOpportunityRecord): Promise<StoredOpportunity> {
    const stored: StoredOpportunity = {
      id: crypto.randomUUID(), workspace_id: record.workspaceId, status: 'EVALUATED',
      input: record.input, evaluation: record.evaluation,
      created_at: record.evaluation.evaluated_at, updated_at: record.evaluation.evaluated_at,
    }
    this.records.push(stored)
    return stored
  }

  async findByRef(workspaceId: string, candidateRef: string): Promise<StoredOpportunity | null> {
    return this.records.find((item) => item.workspace_id === workspaceId && item.input.candidate_ref === candidateRef) ?? null
  }

  async list(workspaceId: string, limit: number): Promise<StoredOpportunity[]> {
    return this.records.filter((item) => item.workspace_id === workspaceId).slice(0, limit)
  }
}

const authenticator: ExternalIdentityAuthenticator = {
  authenticate: async (authorization) => {
    if (authorization !== 'Bearer clerk-valid') throw AppError.authRequired()
    return { provider: 'clerk', subject: 'user_task07' }
  },
}

function env(context: ResolvedIdentityContext, opportunities = new TenantRepository()) {
  const identities: IdentityContextRepository = { resolveOrProvision: async () => context }
  return {
    NODE_ENV: 'test', LOG_LEVEL: 'error',
    DATABASE_URL: 'postgresql://USER:PASSWORD@HOST/DATABASE',
    CLERK_ISSUER: 'https://example.clerk.accounts.dev',
    CLERK_JWKS_URL: 'https://example.clerk.accounts.dev/.well-known/jwks.json',
    IDENTITY_AUTHENTICATOR: authenticator,
    IDENTITY_REPOSITORY: identities,
    OPPORTUNITY_REPOSITORY: opportunities,
  }
}

function createRequest(extra: Record<string, unknown> = {}): RequestInit {
  return {
    method: 'POST',
    headers: { authorization: 'Bearer clerk-valid', 'content-type': 'application/json' },
    body: JSON.stringify({ candidate: SPEC_CARD_CANDIDATE, ...extra }),
  }
}

describe('Task 07 opportunity authorization integration', () => {
  it.each(['owner', 'admin', 'member'] as const)('allows %s operational opportunity access', async (role) => {
    const response = await app.request(
      'http://localhost/api/v1/affiliate/opportunities',
      createRequest(),
      env(identityContext(role)),
    )
    expect(response.status).toBe(201)
  })

  it('denies inactive account, workspace, and membership states', async () => {
    const cases: ResolvedIdentityContext[] = [
      { ...identityContext(), account: { ...identityContext().account, status: 'suspended' } },
      { ...identityContext(), workspace: { ...identityContext().workspace, status: 'suspended' } },
      { ...identityContext(), membership: { ...identityContext().membership, status: 'suspended' } },
    ]
    for (const context of cases) {
      const response = await app.request('http://localhost/api/v1/affiliate/opportunities', createRequest(), env(context))
      expect(response.status).toBe(403)
      expect(JSON.stringify(await response.json())).not.toMatch(/authorization|permission|role matrix|stack|postgres/i)
    }
  })

  it('ignores client-supplied role and permission overrides', async () => {
    const response = await app.request(
      'http://localhost/api/v1/affiliate/opportunities',
      createRequest({ role: 'owner', permission: 'workspace.manage' }),
      env(identityContext('member')),
    )
    expect(response.status).toBe(201)
  })

  it('does not expose another workspace resource through a manipulated reference', async () => {
    const repository = new TenantRepository()
    const evaluation = {
      candidate_ref: SPEC_CARD_CANDIDATE.candidate_ref,
      product_name: SPEC_CARD_CANDIDATE.product_name,
      evaluated_at: '2026-01-01T00:00:00.000Z',
      score: {}, decision: {}, priority: {}, explanation: {}, recommended_angle: {},
    } as unknown as StoredOpportunity['evaluation']
    repository.records.push({
      id: 'foreign', workspace_id: WORKSPACE_B, status: 'EVALUATED',
      input: SPEC_CARD_CANDIDATE, evaluation,
      created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
    })
    const response = await app.request(
      `http://localhost/api/v1/affiliate/opportunities/${SPEC_CARD_CANDIDATE.candidate_ref}`,
      { headers: { authorization: 'Bearer clerk-valid' } },
      env(identityContext('owner'), repository),
    )
    expect(response.status).toBe(404)
  })
})
