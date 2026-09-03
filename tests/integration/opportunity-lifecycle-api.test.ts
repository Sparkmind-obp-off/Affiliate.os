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
  OpportunityStatus,
  StoredOpportunity,
} from '@modules/module-05-opportunity'
import { SPEC_CARD_CANDIDATE } from '../fixtures/opportunity-candidates.js'

const app = createApp()
const ID = '11111111-1111-4111-8111-111111111111'
const WORKSPACE_A = '22222222-2222-4222-8222-222222222222'
const WORKSPACE_B = '55555555-5555-4555-8555-555555555555'
const ISO = '2026-01-01T00:00:00.000Z'

function context(role: MembershipRole = 'owner'): ResolvedIdentityContext {
  const accountId = `account-${role}`
  return {
    authenticatedIdentity: { provider: 'clerk', subject: `user_${role}` },
    account: { id: accountId, displayName: role, status: 'active', createdAt: ISO, updatedAt: ISO },
    workspace: { id: WORKSPACE_A, name: 'Workspace A', slug: 'workspace-a', ownerAccountId: role === 'owner' ? accountId : 'account-owner', status: 'active', createdAt: ISO, updatedAt: ISO },
    membership: { id: `membership-${role}`, workspaceId: WORKSPACE_A, accountId, role, status: 'active', createdAt: ISO, updatedAt: ISO },
  }
}

function stored(status: OpportunityStatus = 'draft', workspaceId = WORKSPACE_A): StoredOpportunity {
  return {
    id: ID,
    workspace_id: workspaceId,
    status,
    input: SPEC_CARD_CANDIDATE,
    evaluation: {
      candidate_ref: SPEC_CARD_CANDIDATE.candidate_ref,
      product_name: SPEC_CARD_CANDIDATE.product_name,
      evaluated_at: ISO,
      score: { total: 84, classification: 'STRONG' },
      decision: { decision: 'TEST_NOW', rule_id: 'R12_TEST_NOW' },
      priority: {}, explanation: {}, recommended_angle: {},
    } as StoredOpportunity['evaluation'],
    created_at: ISO,
    updated_at: ISO,
  }
}

class LifecycleRepository implements OpportunityRepository {
  constructor(public records: StoredOpportunity[]) {}
  async create(_record: CreateOpportunityRecord): Promise<StoredOpportunity> { throw new Error('not used') }
  async findByRef(workspaceId: string, ref: string) { return this.records.find((r) => r.workspace_id === workspaceId && r.input.candidate_ref === ref) ?? null }
  async findById(workspaceId: string, id: string) { return this.records.find((r) => r.workspace_id === workspaceId && r.id === id) ?? null }
  async list(workspaceId: string, limit: number) { return this.records.filter((r) => r.workspace_id === workspaceId).slice(0, limit) }
  async transition(workspaceId: string, id: string, from: OpportunityStatus, to: OpportunityStatus) {
    const record = this.records.find((r) => r.workspace_id === workspaceId && r.id === id && r.status === from)
    if (!record) return null
    record.status = to
    record.updated_at = '2026-01-02T00:00:00.000Z'
    return record
  }
}

const authenticator: ExternalIdentityAuthenticator = {
  authenticate: async (authorization) => {
    if (authorization !== 'Bearer clerk-valid') throw AppError.authRequired()
    return { provider: 'clerk', subject: 'user_task08' }
  },
}

function env(identity: ResolvedIdentityContext, repository: LifecycleRepository) {
  const identities: IdentityContextRepository = { resolveOrProvision: async () => identity }
  return {
    NODE_ENV: 'test', LOG_LEVEL: 'error',
    DATABASE_URL: 'postgresql://USER:PASSWORD@HOST/DATABASE',
    CLERK_ISSUER: 'https://example.clerk.accounts.dev',
    CLERK_JWKS_URL: 'https://example.clerk.accounts.dev/.well-known/jwks.json',
    IDENTITY_AUTHENTICATOR: authenticator,
    IDENTITY_REPOSITORY: identities,
    OPPORTUNITY_REPOSITORY: repository,
  }
}

function patch(status: string, authorization = 'Bearer clerk-valid'): RequestInit {
  return {
    method: 'PATCH',
    headers: { authorization, 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
  }
}

describe('Task 08 opportunity lifecycle API', () => {
  it.each(['owner', 'admin', 'member'] as const)('allows authorized %s lifecycle updates with a canonical response', async (role) => {
    const repository = new LifecycleRepository([stored()])
    const response = await app.request(`http://localhost/api/v1/affiliate/opportunities/${ID}`, patch('active'), env(context(role), repository))
    const body = (await response.json()) as { success: boolean; data: { opportunity: StoredOpportunity }; meta: { request_id: string } }
    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.opportunity.status).toBe('active')
    expect(body.meta.request_id).toBeTruthy()
  })

  it('returns safe canonical errors for invalid transitions and malformed status', async () => {
    const invalid = await app.request(`http://localhost/api/v1/affiliate/opportunities/${ID}`, patch('active'), env(context(), new LifecycleRepository([stored('completed')])))
    expect(invalid.status).toBe(409)
    expect(await invalid.json()).toMatchObject({ success: false, error: { code: 'CONFLICT' } })

    const malformed = await app.request(`http://localhost/api/v1/affiliate/opportunities/${ID}`, patch('won'), env(context(), new LifecycleRepository([stored()])))
    expect(malformed.status).toBe(422)
    expect(JSON.stringify(await malformed.json())).not.toMatch(/postgres|stack|node_modules|permission/i)
  })

  it('hides cross-tenant resources and ignores manipulated tenant identifiers', async () => {
    const repository = new LifecycleRepository([stored('draft', WORKSPACE_B)])
    const missing = await app.request(`http://localhost/api/v1/affiliate/opportunities/${ID}`, patch('active'), env(context(), repository))
    expect(missing.status).toBe(404)

    const manipulated = await app.request(`http://localhost/api/v1/affiliate/opportunities/${ID}`, {
      method: 'PATCH',
      headers: { authorization: 'Bearer clerk-valid', 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'active', workspace_id: WORKSPACE_B }),
    }, env(context(), new LifecycleRepository([stored()])))
    expect(manipulated.status).toBe(422)
  })

  it('fails closed for missing authentication and inactive authorization context', async () => {
    const repository = new LifecycleRepository([stored()])
    const unauthenticated = await app.request(`http://localhost/api/v1/affiliate/opportunities/${ID}`, patch('active', 'Bearer invalid'), env(context(), repository))
    expect(unauthenticated.status).toBe(401)

    const suspendedAccount = context()
    suspendedAccount.account.status = 'suspended'
    const suspendedWorkspace = context()
    suspendedWorkspace.workspace.status = 'suspended'
    const inactiveMembership = context()
    inactiveMembership.membership.status = 'suspended'
    for (const identity of [suspendedAccount, suspendedWorkspace, inactiveMembership]) {
      const response = await app.request(`http://localhost/api/v1/affiliate/opportunities/${ID}`, patch('active'), env(identity, new LifecycleRepository([stored()])))
      expect(response.status).toBe(403)
    }
  })
})
