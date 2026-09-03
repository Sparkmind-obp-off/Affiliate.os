import {
  evaluateCreatorFit,
  normalizeMatchToken,
  type CreatorFitDimensionResult,
  type CreatorProfile,
} from '@modules/module-06-creator-fit'
import type { StoredOpportunity } from '@modules/module-05-opportunity'
import type { ContentOpportunity } from './content-opportunity.js'

export const CONTENT_OPPORTUNITY_POLICY_VERSION = 'content-opportunity-v1.0.0' as const
export const CONTENT_OPPORTUNITY_CLASSIFICATIONS = [
  'STRONG_OPPORTUNITY', 'GOOD_OPPORTUNITY', 'WEAK_OPPORTUNITY', 'NO_OPPORTUNITY',
  'INSUFFICIENT_DATA',
] as const
export type ContentOpportunityClassification = (typeof CONTENT_OPPORTUNITY_CLASSIFICATIONS)[number]

export const CONTENT_OPPORTUNITY_DIMENSIONS = [
  'demand_alignment', 'audience_alignment', 'angle_strength', 'format_fit',
  'creator_fit', 'execution_feasibility', 'evidence_quality',
] as const
export type ContentOpportunityDimension = (typeof CONTENT_OPPORTUNITY_DIMENSIONS)[number]

export const CONTENT_OPPORTUNITY_WEIGHTS: Readonly<Record<ContentOpportunityDimension, number>> = Object.freeze({
  demand_alignment: 20,
  audience_alignment: 15,
  angle_strength: 15,
  format_fit: 15,
  creator_fit: 15,
  execution_feasibility: 10,
  evidence_quality: 10,
})

export const CONTENT_OPPORTUNITY_BANDS = Object.freeze({
  STRONG_OPPORTUNITY: 85,
  GOOD_OPPORTUNITY: 70,
  WEAK_OPPORTUNITY: 50,
  NO_OPPORTUNITY: 0,
  minimumCoverage: 60,
  minimumKnownDimensions: 4,
})

export type ContentOpportunityDimensionStatus = 'POSITIVE' | 'NEGATIVE' | 'MISSING'
export interface ContentOpportunityDimensionResult {
  dimension: ContentOpportunityDimension
  weight: number
  status: ContentOpportunityDimensionStatus
  score?: number
  reasonCode: string
}

export interface ContentOpportunityEvaluation {
  policyVersion: typeof CONTENT_OPPORTUNITY_POLICY_VERSION
  contentOpportunityId: string
  opportunityId: string
  creatorId: string
  score: number | null
  classification: ContentOpportunityClassification
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'
  dataCoverage: number
  dimensions: ContentOpportunityDimensionResult[]
  positiveFactors: string[]
  negativeFactors: string[]
  missingSignals: string[]
}

type Assessment = Omit<ContentOpportunityDimensionResult, 'weight'>

export function evaluateContentOpportunity(
  content: ContentOpportunity,
  opportunity: StoredOpportunity,
  creator: CreatorProfile,
): ContentOpportunityEvaluation {
  const creatorCriteria = {
    ...content.creatorRequirements,
    audienceSegments: content.creatorRequirements.audienceSegments ?? content.targetAudience.audienceSegments,
    contentFormats: content.creatorRequirements.contentFormats ?? content.contentFormats,
    requiresSample: content.creatorRequirements.requiresSample ?? content.executionConstraints.requiresSample,
    minimumBudget: content.creatorRequirements.minimumBudget ?? content.executionConstraints.minimumBudget,
    affiliateRequired: content.creatorRequirements.affiliateRequired ?? content.executionConstraints.affiliateRequired,
    minimumAvailability: content.creatorRequirements.minimumAvailability ?? content.executionConstraints.minimumAvailability,
  }
  const creatorFit = evaluateCreatorFit(creator, opportunity, creatorCriteria)
  const dimensions: ContentOpportunityDimensionResult[] = [
    assessDemand(content),
    assessAudience(content, creator),
    assessAngle(opportunity),
    assessFormat(content, creator),
    assessCreatorFit(creatorFit.score, creatorFit.classification),
    assessExecution(opportunity, creatorFit.dimensions),
    assessEvidenceQuality(content),
  ].map((item) => ({ ...item, weight: CONTENT_OPPORTUNITY_WEIGHTS[item.dimension] }))

  const known = dimensions.filter((item) => item.status !== 'MISSING')
  const knownWeight = known.reduce((sum, item) => sum + item.weight, 0)
  const dataCoverage = round(knownWeight)
  const weighted = known.reduce((sum, item) => sum + (item.score ?? 0) * item.weight, 0)
  const score = knownWeight === 0 ? null : round(weighted / knownWeight)
  const insufficient = dataCoverage < CONTENT_OPPORTUNITY_BANDS.minimumCoverage
    || known.length < CONTENT_OPPORTUNITY_BANDS.minimumKnownDimensions
  const classification = insufficient || score === null
    ? 'INSUFFICIENT_DATA'
    : classifyContentOpportunity(score)
  const confidenceScore = round(dataCoverage * confidenceReliability(content.confidence))

  return {
    policyVersion: CONTENT_OPPORTUNITY_POLICY_VERSION,
    contentOpportunityId: content.id,
    opportunityId: content.opportunityId,
    creatorId: creator.id,
    score,
    classification,
    confidence: confidenceScore >= 80 ? 'HIGH' : confidenceScore >= 50 ? 'MEDIUM' : 'LOW',
    dataCoverage,
    dimensions,
    positiveFactors: factors(dimensions, 'POSITIVE'),
    negativeFactors: factors(dimensions, 'NEGATIVE'),
    missingSignals: factors(dimensions, 'MISSING'),
  }
}

