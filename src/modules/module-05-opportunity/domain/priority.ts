/**
 * Prioritisation & execution feasibility.
 *
 * Contract source: OPPORTUNITY ENGINE & SCORING SYSTEM v1.0
 *   §57 100 opportunities must become a TOP 5, not 100 recommendations
 *   §58 Priority = Opportunity Score × Confidence × Execution Feasibility
 *   §59 execution feasibility factors
 *   §60–§63 budget modes and resource-aware scoring
 */

import { clampScore, type ConfidenceLevel, type OpportunityCandidate } from './signals.js'
import type { OpportunityScore } from './scoring.js'

export const PRIORITY_MODEL_VERSION = '1.0.0'

/** §58 — confidence multiplier. */
export const CONFIDENCE_MULTIPLIER: Readonly<Record<ConfidenceLevel, number>> = Object.freeze({
  LOW: 0.6,
  MEDIUM: 0.85,
  HIGH: 1,
})

/** §62/§63 — production complexity multiplier. */
export const COMPLEXITY_MULTIPLIER = Object.freeze({
  LOW: 1,
  MEDIUM: 0.9,
  HIGH: 0.75,
})

/**
 * §61/§63 — a sample requirement is a real obstacle for a creator without
 * budget, and merely a cost for one with budget.
 */
export const SAMPLE_PENALTY = Object.freeze({
  ZERO_BUDGET: 0.5,
  LOW_BUDGET: 0.75,
  NORMAL: 0.95,
  HIGH_BUDGET: 1,
})

/**
 * §63 — high production complexity punishes a resource-poor creator harder.
 * The multiplier is applied on top of COMPLEXITY_MULTIPLIER.
 */
export const BUDGET_COMPLEXITY_TOLERANCE = Object.freeze({
  ZERO_BUDGET: { LOW: 1, MEDIUM: 0.9, HIGH: 0.6 },
  LOW_BUDGET: { LOW: 1, MEDIUM: 0.95, HIGH: 0.75 },
  NORMAL: { LOW: 1, MEDIUM: 1, HIGH: 0.9 },
  HIGH_BUDGET: { LOW: 1, MEDIUM: 1, HIGH: 1 },
})

export const PRIORITY_BANDS = ['P0', 'P1', 'P2', 'P3'] as const
export type PriorityBand = (typeof PRIORITY_BANDS)[number]

export interface FeasibilityFactor {
  factor: string
  multiplier: number
  note: string
}

export interface ExecutionFeasibility {
  /** 0–1. §59 — can this creator actually run the test? */
  score: number
  blocked: boolean
  factors: FeasibilityFactor[]
}

export interface PriorityResult {
  model_version: string
  /** 0–100. §58 — score × confidence × feasibility. */
  priority_score: number
  band: PriorityBand
  confidence_multiplier: number
  execution_feasibility: ExecutionFeasibility
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * §59 — execution feasibility as a product of independent obstacles.
 *
 * A hard blocker (cannot produce content, or product inaccessible) collapses
 * feasibility to 0: prioritising something the creator cannot execute would be
 * dishonest ranking, not optimism.
 */
export function assessExecutionFeasibility(candidate: OpportunityCandidate): ExecutionFeasibility {
  const { execution } = candidate
  const factors: FeasibilityFactor[] = []

  if (!execution.creator_can_produce_content) {
    factors.push({
      factor: 'creator_can_produce_content',
      multiplier: 0,
      note: 'The creator cannot produce the required content.',
    })
  }
  if (!execution.product_accessible) {
    factors.push({
      factor: 'product_accessible',
      multiplier: 0,
      note: 'The product cannot be accessed or promoted right now.',
    })
  }

  if (factors.length > 0) {
    return { score: 0, blocked: true, factors }
  }

  const samplePenalty = execution.sample_required ? SAMPLE_PENALTY[execution.budget_mode] : 1
  factors.push({
    factor: 'sample_requirement',
    multiplier: samplePenalty,
    note: execution.sample_required
      ? `A sample is required and the budget mode is ${execution.budget_mode}.`
      : 'No sample is required to test this opportunity.',
  })

  const complexityMultiplier = COMPLEXITY_MULTIPLIER[execution.production_complexity]
  factors.push({
    factor: 'production_complexity',
    multiplier: complexityMultiplier,
    note: `Production complexity is ${execution.production_complexity}.`,
  })

  const tolerance =
    BUDGET_COMPLEXITY_TOLERANCE[execution.budget_mode][execution.production_complexity]
  factors.push({
    factor: 'budget_complexity_tolerance',
    multiplier: tolerance,
    note: `Budget mode ${execution.budget_mode} against ${execution.production_complexity} production complexity.`,
  })

  const score = samplePenalty * complexityMultiplier * tolerance
  return { score: round2(score), blocked: false, factors }
}

/** §57/§58 — priority band from the priority score. */
export function bandForPriority(priorityScore: number): PriorityBand {
  if (priorityScore >= 70) return 'P0'
  if (priorityScore >= 55) return 'P1'
  if (priorityScore >= 40) return 'P2'
  return 'P3'
}

/** §58 — Priority = Opportunity Score × Confidence × Execution Feasibility. */
export function prioritizeOpportunity(
  candidate: OpportunityCandidate,
  score: OpportunityScore,
): PriorityResult {
  const feasibility = assessExecutionFeasibility(candidate)
  const confidenceMultiplier = CONFIDENCE_MULTIPLIER[candidate.confidence]
  const priorityScore = round2(
    clampScore(score.total) * confidenceMultiplier * feasibility.score,
  )

  return {
    model_version: PRIORITY_MODEL_VERSION,
    priority_score: priorityScore,
    band: bandForPriority(priorityScore),
    confidence_multiplier: confidenceMultiplier,
    execution_feasibility: feasibility,
  }
}
