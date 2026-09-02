import { describe, it, expect } from 'vitest'
import {
  DECISIONS,
  DECISION_RULE_DESCRIPTORS,
  DECISION_THRESHOLDS,
  decideOpportunity,
  scoreOpportunity,
  type OpportunityCandidate,
} from '@modules/module-05-opportunity'
import { SPEC_CARD_CANDIDATE, candidate } from '../fixtures/opportunity-candidates.js'

/**
 * Decision ladder unit tests.
 *
 * Contract: 14A §14A (same input ⇒ same decision), §14D (fixed precedence — a
 * decision may never skip a level), §14E (a hard block can never be overridden
 * by a lower-priority rule).
 *
 * Every rule in the published ladder must be reachable and must be provably
 * the rule that fired, otherwise the audit trail is decoration.
 */

function decide(overrides: Partial<OpportunityCandidate> = {}) {
  const input = candidate(overrides)
  return decideOpportunity(input, scoreOpportunity(input))
}

describe('decision ladder: the §38 worked example', () => {
  it('decides TEST_NOW for the published card', () => {
    const result = decide()
    expect(result.decision).toBe('TEST_NOW')
    expect(result.rule_id).toBe('R12_TEST_NOW')
    expect(result.reason_codes).toEqual(['EVIDENCE_SUFFICIENT_FOR_TEST'])
  })

  it('names the rule that fired and the rules evaluated before it', () => {
    const result = decide()
    expect(result.evaluated_rule_ids[result.evaluated_rule_ids.length - 1]).toBe(result.rule_id)
    // Precedence proof: every hard block was evaluated first.
    expect(result.evaluated_rule_ids).toContain('R01_POLICY_RISK_FLAGGED')
    expect(result.evaluated_rule_ids).toContain('R03_RISK_EXPOSURE_TOO_HIGH')
  })

  it('never emits a decision outside the published vocabulary (§32)', () => {
    expect(DECISIONS).toContain(decide().decision)
  })
})

describe('decision ladder: hard blocks (14A §14E)', () => {
  it('R01 — a policy flag forces PASS even on an otherwise perfect candidate', () => {
    const result = decide({ policy_risk_flagged: true })
    expect(result.decision).toBe('PASS')
    expect(result.rule_id).toBe('R01_POLICY_RISK_FLAGGED')
    expect(result.reason_codes).toEqual(['POLICY_RISK_FLAGGED'])
  })

  it('R02 — an unproducible content requirement forces PASS', () => {
    const result = decide({
      execution: { ...SPEC_CARD_CANDIDATE.execution, creator_can_produce_content: false },
    })
    expect(result.decision).toBe('PASS')
    expect(result.rule_id).toBe('R02_EXECUTION_NOT_FEASIBLE')
  })

  it('R02 — an inaccessible product forces PASS with its own reason', () => {
    const result = decide({
      execution: { ...SPEC_CARD_CANDIDATE.execution, product_accessible: false },
    })
    expect(result.rule_id).toBe('R02_EXECUTION_NOT_FEASIBLE')
    expect(result.reason).toMatch(/not accessible/i)
  })

  it('R03 — risk at the block threshold forces PASS (boundary is inclusive)', () => {
    const at = decide({ risk: DECISION_THRESHOLDS.risk_block })
    expect(at.rule_id).toBe('R03_RISK_EXPOSURE_TOO_HIGH')

    const below = decide({ risk: DECISION_THRESHOLDS.risk_block - 1 })
    expect(below.rule_id).not.toBe('R03_RISK_EXPOSURE_TOO_HIGH')
  })

  it('R04 — a product that does not solve the demand cannot be rescued by an angle', () => {
    const result = decide({
      product_fit: DECISION_THRESHOLDS.product_fit_min - 1,
      content_gap_identified: true,
    })
    expect(result.decision).toBe('PASS')
    expect(result.rule_id).toBe('R04_PRODUCT_FIT_TOO_WEAK')
  })

  it('R05 — commission never outranks demand (§54)', () => {
    const result = decide({ demand: DECISION_THRESHOLDS.demand_min - 1, economics: 100 })
    expect(result.decision).toBe('PASS')
    expect(result.rule_id).toBe('R05_DEMAND_TOO_WEAK')
  })

  it('R06 — economics that cannot repay the content cost forces PASS', () => {
    const result = decide({ economics: DECISION_THRESHOLDS.economics_min - 1 })
    expect(result.decision).toBe('PASS')
    expect(result.rule_id).toBe('R06_ECONOMICS_UNVIABLE')
  })

  it('precedence: a policy flag outranks every other blocker', () => {
    const result = decide({
      policy_risk_flagged: true,
      risk: 100,
      product_fit: 0,
      demand: 0,
      economics: 0,
      execution: { ...SPEC_CARD_CANDIDATE.execution, product_accessible: false },
    })
    expect(result.rule_id).toBe('R01_POLICY_RISK_FLAGGED')
    expect(result.evaluated_rule_ids).toEqual(['R01_POLICY_RISK_FLAGGED'])
  })
})

describe('decision ladder: evidence quality (§36)', () => {
  it('R07 — a missing signal yields RESEARCH_MORE and names the gap', () => {
    const result = decide({ missing_signals: ['economics'] })
    expect(result.decision).toBe('RESEARCH_MORE')
    expect(result.rule_id).toBe('R07_MISSING_SIGNALS')
    expect(result.reason).toContain('economics')
  })

  it('R08 — LOW confidence yields RESEARCH_MORE, never a test', () => {
    const result = decide({ confidence: 'LOW' })
    expect(result.decision).toBe('RESEARCH_MORE')
    expect(result.rule_id).toBe('R08_LOW_CONFIDENCE')
  })

  it('R09 — strong demand with an empty content space must be explained first (§53)', () => {
    const result = decide({
      demand: DECISION_THRESHOLDS.demand_high,
      competition: DECISION_THRESHOLDS.competition_unexplained,
    })
    expect(result.decision).toBe('RESEARCH_MORE')
    expect(result.rule_id).toBe('R09_UNEXPLAINED_LOW_COMPETITION')
  })

  it('a missing signal outranks low confidence (fixed precedence)', () => {
    const result = decide({ missing_signals: ['demand'], confidence: 'LOW' })
    expect(result.rule_id).toBe('R07_MISSING_SIGNALS')
  })
})

