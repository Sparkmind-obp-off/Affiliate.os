/**
 * Opportunity decision engine.
 *
 * Contract source:
 *   OPPORTUNITY ENGINE & SCORING SYSTEM v1.0 §32–§37 (decision vocabulary and
 *   conditions), §51–§56 (matrix cases), §28 (policy flag), §23 (timing).
 *   14A. DETERMINISTIC POLICY DECISION ENGINE §14A (same input ⇒ same
 *   decision), §14D (fixed precedence — a decision may never skip a level),
 *   §14E (a hard block can never be overridden by a lower-priority rule).
 *
 * The ladder below is evaluated top to bottom and the FIRST matching rule wins.
 * Every rule carries a stable id and reason code so a decision can be audited
 * and replayed. No AI, no clock, no randomness participates.
 */

import type { OpportunityScore } from './scoring.js'
import {
  clampScore,
  resolveMomentumScore,
  type OpportunityCandidate,
} from './signals.js'

export const DECISION_MODEL_VERSION = '1.0.0'

/** §32 — the ONLY decisions this engine may emit. */
export const DECISIONS = ['TEST_NOW', 'TEST_WITH_ANGLE', 'WATCH', 'RESEARCH_MORE', 'PASS'] as const
export type OpportunityDecision = (typeof DECISIONS)[number]

/** Stable, machine-readable reason codes (14A §14C `reason_codes[]`). */
export const DECISION_REASON_CODES = [
  'POLICY_RISK_FLAGGED',
  'EXECUTION_NOT_FEASIBLE',
  'RISK_EXPOSURE_TOO_HIGH',
  'PRODUCT_FIT_TOO_WEAK',
  'DEMAND_TOO_WEAK',
  'ECONOMICS_UNVIABLE',
  'MISSING_SIGNALS',
  'LOW_CONFIDENCE',
  'UNEXPLAINED_LOW_COMPETITION',
  'MOMENTUM_DECLINING',
  'COMPETITION_GAP_AVAILABLE',
  'EVIDENCE_SUFFICIENT_FOR_TEST',
  'BELOW_TEST_THRESHOLD',
  'WEAK_OVERALL_SIGNAL',
] as const

export type DecisionReasonCode = (typeof DECISION_REASON_CODES)[number]

/** Decision thresholds, disclosed through the API so they can be reviewed. */
export const DECISION_THRESHOLDS = Object.freeze({
  /** §24/§37 — risk exposure at or above this is a hard block. */
  risk_block: 70,
  /** §12 — below "partial solution" the product does not answer the demand. */
  product_fit_min: 50,
  /** §37/§54 — commission can never outrank demand. */
  demand_min: 40,
  /** §37 — economics below this cannot repay the content cost. */
  economics_min: 30,
  /** §53 — suspiciously open space next to strong demand needs an explanation. */
  demand_high: 75,
  competition_unexplained: 85,
  /** §22/§23 — declining momentum means the timing is wrong, not the product. */
  momentum_declining_below: 35,
  /** §34 — a tight content space is where an angle, not volume, wins. */
  competition_tight_at_or_below: 60,
  /** §31/§33 — a test needs a testable total score. */
  test_total_min: 70,
  test_demand_min: 70,
  test_product_fit_min: 70,
  test_content_potential_min: 70,
  test_risk_max: 40,
  /** §34 — the angle route accepts slightly softer signals than TEST NOW. */
  angle_demand_min: 60,
  angle_product_fit_min: 60,
  /** §35 — still worth monitoring rather than discarding. */
  watch_total_min: 60,
})

export interface DecisionRuleDescriptor {
  rule_id: string
  decision: OpportunityDecision
  reason_code: DecisionReasonCode
  /** Human-readable condition, for the disclosed model and for operators. */
  condition: string
  /** Section of the source specification this rule implements. */
  source: string
}

