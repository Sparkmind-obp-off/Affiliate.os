import { describe, expect, it, vi } from 'vitest'
import {
  CONTENT_OPPORTUNITY_POLICY_VERSION,
  PostgresContentOpportunityRepository,
  classifyContentOpportunity,
  evaluateContentOpportunity,
  parseContentOpportunity,
  type ContentOpportunity,
  type ContentPostgresQueryExecutor,
} from '@modules/module-07-content'
import type { CreatorProfile } from '@modules/module-06-creator-fit'
import { evaluateOpportunity, type StoredOpportunity } from '@modules/module-05-opportunity'
import { candidate } from '../fixtures/opportunity-candidates.js'

const WORKSPACE = '22222222-2222-4222-8222-222222222222'
const CONTENT_ID = '11111111-1111-4111-8111-111111111111'
const OPPORTUNITY_ID = '33333333-3333-4333-8333-333333333333'
const CREATOR_ID = '44444444-4444-4444-8444-444444444444'
const DEMAND_ID = '55555555-5555-4555-8555-555555555555'
const ISO = '2026-09-03T10:00:00.000Z'

const creator: CreatorProfile = {
  id: CREATOR_ID, workspaceId: WORKSPACE, creatorRef: 'creator-1', displayName: 'Creator',
  platform: 'tiktok', primaryNiche: 'lifestyle', secondaryNiches: ['fashion'],
  productCategories: ['shoe care'], audienceSegments: ['young_adults'], audienceInterests: ['sneakers'],
  contentFormats: ['demo', 'review'], capabilities: [{ type: 'product_demonstration', level: 4 }],
  affiliateCapability: 'experienced', availability: 'available', budgetMode: 'medium', sampleAccess: true,
  evidenceSource: 'verified_record', evidenceConfidence: 'high', createdAt: ISO, updatedAt: ISO,
}
const storedOpportunity: StoredOpportunity = (() => {
  const input = candidate()
  return { id: OPPORTUNITY_ID, workspace_id: WORKSPACE, status: 'active', input, evaluation: evaluateOpportunity(input, ISO), created_at: ISO, updated_at: ISO }
})()
const content: ContentOpportunity = {
  id: CONTENT_ID, workspaceId: WORKSPACE, opportunityId: OPPORTUNITY_ID, title: 'Shoe care demo',
  primaryAngle: 'DEMONSTRATION', secondaryAngles: ['PROBLEM_SOLUTION'],
  targetAudience: { audienceSegments: ['young_adults'], audienceInterests: ['sneakers'], painPoints: ['dirty shoes'], desiredOutcome: 'clean shoes' },
  contentFormats: ['demo'],
  creatorRequirements: {
    niches: ['lifestyle'], productCategories: ['shoe care'], audienceSegments: ['young_adults'],
    contentFormats: ['demo'], capabilityRequirements: [{ type: 'product_demonstration', minimumLevel: 3 }],
    requiresSample: true, minimumBudget: 'low', affiliateRequired: true, minimumAvailability: 'limited',
  },
  executionConstraints: { requiresSample: true, minimumBudget: 'low', affiliateRequired: true, minimumAvailability: 'limited' },
  evidence: [{ demandSignalId: DEMAND_ID, sourceType: 'user_input', sourceRef: 'research-1', observedAt: ISO, evidence: 'Explicit repeated shoe care demand', confidence: 'high', demandScore: 90 }],
  confidence: 'high', status: 'ready', createdAt: ISO, updatedAt: ISO,
}

