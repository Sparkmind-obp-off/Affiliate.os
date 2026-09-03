import { describe, expect, it } from 'vitest'
import { createApp } from '../../src/app/create-app.js'
import { AppError } from '../../src/shared/errors/app-error.js'
import type { ContentOpportunity, ContentOpportunityRepository } from '@modules/module-07-content'
import type { CreatorProfile, CreatorRepository } from '@modules/module-06-creator-fit'
import type {
  ContentGeneration,
  ContentGenerationRepository,
  GenerationProvider,
} from '@modules/module-08-content-generation'
import type {
  ExternalIdentityAuthenticator,
  IdentityContextRepository,
  MembershipRole,
  ResolvedIdentityContext,
} from '@modules/module-15-identity'

const app = createApp()
const GENERATION_ID = '11111111-1111-4111-8111-111111111111'
const WORKSPACE_A = '22222222-2222-4222-8222-222222222222'
const CONTENT_ID = '33333333-3333-4333-8333-333333333333'
const OPPORTUNITY_ID = '44444444-4444-4444-8444-444444444444'
const CREATOR_ID = '55555555-5555-4555-8555-555555555555'
const DEMAND_ID = '66666666-6666-4666-8666-666666666666'
const WORKSPACE_B = '77777777-7777-4777-8777-777777777777'
const ISO = '2026-09-03T10:00:00.000Z'
const payload = {
  contentOpportunityId: CONTENT_ID, creatorId: CREATOR_ID, contentType: 'SCRIPT', format: 'demo',
  language: 'id', targetLength: 500, hook: 'Sepatu kotor?', callToAction: 'Coba sekarang',
  generationInstructions: 'Tulis skrip demonstrasi yang faktual.',
}
const content: ContentOpportunity = {
  id: CONTENT_ID, workspaceId: WORKSPACE_A, opportunityId: OPPORTUNITY_ID, title: 'Shoe care demo',
  primaryAngle: 'DEMONSTRATION', secondaryAngles: ['REVIEW'],
  targetAudience: { audienceSegments: ['young_adults'], audienceInterests: ['sneakers'], painPoints: ['dirty shoes'], desiredOutcome: 'clean shoes' },
  contentFormats: ['demo'], creatorRequirements: {}, executionConstraints: {},
  evidence: [{ demandSignalId: DEMAND_ID, sourceType: 'user_input', observedAt: ISO, evidence: 'Demand', confidence: 'high', demandScore: 90 }],
  confidence: 'high', status: 'ready', createdAt: ISO, updatedAt: ISO,
}
const creator: CreatorProfile = {
  id: CREATOR_ID, workspaceId: WORKSPACE_A, creatorRef: 'creator', displayName: 'Creator', platform: 'tiktok',
  primaryNiche: 'lifestyle', secondaryNiches: [], productCategories: [], audienceSegments: ['young_adults'],
  audienceInterests: [], contentFormats: ['demo'], capabilities: [], affiliateCapability: 'experienced',
  availability: 'available', budgetMode: 'low', sampleAccess: true, evidenceSource: 'verified_record',
  evidenceConfidence: 'high', createdAt: ISO, updatedAt: ISO,
}
class MemoryGenerationRepository implements ContentGenerationRepository {
  constructor(readonly records: ContentGeneration[] = []) {}
  async create(record: Omit<ContentGeneration, 'id'>) { const value = { ...record, id: GENERATION_ID }; this.records.push(value); return value }
  async findById(workspaceId: string, id: string) { return this.records.find((item) => item.workspaceId === workspaceId && item.id === id) ?? null }
  async list(workspaceId: string, limit: number) { return this.records.filter((item) => item.workspaceId === workspaceId).slice(0, limit) }
  async transition(workspaceId: string, id: string, expectedStatus: ContentGeneration['status'], nextStatus: ContentGeneration['status'], updatedAt: string) {
    const value = await this.findById(workspaceId, id); if (!value || value.status !== expectedStatus) return null
    Object.assign(value, { status: nextStatus, updatedAt }); return value
  }
  async complete(workspaceId: string, id: string, expectedStatus: 'REQUESTED', completion: Pick<ContentGeneration, 'title' | 'hook' | 'body' | 'callToAction' | 'provider' | 'providerModel' | 'outputFingerprint' | 'generationMetadata' | 'generatedAt' | 'updatedAt'>) {
    const value = await this.findById(workspaceId, id); if (!value || value.status !== expectedStatus) return null
    Object.assign(value, completion, { status: 'GENERATED' }); return value
  }
}
const provider: GenerationProvider = {
  isAvailable: () => true,
  generate: async () => ({ provider: 'test-provider', model: 'test-model', content: { title: 'Demo', hook: 'Sepatu kotor?', body: 'Ikuti langkah demonstrasi yang jelas untuk membersihkan sepatu.', callToAction: 'Coba sekarang' } }),
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
  return { provider: 'clerk', subject: 'task12' }
} }
function environment(
  identity = context(),
  generations = new MemoryGenerationRepository(),
  contentRecord: ContentOpportunity | null = content,
  creatorRecord: CreatorProfile | null = creator,
  generationProvider?: GenerationProvider,
) {
  const identities: IdentityContextRepository = { resolveOrProvision: async () => identity }
  const contents: ContentOpportunityRepository = { create: async () => { throw new Error('not used') }, findById: async (workspaceId, id) => contentRecord?.workspaceId === workspaceId && contentRecord.id === id ? contentRecord : null, list: async () => [] }
  const creators: CreatorRepository = { create: async () => { throw new Error('not used') }, findById: async (workspaceId, id) => creatorRecord?.workspaceId === workspaceId && creatorRecord.id === id ? creatorRecord : null, list: async () => [] }
  return {
    NODE_ENV: 'test', LOG_LEVEL: 'error', DATABASE_URL: 'postgresql://USER:PASSWORD@HOST/DATABASE',
    CLERK_ISSUER: 'https://example.clerk.accounts.dev', CLERK_JWKS_URL: 'https://example.clerk.accounts.dev/.well-known/jwks.json',
    IDENTITY_AUTHENTICATOR: authenticator, IDENTITY_REPOSITORY: identities,
    CONTENT_GENERATION_REPOSITORY: generations, CONTENT_OPPORTUNITY_REPOSITORY: contents,
    CREATOR_REPOSITORY: creators, CONTENT_GENERATION_PROVIDER: generationProvider,
  }
}
function post(body?: unknown, authorization = 'Bearer clerk-valid'): RequestInit {
  return { method: 'POST', headers: { authorization, ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) }
}

