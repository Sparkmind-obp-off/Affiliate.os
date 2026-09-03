/** Public contract for Content Generation Foundation (Task 12). */
export const MODULE_ID = 'module-08-content-generation' as const
export const MODULE_TITLE = 'Content Generation Foundation' as const
export const MODULE_STATUS = 'FOUNDATION_IMPLEMENTED' as const

export { contentGenerationRoutes } from './infrastructure/http/content-generation-routes.js'
export {
  createContentGeneration,
  fingerprint,
  getContentGeneration,
  listContentGenerations,
  parseContentGenerationListLimit,
  requestContentGeneration,
  reviewContentGeneration,
  DEFAULT_CONTENT_GENERATION_LIST_LIMIT,
  MAX_CONTENT_GENERATION_LIST_LIMIT,
  type CreateContentGenerationDependencies,
} from './application/content-generation-service.js'
export {
  createContentGenerationSchema,
  generationSpecificationSchema,
  parseCreateContentGeneration,
  parseReviewContentGeneration,
  reviewContentGenerationSchema,
} from './application/schemas.js'
export {
  UnavailableGenerationProvider,
  systemGenerationClock,
  type ContentGenerationRepository,
  type GenerationClock,
  type GenerationProvider,
} from './application/ports.js'
export {
  CONTENT_GENERATION_POLICY_VERSION,
  MAX_GENERATION_INSTRUCTIONS_LENGTH,
  MAX_GENERATION_LENGTH,
  MIN_GENERATION_LENGTH,
  assertContentGenerationTransition,
  canTransitionContentGeneration,
  isContentGenerationStatus,
  validateGeneratedArtifact,
} from './domain/generation-policy.js'
export {
  CONTENT_GENERATION_LANGUAGES,
  CONTENT_GENERATION_STATUSES,
  CONTENT_GENERATION_TYPES,
  type ContentGenerationLanguage,
  type ContentGenerationStatus,
  type ContentGenerationType,
} from './domain/vocabularies.js'
export type {
  ContentGeneration,
  CreateContentGenerationInput,
  GeneratedArtifact,
  GenerationMetadata,
  GenerationProviderResult,
  GenerationSpecification,
} from './domain/content-generation.js'
export {
  PostgresContentGenerationRepository,
  mapContentGenerationRow,
  type GenerationPostgresQueryExecutor,
  type GenerationQueryResult,
} from './infrastructure/persistence/postgres-content-generation-repository.js'
export { createPostgresContentGenerationRepository } from './infrastructure/persistence/postgres-client.js'
