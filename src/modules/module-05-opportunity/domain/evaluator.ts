/**
 * Opportunity evaluation — the domain composition of the vertical.
 *
 * Contract source: OPPORTUNITY ENGINE & SCORING SYSTEM v1.0
 *   §3  the opportunity loop
 *   §38 the opportunity card
 *   §57 100 opportunities must be reduced to a TOP N
 *   §70 MVP scope: entity, score, priority, decision, explanation, angle
 *
 * This is a PURE domain service (DOC 24 §328): no HTTP, no database, no clock
 * dependency inside the computation. `evaluated_at` is injected by the caller
 * so the result stays reproducible in a test.
 */

import { recommendAngles, type RecommendedAngle } from './angles.js'
import { decideOpportunity, type DecisionResult } from './decision.js'
import { explainOpportunity, type OpportunityExplanation } from './explanation.js'
import { prioritizeOpportunity, type PriorityResult } from './priority.js'
import { scoreOpportunity, type OpportunityScore } from './scoring.js'
import type { OpportunityCandidate, SignalProvenance } from './signals.js'

/** How many alternative angles accompany the recommendation (§40). */
export const ALTERNATIVE_ANGLE_COUNT = 2

/** Default shortlist size (§57 — "TOP 5", not 100 recommendations). */
export const DEFAULT_SHORTLIST_SIZE = 5
export const MAX_SHORTLIST_SIZE = 25

export interface OpportunityEvaluation {
  candidate_ref: string
  product_name: string
  score: OpportunityScore
  decision: DecisionResult
  priority: PriorityResult
  recommended_angle: RecommendedAngle | null
  alternative_angles: RecommendedAngle[]
  explanation: OpportunityExplanation
  provenance: SignalProvenance | null
  /** Injected, never read from the clock inside the domain. */
  evaluated_at: string
}

export function evaluateOpportunity(
  candidate: OpportunityCandidate,
  evaluatedAt: string,
): OpportunityEvaluation {
  const score = scoreOpportunity(candidate)
  const decision = decideOpportunity(candidate, score)
  const priority = prioritizeOpportunity(candidate, score)
  const angles = recommendAngles(candidate)

  const recommended = angles[0] ?? null
  const alternatives = angles.slice(1, 1 + ALTERNATIVE_ANGLE_COUNT)

  const explanation = explainOpportunity({
    candidate,
    score,
    decision,
    priority,
    bestAngle: recommended ? { angle: recommended.angle, format: recommended.format } : null,
  })

  return {
    candidate_ref: candidate.candidate_ref,
    product_name: candidate.product_name,
    score,
    decision,
    priority,
    recommended_angle: recommended,
    alternative_angles: alternatives,
    explanation,
    provenance: candidate.provenance ?? null,
    evaluated_at: evaluatedAt,
  }
}

export interface RankedOpportunity {
  rank: number
  evaluation: OpportunityEvaluation
}

export interface OpportunityRanking {
  shortlist: RankedOpportunity[]
  /** Everything evaluated but not shortlisted — kept so nothing disappears. */
  considered_count: number
  shortlist_size: number
  /** Count per decision, so the caller sees the shape of the whole batch. */
  decision_breakdown: Record<string, number>
}

/**
 * §57/§58 — rank a batch and cut it to a shortlist.
 *
 * Ordering is fully deterministic: priority score, then total score, then the
 * candidate reference. Two identical batches always produce identical ranks.
 */
export function rankOpportunities(
  candidates: OpportunityCandidate[],
  evaluatedAt: string,
  shortlistSize: number = DEFAULT_SHORTLIST_SIZE,
): OpportunityRanking {
  const evaluations = candidates.map((candidate) => evaluateOpportunity(candidate, evaluatedAt))

  const sorted = [...evaluations].sort((a, b) => {
    if (b.priority.priority_score !== a.priority.priority_score) {
      return b.priority.priority_score - a.priority.priority_score
    }
    if (b.score.total !== a.score.total) return b.score.total - a.score.total
    return a.candidate_ref.localeCompare(b.candidate_ref)
  })

  const breakdown: Record<string, number> = {}
  for (const evaluation of evaluations) {
    const key = evaluation.decision.decision
    breakdown[key] = (breakdown[key] ?? 0) + 1
  }

  const size = Math.max(1, Math.min(shortlistSize, MAX_SHORTLIST_SIZE))

  return {
    shortlist: sorted.slice(0, size).map((evaluation, index) => ({
      rank: index + 1,
      evaluation,
    })),
    considered_count: evaluations.length,
    shortlist_size: Math.min(size, evaluations.length),
    decision_breakdown: breakdown,
  }
}
