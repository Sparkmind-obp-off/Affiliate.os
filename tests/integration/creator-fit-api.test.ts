import { describe, expect, it } from 'vitest'
import { createApp } from '../../src/app/create-app.js'
import { AppError } from '../../src/shared/errors/app-error.js'
import type { CreatorProfile, CreatorRepository } from '@modules/module-06-creator-fit'
import {
  evaluateOpportunity,
  type OpportunityRepository,
  type StoredOpportunity,
} from '@modules/module-05-opportunity'
import type {
  ExternalIdentityAuthenticator,
  IdentityContextRepository,
  MembershipRole,
  ResolvedIdentityContext,
} from '@modules/module-15-identity'
import { candidate } from '../fixtures/opportunity-candidates.js'

const app = createApp()
const CREATOR_ID = '11111111-1111-4111-8111-111111111111'
const WORKSPACE_A = '22222222-2222-4222-8222-222222222222'
const OPPORTUNITY_ID = '33333333-3333-4333-8333-333333333333'
const WORKSPACE_B = '55555555-5555-4555-8555-555555555555'
const ISO = '2026-09-03T10:00:00.000Z'

const profilePayload = {
  creatorRef: 'creator-001', displayName: 'Shoe Lab', platform: 'tiktok', platformRef: '@shoelab',
  primaryNiche: 'lifestyle', secondaryNiches: ['fashion'], productCategories: ['shoe care'],
  audienceSegments: ['young_adults'], audienceInterests: ['sneakers'], contentFormats: ['faceless', 'demo'],
  capabilities: [{ type: 'product_demonstration', level: 4 }], affiliateCapability: 'experienced',
  availability: 'available', budgetMode: 'medium', sampleAccess: true,
  evidenceSource: 'verified_record', evidenceConfidence: 'high',
}
const fitPayload = {
  opportunityId: OPPORTUNITY_ID,
  criteria: {
    niches: ['lifestyle'], productCategories: ['shoe care'], audienceSegments: ['young_adults'],
    contentFormats: ['demo'], capabilityRequirements: [{ type: 'product_demonstration', minimumLevel: 3 }],
    requiresSample: true, minimumBudget: 'low', affiliateRequired: true, minimumAvailability: 'limited',
  },
}

class MemoryCreatorRepository implements CreatorRepository {
  constructor(readonly records: CreatorProfile[] = []) {}
  async create(profile: Omit<CreatorProfile, 'id'>): Promise<CreatorProfile> {
    if (this.records.some((item) => item.workspaceId === profile.workspaceId && item.creatorRef === profile.creatorRef)) throw { code: '23505' }
    const value = { ...profile, id: CREATOR_ID }
    this.records.push(value)
    return value
  }
  async findById(workspaceId: string, id: string) { return this.records.find((item) => item.workspaceId === workspaceId && item.id === id) ?? null }
  async list(workspaceId: string, limit: number) { return this.records.filter((item) => item.workspaceId === workspaceId).slice(0, limit) }
}

class MemoryOpportunityRepository implements OpportunityRepository {
  constructor(private readonly records: StoredOpportunity[]) {}
  async create(): Promise<StoredOpportunity> { throw new Error('not used') }
  async findByRef(workspaceId: string, ref: string) { return this.records.find((item) => item.workspace_id === workspaceId && item.input.candidate_ref === ref) ?? null }
  async findById(workspaceId: string, id: string) { return this.records.find((item) => item.workspace_id === workspaceId && item.id === id) ?? null }
  async list(workspaceId: string, limit: number) { return this.records.filter((item) => item.workspace_id === workspaceId).slice(0, limit) }
  async transition() { return null }
}

function storedOpportunity(workspaceId = WORKSPACE_A): StoredOpportunity {
  const input = candidate()
  return { id: OPPORTUNITY_ID, workspace_id: workspaceId, status: 'active', input, evaluation: evaluateOpportunity(input, ISO), created_at: ISO, updated_at: ISO }
}
function context(role: MembershipRole = 'owner'): ResolvedIdentityContext {
  const accountId = `account-${role}`
  return {
    authenticatedIdentity: { provider: 'clerk', subject: `user_${role}` },
    account: { id: accountId, displayName: role, status: 'active', createdAt: ISO, updatedAt: ISO },
    workspace: { id: WORKSPACE_A, name: 'Workspace A', slug: 'workspace-a', ownerAccountId: role === 'owner' ? accountId : 'account-owner', status: 'active', createdAt: ISO, updatedAt: ISO },
    membership: { id: `membership-${role}`, workspaceId: WORKSPACE_A, accountId, role, status: 'active', createdAt: ISO, updatedAt: ISO },
  }
}
const authenticator: ExternalIdentityAuthenticator = {
  authenticate: async (authorization) => {
    if (authorization !== 'Bearer clerk-valid') throw AppError.authRequired()
    return { provider: 'clerk', subject: 'user_task10' }
  },
}
function env(identity: ResolvedIdentityContext, creators: MemoryCreatorRepository, opportunities = new MemoryOpportunityRepository([storedOpportunity()])) {
  const identities: IdentityContextRepository = { resolveOrProvision: async () => identity }
  return {
    NODE_ENV: 'test', LOG_LEVEL: 'error', DATABASE_URL: 'postgresql://USER:PASSWORD@HOST/DATABASE',
    CLERK_ISSUER: 'https://example.clerk.accounts.dev', CLERK_JWKS_URL: 'https://example.clerk.accounts.dev/.well-known/jwks.json',
    IDENTITY_AUTHENTICATOR: authenticator, IDENTITY_REPOSITORY: identities,
    CREATOR_REPOSITORY: creators, OPPORTUNITY_REPOSITORY: opportunities,
  }
}
function post(body: unknown, authorization = 'Bearer clerk-valid'): RequestInit {
  return { method: 'POST', headers: { authorization, 'content-type': 'application/json' }, body: JSON.stringify(body) }
}

