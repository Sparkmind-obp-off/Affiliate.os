import { describe, expect, it } from 'vitest'
import { createApp } from '../../src/app/create-app.js'
import { AppError } from '../../src/shared/errors/app-error.js'
import type {
  DemandSignal,
  DemandSignalRepository,
} from '@modules/module-04-demand'
import type {
  ExternalIdentityAuthenticator,
  IdentityContextRepository,
  MembershipRole,
  ResolvedIdentityContext,
} from '@modules/module-15-identity'

const app = createApp()
const ID = '11111111-1111-4111-8111-111111111111'
const WORKSPACE_A = '22222222-2222-4222-8222-222222222222'
const WORKSPACE_B = '55555555-5555-4555-8555-555555555555'
const ISO = '2026-09-02T10:00:00.000Z'

const payload = {
  problem: 'Susah cari produk skincare untuk kulit sensitif!',
  audience: 'Adults with sensitive skin',
  category: 'Skincare',
  keyword: 'skincare kulit sensitif',
  signalType: 'commercial_intent' as const,
  signalValue: 95,
  sourceType: 'user_input' as const,
  sourceRef: 'interview-42',
  observedAt: ISO,
  confidence: 'very_high' as const,
  evidence: 'Six verified interviews explicitly requested a purchasable solution.',
}

class MemoryDemandRepository implements DemandSignalRepository {
  readonly records: DemandSignal[]

  constructor(records: DemandSignal[] = []) {
    this.records = records
  }

  async create(signal: Omit<DemandSignal, 'id'>): Promise<DemandSignal> {
    if (this.records.some((record) => (
      record.workspaceId === signal.workspaceId && record.fingerprint === signal.fingerprint
    ))) {
      throw { code: '23505' }
    }
    const created = { ...signal, id: this.records.length === 0 ? ID : crypto.randomUUID() }
    this.records.push(created)
    return created
  }

  async findById(workspaceId: string, id: string): Promise<DemandSignal | null> {
    return this.records.find((record) => record.workspaceId === workspaceId && record.id === id) ?? null
  }

  async list(workspaceId: string, limit: number): Promise<DemandSignal[]> {
    return this.records.filter((record) => record.workspaceId === workspaceId).slice(0, limit)
  }
}

function context(role: MembershipRole = 'owner'): ResolvedIdentityContext {
  const accountId = `account-${role}`
  return {
    authenticatedIdentity: { provider: 'clerk', subject: `user_${role}` },
    account: {
      id: accountId,
      displayName: role,
      status: 'active',
      createdAt: ISO,
      updatedAt: ISO,
    },
    workspace: {
      id: WORKSPACE_A,
      name: 'Workspace A',
      slug: 'workspace-a',
      ownerAccountId: role === 'owner' ? accountId : 'account-owner',
      status: 'active',
      createdAt: ISO,
      updatedAt: ISO,
    },
    membership: {
      id: `membership-${role}`,
      workspaceId: WORKSPACE_A,
      accountId,
      role,
      status: 'active',
      createdAt: ISO,
      updatedAt: ISO,
    },
  }
}

const authenticator: ExternalIdentityAuthenticator = {
  authenticate: async (authorization) => {
    if (authorization !== 'Bearer clerk-valid') throw AppError.authRequired()
    return { provider: 'clerk', subject: 'user_task09' }
  },
}

function env(identity: ResolvedIdentityContext, repository: MemoryDemandRepository) {
  const identities: IdentityContextRepository = { resolveOrProvision: async () => identity }
  return {
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    DATABASE_URL: 'postgresql://USER:PASSWORD@HOST/DATABASE',
    CLERK_ISSUER: 'https://example.clerk.accounts.dev',
    CLERK_JWKS_URL: 'https://example.clerk.accounts.dev/.well-known/jwks.json',
    IDENTITY_AUTHENTICATOR: authenticator,
    IDENTITY_REPOSITORY: identities,
    DEMAND_REPOSITORY: repository,
  }
}

