import type { OpportunityCandidate } from '@modules/module-05-opportunity'
import {
  type AudienceSegment,
  type ContentFormat,
  type CreatorAvailability,
  type CreatorBudgetMode,
  type CreatorCapabilityType,
  type CreatorNiche,
  type CreatorProfile,
  normalizeMatchToken,
} from './creator.js'

export const CREATOR_FIT_POLICY_VERSION = 'creator-fit-v1.0.0' as const
export const CREATOR_FIT_CLASSIFICATIONS = [
  'STRONG_FIT', 'GOOD_FIT', 'WEAK_FIT', 'NO_FIT', 'INSUFFICIENT_DATA',
] as const
export type CreatorFitClassification = (typeof CREATOR_FIT_CLASSIFICATIONS)[number]
export const CREATOR_FIT_CONFIDENCE = ['LOW', 'MEDIUM', 'HIGH'] as const
export type CreatorFitConfidence = (typeof CREATOR_FIT_CONFIDENCE)[number]

export const CREATOR_FIT_DIMENSIONS = [
  'niche', 'product_category', 'audience', 'content_format', 'capability',
  'execution', 'commerce', 'availability',
] as const
export type CreatorFitDimension = (typeof CREATOR_FIT_DIMENSIONS)[number]

export const CREATOR_FIT_WEIGHTS: Readonly<Record<CreatorFitDimension, number>> = Object.freeze({
  niche: 15,
  product_category: 15,
  audience: 15,
  content_format: 15,
  capability: 15,
  execution: 10,
  commerce: 10,
  availability: 5,
})

export const CREATOR_FIT_BANDS = Object.freeze({
  STRONG_FIT: 85,
  GOOD_FIT: 70,
  WEAK_FIT: 50,
  NO_FIT: 0,
  minimumCoverage: 60,
  minimumKnownDimensions: 4,
})

export interface CapabilityRequirement {
  type: CreatorCapabilityType
  minimumLevel: number
}

/** Explicit opportunity-side matching criteria; no attributes are inferred from product names. */
export interface CreatorFitCriteria {
  niches?: CreatorNiche[]
  productCategories?: string[]
  audienceSegments?: AudienceSegment[]
  contentFormats?: ContentFormat[]
  capabilityRequirements?: CapabilityRequirement[]
  requiresSample?: boolean
  minimumBudget?: CreatorBudgetMode
  affiliateRequired?: boolean
  minimumAvailability?: CreatorAvailability
}

export type CreatorFitDimensionStatus = 'POSITIVE' | 'NEGATIVE' | 'MISSING'
export interface CreatorFitDimensionResult {
  dimension: CreatorFitDimension
  weight: number
  status: CreatorFitDimensionStatus
  score?: number
  reasonCode: string
}

export interface CreatorFitResult {
  policyVersion: typeof CREATOR_FIT_POLICY_VERSION
  creatorId: string
  opportunityId: string
  opportunityRef: string
  score: number | null
  classification: CreatorFitClassification
  confidence: CreatorFitConfidence
  confidenceScore: number
  dataCoverage: number
  dimensions: CreatorFitDimensionResult[]
  positiveFactors: string[]
  negativeFactors: string[]
  missingSignals: string[]
}

type DimensionAssessment = Omit<CreatorFitDimensionResult, 'weight'>

export function evaluateCreatorFit(
  creator: CreatorProfile,
  opportunity: { id: string; input: OpportunityCandidate },
  criteria: CreatorFitCriteria,
): CreatorFitResult {
  const dimensions: CreatorFitDimensionResult[] = [
    assessSetOverlap('niche', [creator.primaryNiche, ...creator.secondaryNiches], criteria.niches, 'NICHE'),
    assessSetOverlap('product_category', creator.productCategories, criteria.productCategories, 'PRODUCT_CATEGORY'),
    assessSetOverlap('audience', creator.audienceSegments, criteria.audienceSegments, 'AUDIENCE'),
    assessSetOverlap('content_format', creator.contentFormats, criteria.contentFormats, 'CONTENT_FORMAT'),
    assessCapabilities(creator, criteria.capabilityRequirements),
    assessExecution(creator, criteria),
    assessCommerce(creator, criteria.affiliateRequired),
    assessAvailability(creator, criteria.minimumAvailability),
  ].map((assessment) => ({ ...assessment, weight: CREATOR_FIT_WEIGHTS[assessment.dimension] }))

  const known = dimensions.filter((item) => item.status !== 'MISSING')
  const knownWeight = known.reduce((sum, item) => sum + item.weight, 0)
  const dataCoverage = round(knownWeight)
  const weighted = known.reduce((sum, item) => sum + (item.score ?? 0) * item.weight, 0)
  const score = knownWeight === 0 ? null : round(weighted / knownWeight)
  const insufficient = dataCoverage < CREATOR_FIT_BANDS.minimumCoverage
    || known.length < CREATOR_FIT_BANDS.minimumKnownDimensions
  const classification = insufficient || score === null
    ? 'INSUFFICIENT_DATA'
    : classifyCreatorFit(score)
  const confidenceScore = round(dataCoverage * evidenceReliability(creator.evidenceConfidence))

  return {
    policyVersion: CREATOR_FIT_POLICY_VERSION,
    creatorId: creator.id,
    opportunityId: opportunity.id,
    opportunityRef: opportunity.input.candidate_ref,
    score,
    classification,
    confidence: classifyConfidence(confidenceScore),
    confidenceScore,
    dataCoverage,
    dimensions,
    positiveFactors: dimensions.filter((item) => item.status === 'POSITIVE').map((item) => item.reasonCode),
    negativeFactors: dimensions.filter((item) => item.status === 'NEGATIVE').map((item) => item.reasonCode),
    missingSignals: dimensions.filter((item) => item.status === 'MISSING').map((item) => item.reasonCode),
  }
}

