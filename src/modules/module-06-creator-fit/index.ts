/** Public contract for Creator Fit & Matching Foundation (Task 10). */
export const MODULE_ID = 'module-06-creator-fit' as const
export const MODULE_TITLE = 'Creator Fit & Personalization Engine' as const
export const MODULE_STATUS = 'FOUNDATION_IMPLEMENTED' as const

export { creatorRoutes } from './infrastructure/http/creator-routes.js'
export {
  createCreatorProfile,
  evaluateStoredCreatorFit,
  getCreatorProfile,
  listCreatorProfiles,
  parseCreatorListLimit,
  DEFAULT_CREATOR_LIST_LIMIT,
  MAX_CREATOR_LIST_LIMIT,
} from './application/creator-service.js'
export {
  creatorFitRequestSchema,
  creatorProfileSchema,
  parseCreatorFitRequest,
  parseCreatorProfile,
} from './application/schemas.js'
export {
  systemCreatorClock,
  type CreatorClock,
  type CreatorRepository,
} from './application/ports.js'
export {
  AFFILIATE_CAPABILITIES,
  AUDIENCE_SEGMENTS,
  CAPABILITY_LEVELS,
  CONTENT_FORMATS,
  CREATOR_AVAILABILITY,
  CREATOR_BUDGET_MODES,
  CREATOR_CAPABILITY_TYPES,
  CREATOR_NICHES,
  CREATOR_PLATFORMS,
  EVIDENCE_CONFIDENCE,
  EVIDENCE_SOURCES,
  normalizeMatchToken,
  type AffiliateCapability,
  type AudienceSegment,
  type CapabilityLevel,
  type ContentFormat,
  type CreatorAvailability,
  type CreatorBudgetMode,
  type CreatorCapability,
  type CreatorCapabilityType,
  type CreatorNiche,
  type CreatorPlatform,
  type CreatorProfile,
  type CreatorProfileInput,
  type EvidenceConfidence,
  type EvidenceSource,
} from './domain/creator.js'
export {
  CREATOR_FIT_BANDS,
  CREATOR_FIT_CLASSIFICATIONS,
  CREATOR_FIT_CONFIDENCE,
  CREATOR_FIT_DIMENSIONS,
  CREATOR_FIT_POLICY_VERSION,
  CREATOR_FIT_WEIGHTS,
  classifyCreatorFit,
  evaluateCreatorFit,
  type CapabilityRequirement,
  type CreatorFitClassification,
  type CreatorFitConfidence,
  type CreatorFitCriteria,
  type CreatorFitDimension,
  type CreatorFitDimensionResult,
  type CreatorFitDimensionStatus,
  type CreatorFitResult,
} from './domain/fit-policy.js'
export {
  PostgresCreatorRepository,
  mapCreatorRow,
  type CreatorPostgresQueryExecutor,
  type CreatorQueryResult,
} from './infrastructure/persistence/postgres-creator-repository.js'
export { createPostgresCreatorRepository } from './infrastructure/persistence/postgres-client.js'