export function classifyContentOpportunity(
  score: number,
): Exclude<ContentOpportunityClassification, 'INSUFFICIENT_DATA'> {
  if (score >= CONTENT_OPPORTUNITY_BANDS.STRONG_OPPORTUNITY) return 'STRONG_OPPORTUNITY'
  if (score >= CONTENT_OPPORTUNITY_BANDS.GOOD_OPPORTUNITY) return 'GOOD_OPPORTUNITY'
  if (score >= CONTENT_OPPORTUNITY_BANDS.WEAK_OPPORTUNITY) return 'WEAK_OPPORTUNITY'
  return 'NO_OPPORTUNITY'
}

function assessDemand(content: ContentOpportunity): Assessment {
  if (content.evidence.length === 0) return missing('demand_alignment', 'DEMAND_EVIDENCE_MISSING')
  const score = round(content.evidence.reduce((sum, item) => sum + item.demandScore, 0) / content.evidence.length)
  return result('demand_alignment', score, 'DEMAND_ALIGNMENT')
}
function assessAudience(content: ContentOpportunity, creator: CreatorProfile): Assessment {
  const required = [
    ...content.targetAudience.audienceSegments,
    ...content.targetAudience.audienceInterests,
  ].map(normalizeMatchToken)
  const available = new Set([
    ...creator.audienceSegments,
    ...creator.audienceInterests,
  ].map(normalizeMatchToken))
  if (required.length === 0) return missing('audience_alignment', 'AUDIENCE_CRITERIA_MISSING')
  if (available.size === 0) return missing('audience_alignment', 'CREATOR_AUDIENCE_MISSING')
  const score = round(required.filter((item) => available.has(item)).length / required.length * 100)
  return result('audience_alignment', score, 'AUDIENCE_ALIGNMENT')
}
function assessAngle(opportunity: StoredOpportunity): Assessment {
  if (opportunity.input.missing_signals.includes('content_potential')) {
    return missing('angle_strength', 'CONTENT_POTENTIAL_MISSING')
  }
  return result('angle_strength', opportunity.input.content_potential, 'ANGLE_STRENGTH')
}
function assessFormat(content: ContentOpportunity, creator: CreatorProfile): Assessment {
  if (content.contentFormats.length === 0) return missing('format_fit', 'CONTENT_FORMAT_MISSING')
  if (creator.contentFormats.length === 0) return missing('format_fit', 'CREATOR_FORMAT_CAPABILITY_MISSING')
  const creatorFormats = new Set(creator.contentFormats)
  const score = round(content.contentFormats.filter((item) => creatorFormats.has(item)).length / content.contentFormats.length * 100)
  return result('format_fit', score, 'FORMAT_FIT')
}
function assessCreatorFit(score: number | null, classification: string): Assessment {
  if (score === null || classification === 'INSUFFICIENT_DATA') return missing('creator_fit', 'CREATOR_FIT_INSUFFICIENT')
  return result('creator_fit', score, 'CREATOR_FIT')
}
function assessExecution(opportunity: StoredOpportunity, fitDimensions: CreatorFitDimensionResult[]): Assessment {
  if (opportunity.input.missing_signals.includes('risk')) {
    return missing('execution_feasibility', 'EXECUTION_SIGNAL_MISSING')
  }
  const checks = [
    opportunity.input.execution.creator_can_produce_content ? 100 : 0,
    opportunity.input.execution.product_accessible ? 100 : 0,
  ]
  const creatorExecution = fitDimensions.find((item) => item.dimension === 'execution')
  if (creatorExecution?.score !== undefined) checks.push(creatorExecution.score)
  return result('execution_feasibility', round(checks.reduce((sum, value) => sum + value, 0) / checks.length), 'EXECUTION_FEASIBILITY')
}
function assessEvidenceQuality(content: ContentOpportunity): Assessment {
  if (content.evidence.length === 0) return missing('evidence_quality', 'EVIDENCE_QUALITY_MISSING')
  const scoreMap = { low: 25, medium: 60, high: 85, very_high: 100 } as const
  const score = round(content.evidence.reduce((sum, item) => sum + scoreMap[item.confidence], 0) / content.evidence.length)
  return result('evidence_quality', score, 'EVIDENCE_QUALITY')
}
function result(dimension: ContentOpportunityDimension, score: number, prefix: string): Assessment {
  const normalized = Math.max(0, Math.min(100, round(score)))
  return normalized >= 70
    ? { dimension, status: 'POSITIVE', score: normalized, reasonCode: `${prefix}_STRONG` }
    : { dimension, status: 'NEGATIVE', score: normalized, reasonCode: `${prefix}_WEAK` }
}
function missing(dimension: ContentOpportunityDimension, reasonCode: string): Assessment {
  return { dimension, status: 'MISSING', reasonCode }
}
function factors(items: readonly ContentOpportunityDimensionResult[], status: ContentOpportunityDimensionStatus): string[] {
  return items.filter((item) => item.status === status).map((item) => item.reasonCode)
}
function confidenceReliability(value: ContentOpportunity['confidence']): number {
  return value === 'high' ? 1 : value === 'medium' ? 0.75 : 0.5
}
function round(value: number): number { return Math.round(value * 100) / 100 }
