import { describe, expect, it } from 'vitest'
import { createApp } from '../../src/app/create-app.js'
import { AppError } from '../../src/shared/errors/app-error.js'
import type { ContentOpportunity, ContentOpportunityRepository } from '@modules/module-07-content'
import type { CreatorProfile, CreatorRepository } from '@modules/module-06-creator-fit'
import type { DemandSignal, DemandSignalRepository } from '@modules/module-04-demand'
import { evaluateOpportunity, type OpportunityRepository, type StoredOpportunity } from '@modules/module-05-opportunity'
import type { ExternalIdentityAuthenticator, IdentityContextRepository, MembershipRole, ResolvedIdentityContext } from '@modules/module-15-identity'
import { candidate } from '../fixtures/opportunity-candidates.js'

const app = createApp()
const CONTENT_ID = '11111111-1111-4111-8111-111111111111'
const WORKSPACE_A = '22222222-2222-4222-8222-222222222222'
const OPPORTUNITY_ID = '33333333-3333-4333-8333-333333333333'
const CREATOR_ID = '44444444-4444-4444-8444-444444444444'
const DEMAND_ID = '55555555-5555-4555-8555-555555555555'
const WORKSPACE_B = '66666666-6666-4666-8666-666666666666'
const ISO = '2026-09-03T10:00:00.000Z'
const payload = {
  opportunityId: OPPORTUNITY_ID, title: 'Shoe care demo', primaryAngle: 'DEMONSTRATION', secondaryAngles: ['REVIEW'],
  targetAudience: { audienceSegments: ['young_adults'], audienceInterests: ['sneakers'], painPoints: ['dirty shoes'], desiredOutcome: 'clean shoes' },
  contentFormats: ['demo'],
  creatorRequirements: { niches: ['lifestyle'], productCategories: ['shoe care'], audienceSegments: ['young_adults'], contentFormats: ['demo'], capabilityRequirements: [{ type: 'product_demonstration', minimumLevel: 3 }], requiresSample: true, minimumBudget: 'low', affiliateRequired: true, minimumAvailability: 'limited' },
  executionConstraints: { requiresSample: true, minimumBudget: 'low', affiliateRequired: true, minimumAvailability: 'limited' },
  demandSignalIds: [DEMAND_ID], status: 'ready',
}
const creator: CreatorProfile = {
  id: CREATOR_ID, workspaceId: WORKSPACE_A, creatorRef: 'creator-1', displayName: 'Creator', platform: 'tiktok',
  primaryNiche: 'lifestyle', secondaryNiches: ['fashion'], productCategories: ['shoe care'], audienceSegments: ['young_adults'], audienceInterests: ['sneakers'],
  contentFormats: ['demo'], capabilities: [{ type: 'product_demonstration', level: 4 }], affiliateCapability: 'experienced', availability: 'available', budgetMode: 'medium', sampleAccess: true,
  evidenceSource: 'verified_record', evidenceConfidence: 'high', createdAt: ISO, updatedAt: ISO,
}
const demand: DemandSignal = {
  id: DEMAND_ID, workspaceId: WORKSPACE_A, problem: 'Dirty shoes', audience: 'Young adults', category: 'shoe care', signalType: 'commercial_intent', signalValue: 100,
  sourceType: 'user_input', sourceRef: 'research-1', observedAt: ISO, confidence: 'high', evidence: 'Repeated explicit demand', canonicalProblem: 'dirty shoes', collectedAt: ISO,
  demandScore: 85.5, status: 'OPPORTUNITY_READY', fingerprint: 'abc', createdAt: ISO, updatedAt: ISO,
}
function opportunity(workspaceId = WORKSPACE_A): StoredOpportunity {
  const input = candidate()
  return { id: OPPORTUNITY_ID, workspace_id: workspaceId, status: 'active', input, evaluation: evaluateOpportunity(input, ISO), created_at: ISO, updated_at: ISO }
}
class MemoryContentRepository implements ContentOpportunityRepository {
  constructor(readonly records: ContentOpportunity[] = []) {}
  async create(record: Omit<ContentOpportunity, 'id'>) { const value = { ...record, id: CONTENT_ID }; this.records.push(value); return value }
  async findById(workspaceId: string, id: string) { return this.records.find((item) => item.workspaceId === workspaceId && item.id === id) ?? null }
  async list(workspaceId: string, limit: number) { return this.records.filter((item) => item.workspaceId === workspaceId).slice(0, limit) }
}
class MemoryOpportunityRepository implements OpportunityRepository {
  constructor(private readonly records = [opportunity()]) {}
  async create(): Promise<StoredOpportunity> { throw new Error('not used') }
  async findById(workspaceId: string, id: string) { return this.records.find((item) => item.workspace_id === workspaceId && item.id === id) ?? null }
  async findByRef(workspaceId: string, ref: string) { return this.records.find((item) => item.workspace_id === workspaceId && item.input.candidate_ref === ref) ?? null }
  async list(workspaceId: string, limit: number) { return this.records.filter((item) => item.workspace_id === workspaceId).slice(0, limit) }
  async transition() { return null }
}
class MemoryDemandRepository implements DemandSignalRepository {
  constructor(private readonly records = [demand]) {}
  async create(): Promise<DemandSignal> { throw new Error('not used') }
  async findById(workspaceId: string, id: string) { return this.records.find((item) => item.workspaceId === workspaceId && item.id === id) ?? null }
  async list(workspaceId: string, limit: number) { return this.records.filter((item) => item.workspaceId === workspaceId).slice(0, limit) }
}
class MemoryCreatorRepository implements CreatorRepository {
  constructor(private readonly records = [creator]) {}
  async create(): Promise<CreatorProfile> { throw new Error('not used') }
  async findById(workspaceId: string, id: string) { return this.records.find((item) => item.workspaceId === workspaceId && item.id === id) ?? null }
  async list(workspaceId: string, limit: number) { return this.records.filter((item) => item.workspaceId === workspaceId).slice(0, limit) }
}
function context(role: MembershipRole = 'owner'): ResolvedIdentityContext {
  const accountId = `account-${role}`
  return {
    authenticatedIdentity: { provider: 'clerk', subject: `user_${role}` },
    account: { id: accountId, displayName: role, status: 'active', createdAt: ISO, updatedAt: ISO },
    workspace: { id: WORKSPACE_A, name: 'A', slug: 'a', ownerAccountId: role === 'owner' ? accountId : 'owner', status: 'active', createdAt: ISO, updatedAt: ISO },
    membership: { id: `membership-${role}`, workspaceId: WORKSPACE_A, accountId, role, status: 'active', createdAt: ISO, updatedAt: ISO },
  }
}
const authenticator: ExternalIdentityAuthenticator = { authenticate: async (authorization) => {
  if (authorization !== 'Bearer clerk-valid') throw AppError.authRequired()
  return { provider: 'clerk', subject: 'task11' }
} }
function env(identity: ResolvedIdentityContext, contents = new MemoryContentRepository(), opportunities = new MemoryOpportunityRepository(), demands = new MemoryDemandRepository(), creators = new MemoryCreatorRepository()) {
  const identities: IdentityContextRepository = { resolveOrProvision: async () => identity }
  return {
    NODE_ENV: 'test', LOG_LEVEL: 'error', DATABASE_URL: 'postgresql://USER:PASSWORD@HOST/DATABASE',
    CLERK_ISSUER: 'https://example.clerk.accounts.dev', CLERK_JWKS_URL: 'https://example.clerk.accounts.dev/.well-known/jwks.json',
    IDENTITY_AUTHENTICATOR: authenticator, IDENTITY_REPOSITORY: identities, CONTENT_OPPORTUNITY_REPOSITORY: contents,
    OPPORTUNITY_REPOSITORY: opportunities, DEMAND_REPOSITORY: demands, CREATOR_REPOSITORY: creators,
  }
}
function post(body: unknown, authorization = 'Bearer clerk-valid'): RequestInit {
  return { method: 'POST', headers: { authorization, 'content-type': 'application/json' }, body: JSON.stringify(body) }
}

