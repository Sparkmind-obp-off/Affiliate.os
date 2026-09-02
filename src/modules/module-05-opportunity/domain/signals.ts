/**
 * Opportunity signals — value objects.
 *
 * Contract source: AFFILIATE OS — OPPORTUNITY ENGINE & SCORING SYSTEM v1.0
 *   §4  input from the Demand Engine
 *   §5  product input
 *   §6  creator context
 *   §9  opportunity dimensions
 *   §22 momentum states
 *
 * These are pure value objects: no HTTP, no database, no SDK (DOC 24 §328).
 */

/** The eight scored dimensions of §9. Order is part of the published contract. */
export const OPPORTUNITY_DIMENSIONS = [
  'demand',
  'product_fit',
  'creator_fit',
  'content_potential',
  'economics',
  'competition',
  'momentum',
  'risk',
] as const

export type OpportunityDimension = (typeof OPPORTUNITY_DIMENSIONS)[number]

/**
 * Momentum states (§22), lowest → highest.
 *
 * A caller may supply either the state or a raw 0–100 momentum score; the
 * state is mapped to the midpoint of its band so both forms are comparable.
 */
export const MOMENTUM_STATES = [
  'DECLINING',
  'STABLE',
  'EMERGING',
  'GROWING',
  'ACCELERATING',
] as const

export type MomentumState = (typeof MOMENTUM_STATES)[number]

export const MOMENTUM_STATE_SCORE: Readonly<Record<MomentumState, number>> = Object.freeze({
  DECLINING: 20,
  STABLE: 45,
  EMERGING: 60,
  GROWING: 80,
  ACCELERATING: 95,
})

/** Evaluation confidence (MVP Scope §17, Opportunity Engine §4). */
export const CONFIDENCE_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number]

/** Resource modes of §60. */
export const BUDGET_MODES = ['ZERO_BUDGET', 'LOW_BUDGET', 'NORMAL', 'HIGH_BUDGET'] as const
export type BudgetMode = (typeof BUDGET_MODES)[number]

/** Production complexity of the content the opportunity would require (§62, §63). */
export const PRODUCTION_COMPLEXITY = ['LOW', 'MEDIUM', 'HIGH'] as const
export type ProductionComplexity = (typeof PRODUCTION_COMPLEXITY)[number]

/**
 * Execution context — §59 execution feasibility, §60–§63 resource awareness.
 *
 * This is creator reality, not product data: the same product is a different
 * opportunity for a creator who cannot obtain a sample (§63).
 */
export interface ExecutionContext {
  budget_mode: BudgetMode
  /** Does testing this opportunity require physically obtaining the product? */
  sample_required: boolean
  production_complexity: ProductionComplexity
  /** Can the creator actually produce the content (§59)? */
  creator_can_produce_content: boolean
  /** Is the product promotable/accessible to this creator right now (§59)? */
  product_accessible: boolean
}

/** Data provenance required by MVP Scope §17 — source + timestamp + confidence. */
export interface SignalProvenance {
  source: string
  checked_at: string
}

/**
 * A candidate opportunity as it enters the engine.
 *
 * NOTE ON `competition`: the dimension is scored as HEADROOM, not saturation.
 * 100 = uncontested / wide-open content space, 0 = fully saturated. This
 * follows §29, where competition contributes POSITIVELY to the weighted score.
 *
 * NOTE ON `risk`: risk is scored as EXPOSURE — 0 = no risk, 100 = extreme risk
 * (§30). It is inverted before it enters the weighted sum.
 */
export interface OpportunityCandidate {
  /** Caller-supplied stable reference, echoed back so a batch stays traceable. */
  candidate_ref: string
  product_name: string
  demand: number
  product_fit: number
  creator_fit: number
  content_potential: number
  economics: number
  /** Competition HEADROOM: 100 = uncontested, 0 = saturated. */
  competition: number
  momentum: MomentumState | number
  /** Risk EXPOSURE: 0 = none, 100 = extreme. */
  risk: number
  confidence: ConfidenceLevel
  execution: ExecutionContext
  /**
   * A competitor content gap has actually been identified (§21, §34, §52).
   * Absence of evidence is NOT a gap — defaults to false.
   */
  content_gap_identified: boolean
  /** Platform/policy concern flagged (§28). A flag never becomes a silent TEST. */
  policy_risk_flagged: boolean
  /** Dimensions the caller could not supply (§36 missing data). */
  missing_signals: OpportunityDimension[]
  provenance?: SignalProvenance
}

export const SCORE_MIN = 0
export const SCORE_MAX = 100

/** Clamp a signal into the published 0–100 range (§11). */
export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return SCORE_MIN
  if (value < SCORE_MIN) return SCORE_MIN
  if (value > SCORE_MAX) return SCORE_MAX
  return value
}

/**
 * Round half-up to an integer.
 *
 * Determinism matters more than elegance here: `Math.round` already rounds
 * half-up for positive numbers, and every score in this engine is non-negative
 * and clamped, so the behaviour is stable and documented.
 */
export function roundScore(value: number): number {
  return Math.round(clampScore(value))
}

/** Round to two decimals — used for weighted contributions, never for decisions. */
export function roundContribution(value: number): number {
  return Math.round(value * 100) / 100
}

/** Resolve momentum given as either a state or a raw score into a 0–100 score. */
export function resolveMomentumScore(momentum: MomentumState | number): number {
  if (typeof momentum === 'number') return clampScore(momentum)
  return MOMENTUM_STATE_SCORE[momentum]
}

/** Classify a momentum score back into its state — used for explanations (§39). */
export function resolveMomentumState(score: number): MomentumState {
  const value = clampScore(score)
  if (value < 35) return 'DECLINING'
  if (value < 55) return 'STABLE'
  if (value < 70) return 'EMERGING'
  if (value < 90) return 'GROWING'
  return 'ACCELERATING'
}