export function classifyCreatorFit(score: number): Exclude<CreatorFitClassification, 'INSUFFICIENT_DATA'> {
  if (score >= CREATOR_FIT_BANDS.STRONG_FIT) return 'STRONG_FIT'
  if (score >= CREATOR_FIT_BANDS.GOOD_FIT) return 'GOOD_FIT'
  if (score >= CREATOR_FIT_BANDS.WEAK_FIT) return 'WEAK_FIT'
  return 'NO_FIT'
}

function assessSetOverlap<T extends string>(
  dimension: CreatorFitDimension,
  creatorValues: readonly T[],
  required: readonly T[] | undefined,
  code: string,
): DimensionAssessment {
  if (!required || required.length === 0) return missing(dimension, `${code}_REQUIREMENT_MISSING`)
  if (creatorValues.length === 0) return missing(dimension, `${code}_CREATOR_DATA_MISSING`)
  const creatorTokens = new Set(creatorValues.map(normalizeMatchToken))
  const matched = required.filter((value) => creatorTokens.has(normalizeMatchToken(value))).length
  if (matched === 0) return negative(dimension, 0, `${code}_NO_MATCH`)
  const score = round((matched / required.length) * 100)
  return score >= 70
    ? positive(dimension, score, `${code}_MATCH`)
    : negative(dimension, score, `${code}_PARTIAL_MATCH`)
}

function assessCapabilities(
  creator: CreatorProfile,
  requirements: readonly CapabilityRequirement[] | undefined,
): DimensionAssessment {
  if (!requirements || requirements.length === 0) return missing('capability', 'CAPABILITY_REQUIREMENT_MISSING')
  const levels = new Map(creator.capabilities.map((capability) => [capability.type, capability.level]))
  if (requirements.some((requirement) => !levels.has(requirement.type))) {
    return missing('capability', 'CAPABILITY_CREATOR_DATA_MISSING')
  }
  const score = round(requirements.reduce((sum, requirement) => {
    const actual = levels.get(requirement.type) ?? 0
    return sum + (requirement.minimumLevel === 0 ? 100 : Math.min(100, actual / requirement.minimumLevel * 100))
  }, 0) / requirements.length)
  return score >= 70
    ? positive('capability', score, 'CAPABILITY_REQUIREMENTS_MET')
    : negative('capability', score, 'CAPABILITY_REQUIREMENTS_NOT_MET')
}

function assessExecution(creator: CreatorProfile, criteria: CreatorFitCriteria): DimensionAssessment {
  if (criteria.requiresSample === undefined && criteria.minimumBudget === undefined) {
    return missing('execution', 'EXECUTION_REQUIREMENT_MISSING')
  }
  const checks: number[] = []
  if (criteria.requiresSample !== undefined) checks.push(!criteria.requiresSample || creator.sampleAccess ? 100 : 0)
  if (criteria.minimumBudget !== undefined) {
    checks.push(ordinalBudget(creator.budgetMode) >= ordinalBudget(criteria.minimumBudget) ? 100 : 0)
  }
  const score = round(checks.reduce((sum, value) => sum + value, 0) / checks.length)
  return score >= 70
    ? positive('execution', score, 'EXECUTION_REQUIREMENTS_MET')
    : negative('execution', score, 'EXECUTION_REQUIREMENTS_NOT_MET')
}

function assessCommerce(creator: CreatorProfile, required: boolean | undefined): DimensionAssessment {
  if (required === undefined) return missing('commerce', 'COMMERCE_REQUIREMENT_MISSING')
  if (!required) return positive('commerce', 100, 'COMMERCE_NOT_REQUIRED')
  const score = creator.affiliateCapability === 'experienced'
    ? 100
    : creator.affiliateCapability === 'learning' ? 50 : 0
  return score >= 70
    ? positive('commerce', score, 'AFFILIATE_CAPABILITY_MATCH')
    : negative('commerce', score, 'AFFILIATE_CAPABILITY_GAP')
}

function assessAvailability(
  creator: CreatorProfile,
  required: CreatorAvailability | undefined,
): DimensionAssessment {
  if (required === undefined) return missing('availability', 'AVAILABILITY_REQUIREMENT_MISSING')
  const score = ordinalAvailability(creator.availability) >= ordinalAvailability(required) ? 100 : 0
  return score === 100
    ? positive('availability', score, 'AVAILABILITY_MATCH')
    : negative('availability', score, 'AVAILABILITY_GAP')
}

function positive(dimension: CreatorFitDimension, score: number, reasonCode: string): DimensionAssessment {
  return { dimension, status: 'POSITIVE', score, reasonCode }
}
function negative(dimension: CreatorFitDimension, score: number, reasonCode: string): DimensionAssessment {
  return { dimension, status: 'NEGATIVE', score, reasonCode }
}
function missing(dimension: CreatorFitDimension, reasonCode: string): DimensionAssessment {
  return { dimension, status: 'MISSING', reasonCode }
}
function ordinalBudget(value: CreatorBudgetMode): number { return ['zero', 'low', 'medium', 'high'].indexOf(value) }
function ordinalAvailability(value: CreatorAvailability): number { return ['unavailable', 'limited', 'available'].indexOf(value) }
function evidenceReliability(value: CreatorProfile['evidenceConfidence']): number {
  return value === 'high' ? 1 : value === 'medium' ? 0.75 : 0.5
}
function classifyConfidence(score: number): CreatorFitConfidence {
  if (score >= 80) return 'HIGH'
  if (score >= 50) return 'MEDIUM'
  return 'LOW'
}
function round(value: number): number { return Math.round(value * 100) / 100 }