describe('Task 11 content opportunity domain', () => {
  it('validates controlled angles and formats and normalizes audience values', () => {
    const parsed = parseContentOpportunity({
      opportunityId: OPPORTUNITY_ID, title: '  Shoe demo  ', primaryAngle: 'DEMONSTRATION',
      secondaryAngles: ['REVIEW'], targetAudience: { audienceSegments: ['young_adults'], audienceInterests: ['  Sneaker Fans  '], painPoints: [' Dirty Shoes '], desiredOutcome: ' Clean Shoes ' },
      contentFormats: ['demo'], creatorRequirements: {}, executionConstraints: {}, demandSignalIds: [DEMAND_ID],
    })
    expect(parsed.title).toBe('Shoe demo')
    expect(parsed.targetAudience).toMatchObject({ audienceInterests: ['sneaker fans'], painPoints: ['dirty shoes'], desiredOutcome: 'clean shoes' })
    expect(() => parseContentOpportunity({ ...parsed, demandSignalIds: [DEMAND_ID], primaryAngle: 'VIRAL' })).toThrow()
    expect(() => parseContentOpportunity({ ...parsed, demandSignalIds: [DEMAND_ID], contentFormats: ['short_video'] })).toThrow()
  })

  it('evaluates deterministically with explicit score, coverage, confidence, and reasons', () => {
    const first = evaluateContentOpportunity(content, storedOpportunity, creator)
    const second = evaluateContentOpportunity(content, storedOpportunity, creator)
    expect(first).toEqual(second)
    expect(first.policyVersion).toBe(CONTENT_OPPORTUNITY_POLICY_VERSION)
    expect(first.classification).toBe('STRONG_OPPORTUNITY')
    expect(first.confidence).toBe('HIGH')
    expect(first.dataCoverage).toBe(100)
    expect(first.positiveFactors).toContain('FORMAT_FIT_STRONG')
    expect(first.missingSignals).toEqual([])
  })

  it('reports missing signals as insufficient data instead of inventing values', () => {
    const sparse = { ...content, targetAudience: { ...content.targetAudience, audienceSegments: [], audienceInterests: [] }, contentFormats: [], evidence: [], confidence: 'low' as const }
    const sparseCreator = { ...creator, contentFormats: [], audienceSegments: [], audienceInterests: [] }
    const result = evaluateContentOpportunity(sparse, storedOpportunity, sparseCreator)
    expect(result.classification).toBe('INSUFFICIENT_DATA')
    expect(result.missingSignals).toEqual(expect.arrayContaining(['DEMAND_EVIDENCE_MISSING', 'AUDIENCE_CRITERIA_MISSING', 'CONTENT_FORMAT_MISSING', 'EVIDENCE_QUALITY_MISSING']))
  })

  it.each([[90, 'STRONG_OPPORTUNITY'], [75, 'GOOD_OPPORTUNITY'], [55, 'WEAK_OPPORTUNITY'], [20, 'NO_OPPORTUNITY']] as const)('classifies %s as %s', (score, classification) => {
    expect(classifyContentOpportunity(score)).toBe(classification)
  })

  it('uses tenant-scoped parameterized persistence and rejects malformed stored data', async () => {
    const row = {
      id: CONTENT_ID, workspace_id: WORKSPACE, opportunity_id: OPPORTUNITY_ID, title: content.title,
      primary_angle: content.primaryAngle, secondary_angles: content.secondaryAngles, target_audience: content.targetAudience,
      content_formats: content.contentFormats, creator_requirements: content.creatorRequirements,
      execution_constraints: content.executionConstraints, evidence: content.evidence, confidence: content.confidence,
      status: content.status, created_at: ISO, updated_at: ISO,
    }
    const db: ContentPostgresQueryExecutor = { query: vi.fn().mockResolvedValueOnce({ rows: [row] }).mockResolvedValueOnce({ rows: [row] }) }
    const repository = new PostgresContentOpportunityRepository(db)
    expect((await repository.findById(WORKSPACE, CONTENT_ID))?.id).toBe(CONTENT_ID)
    expect((await repository.list(WORKSPACE, 10))).toHaveLength(1)
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringMatching(/workspace_id = \$1 AND id = \$2/), [WORKSPACE, CONTENT_ID])
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringMatching(/workspace_id = \$1[\s\S]*LIMIT \$2/), [WORKSPACE, 10])

    const malformed: ContentPostgresQueryExecutor = { query: vi.fn().mockResolvedValue({ rows: [{ ...row, primary_angle: 'INVALID' }] }) }
    await expect(new PostgresContentOpportunityRepository(malformed).findById(WORKSPACE, CONTENT_ID)).rejects.toMatchObject({ code: 'INTERNAL_ERROR' })
  })
})
