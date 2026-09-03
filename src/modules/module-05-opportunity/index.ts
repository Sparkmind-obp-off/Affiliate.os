/**
 * OPPORTUNITY ENGINE & SCORING SYSTEM
 * Module: module-05-opportunity
 * Architecture reference: AFFILIATE OS — OPPORTUNITY ENGINE & SCORING SYSTEM v1.0
 *
 * PUBLIC CONTRACT — this file is the ONLY legal import surface of this module.
 * Other modules MUST import from '@modules/module-05-opportunity' and MUST NOT reach into
 * this module's internal folders (enforced by tests/architecture).
 *
 * STATUS: IMPLEMENTED (first MVP vertical, AFFILIATE-OS-MVP-VERTICAL-003).
 *
 * SCOPE OF THIS MODULE (MVP Scope §24 build order, Opportunity Engine §70):
 *   scoring → classification → decision → priority → explanation → angle → ranking.
 *
 * NOT in this module (deliberately): persistence of evaluations. The locked
 * database is PostgreSQL and CONFLICT-01 is still OPEN, so the application
 * layer ships the port only (`OpportunityEvaluationRecorder`) and the
 * persistence-dependent routes answer NOT_IMPLEMENTED rather than faking a
 * result. See docs/ARCHITECTURE-CONFLICTS.md CONFLICT-06.
 */

export const MODULE_ID = 'module-05-opportunity' as const
export const MODULE_TITLE = 'Opportunity Engine & Scoring System' as const
export const MODULE_STATUS = 'IMPLEMENTED' as const

/** The router this module owns. Mounted by the app at /api/v1/affiliate. */
export { opportunityRoutes } from './infrastructure/http/opportunity-routes.js'

/** Use cases — the only legal way for another transport to run this vertical. */
export {
  executeEvaluateOpportunity,
  executeRankOpportunities,
  parseEvaluateInput,
  parseRankInput,
  type EvaluateOpportunityDeps,
} from './application/evaluate-opportunity.js'

export {
  executeCreateOpportunity,
  executeGetOpportunity,
  executeListOpportunities,
  executeTransitionOpportunity,
  parseOpportunityListLimit,
  parseTransitionPayload,
  DEFAULT_OPPORTUNITY_LIST_LIMIT,
  MAX_OPPORTUNITY_LIST_LIMIT,
  opportunityModelVersions,
  type OpportunityLifecycleDeps,
} from './application/opportunity-lifecycle.js'

export {
  MAX_BATCH_SIZE,
  candidateSchema,
  evaluateRequestSchema,
  rankRequestSchema,
  type EvaluateRequest,
  type RankRequest,
} from './application/schemas.js'

export {
  type Clock,
  type CreateOpportunityRecord,
  type OpportunityEvaluationRecorder,
  type OpportunityRepository,
  type OpportunityTenantContext,
  type StoredOpportunity,
} from './application/ports.js'

export {
  OPPORTUNITY_STATUSES,
  canTransitionOpportunity,
  isOpportunityStatus,
  type OpportunityStatus,
} from './domain/lifecycle.js'

export {
  PostgresOpportunityRepository,
  mapOpportunityRow,
  type PostgresQueryExecutor,
  type QueryResult,
} from './infrastructure/persistence/postgres-opportunity-repository.js'
export { createPostgresOpportunityRepository } from './infrastructure/persistence/postgres-client.js'

/** Domain contract — value objects and result shapes other modules may read. */
export {
  DEFAULT_SHORTLIST_SIZE,
  MAX_SHORTLIST_SIZE,
  evaluateOpportunity,
  rankOpportunities,
  type OpportunityEvaluation,
  type OpportunityRanking,
  type RankedOpportunity,
} from './domain/evaluator.js'

export {
  CLASSIFICATIONS,
  CLASSIFICATION_BANDS,
  DIMENSION_WEIGHTS,
  SCORING_MODEL_VERSION,
  classifyScore,
  scoreOpportunity,
  type OpportunityClassification,
  type OpportunityScore,
} from './domain/scoring.js'

export {
  DECISIONS,
  DECISION_MODEL_VERSION,
  DECISION_REASON_CODES,
  DECISION_RULE_DESCRIPTORS,
  DECISION_THRESHOLDS,
  decideOpportunity,
  type DecisionResult,
  type OpportunityDecision,
} from './domain/decision.js'

export {
  PRIORITY_BANDS,
  PRIORITY_MODEL_VERSION,
  assessExecutionFeasibility,
  prioritizeOpportunity,
  type PriorityBand,
  type PriorityResult,
} from './domain/priority.js'

export {
  ANGLE_FORMATS,
  ANGLE_MODEL_VERSION,
  recommendAngles,
  type AngleFormat,
  type RecommendedAngle,
} from './domain/angles.js'

export {
  EXPLANATION_MODEL_VERSION,
  explainOpportunity,
  type ExplanationItem,
  type OpportunityExplanation,
} from './domain/explanation.js'

export { describeScoringModel, type ScoringModelDescriptor } from './domain/model-descriptor.js'

export {
  BUDGET_MODES,
  CONFIDENCE_LEVELS,
  MOMENTUM_STATES,
  OPPORTUNITY_DIMENSIONS,
  PRODUCTION_COMPLEXITY,
  type BudgetMode,
  type ConfidenceLevel,
  type ExecutionContext,
  type MomentumState,
  type OpportunityCandidate,
  type OpportunityDimension,
  type ProductionComplexity,
} from './domain/signals.js'
