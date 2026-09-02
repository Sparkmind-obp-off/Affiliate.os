/**
 * Opportunity scoring model.
 *
 * Contract source: OPPORTUNITY ENGINE & SCORING SYSTEM v1.0
 *   §10 initial weighted model
 *   §29 opportunity score formula
 *   §30 risk inversion
 *   §31 classification bands
 *   §38 worked example (reproduced verbatim by the unit tests)
 *
 * The weights are a STARTING HYPOTHESIS (MVP Scope §16) — they are versioned
 * and disclosed through the API so a recorded decision can always be replayed
 * against the model that produced it.
 */

import {
  OPPORTUNITY_DIMENSIONS,
  clampScore,
  resolveMomentumScore,
  roundContribution,
  roundScore,
  type OpportunityCandidate,
  type OpportunityDimension,
} from './signals.js'

/** Version of the weighted model. Bump when any weight or band changes. */
export const SCORING_MODEL_VERSION = '1.0.0'

/** §10 — weights. MUST sum to exactly 1. Enforced by a unit test. */
export const DIMENSION_WEIGHTS: Readonly<Record<OpportunityDimension, number>> = Object.freeze({
  demand: 0.2,
  product_fit: 0.15,
  creator_fit: 0.15,
  content_potential: 0.15,
  economics: 0.1,
  competition: 0.1,
  momentum: 0.05,
  risk: 0.1,
})

/** §31 — classification bands, highest first. */
export const CLASSIFICATIONS = ['EXCEPTIONAL', 'STRONG', 'TESTABLE', 'WATCH', 'PASS'] as const
export type OpportunityClassification = (typeof CLASSIFICATIONS)[number]

export interface ClassificationBand {
  classification: OpportunityClassification
  /** Inclusive lower bound of the band. */
  min_score: number
  label: string
}

export const CLASSIFICATION_BANDS: readonly ClassificationBand[] = Object.freeze([
  { classification: 'EXCEPTIONAL', min_score: 90, label: 'Exceptional opportunity' },
  { classification: 'STRONG', min_score: 80, label: 'Strong opportunity' },
  { classification: 'TESTABLE', min_score: 70, label: 'Testable opportunity' },
  { classification: 'WATCH', min_score: 60, label: 'Watch before investing' },
  { classification: 'PASS', min_score: 0, label: 'Do not spend content resources' },
])

export interface DimensionScore {
  dimension: OpportunityDimension
  /** The signal as supplied (clamped), before weighting. */
  raw_score: number
  /**
   * The value that actually entered the weighted sum. Identical to `raw_score`
   * for every dimension except `risk`, which is inverted per §30.
   */
  effective_score: number
  weight: number
  /** `effective_score × weight`, rounded to 2 decimals for display only. */
  contribution: number
}

export interface OpportunityScore {
  model_version: string
  /** Integer 0–100 (§29 + §31 operate on the rounded total). */
  total: number
  /** Unrounded total, kept so a replay can verify the rounding step. */
  total_precise: number
  classification: OpportunityClassification
  classification_label: string
  components: DimensionScore[]
  /** `100 − risk` (§30), surfaced explicitly because it is easy to misread. */
  risk_adjusted_score: number
}

/** Resolve the raw 0–100 signal for a dimension from a candidate. */
export function rawSignal(
  candidate: OpportunityCandidate,
  dimension: OpportunityDimension,
): number {
  if (dimension === 'momentum') return resolveMomentumScore(candidate.momentum)
  return clampScore(candidate[dimension])
}

/**
 * §30 — risk must be inverted before it can be added to a positive score.
 * Risk 20 (low) becomes 80; risk 80 (high) becomes 20.
 */
export function riskAdjustedScore(risk: number): number {
  return clampScore(100 - clampScore(risk))
}

/** §31 — map a total score to its classification band. */
export function classifyScore(total: number): ClassificationBand {
  const value = clampScore(total)
  for (const band of CLASSIFICATION_BANDS) {
    if (value >= band.min_score) return band
  }
  // Unreachable: the last band starts at 0 and `value` is clamped to >= 0.
  return CLASSIFICATION_BANDS[CLASSIFICATION_BANDS.length - 1] as ClassificationBand
}

/**
 * §29 — compute the weighted opportunity score.
 *
 * Deterministic: no clock, no randomness, no I/O. The same candidate and the
 * same `SCORING_MODEL_VERSION` always produce the same score.
 */
export function scoreOpportunity(candidate: OpportunityCandidate): OpportunityScore {
  const components: DimensionScore[] = []
  let totalPrecise = 0

  for (const dimension of OPPORTUNITY_DIMENSIONS) {
    const raw = rawSignal(candidate, dimension)
    const effective = dimension === 'risk' ? riskAdjustedScore(raw) : raw
    const weight = DIMENSION_WEIGHTS[dimension]
    const contribution = effective * weight

    totalPrecise += contribution
    components.push({
      dimension,
      raw_score: roundScore(raw),
      effective_score: roundScore(effective),
      weight,
      contribution: roundContribution(contribution),
    })
  }

  const total = roundScore(totalPrecise)
  const band = classifyScore(total)

  return {
    model_version: SCORING_MODEL_VERSION,
    total,
    total_precise: roundContribution(totalPrecise),
    classification: band.classification,
    classification_label: band.label,
    components,
    risk_adjusted_score: roundScore(riskAdjustedScore(clampScore(candidate.risk))),
  }
}
