import type {
  AudienceSegment,
  ContentFormat,
  CreatorFitCriteria,
  EvidenceConfidence,
} from '@modules/module-06-creator-fit'
import type { DemandConfidence, DemandSourceType } from '@modules/module-04-demand'

export const CONTENT_ANGLES = [
  'PROBLEM_SOLUTION', 'HOW_TO', 'DEMONSTRATION', 'COMPARISON', 'REVIEW', 'TUTORIAL',
  'EDUCATIONAL', 'STORYTELLING', 'BEFORE_AFTER', 'FAQ', 'MYTH_BUSTING', 'LISTICLE',
] as const
export type ContentAngle = (typeof CONTENT_ANGLES)[number]

export const CONTENT_OPPORTUNITY_STATUSES = ['draft', 'ready', 'archived'] as const
export type ContentOpportunityStatus = (typeof CONTENT_OPPORTUNITY_STATUSES)[number]

export interface TargetAudience {
  audienceSegments: AudienceSegment[]
  audienceInterests: string[]
  painPoints: string[]
  desiredOutcome: string
}

export interface ExecutionConstraints {
  requiresSample?: boolean
  minimumBudget?: CreatorFitCriteria['minimumBudget']
  affiliateRequired?: boolean
  minimumAvailability?: CreatorFitCriteria['minimumAvailability']
}

/** Immutable evidence snapshot derived from a workspace-owned Module 04 signal. */
export interface ContentOpportunityEvidence {
  demandSignalId: string
  sourceType: DemandSourceType
  sourceRef?: string
  observedAt: string
  evidence: string
  confidence: DemandConfidence
  demandScore: number
}

export interface ContentOpportunityInput {
  opportunityId: string
  title: string
  primaryAngle: ContentAngle
  secondaryAngles: ContentAngle[]
  targetAudience: TargetAudience
  contentFormats: ContentFormat[]
  creatorRequirements: CreatorFitCriteria
  executionConstraints: ExecutionConstraints
  demandSignalIds: string[]
  status: ContentOpportunityStatus
}

export interface ContentOpportunity {
  id: string
  workspaceId: string
  opportunityId: string
  title: string
  primaryAngle: ContentAngle
  secondaryAngles: ContentAngle[]
  targetAudience: TargetAudience
  contentFormats: ContentFormat[]
  creatorRequirements: CreatorFitCriteria
  executionConstraints: ExecutionConstraints
  evidence: ContentOpportunityEvidence[]
  confidence: EvidenceConfidence
  status: ContentOpportunityStatus
  createdAt: string
  updatedAt: string
}

export function aggregateEvidenceConfidence(
  evidence: readonly ContentOpportunityEvidence[],
): EvidenceConfidence {
  if (evidence.length === 0) return 'low'
  const values: Record<DemandConfidence, number> = { low: 1, medium: 2, high: 3, very_high: 4 }
  const average = evidence.reduce((sum, item) => sum + values[item.confidence], 0) / evidence.length
  if (average >= 3) return 'high'
  if (average >= 2) return 'medium'
  return 'low'
}
