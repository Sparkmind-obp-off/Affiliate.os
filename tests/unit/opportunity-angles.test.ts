import { describe, it, expect } from 'vitest'
import {
  ANGLE_FORMATS,
  explainOpportunity,
  decideOpportunity,
  prioritizeOpportunity,
  recommendAngles,
  scoreOpportunity,
} from '@modules/module-05-opportunity'
import { SPEC_CARD_CANDIDATE, candidate } from '../fixtures/opportunity-candidates.js'

/**
 * Angle + explanation unit tests.
 *
 * Angle contract: §40–§43. The catalogue is a deterministic rule table, so the
 * ordering must be reproducible and every recommendation must stay STRATEGY
 * (angle, hook direction, proof mechanism, CTA direction) rather than produced
 * content — content production is out of MVP scope (MVP Scope §19).
 *
 * Explanation contract: §39 and MVP Scope §26 — the MVP is only successful if
 * the user can explain WHY an opportunity was chosen.
 */

describe('angle engine (§40–§42)', () => {
  it('returns the whole catalogue ranked, highest score first', () => {
    const angles = recommendAngles(SPEC_CARD_CANDIDATE)
    expect(angles.length).toBeGreaterThanOrEqual(6)
    for (let i = 1; i < angles.length; i += 1) {
      expect(angles[i]!.score).toBeLessThanOrEqual(angles[i - 1]!.score)
    }
  })

  it('scores every angle on all six published dimensions (§42)', () => {
    for (const angle of recommendAngles(SPEC_CARD_CANDIDATE)) {
      expect(Object.keys(angle.breakdown).sort()).toEqual(
        [
          'audience_fit',
          'demonstrability',
          'hook_strength',
          'novelty',
          'problem_relevance',
          'proof',
        ].sort(),
      )
      for (const value of Object.values(angle.breakdown)) {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(100)
      }
      expect(angle.score).toBeGreaterThanOrEqual(0)
      expect(angle.score).toBeLessThanOrEqual(100)
    }
  })

  it('delivers strategy, not content (MVP Scope §19)', () => {
    for (const angle of recommendAngles(SPEC_CARD_CANDIDATE)) {
      expect(ANGLE_FORMATS).toContain(angle.format)
      expect(angle.hook_direction.length).toBeGreaterThan(0)
      expect(angle.proof_mechanism.length).toBeGreaterThan(0)
      expect(angle.cta_direction.length).toBeGreaterThan(0)
      expect(angle.rationale.length).toBeGreaterThan(0)
    }
  })

  it('is deterministic: identical candidates yield an identical ranking', () => {
    expect(recommendAngles(SPEC_CARD_CANDIDATE)).toEqual(recommendAngles(SPEC_CARD_CANDIDATE))
  })

  it('raises novelty for a saturated space once a content gap is identified (§52)', () => {
    const saturated = candidate({ competition: 20, content_gap_identified: false })
    const withGap = candidate({ competition: 20, content_gap_identified: true })

    const noGapNovelty = recommendAngles(saturated)[0]!.breakdown.novelty
    const gapNovelty = recommendAngles(withGap).find(
      (a) => a.angle_id === recommendAngles(saturated)[0]!.angle_id,
    )!.breakdown.novelty

    expect(gapNovelty).toBeGreaterThan(noGapNovelty)
  })

  it('prefers a demonstrable angle when content potential is high', () => {
    const angles = recommendAngles(candidate({ content_potential: 100, creator_fit: 40 }))
    expect(['ANG_BEFORE_AFTER', 'ANG_REAL_TEST', 'ANG_PROBLEM_FIRST']).toContain(
      angles[0]!.angle_id,
    )
  })

  it('breaks a score tie by catalogue order, never randomly', () => {
    const flat = candidate({
      demand: 50,
      product_fit: 50,
      creator_fit: 50,
      content_potential: 50,
      competition: 50,
      momentum: 50,
    })
    const first = recommendAngles(flat).map((a) => a.angle_id)
    const second = recommendAngles(flat).map((a) => a.angle_id)
    expect(first).toEqual(second)
  })
})

describe('explanation engine (§39, MVP Scope §26)', () => {
  function explain(overrides: Parameters<typeof candidate>[0] = {}) {
    const input = candidate(overrides)
    const score = scoreOpportunity(input)
    const decision = decideOpportunity(input, score)
    const priority = prioritizeOpportunity(input, score)
    const bestAngle = recommendAngles(input)[0] ?? null
    return explainOpportunity({
      candidate: input,
      score,
      decision,
      priority,
      bestAngle: bestAngle ? { angle: bestAngle.angle, format: bestAngle.format } : null,
    })
  }

  it('answers the seven questions of §77', () => {
    const explanation = explain()
    expect(Object.keys(explanation.summary).sort()).toEqual(
      ['for_whom', 'how', 'how_good', 'what', 'what_next', 'why', 'why_now'].sort(),
    )
    expect(explanation.summary.what).toBe(SPEC_CARD_CANDIDATE.product_name)
    expect(explanation.summary.how_good).toContain('84')
    expect(explanation.summary.what_next).toContain('TEST_NOW')
  })

  it('states the strengths of the published card', () => {
    const codes = explain().items.map((i) => i.code)
    expect(codes).toContain('DEMAND_STRONG')
    expect(codes).toContain('PRODUCT_FIT_DIRECT')
    expect(codes).toContain('CREATOR_FIT_ALIGNED')
    expect(codes).toContain('CONTENT_HIGHLY_DEMONSTRABLE')
    expect(codes).toContain('MOMENTUM_FAVOURABLE')
    expect(codes).toContain('RISK_ACCEPTABLE')
  })

  it('marks a policy flag and a high risk as BLOCKER, not as a caution', () => {
    const items = explain({ policy_risk_flagged: true, risk: 90 }).items
    const policy = items.find((i) => i.code === 'POLICY_RISK_FLAGGED')
    const risk = items.find((i) => i.code === 'RISK_HIGH')
    expect(policy?.severity).toBe('BLOCKER')
    expect(risk?.severity).toBe('BLOCKER')
  })

  it('names every missing signal so the gap is actionable', () => {
    const item = explain({ missing_signals: ['economics', 'competition'] }).items.find(
      (i) => i.code === 'SIGNALS_MISSING',
    )
    expect(item?.statement).toContain('economics')
    expect(item?.statement).toContain('competition')
  })

  it('flags a crowded content space as a caution', () => {
    const codes = explain({ competition: 20 }).items.map((i) => i.code)
    expect(codes).toContain('COMPETITION_SATURATED')
  })

  it('flags unexplained headroom rather than treating it as an advantage', () => {
    const codes = explain({ competition: 95 }).items.map((i) => i.code)
    expect(codes).toContain('COMPETITION_UNEXPLAINED_HEADROOM')
  })

  it('reports missing provenance instead of assuming the signals are fresh', () => {
    const codes = explain().items.map((i) => i.code)
    expect(codes).toContain('PROVENANCE_MISSING')

    const withProvenance = explain({
      provenance: { source: 'manual-research', checked_at: '2026-01-01T00:00:00.000Z' },
    }).items.map((i) => i.code)
    expect(withProvenance).not.toContain('PROVENANCE_MISSING')
  })

  it('reports blocked execution as a BLOCKER', () => {
    const item = explain({
      execution: { ...SPEC_CARD_CANDIDATE.execution, creator_can_produce_content: false },
    }).items.find((i) => i.code === 'EXECUTION_BLOCKED')
    expect(item?.severity).toBe('BLOCKER')
  })

  it('is deterministic', () => {
    expect(explain()).toEqual(explain())
  })
})