describe('Task 11 content opportunity API', () => {
  it.each(['owner', 'admin', 'member'] as const)('creates, retrieves, lists, and evaluates for authorized %s', async (role) => {
    const contents = new MemoryContentRepository()
    const environment = env(context(role), contents)
    const created = await app.request('http://localhost/api/v1/content-opportunities', post(payload), environment)
    expect(created.status).toBe(201)
    expect(await created.json()).toMatchObject({ success: true, data: { contentOpportunity: { id: CONTENT_ID, workspaceId: WORKSPACE_A, confidence: 'high' } } })
    expect((await app.request(`http://localhost/api/v1/content-opportunities/${CONTENT_ID}`, { headers: { authorization: 'Bearer clerk-valid' } }, environment)).status).toBe(200)
    expect(await (await app.request('http://localhost/api/v1/content-opportunities', { headers: { authorization: 'Bearer clerk-valid' } }, environment)).json()).toMatchObject({ data: { count: 1 } })
    const evaluated = await app.request(`http://localhost/api/v1/content-opportunities/${CONTENT_ID}/evaluate`, post({ creatorId: CREATOR_ID }), environment)
    expect(evaluated.status).toBe(200)
    expect(await evaluated.json()).toMatchObject({ success: true, data: { evaluation: { classification: 'STRONG_OPPORTUNITY', policyVersion: 'content-opportunity-v1.0.0' } } })
  })

  it('returns canonical 422, 401, 403, and 404 errors without internals', async () => {
    const environment = env(context())
    expect((await app.request('http://localhost/api/v1/content-opportunities', post({ ...payload, primaryAngle: 'VIRAL' }), environment)).status).toBe(422)
    expect((await app.request('http://localhost/api/v1/content-opportunities', post(payload, 'Bearer invalid'), environment)).status).toBe(401)
    const suspended = context(); suspended.membership.status = 'suspended'
    const forbidden = await app.request('http://localhost/api/v1/content-opportunities', post(payload), env(suspended))
    expect(forbidden.status).toBe(403)
    expect(JSON.stringify(await forbidden.json())).not.toMatch(/postgres|stack|node_modules/i)
    expect((await app.request(`http://localhost/api/v1/content-opportunities/${CONTENT_ID}`, { headers: { authorization: 'Bearer clerk-valid' } }, environment)).status).toBe(404)
  })

  it('fails closed for cross-workspace content, opportunity, demand, and creator resources', async () => {
    const foreignContent = new MemoryContentRepository([{ ...(await new MemoryContentRepository().create({
      workspaceId: WORKSPACE_B, opportunityId: OPPORTUNITY_ID, title: 'foreign', primaryAngle: 'REVIEW', secondaryAngles: [],
      targetAudience: { audienceSegments: ['young_adults'], audienceInterests: [], painPoints: [], desiredOutcome: 'result' }, contentFormats: ['review'], creatorRequirements: {}, executionConstraints: {},
      evidence: [{ demandSignalId: DEMAND_ID, sourceType: 'user_input', observedAt: ISO, evidence: 'x', confidence: 'high', demandScore: 90 }], confidence: 'high', status: 'draft', createdAt: ISO, updatedAt: ISO,
    })) }])
    expect((await app.request(`http://localhost/api/v1/content-opportunities/${CONTENT_ID}`, { headers: { authorization: 'Bearer clerk-valid' } }, env(context(), foreignContent))).status).toBe(404)
    expect((await app.request('http://localhost/api/v1/content-opportunities', post(payload), env(context(), new MemoryContentRepository(), new MemoryOpportunityRepository([opportunity(WORKSPACE_B)])))).status).toBe(404)
    expect((await app.request('http://localhost/api/v1/content-opportunities', post(payload), env(context(), new MemoryContentRepository(), new MemoryOpportunityRepository(), new MemoryDemandRepository([{ ...demand, workspaceId: WORKSPACE_B }])))).status).toBe(404)
  })
})