describe('Task 12 content generation API', () => {
  it.each(['owner', 'admin', 'member'] as const)('creates, lists, gets, generates, and reviews for authorized %s', async (role) => {
    const generations = new MemoryGenerationRepository()
    const env = environment(context(role), generations, content, creator, provider)
    const created = await app.request('http://localhost/api/v1/content-generations', post(payload), env)
    expect(created.status).toBe(201)
    expect(await created.json()).toMatchObject({ success: true, data: { contentGeneration: { id: GENERATION_ID, workspaceId: WORKSPACE_A, status: 'DRAFT' } } })
    expect((await app.request(`http://localhost/api/v1/content-generations/${GENERATION_ID}`, { headers: { authorization: 'Bearer clerk-valid' } }, env)).status).toBe(200)
    expect(await (await app.request('http://localhost/api/v1/content-generations', { headers: { authorization: 'Bearer clerk-valid' } }, env)).json()).toMatchObject({ data: { count: 1 } })
    const generated = await app.request(`http://localhost/api/v1/content-generations/${GENERATION_ID}/request`, post(), env)
    expect(await generated.json()).toMatchObject({ data: { contentGeneration: { status: 'GENERATED', provider: 'test-provider' } } })
    const reviewed = await app.request(`http://localhost/api/v1/content-generations/${GENERATION_ID}/review`, post({ status: 'REVIEW_REQUIRED' }), env)
    expect(await reviewed.json()).toMatchObject({ data: { contentGeneration: { status: 'REVIEW_REQUIRED' } } })
  })

  it('returns safe validation, unauthenticated, forbidden, lifecycle, and provider errors', async () => {
    const invalid = await app.request('http://localhost/api/v1/content-generations', post({ ...payload, language: 'xx' }), environment())
    expect(invalid.status).toBe(422)
    expect((await app.request('http://localhost/api/v1/content-generations', post(payload, 'Bearer invalid'), environment())).status).toBe(401)
    const suspended = context(); suspended.membership.status = 'suspended'
    expect((await app.request('http://localhost/api/v1/content-generations', post(payload), environment(suspended))).status).toBe(403)
    const generations = new MemoryGenerationRepository()
    const env = environment(context(), generations)
    await app.request('http://localhost/api/v1/content-generations', post(payload), env)
    const unavailable = await app.request(`http://localhost/api/v1/content-generations/${GENERATION_ID}/request`, post(), env)
    expect(unavailable.status).toBe(501)
    expect(JSON.stringify(await unavailable.json())).not.toMatch(/stack|token|postgresql:\/\//i)
    const invalidTransition = await app.request(`http://localhost/api/v1/content-generations/${GENERATION_ID}/review`, post({ status: 'APPROVED' }), env)
    expect(invalidTransition.status).toBe(409)
  })

  it('denies cross-workspace content opportunities, creators, and generated artifacts', async () => {
    expect((await app.request('http://localhost/api/v1/content-generations', post(payload), environment(context(), new MemoryGenerationRepository(), { ...content, workspaceId: WORKSPACE_B }))).status).toBe(404)
    expect((await app.request('http://localhost/api/v1/content-generations', post(payload), environment(context(), new MemoryGenerationRepository(), content, { ...creator, workspaceId: WORKSPACE_B }))).status).toBe(404)
    const foreign = new MemoryGenerationRepository()
    const created = await app.request('http://localhost/api/v1/content-generations', post(payload), environment(context(), foreign))
    expect(created.status).toBe(201)
    foreign.records[0] = { ...foreign.records[0]!, workspaceId: WORKSPACE_B }
    expect((await app.request(`http://localhost/api/v1/content-generations/${GENERATION_ID}`, { headers: { authorization: 'Bearer clerk-valid' } }, environment(context(), foreign))).status).toBe(404)
  })
})
