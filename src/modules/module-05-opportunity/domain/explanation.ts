/**
 * Explanation engine.
 *
 * Contract source: OPPORTUNITY ENGINE & SCORING SYSTEM v1.0 §39 ("Engine wajib
 * menghasilkan explanation"), §77 (WHAT / WHY / FOR WHOM / WHY NOW / HOW /
 * HOW GOOD / WHAT NEXT), and MVP Scope §26 — the MVP is only successful if the
 * user can EXPLAIN why an opportunity was chosen.
 *
 * An explanation is therefore a first-class output, not a cosmetic string. It
 * is machine-readable (code + severity) so the UI can render it and a test can
 * assert it.
 */

import {
  clampScore,
  resolveMomentumScore,
  resolveMomentumState,
  type OpportunityCandidate,
} from './signals.js'
import type { OpportunityScore } from './scoring.js'
import type { DecisionResult } from './decision.js'
import type { PriorityResult } from './priority.js'

export const EXPLANATION_MODEL_VERSION = '1.0.0'

export const EXPLANATION_SEVERITIES = ['STRENGTH', 'CAUTION', 'BLOCKER'] as const
export type ExplanationSeverity = (typeof EXPLANATION_SEVERITIES)[number]

export interface ExplanationItem {
  code: string
  severity: ExplanationSeverity
  statement: string
}

export interface OpportunityExplanation {
  model_version: string
  /** §77 — the seven questions every opportunity must answer. */
  summary: {
    what: string
    why: string
    for_whom: string
    why_now: string
    how: string
    how_good: string
    what_next: string
  }
  items: ExplanationItem[]
}

/** Thresholds used only for narrative wording — never for decisions. */
const STRONG = 80
const WEAK = 50

export function explainOpportunity(input: {
  candidate: OpportunityCandidate
  score: OpportunityScore
  decision: DecisionResult
  priority: PriorityResult
  bestAngle: { angle: string; format: string } | null
}): OpportunityExplanation {
  const { candidate, score, decision, priority, bestAngle } = input
  const items: ExplanationItem[] = []

  const demand = clampScore(candidate.demand)
  const productFit = clampScore(candidate.product_fit)
  const creatorFit = clampScore(candidate.creator_fit)
  const contentPotential = clampScore(candidate.content_potential)
  const economics = clampScore(candidate.economics)
  const competition = clampScore(candidate.competition)
  const risk = clampScore(candidate.risk)
  const momentum = resolveMomentumScore(candidate.momentum)
  const momentumState = resolveMomentumState(momentum)

  const note = (
    code: string,
    severity: ExplanationSeverity,
    statement: string,
  ): void => void items.push({ code, severity, statement })

  if (demand >= STRONG) note('DEMAND_STRONG', 'STRENGTH', 'Demand evidence is strong.')
  else if (demand < WEAK) note('DEMAND_WEAK', 'CAUTION', 'Demand evidence is weak.')

  if (productFit >= STRONG)
    note('PRODUCT_FIT_DIRECT', 'STRENGTH', 'The product directly solves the demand.')
  else if (productFit < WEAK)
    note('PRODUCT_FIT_WEAK', 'CAUTION', 'The product only weakly relates to the demand.')

  if (creatorFit >= STRONG)
    note('CREATOR_FIT_ALIGNED', 'STRENGTH', 'The opportunity is aligned with the creator niche.')
  else if (creatorFit < WEAK)
    note(
      'CREATOR_FIT_WEAK',
      'CAUTION',
      'Creator fit is low: a good product is not automatically your opportunity.',
    )

  if (contentPotential >= STRONG)
    note('CONTENT_HIGHLY_DEMONSTRABLE', 'STRENGTH', 'The product is highly demonstrable on camera.')
  else if (contentPotential < WEAK)
    note('CONTENT_HARD_TO_DEMONSTRATE', 'CAUTION', 'The product is hard to demonstrate visually.')

  if (economics >= STRONG)
    note('ECONOMICS_FAVOURABLE', 'STRENGTH', 'Expected affiliate value comfortably covers the test.')
  else if (economics < WEAK)
    note('ECONOMICS_THIN', 'CAUTION', 'Expected affiliate value is thin relative to content cost.')

  // Competition is HEADROOM: a low value means a crowded space.
  if (competition <= 40)
    note(
      'COMPETITION_SATURATED',
      'CAUTION',
      candidate.content_gap_identified
        ? 'The content space is crowded, but a competitor gap was identified.'
        : 'The content space is crowded and no competitor gap has been identified yet.',
    )
  else if (competition >= 85)
    note(
      'COMPETITION_UNEXPLAINED_HEADROOM',
      'CAUTION',
      'Competition is unusually low — establish why before assuming an early advantage.',
    )

  if (candidate.content_gap_identified)
    note('CONTENT_GAP_IDENTIFIED', 'STRENGTH', 'A differentiated content angle is available.')

  if (momentum >= STRONG)
    note('MOMENTUM_FAVOURABLE', 'STRENGTH', `Demand momentum is ${momentumState}.`)
  else if (momentum < 35)
    note('MOMENTUM_DECLINING', 'CAUTION', `Demand momentum is ${momentumState}.`)

  if (risk >= 70) note('RISK_HIGH', 'BLOCKER', `Risk exposure is high (${Math.round(risk)}/100).`)
  else if (risk >= 40)
    note('RISK_MODERATE', 'CAUTION', `Risk exposure is moderate (${Math.round(risk)}/100).`)
  else note('RISK_ACCEPTABLE', 'STRENGTH', `Risk exposure is acceptable (${Math.round(risk)}/100).`)

  if (candidate.policy_risk_flagged)
    note(
      'POLICY_RISK_FLAGGED',
      'BLOCKER',
      'A platform/policy risk is flagged and must be reviewed before any test.',
    )

  if (candidate.missing_signals.length > 0)
    note(
      'SIGNALS_MISSING',
      'CAUTION',
      `Missing signals: ${candidate.missing_signals.join(', ')}.`,
    )

  if (candidate.confidence === 'LOW')
    note('CONFIDENCE_LOW', 'CAUTION', 'Evaluation confidence is LOW.')

  if (priority.execution_feasibility.blocked)
    note(
      'EXECUTION_BLOCKED',
      'BLOCKER',
      'Execution is blocked: the creator cannot run this test as things stand.',
    )
  else if (priority.execution_feasibility.score < 0.7)
    note(
      'EXECUTION_CONSTRAINED',
      'CAUTION',
      `Execution feasibility is constrained (${priority.execution_feasibility.score}) for budget mode ${candidate.execution.budget_mode}.`,
    )

  if (!candidate.provenance)
    note(
      'PROVENANCE_MISSING',
      'CAUTION',
      'No source/timestamp was supplied, so freshness of the signals cannot be assessed.',
    )

  return {
    model_version: EXPLANATION_MODEL_VERSION,
    summary: {
      what: candidate.product_name,
      why: `Demand ${Math.round(demand)}/100 with product fit ${Math.round(productFit)}/100.`,
      for_whom: `Creator fit ${Math.round(creatorFit)}/100.`,
      why_now: `Momentum is ${momentumState} (${Math.round(momentum)}/100).`,
      how: bestAngle ? `${bestAngle.format}: ${bestAngle.angle}` : 'No angle recommended.',
      how_good: `Score ${score.total}/100 — ${score.classification}.`,
      what_next: `${decision.decision} (${decision.rule_id}); priority ${priority.priority_score} (${priority.band}).`,
    },
    items,
  }
}
