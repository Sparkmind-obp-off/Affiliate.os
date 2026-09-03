/** Public contract for Content Strategy & Content Opportunity Foundation (Task 11). */
export const MODULE_ID = 'module-07-content' as const
export const MODULE_TITLE = 'Content Production OS' as const
export const MODULE_STATUS = 'FOUNDATION_IMPLEMENTED' as const

export { contentOpportunityRoutes } from './infrastructure/http/content-opportunity-routes.js'
export {
  createContentOpportunity,
  evaluateStoredContentOpportunity,
  getContentOpportunity,
  listContentOpportunities,
  parseContentOpportunityListLimit,
  DEFAULT_CONTENT_OPPORTUNITY_LIST_LIMIT,
  MAX_CONTENT_OPPORTUNITY_LIST_LIMIT,
  type CreateContentOpportunityDependencies,
} from './application/content-opportunity-service.js'
export {
  contentOpportunitySchema,
  evaluateContentOpportunitySchema,
  parseContentEvaluation,
  parseContentOpportunity,
} from './application/schemas.js'
export {
  systemContentClock,
  type ContentClock,
  type ContentOpportunityRepository,
} from './application/ports.js'
export {
  CONTENT_ANGLES,
  CONTENT_OPPORTUNITY_STATUSES,
  aggregateEvidenceConfidence,
  type ContentAngle,
  type ContentOpportunity,
  type ContentOpportunityEvidence,
  type ContentOpportunityInput,
  type ContentOpportunityStatus,
  type ExecutionConstraints,
  type TargetAudience,
} from './domain/content-opportunity.js'
export {
  CONTENT_OPPORTUNITY_BANDS,
  CONTENT_OPPORTUNITY_CLASSIFICATIONS,
  CONTENT_OPPORTUNITY_DIMENSIONS,
  CONTENT_OPPORTUNITY_POLICY_VERSION,
  CONTENT_OPPORTUNITY_WEIGHTS,
  classifyContentOpportunity,
  evaluateContentOpportunity,
  type ContentOpportunityClassification,
  type ContentOpportunityDimension,
  type ContentOpportunityDimensionResult,
  type ContentOpportunityDimensionStatus,
  type ContentOpportunityEvaluation,
} from './domain/evaluation-policy.js'
export {
  PostgresContentOpportunityRepository,
  mapContentOpportunityRow,
  type ContentPostgresQueryExecutor,
  type ContentQueryResult,
} from './infrastructure/persistence/postgres-content-opportunity-repository.js'
export { createPostgresContentOpportunityRepository } from './infrastructure/persistence/postgres-client.js'
