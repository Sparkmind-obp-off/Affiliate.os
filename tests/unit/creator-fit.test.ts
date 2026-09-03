import { describe, expect, it, vi } from 'vitest'
import {
  CREATOR_FIT_POLICY_VERSION,
  PostgresCreatorRepository,
  classifyCreatorFit,
  createCreatorProfile,
  evaluateCreatorFit,
  evaluateStoredCreatorFit,
  parseCreatorFitRequest,
  parseCreatorProfile,
  type CreatorClock,
  type CreatorFitCriteria,
  type CreatorFitDimension,
  type CreatorPostgresQueryExecutor,
  type CreatorProfile,
  type CreatorProfileInput,
  type CreatorRepository,
} from '@modules/module-06-creator-fit'
import { evaluateOpportunity, type OpportunityRepository, type StoredOpportunity } from '@modules/module-05-opportunity'
import { candidate } from '../fixtures/opportunity-candidates.js'

const CREATOR_ID = '11111111-1111-4111-8111-111111111111'
const OPPORTUNITY_ID = '33333333-3333-4333-8333-333333333333'
const WORKSPACE = '22222222-2222-4222-8222-222222222222'
const OTHER_WORKSPACE = '55555555-5555-4555-8555-555555555555'
const ISO = '2026-09-03T10:00:00.000Z'
const clock: CreatorClock = { now: () => new Date(ISO) }

const input: CreatorProfileInput = {
  creatorRef: 'creator-001',
  displayName: 'Shoe Lab',
  platform: 'tiktok' as const,
  platformRef: '@shoelab',
  primaryNiche: 'lifestyle' as const,
  secondaryNiches: ['fashion'] as const,
  productCategories: ['shoe care'],
  audienceSegments: ['young_adults'] as const,
  audienceInterests: ['sneakers'],
  contentFormats: ['faceless', 'demo'] as const,
  capabilities: [{ type: 'product_demonstration', level: 4 as const }],
  affiliateCapability: 'experienced' as const,
  availability: 'available' as const,
  budgetMode: 'medium' as const,
  sampleAccess: true,
  evidenceSource: 'verified_record' as const,
  evidenceConfidence: 'high' as const,
}

function creator(overrides: Partial<CreatorProfile> = {}): CreatorProfile {
  return {
    id: CREATOR_ID,
    workspaceId: WORKSPACE,
    ...input,
    secondaryNiches: [...input.secondaryNiches],
    audienceSegments: [...input.audienceSegments],
    contentFormats: [...input.contentFormats],
    createdAt: ISO,
    updatedAt: ISO,
    ...overrides,
  }
}

function opportunity(workspaceId = WORKSPACE): StoredOpportunity {
  return {
    id: OPPORTUNITY_ID,
    workspace_id: workspaceId,
    status: 'active',
    input: candidate(),
    evaluation: evaluateOpportunity(candidate(), ISO),
    created_at: ISO,
    updated_at: ISO,
  }
}

const allCriteria: CreatorFitCriteria = {
  niches: ['lifestyle'],
  productCategories: ['shoe care'],
  audienceSegments: ['young_adults'],
  contentFormats: ['demo'],
  capabilityRequirements: [{ type: 'product_demonstration', minimumLevel: 3 }],
  requiresSample: true,
  minimumBudget: 'low',
  affiliateRequired: true,
  minimumAvailability: 'limited',
}

class MemoryCreatorRepository implements CreatorRepository {
  constructor(readonly records: CreatorProfile[] = []) {}
  async create(profile: Omit<CreatorProfile, 'id'>): Promise<CreatorProfile> {
    if (this.records.some((record) => record.workspaceId === profile.workspaceId && record.creatorRef === profile.creatorRef)) throw { code: '23505' }
    const stored = { ...profile, id: CREATOR_ID }
    this.records.push(stored)
    return stored
  }
  async findById(workspaceId: string, id: string): Promise<CreatorProfile | null> {
    return this.records.find((record) => record.workspaceId === workspaceId && record.id === id) ?? null
  }
  async list(workspaceId: string, limit: number): Promise<CreatorProfile[]> {
    return this.records.filter((record) => record.workspaceId === workspaceId).slice(0, limit)
  }
}

class MemoryOpportunityRepository implements OpportunityRepository {
  constructor(private readonly record: StoredOpportunity | null) {}
  async findById(workspaceId: string, id: string) { return this.record?.workspace_id === workspaceId && this.record.id === id ? this.record : null }
  async findByRef() { return null }
  async list() { return [] }
  async create(): Promise<StoredOpportunity> { throw new Error('not used') }
  async transition() { return null }
}