export interface DecisionResult {
  model_version: string
  decision: OpportunityDecision
  /** Id of the rule that actually fired — a decision is never anonymous. */
  rule_id: string
  reason_codes: DecisionReasonCode[]
  reason: string
  /** Every rule evaluated before the match, in order (audit trail). */
  evaluated_rule_ids: string[]
}

interface EvaluationInput {
  candidate: OpportunityCandidate
  score: OpportunityScore
  momentumScore: number
}

interface DecisionRule extends DecisionRuleDescriptor {
  matches(input: EvaluationInput): boolean
  reason(input: EvaluationInput): string
}

/**
 * THE LADDER (14A §14D).
 *
 * Order is the contract. Hard blocks come first so that a high score can never
 * buy its way past a policy flag, an unusable execution context, or a risk
 * exposure the creator cannot absorb.
 */
const RULES: readonly DecisionRule[] = Object.freeze([
  {
    rule_id: 'R01_POLICY_RISK_FLAGGED',
    decision: 'PASS',
    reason_code: 'POLICY_RISK_FLAGGED',
    condition: 'policy_risk_flagged === true',
    source: 'Opportunity Engine §28; 14A §14E hard deny',
    matches: ({ candidate }) => candidate.policy_risk_flagged,
    reason: () =>
      'A platform/policy risk is flagged. A flagged product is reviewed, never pushed into a content test.',
  },
  {
    rule_id: 'R02_EXECUTION_NOT_FEASIBLE',
    decision: 'PASS',
    reason_code: 'EXECUTION_NOT_FEASIBLE',
    condition: 'creator_can_produce_content === false || product_accessible === false',
    source: 'Opportunity Engine §59',
    matches: ({ candidate }) =>
      !candidate.execution.creator_can_produce_content || !candidate.execution.product_accessible,
    reason: ({ candidate }) =>
      !candidate.execution.creator_can_produce_content
        ? 'The creator cannot produce the content this opportunity requires, so it cannot be tested.'
        : 'The product is not accessible/promotable for this creator right now, so it cannot be tested.',
  },
  {
    rule_id: 'R03_RISK_EXPOSURE_TOO_HIGH',
    decision: 'PASS',
    reason_code: 'RISK_EXPOSURE_TOO_HIGH',
    condition: `risk >= ${DECISION_THRESHOLDS.risk_block}`,
    source: 'Opportunity Engine §24, §37',
    matches: ({ candidate }) => clampScore(candidate.risk) >= DECISION_THRESHOLDS.risk_block,
    reason: ({ candidate }) =>
      `Risk exposure is ${Math.round(clampScore(candidate.risk))}/100, at or above the ${
        DECISION_THRESHOLDS.risk_block
      } block threshold.`,
  },
  {
    rule_id: 'R04_PRODUCT_FIT_TOO_WEAK',
    decision: 'PASS',
    reason_code: 'PRODUCT_FIT_TOO_WEAK',
    condition: `product_fit < ${DECISION_THRESHOLDS.product_fit_min}`,
    source: 'Opportunity Engine §12, §37',
    matches: ({ candidate }) =>
      clampScore(candidate.product_fit) < DECISION_THRESHOLDS.product_fit_min,
    reason: () =>
      'The product does not actually solve the demand (weak relation or worse), so no angle can rescue it.',
  },
  {
    rule_id: 'R05_DEMAND_TOO_WEAK',
    decision: 'PASS',
    reason_code: 'DEMAND_TOO_WEAK',
    condition: `demand < ${DECISION_THRESHOLDS.demand_min}`,
    source: 'Opportunity Engine §37, §54',
    matches: ({ candidate }) => clampScore(candidate.demand) < DECISION_THRESHOLDS.demand_min,
    reason: () =>
      'Demand evidence is too weak. Commission potential never outranks demand.',
  },
  {
    rule_id: 'R06_ECONOMICS_UNVIABLE',
    decision: 'PASS',
    reason_code: 'ECONOMICS_UNVIABLE',
    condition: `economics < ${DECISION_THRESHOLDS.economics_min}`,
    source: 'Opportunity Engine §16, §18, §37',
    matches: ({ candidate }) =>
      clampScore(candidate.economics) < DECISION_THRESHOLDS.economics_min,
    reason: () =>
      'Expected affiliate value cannot repay the content cost of testing this opportunity.',
  },
  {
    rule_id: 'R07_MISSING_SIGNALS',
    decision: 'RESEARCH_MORE',
    reason_code: 'MISSING_SIGNALS',
    condition: 'missing_signals.length > 0',
    source: 'Opportunity Engine §36; MVP Scope §17',
    matches: ({ candidate }) => candidate.missing_signals.length > 0,
    reason: ({ candidate }) =>
      `Signals are missing (${candidate.missing_signals.join(', ')}). Collect the evidence before spending content resources.`,
  },
  {
    rule_id: 'R08_LOW_CONFIDENCE',
    decision: 'RESEARCH_MORE',
    reason_code: 'LOW_CONFIDENCE',
    condition: "confidence === 'LOW'",
    source: 'Opportunity Engine §36; MVP Scope §17',
    matches: ({ candidate }) => candidate.confidence === 'LOW',
    reason: () =>
      'Evaluation confidence is LOW. The score is not yet trustworthy enough to justify a test.',
  },
  {
    rule_id: 'R09_UNEXPLAINED_LOW_COMPETITION',
    decision: 'RESEARCH_MORE',
    reason_code: 'UNEXPLAINED_LOW_COMPETITION',
    condition: `demand >= ${DECISION_THRESHOLDS.demand_high} && competition >= ${DECISION_THRESHOLDS.competition_unexplained}`,
    source: 'Opportunity Engine §53',
    matches: ({ candidate }) =>
      clampScore(candidate.demand) >= DECISION_THRESHOLDS.demand_high &&
      clampScore(candidate.competition) >= DECISION_THRESHOLDS.competition_unexplained,
    reason: () =>
      'Strong demand with an almost empty content space is a question, not a gift: find out why competition is absent before testing.',
  },
  {
    rule_id: 'R10_MOMENTUM_DECLINING',
    decision: 'WATCH',
    reason_code: 'MOMENTUM_DECLINING',
    condition: `momentum < ${DECISION_THRESHOLDS.momentum_declining_below}`,
    source: 'Opportunity Engine §22, §23',
    matches: ({ momentumScore }) =>
      momentumScore < DECISION_THRESHOLDS.momentum_declining_below,
    reason: () =>
      'Demand momentum is declining. The timing is wrong even when the product itself is fine.',
  },
  {
    rule_id: 'R11_TEST_WITH_ANGLE',
    decision: 'TEST_WITH_ANGLE',
    reason_code: 'COMPETITION_GAP_AVAILABLE',
    condition:
      `total >= ${DECISION_THRESHOLDS.test_total_min} && demand >= ${DECISION_THRESHOLDS.angle_demand_min} && ` +
      `product_fit >= ${DECISION_THRESHOLDS.angle_product_fit_min} && competition <= ${DECISION_THRESHOLDS.competition_tight_at_or_below} && ` +
      'content_gap_identified === true',
    source: 'Opportunity Engine §34, §52',
    matches: ({ candidate, score }) =>
      score.total >= DECISION_THRESHOLDS.test_total_min &&
      clampScore(candidate.demand) >= DECISION_THRESHOLDS.angle_demand_min &&
      clampScore(candidate.product_fit) >= DECISION_THRESHOLDS.angle_product_fit_min &&
      clampScore(candidate.competition) <= DECISION_THRESHOLDS.competition_tight_at_or_below &&
      candidate.content_gap_identified,
    reason: () =>
      'The content space is contested but a competitor gap was identified: test with a differentiated angle rather than another showcase.',
  },
  {
    rule_id: 'R12_TEST_NOW',
    decision: 'TEST_NOW',
    reason_code: 'EVIDENCE_SUFFICIENT_FOR_TEST',
    condition:
      `total >= ${DECISION_THRESHOLDS.test_total_min} && demand >= ${DECISION_THRESHOLDS.test_demand_min} && ` +
      `product_fit >= ${DECISION_THRESHOLDS.test_product_fit_min} && content_potential >= ${DECISION_THRESHOLDS.test_content_potential_min} && ` +
      `risk <= ${DECISION_THRESHOLDS.test_risk_max}`,
    source: 'Opportunity Engine §33',
    matches: ({ candidate, score }) =>
      score.total >= DECISION_THRESHOLDS.test_total_min &&
      clampScore(candidate.demand) >= DECISION_THRESHOLDS.test_demand_min &&
      clampScore(candidate.product_fit) >= DECISION_THRESHOLDS.test_product_fit_min &&
      clampScore(candidate.content_potential) >= DECISION_THRESHOLDS.test_content_potential_min &&
      clampScore(candidate.risk) <= DECISION_THRESHOLDS.test_risk_max,
    reason: () =>
      'Demand, product fit and content potential are all strong and risk is acceptable: this opportunity has earned the next content test.',
  },
  {
    rule_id: 'R13_WATCH',
    decision: 'WATCH',
    reason_code: 'BELOW_TEST_THRESHOLD',
    condition: `total >= ${DECISION_THRESHOLDS.watch_total_min}`,
    source: 'Opportunity Engine §35, §56',
    matches: ({ score }) => score.total >= DECISION_THRESHOLDS.watch_total_min,
    reason: ({ score }) =>
      `Total score ${score.total} is promising but below the ${DECISION_THRESHOLDS.test_total_min} test threshold: monitor before investing.`,
  },
  {
    rule_id: 'R14_PASS_DEFAULT',
    decision: 'PASS',
    reason_code: 'WEAK_OVERALL_SIGNAL',
    condition: 'default',
    source: 'Opportunity Engine §31, §37',
    matches: () => true,
    reason: ({ score }) =>
      `Total score ${score.total} is below the watch threshold: do not spend content resources here.`,
  },
])

