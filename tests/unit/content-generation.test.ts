import { describe, expect, it, vi } from 'vitest'
import {
  CONTENT_GENERATION_POLICY_VERSION,
  PostgresContentGenerationRepository,
  UnavailableGenerationProvider,
  assertContentGenerationTransition,
  canTransitionContentGeneration,
  createContentGeneration,
  fingerprint,
  requestContentGeneration,
  type ContentGeneration,
  type ContentGenerationRepository,
  type GenerationPostgresQueryExecutor,
  type GenerationProvider,
} from '@modules/module-08-content-generation'
import type { ContentOpportunity, ContentOpportunityRepository } from '@modules/module-07-content'
import type { CreatorProfile, CreatorRepository } from '@modules/module-06-creator-fit'

const GENERATION_ID = '11111111-1111-4111-8111-111111111111'
const WORKSPACE = '22222222-2222-4222-8222-222222222222'
const CONTENT_ID = '33333333-3333-4333-8333-333333333333'
const OPPORTUNITY_ID = '44444444-4444-4444-8444-444444444444'
const CREATOR_ID = '55555555-5555-4555-8555-555555555555'
const DEMAND_ID = '66666666-6666-4666-8666-666666666666'
const ISO = '2026-09-03T10:00:00.000Z'

const contentOpportunity: ContentOpportunity = {
  id: CONTENT_ID, workspaceId: WORKSPACE, opportunityId: OPPORTUNITY_ID, title: 'Shoe care demo',
  primaryAngle: 'DEMONSTRATION', secondaryAngles: ['REVIEW'],
  targetAudience: { audienceSegments: ['young_adults'], audienceInterests: ['sneakers'], painPoints: ['dirty shoes'], desiredOutcome: 'clean shoes' },
  contentFormats: ['demo'], creatorRequirements: { contentFormats: ['demo'] }, executionConstraints: { requiresSample: true },
  evidence: [{ demandSignalId: DEMAND_ID, sourceType: 'user_input', sourceRef: 'research', observedAt: ISO, evidence: 'Observed demand', confidence: 'high', demandScore: 90 }],
  confidence: 'high', status: 'ready', createdAt: ISO, updatedAt: ISO,
}
const creator: CreatorProfile = {
  id: CREATOR_ID, workspaceId: WORKSPACE, creatorRef: 'creator-1', displayName: 'Creator', platform: 'tiktok',
  primaryNiche: 'lifestyle', secondaryNiches: [], productCategories: ['shoe care'], audienceSegments: ['young_adults'],
  audienceInterests: ['sneakers'], contentFormats: ['demo'], capabilities: [{ type: 'product_demonstration', level: 4 }],
  affiliateCapability: 'experienced', availability: 'available', budgetMode: 'low', sampleAccess: true,
  evidenceSource: 'verified_record', evidenceConfidence: 'high', createdAt: ISO, updatedAt: ISO,
}
const payload = {
  contentOpportunityId: CONTENT_ID, creatorId: CREATOR_ID, contentType: 'SCRIPT', format: 'demo',
  language: 'id', targetLength: 500, hook: 'Sepatu kotor?', callToAction: 'Coba sekarang',
  generationInstructions: 'Buat skrip demonstrasi yang faktual dan ringkas.',
}
class MemoryGenerationRepository implements ContentGenerationRepository {
  constructor(readonly records: ContentGeneration[] = []) {}
  async create(record: Omit<ContentGeneration, 'id'>) { const value = { ...record, id: GENERATION_ID }; this.records.push(value); return value }
  async findById(workspaceId: string, id: string) { return this.records.find((item) => item.workspaceId === workspaceId && item.id === id) ?? null }
  async list(workspaceId: string, limit: number) { return this.records.filter((item) => item.workspaceId === workspaceId).slice(0, limit) }
  async transition(workspaceId: string, id: string, expectedStatus: ContentGeneration['status'], nextStatus: ContentGeneration['status'], updatedAt: string) {
    const record = await this.findById(workspaceId, id); if (!record || record.status !== expectedStatus) return null
    Object.assign(record, { status: nextStatus, updatedAt }); return record
  }
  async complete(workspaceId: string, id: string, expectedStatus: 'REQUESTED', completion: Pick<ContentGeneration, 'title' | 'hook' | 'body' | 'callToAction' | 'provider' | 'providerModel' | 'outputFingerprint' | 'generationMetadata' | 'generatedAt' | 'updatedAt'>) {
    const record = await this.findById(workspaceId, id); if (!record || record.status !== expectedStatus) return null
    Object.assign(record, completion, { status: 'GENERATED' }); return record
  }
}
const contentRepository: ContentOpportunityRepository = {
  create: async () => { throw new Error('not used') },
  findById: async (workspaceId, id) => workspaceId === WORKSPACE && id === CONTENT_ID ? contentOpportunity : null,
  list: async () => [],
}
const creatorRepository: CreatorRepository = {
  create: async () => { throw new Error('not used') },
  findById: async (workspaceId, id) => workspaceId === WORKSPACE && id === CREATOR_ID ? creator : null,
  list: async () => [],
}
const provider: GenerationProvider = {
  isAvailable: () => true,
  generate: async () => ({
    provider: 'test-provider', model: 'test-model', providerRequestId: 'req-1', usage: { input: 10, output: 20 },
    metadata: { region: 'test' },
    content: { title: 'Demo', hook: 'Sepatu kotor?', body: 'Bersihkan sepatu dengan langkah demonstrasi yang jelas.', callToAction: 'Coba sekarang' },
  }),
}