describe('decision ladder: timing and test routes', () => {
  it('R10 — declining momentum yields WATCH even when the product is fine (§23)', () => {
    const result = decide({ momentum: 'DECLINING' })
    expect(result.decision).toBe('WATCH')
    expect(result.rule_id).toBe('R10_MOMENTUM_DECLINING')
  })

  it('R11 — a tight space with an identified gap yields TEST_WITH_ANGLE (§34)', () => {
    const result = decide({
      competition: DECISION_THRESHOLDS.competition_tight_at_or_below,
      content_gap_identified: true,
    })
    expect(result.decision).toBe('TEST_WITH_ANGLE')
    expect(result.rule_id).toBe('R11_TEST_WITH_ANGLE')
    expect(result.reason_codes).toEqual(['COMPETITION_GAP_AVAILABLE'])
  })

  it('R11 does not fire without an identified gap: absence of evidence is not a gap', () => {
    const result = decide({
      competition: DECISION_THRESHOLDS.competition_tight_at_or_below,
      content_gap_identified: false,
    })
    expect(result.rule_id).not.toBe('R11_TEST_WITH_ANGLE')
  })

  it('R11 outranks R12: an angle route is preferred over another showcase test', () => {
    const result = decide({
      competition: DECISION_THRESHOLDS.competition_tight_at_or_below,
      content_gap_identified: true,
    })
    expect(result.evaluated_rule_ids).not.toContain('R12_TEST_NOW')
  })

  it('R12 — TEST_NOW requires all four test signals, not just a high total', () => {
    // Content potential just below the test floor: the total can still be high,
    // but the specific §33 condition is not met.
    const result = decide({
      content_potential: DECISION_THRESHOLDS.test_content_potential_min - 1,
    })
    expect(result.rule_id).not.toBe('R12_TEST_NOW')
  })

  it('R13 — a promising but sub-threshold total yields WATCH (§35)', () => {
    const result = decide({
      demand: 62,
      product_fit: 62,
      creator_fit: 62,
      content_potential: 62,
      economics: 62,
      competition: 62,
      momentum: 62,
      risk: 38,
    })
    expect(result.decision).toBe('WATCH')
    expect(result.rule_id).toBe('R13_WATCH')
  })

  it('R14 — a weak overall signal falls through to PASS', () => {
    const result = decide({
      demand: 45,
      product_fit: 52,
      creator_fit: 30,
      content_potential: 30,
      economics: 35,
      competition: 30,
      momentum: 45,
      risk: 60,
    })
    expect(result.decision).toBe('PASS')
    expect(result.rule_id).toBe('R14_PASS_DEFAULT')
  })
})

describe('decision ladder: determinism and disclosure (14A §14A)', () => {
  it('the same input always produces the same decision', () => {
    expect(decide()).toEqual(decide())
  })

  it('publishes every rule as inspectable data with a source reference', () => {
    expect(DECISION_RULE_DESCRIPTORS.length).toBeGreaterThanOrEqual(14)
    for (const rule of DECISION_RULE_DESCRIPTORS) {
      expect(rule.rule_id).toMatch(/^R\d{2}_[A-Z_]+$/)
      expect(DECISIONS).toContain(rule.decision)
      expect(rule.condition.length).toBeGreaterThan(0)
      expect(rule.source.length).toBeGreaterThan(0)
    }
  })

  it('has unique rule ids and ends with an unconditional default', () => {
    const ids = DECISION_RULE_DESCRIPTORS.map((r) => r.rule_id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids[ids.length - 1]).toBe('R14_PASS_DEFAULT')
    expect(DECISION_RULE_DESCRIPTORS[DECISION_RULE_DESCRIPTORS.length - 1]?.condition).toBe(
      'default',
    )
  })

  it('every published rule is reachable by at least one candidate', () => {
    const fired = new Set<string>([
      decide({ policy_risk_flagged: true }).rule_id,
      decide({
        execution: { ...SPEC_CARD_CANDIDATE.execution, creator_can_produce_content: false },
      }).rule_id,
      decide({ risk: 100 }).rule_id,
      decide({ product_fit: 10 }).rule_id,
      decide({ demand: 10 }).rule_id,
      decide({ economics: 10 }).rule_id,
      decide({ missing_signals: ['risk'] }).rule_id,
      decide({ confidence: 'LOW' }).rule_id,
      decide({ demand: 90, competition: 95 }).rule_id,
      decide({ momentum: 'DECLINING' }).rule_id,
      decide({ competition: 55, content_gap_identified: true }).rule_id,
      decide().rule_id,
      decide({
        demand: 62,
        product_fit: 62,
        creator_fit: 62,
        content_potential: 62,
        economics: 62,
        competition: 62,
        momentum: 62,
        risk: 38,
      }).rule_id,
      decide({
        demand: 45,
        product_fit: 52,
        creator_fit: 30,
        content_potential: 30,
        economics: 35,
        competition: 30,
        momentum: 45,
        risk: 60,
      }).rule_id,
    ])

    for (const rule of DECISION_RULE_DESCRIPTORS) {
      expect(fired.has(rule.rule_id), `rule ${rule.rule_id} is unreachable`).toBe(true)
    }
  })
})