describe('Task 10 creator fit API', () => {
  it.each(['owner', 'admin', 'member'] as const)('creates, retrieves, lists, and evaluates fit for authorized %s', async (role) => {
    const creators = new MemoryCreatorRepository()
    const environment = env(context(role), creators)
    const createResponse = await app.request('http://localhost/api/v1/creators', post(profilePayload), environment)
    expect(createResponse.status).toBe(201)
    expect(await createResponse.json()).toMatchObject({ success: true, data: { creator: { id: CREATOR_ID, workspaceId: WORKSPACE_A } } })

    const getResponse = await app.request(`http://localhost/api/v1/creators/${CREATOR_ID}`, { headers: { authorization: 'Bearer clerk-valid' } }, environment)
    expect(getResponse.status).toBe(200)
    const listResponse = await app.request('http://localhost/api/v1/creators?limit=10', { headers: { authorization: 'Bearer clerk-valid' } }, environment)
    expect(await listResponse.json()).toMatchObject({ success: true, data: { count: 1 } })

    const fitResponse = await app.request(`http://localhost/api/v1/creators/${CREATOR_ID}/fit`, post(fitPayload), environment)
    expect(fitResponse.status).toBe(200)
    expect(await fitResponse.json()).toMatchObject({
      success: true,
      data: { fit: { creatorId: CREATOR_ID, opportunityId: OPPORTUNITY_ID, classification: 'STRONG_FIT', confidence: 'HIGH', score: 100 } },
    })
  })

  it('returns canonical validation, unauthenticated, forbidden, and not-found errors', async () => {
    const creators = new MemoryCreatorRepository()
    const environment = env(context(), creators)
    const invalid = await app.request('http://localhost/api/v1/creators', post({ ...profilePayload, platform: 'unknown' }), environment)
    expect(invalid.status).toBe(422)
    expect(await invalid.json()).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' }, meta: { request_id: expect.any(String) } })

    const unauthorized = await app.request('http://localhost/api/v1/creators', post(profilePayload, 'Bearer invalid'), environment)
    expect(unauthorized.status).toBe(401)

    const inactive = context()
    inactive.membership.status = 'suspended'
    const forbidden = await app.request('http://localhost/api/v1/creators', post(profilePayload), env(inactive, creators))
    expect(forbidden.status).toBe(403)
    expect(JSON.stringify(await forbidden.json())).not.toMatch(/postgres|stack|node_modules/i)

    const missing = await app.request(`http://localhost/api/v1/creators/${CREATOR_ID}`, { headers: { authorization: 'Bearer clerk-valid' } }, environment)
    expect(missing.status).toBe(404)
  })

  it('denies cross-workspace creator retrieval and fit evaluation at both repository boundaries', async () => {
    const foreignCreator: CreatorProfile = {
      ...(profilePayload as Omit<CreatorProfile, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>),
      id: CREATOR_ID, workspaceId: WORKSPACE_B, createdAt: ISO, updatedAt: ISO,
    }
    const creators = new MemoryCreatorRepository([foreignCreator])
    const creatorDenied = await app.request(`http://localhost/api/v1/creators/${CREATOR_ID}`, { headers: { authorization: 'Bearer clerk-valid' } }, env(context(), creators))
    expect(creatorDenied.status).toBe(404)

    creators.records[0] = { ...foreignCreator, workspaceId: WORKSPACE_A }
    const opportunityDenied = await app.request(
      `http://localhost/api/v1/creators/${CREATOR_ID}/fit`,
      post(fitPayload),
      env(context(), creators, new MemoryOpportunityRepository([storedOpportunity(WORKSPACE_B)])),
    )
    expect(opportunityDenied.status).toBe(404)
  })
})