/** The ladder as data — published through the scoring-model endpoint. */
export const DECISION_RULE_DESCRIPTORS: readonly DecisionRuleDescriptor[] = Object.freeze(
  RULES.map(({ rule_id, decision, reason_code, condition, source }) => ({
    rule_id,
    decision,
    reason_code,
    condition,
    source,
  })),
)

/**
 * Evaluate the ladder. First match wins; the rules evaluated before it are
 * returned so the audit trail shows the precedence was respected.
 */
export function decideOpportunity(
  candidate: OpportunityCandidate,
  score: OpportunityScore,
): DecisionResult {
  const input: EvaluationInput = {
    candidate,
    score,
    momentumScore: resolveMomentumScore(candidate.momentum),
  }

  const evaluated: string[] = []
  for (const rule of RULES) {
    evaluated.push(rule.rule_id)
    if (!rule.matches(input)) continue

    return {
      model_version: DECISION_MODEL_VERSION,
      decision: rule.decision,
      rule_id: rule.rule_id,
      reason_codes: [rule.reason_code],
      reason: rule.reason(input),
      evaluated_rule_ids: evaluated,
    }
  }

  // Unreachable: the last rule matches unconditionally. Kept as a fail-closed
  // guard so a future edit to the ladder can never return an undefined decision.
  return {
    model_version: DECISION_MODEL_VERSION,
    decision: 'PASS',
    rule_id: 'R14_PASS_DEFAULT',
    reason_codes: ['WEAK_OVERALL_SIGNAL'],
    reason: 'No decision rule matched; failing closed to PASS.',
    evaluated_rule_ids: evaluated,
  }
}
