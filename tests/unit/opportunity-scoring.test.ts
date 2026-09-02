import { describe, it, expect } from 'vitest'
import {
  CLASSIFICATION_BANDS,
  DIMENSION_WEIGHTS,
  OPPORTUNITY_DIMENSIONS,
  SCORING_MODEL_VERSION,
  classifyScore,
  scoreOpportunity,
} from '@modules/module-05-opportunity'
import { SPEC_CARD_CANDIDATE, candidate } from '../fixtures/opportunity-candidates.js'

/**
 * Scoring model unit tests.
 *
 * The anchor of this suite is the worked example published in the source
 * specification (OPPORTUNITY ENGINE & SCORING SYSTEM v1.0 §38): if the
 * implementation ever stops reproducing that card, the engine no longer
 * implements the contract it claims to implement.
 */

describe('scoring model: weights', () => {
  it('declares a weight for every published dimension', () => {
    for (const dimension of OPPORTUNITY_DIMENSIONS) {
      expect(DIMENSION_WEIGHTS[dimension], `missing weight for ${dimension}`).toBeGreaterThan(0)
    }
    expect(Object.keys(DIMENSION_WEIGHTS)).toHaveLength(OPPORTUNITY_DIMENSIONS.length)
  })

  it('weights sum to exactly 1.0 (§10)', () => {
    const total = Object.values(DIMENSION_WEIGHTS).reduce((sum, w) => sum + w, 0)
    // Floating-point tolerance only; the intent is an exact 1.0 weight table.
    expect(total).toBeCloseTo(1, 10)
  })

  it('matches the §29 published weights', () => {
    expect(DIMENSION_WEIGHTS).toMatchObject({
      demand: 0.2,
      product_fit: 0.15,
      creator_fit: 0.15,
      content_potential: 0.15,
      economics: 0.1,
      competition: 0.1,
      momentum: 0.05,
      risk: 0.1,
    })
  })
})

describe('scoring model: the §38 worked example', () => {
  const score = scoreOpportunity(SPEC_CARD_CANDIDATE)

  it('reproduces the published total score of 84', () => {
    expect(score.total).toBe(84)
  })

  it('reproduces the published classification STRONG', () => {
    expect(score.classification).toBe('STRONG')
  })

  it('inverts risk per §30 (risk 18 → 82)', () => {
    expect(score.risk_adjusted_score).toBe(82)
    const riskComponent = score.components.find((c) => c.dimension === 'risk')
    expect(riskComponent?.raw_score).toBe(18)
    expect(riskComponent?.effective_score).toBe(82)
  })

  it('does not invert any dimension other than risk', () => {
    for (const component of score.components) {
      if (component.dimension === 'risk') continue
      expect(component.effective_score).toBe(component.raw_score)
    }
  })

  it('carries the model version so a decision can be replayed', () => {
    expect(score.model_version).toBe(SCORING_MODEL_VERSION)
  })

  it('exposes one weighted component per dimension whose contributions rebuild the total', () => {
    expect(score.components).toHaveLength(OPPORTUNITY_DIMENSIONS.length)
    const rebuilt = score.components.reduce((sum, c) => sum + c.effective_score * c.weight, 0)
    expect(Math.round(rebuilt)).toBe(score.total)
  })
})

describe('scoring model: clamping and rounding', () => {
  it('clamps an out-of-range signal instead of producing a score above 100', () => {
    const score = scoreOpportunity(candidate({ demand: 1000, risk: -50 }))
    expect(score.total).toBeLessThanOrEqual(100)
    expect(score.components.find((c) => c.dimension === 'demand')?.raw_score).toBe(100)
    expect(score.components.find((c) => c.dimension === 'risk')?.raw_score).toBe(0)
  })

  it('scores a perfect candidate as 100 and a worst-case candidate as 0', () => {
    const perfect = scoreOpportunity(
      candidate({
        demand: 100,
        product_fit: 100,
        creator_fit: 100,
        content_potential: 100,
        economics: 100,
        competition: 100,
        momentum: 100,
        risk: 0,
      }),
    )
    expect(perfect.total).toBe(100)
    expect(perfect.classification).toBe('EXCEPTIONAL')

    const worst = scoreOpportunity(
      candidate({
        demand: 0,
        product_fit: 0,
        creator_fit: 0,
        content_potential: 0,
        economics: 0,
        competition: 0,
        momentum: 0,
        risk: 100,
      }),
    )
    expect(worst.total).toBe(0)
    expect(worst.classification).toBe('PASS')
  })

  it('maps a momentum state to a comparable score (§22)', () => {
    const withState = scoreOpportunity(candidate({ momentum: 'ACCELERATING' }))
    const withNumber = scoreOpportunity(candidate({ momentum: 95 }))
    expect(withState.total).toBe(withNumber.total)
  })

  it('is deterministic: the same candidate always scores identically', () => {
    expect(scoreOpportunity(SPEC_CARD_CANDIDATE)).toEqual(scoreOpportunity(SPEC_CARD_CANDIDATE))
  })
})

describe('scoring model: classification bands (§31)', () => {
  it('assigns every band at its inclusive lower edge', () => {
    expect(classifyScore(90).classification).toBe('EXCEPTIONAL')
    expect(classifyScore(100).classification).toBe('EXCEPTIONAL')
    expect(classifyScore(89).classification).toBe('STRONG')
    expect(classifyScore(80).classification).toBe('STRONG')
    expect(classifyScore(79).classification).toBe('TESTABLE')
    expect(classifyScore(70).classification).toBe('TESTABLE')
    expect(classifyScore(69).classification).toBe('WATCH')
    expect(classifyScore(60).classification).toBe('WATCH')
    expect(classifyScore(59).classification).toBe('PASS')
    expect(classifyScore(0).classification).toBe('PASS')
  })

  it('publishes the bands in descending order with no gap', () => {
    const bands = [...CLASSIFICATION_BANDS]
    for (let i = 1; i < bands.length; i += 1) {
      expect(bands[i]!.min_score).toBeLessThan(bands[i - 1]!.min_score)
    }
    expect(bands[bands.length - 1]!.min_score).toBe(0)
  })
})