describe('Task 12 content generation domain and application', () => {
  it('centralizes valid and invalid lifecycle transitions', () => {
    expect(canTransitionContentGeneration('DRAFT', 'REQUESTED')).toBe(true)
    expect(canTransitionContentGeneration('GENERATED', 'REVIEW_REQUIRED')).toBe(true)
    expect(canTransitionContentGeneration('APPROVED', 'GENERATED')).toBe(false)
    expect(() => assertContentGenerationTransition('DRAFT', 'APPROVED')).toThrow(/cannot transition/)
  })

  it('creates a deterministic tenant-owned specification from public Module 07/06 contracts', async () => {
    const firstRepository = new MemoryGenerationRepository()
    const secondRepository = new MemoryGenerationRepository()
    const dependencies = { contentOpportunityRepository: contentRepository, creatorRepository, clock: { now: () => new Date(ISO) } }
    const first = await createContentGeneration(payload, WORKSPACE, { ...dependencies, repository: firstRepository })
    const second = await createContentGeneration(payload, WORKSPACE, { ...dependencies, repository: secondRepository })
    expect(first).toMatchObject({ status: 'DRAFT', policyVersion: CONTENT_GENERATION_POLICY_VERSION, provider: null, body: null })
    expect(first.generationSpec).toMatchObject({ primaryAngle: 'DEMONSTRATION', supportingAngles: ['REVIEW'] })
    expect(first.inputFingerprint).toBe(second.inputFingerprint)
    expect(first.inputFingerprint).toHaveLength(64)
  })

  it('rejects invalid ids, unsupported format/language/length, missing tenant resources, and oversized instructions', async () => {
    const dependencies = { repository: new MemoryGenerationRepository(), contentOpportunityRepository: contentRepository, creatorRepository }
    await expect(createContentGeneration({ ...payload, language: 'fr' }, WORKSPACE, dependencies)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    await expect(createContentGeneration({ ...payload, targetLength: 10 }, WORKSPACE, dependencies)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    await expect(createContentGeneration({ ...payload, format: 'review' }, WORKSPACE, dependencies)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    await expect(createContentGeneration({ ...payload, contentOpportunityId: GENERATION_ID }, WORKSPACE, dependencies)).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' })
    await expect(createContentGeneration({ ...payload, generationInstructions: 'x'.repeat(4001) }, WORKSPACE, dependencies)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('generates through the provider port, validates output, and records provenance/fingerprints', async () => {
    const repository = new MemoryGenerationRepository()
    await createContentGeneration(payload, WORKSPACE, { repository, contentOpportunityRepository: contentRepository, creatorRepository, clock: { now: () => new Date(ISO) } })
    const generated = await requestContentGeneration(GENERATION_ID, WORKSPACE, repository, provider, { now: () => new Date(ISO) })
    expect(generated).toMatchObject({ status: 'GENERATED', provider: 'test-provider', providerModel: 'test-model', generatedAt: ISO })
    expect(generated.outputFingerprint).toHaveLength(64)
    expect(generated.generationMetadata).toMatchObject({ providerRequestId: 'req-1', usage: { input: 10 } })
  })

  it('fails explicitly when provider is unavailable or malformed and never fabricates output', async () => {
    const repository = new MemoryGenerationRepository()
    await createContentGeneration(payload, WORKSPACE, { repository, contentOpportunityRepository: contentRepository, creatorRepository })
    await expect(requestContentGeneration(GENERATION_ID, WORKSPACE, repository, new UnavailableGenerationProvider())).rejects.toMatchObject({ code: 'NOT_IMPLEMENTED' })
    expect(repository.records[0]).toMatchObject({ status: 'DRAFT', body: null })
    const malformed: GenerationProvider = { isAvailable: () => true, generate: async () => ({ provider: '', model: '', content: { title: '', hook: '', body: '', callToAction: '' } }) }
    await expect(requestContentGeneration(GENERATION_ID, WORKSPACE, repository, malformed)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(repository.records[0]).toMatchObject({ status: 'REJECTED', body: null })
  })

  it('canonicalizes object keys for stable fingerprints', async () => {
    expect(await fingerprint({ b: 2, a: 1 })).toBe(await fingerprint({ a: 1, b: 2 }))
  })
})

describe('Task 12 content generation persistence', () => {
  it('uses tenant-scoped parameterized read/list operations and rejects malformed rows', async () => {
    const generationSpec = { contentType: 'SCRIPT', format: 'demo', language: 'id', targetLength: 500, hook: 'Hook', primaryAngle: 'DEMONSTRATION', supportingAngles: ['REVIEW'], targetAudience: contentOpportunity.targetAudience, creatorRequirements: {}, executionConstraints: {}, evidenceReferences: [{ demandSignalId: DEMAND_ID, sourceType: 'user_input', sourceRef: 'research', observedAt: ISO }], callToAction: 'Act', generationInstructions: 'Write it' }
    const row = { id: GENERATION_ID, workspace_id: WORKSPACE, content_opportunity_id: CONTENT_ID, creator_id: CREATOR_ID, generation_spec: generationSpec, content_type: 'SCRIPT', format: 'demo', language: 'id', title: 'Title', hook: 'Hook', body: null, call_to_action: 'Act', status: 'DRAFT', provider: null, provider_model: null, policy_version: CONTENT_GENERATION_POLICY_VERSION, input_fingerprint: 'a'.repeat(64), output_fingerprint: null, generation_metadata: null, generated_at: null, created_at: ISO, updated_at: ISO }
    const db: GenerationPostgresQueryExecutor = { query: vi.fn().mockResolvedValueOnce({ rows: [row] }).mockResolvedValueOnce({ rows: [row] }) }
    const repository = new PostgresContentGenerationRepository(db)
    expect((await repository.findById(WORKSPACE, GENERATION_ID))?.id).toBe(GENERATION_ID)
    expect(await repository.list(WORKSPACE, 10)).toHaveLength(1)
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringMatching(/workspace_id = \$1 AND id = \$2/), [WORKSPACE, GENERATION_ID])
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringMatching(/workspace_id = \$1[\s\S]*LIMIT \$2/), [WORKSPACE, 10])
    const malformed: GenerationPostgresQueryExecutor = { query: vi.fn().mockResolvedValue({ rows: [{ ...row, status: 'PUBLISHED' }] }) }
    await expect(new PostgresContentGenerationRepository(malformed).findById(WORKSPACE, GENERATION_ID)).rejects.toMatchObject({ code: 'INTERNAL_ERROR' })
  })
})