describe('Task 10 creator profile domain', () => {
  it('accepts a valid controlled profile and normalizes category evidence', () => {
    expect(parseCreatorProfile({ ...input, productCategories: ['  Shoe Care! '] })).toMatchObject({
      creatorRef: 'creator-001',
      productCategories: ['shoe care'],
    })
  })

  it.each([
    { ...input, platform: 'facebook' },
    { ...input, primaryNiche: 'everything' },
    { ...input, contentFormats: ['viral'] },
    { ...input, capabilities: [{ type: 'camera', level: 5 }] },
    { ...input, secondaryNiches: ['lifestyle'] },
    { ...input, workspaceId: OTHER_WORKSPACE },
  ])('rejects invalid or authority-bearing profile %#', (payload) => {
    expect(() => parseCreatorProfile(payload)).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }))
  })

  it('validates strict fit criteria and UUID opportunity references', () => {
    expect(parseCreatorFitRequest({ opportunityId: OPPORTUNITY_ID, criteria: allCriteria })).toMatchObject({ opportunityId: OPPORTUNITY_ID })
    expect(() => parseCreatorFitRequest({ opportunityId: 'bad', criteria: allCriteria })).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }))
    expect(() => parseCreatorFitRequest({ opportunityId: OPPORTUNITY_ID, criteria: { niches: ['viral'] } })).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }))
  })
})

describe('Task 10 deterministic creator fit policy', () => {
  it('is reproducible, explainable, and separates confidence from fit', () => {
    const first = evaluateCreatorFit(creator(), opportunity(), allCriteria)
    const second = evaluateCreatorFit(creator(), opportunity(), allCriteria)
    expect(first).toEqual(second)
    expect(first).toMatchObject({
      policyVersion: CREATOR_FIT_POLICY_VERSION,
      score: 100,
      classification: 'STRONG_FIT',
      confidence: 'HIGH',
      dataCoverage: 100,
      missingSignals: [],
    })
    expect(first.positiveFactors).toHaveLength(8)
    expect(JSON.stringify(first)).not.toContain(ISO)
  })

  it('implements every explicit classification boundary', () => {
    expect(classifyCreatorFit(85)).toBe('STRONG_FIT')
    expect(classifyCreatorFit(84.99)).toBe('GOOD_FIT')
    expect(classifyCreatorFit(70)).toBe('GOOD_FIT')
    expect(classifyCreatorFit(50)).toBe('WEAK_FIT')
    expect(classifyCreatorFit(49.99)).toBe('NO_FIT')
  })

  it.each([
    [[], 'STRONG_FIT'],
    [['product_category', 'audience'], 'GOOD_FIT'],
    [['niche', 'product_category', 'audience'], 'WEAK_FIT'],
    [['niche', 'product_category', 'audience', 'content_format'], 'NO_FIT'],
  ] as Array<[CreatorFitDimension[], string]>)('classifies failures %s as %s using explicit negative evidence', (failures, expected) => {
    const changed = creator({
      primaryNiche: failures.includes('niche') ? 'technology' : 'lifestyle',
      secondaryNiches: [],
      productCategories: failures.includes('product_category') ? ['electronics'] : ['shoe care'],
      audienceSegments: failures.includes('audience') ? ['parents'] : ['young_adults'],
      contentFormats: failures.includes('content_format') ? ['talking_head'] : ['demo'],
    })
    expect(evaluateCreatorFit(changed, opportunity(), allCriteria).classification).toBe(expected)
  })

  it('keeps missing evidence distinct from negative evidence and lowers confidence only', () => {
    const result = evaluateCreatorFit(
      creator({ evidenceConfidence: 'low' }),
      opportunity(),
      { niches: ['lifestyle'], contentFormats: ['demo'], affiliateRequired: true },
    )
    expect(result.classification).toBe('INSUFFICIENT_DATA')
    expect(result.negativeFactors).toEqual([])
    expect(result.missingSignals.length).toBe(5)
    expect(result.confidence).toBe('LOW')
    expect(result.score).toBe(100)
  })
})

describe('Task 10 application and persistence', () => {
  it('creates profiles and maps duplicate references to conflict', async () => {
    const repository = new MemoryCreatorRepository()
    await expect(createCreatorProfile(input, WORKSPACE, { repository, clock })).resolves.toMatchObject({ id: CREATOR_ID, workspaceId: WORKSPACE, createdAt: ISO })
    await expect(createCreatorProfile(input, WORKSPACE, { repository, clock })).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('hides creators and opportunities outside the server-derived workspace', async () => {
    await expect(evaluateStoredCreatorFit(CREATOR_ID, { opportunityId: OPPORTUNITY_ID, criteria: allCriteria }, WORKSPACE, {
      creatorRepository: new MemoryCreatorRepository([creator({ workspaceId: OTHER_WORKSPACE })]),
      opportunityRepository: new MemoryOpportunityRepository(opportunity()),
    })).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' })
    await expect(evaluateStoredCreatorFit(CREATOR_ID, { opportunityId: OPPORTUNITY_ID, criteria: allCriteria }, WORKSPACE, {
      creatorRepository: new MemoryCreatorRepository([creator()]),
      opportunityRepository: new MemoryOpportunityRepository(opportunity(OTHER_WORKSPACE)),
    })).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' })
  })

  it('uses parameterized workspace filtering for create, get, and list', async () => {
    const db = { query: vi.fn(async () => ({ rows: [] })) } as unknown as CreatorPostgresQueryExecutor
    const repository = new PostgresCreatorRepository(db)
    await repository.findById(WORKSPACE, CREATOR_ID)
    await repository.list(WORKSPACE, 20)
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringMatching(/workspace_id = \$1 AND id = \$2/), [WORKSPACE, CREATOR_ID])
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringMatching(/workspace_id = \$1[\s\S]*LIMIT \$2/), [WORKSPACE, 20])
  })
})