function post(body: unknown, authorization = 'Bearer clerk-valid'): RequestInit {
  return {
    method: 'POST',
    headers: { authorization, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }
}

describe('Task 09 demand discovery API', () => {
  it.each(['owner', 'admin', 'member'] as const)(
    'creates, gets, and lists a tenant-owned signal for authorized %s',
    async (role) => {
      const repository = new MemoryDemandRepository()
      const environment = env(context(role), repository)
      const createdResponse = await app.request(
        'http://localhost/api/v1/demand/signals',
        post(payload),
        environment,
      )
      const created = (await createdResponse.json()) as {
        success: boolean
        data: { signal: DemandSignal }
        meta: { request_id: string }
      }
      expect(createdResponse.status).toBe(201)
      expect(created.success).toBe(true)
      expect(created.data.signal).toMatchObject({
        id: ID,
        workspaceId: WORKSPACE_A,
        canonicalProblem: 'susah cari produk skincare untuk kulit sensitif',
        status: 'OPPORTUNITY_READY',
      })
      expect(created.meta.request_id).toBeTruthy()

      const getResponse = await app.request(
        `http://localhost/api/v1/demand/signals/${ID}`,
        { headers: { authorization: 'Bearer clerk-valid' } },
        environment,
      )
      expect(getResponse.status).toBe(200)
      expect(await getResponse.json()).toMatchObject({
        success: true,
        data: { signal: { id: ID, workspaceId: WORKSPACE_A } },
      })

      const listResponse = await app.request(
        'http://localhost/api/v1/demand/signals?limit=10',
        { headers: { authorization: 'Bearer clerk-valid' } },
        environment,
      )
      expect(listResponse.status).toBe(200)
      expect(await listResponse.json()).toMatchObject({
        success: true,
        data: { count: 1, signals: [{ id: ID, workspaceId: WORKSPACE_A }] },
      })
    },
  )

  it('returns canonical validation errors for malformed input and excessive limits', async () => {
    const environment = env(context(), new MemoryDemandRepository())
    const malformed = await app.request(
      'http://localhost/api/v1/demand/signals',
      post({ ...payload, signalValue: 101, workspace_id: WORKSPACE_B }),
      environment,
    )
    expect(malformed.status).toBe(422)
    expect(await malformed.json()).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    })

    const excessive = await app.request(
      'http://localhost/api/v1/demand/signals?limit=101',
      { headers: { authorization: 'Bearer clerk-valid' } },
      environment,
    )
    expect(excessive.status).toBe(422)
  })

  it('returns a deterministic conflict for duplicate submissions', async () => {
    const repository = new MemoryDemandRepository()
    const environment = env(context(), repository)
    expect((await app.request('http://localhost/api/v1/demand/signals', post(payload), environment)).status)
      .toBe(201)
    const duplicate = await app.request(
      'http://localhost/api/v1/demand/signals',
      post(payload),
      environment,
    )
    expect(duplicate.status).toBe(409)
    expect(await duplicate.json()).toMatchObject({
      success: false,
      error: { code: 'CONFLICT' },
    })
  })

  it('hides cross-tenant resources and never trusts a client workspace id', async () => {
    const foreign = {
      id: ID,
      workspaceId: WORKSPACE_B,
      ...payload,
      canonicalProblem: 'susah cari produk skincare untuk kulit sensitif',
      collectedAt: ISO,
      demandScore: 90.25,
      status: 'OPPORTUNITY_READY' as const,
      fingerprint: 'f'.repeat(64),
      createdAt: ISO,
      updatedAt: ISO,
    }
    const repository = new MemoryDemandRepository([foreign])
    const environment = env(context(), repository)
    const getResponse = await app.request(
      `http://localhost/api/v1/demand/signals/${ID}`,
      { headers: { authorization: 'Bearer clerk-valid' } },
      environment,
    )
    expect(getResponse.status).toBe(404)

    const listResponse = await app.request(
      'http://localhost/api/v1/demand/signals',
      { headers: { authorization: 'Bearer clerk-valid' } },
      environment,
    )
    expect(await listResponse.json()).toMatchObject({ data: { count: 0, signals: [] } })

    const manipulated = await app.request(
      'http://localhost/api/v1/demand/signals',
      post({ ...payload, workspace_id: WORKSPACE_B }),
      environment,
    )
    expect(manipulated.status).toBe(422)
  })

  it('fails closed for unauthenticated and inactive identity contexts', async () => {
    const repository = new MemoryDemandRepository()
    const unauthenticated = await app.request(
      'http://localhost/api/v1/demand/signals',
      post(payload, 'Bearer invalid'),
      env(context(), repository),
    )
    expect(unauthenticated.status).toBe(401)

    const suspendedAccount = context()
    suspendedAccount.account.status = 'suspended'
    const suspendedWorkspace = context()
    suspendedWorkspace.workspace.status = 'suspended'
    const inactiveMembership = context()
    inactiveMembership.membership.status = 'suspended'
    for (const identity of [suspendedAccount, suspendedWorkspace, inactiveMembership]) {
      const response = await app.request(
        'http://localhost/api/v1/demand/signals',
        post(payload),
        env(identity, new MemoryDemandRepository()),
      )
      expect(response.status).toBe(403)
      expect(JSON.stringify(await response.json())).not.toMatch(/postgres|stack|node_modules|permission/i)
    }
  })
})
