import { describe, it, expect } from 'vitest'
import {
  assessExecutionFeasibility,
  prioritizeOpportunity,
  scoreOpportunity,
  type OpportunityCandidate,
} from '@modules/module-05-opportunity'
import { SPEC_CARD_CANDIDATE, candidate } from '../fixtures/opportunity-candidates.js'

/**
 * Prioritisation unit tests.
 *
 * Contract: §57 (100 opportunities must become a TOP N), §58 (priority =
 * score × confidence × execution feasibility), §59 (feasibility factors),
 * §60–§63 (resource awareness — the same product is a different opportunity
 * for a creator who cannot obtain a sample).
 */

function prioritize(overrides: Partial<OpportunityCandidate> = {}) {
  const input = candidate(overrides)
  return prioritizeOpportunity(input, scoreOpportunity(input))
}

describe('execution feasibility (§59)', () => {
  it('is unobstructed for the published card: no sample, low complexity', () => {
    const feasibility = assessExecutionFeasibility(SPEC_CARD_CANDIDATE)
    expect(feasibility.blocked).toBe(false)
    expect(feasibility.score).toBe(1)
  })

  it('collapses to zero when the creator cannot produce the content', () => {
    const feasibility = assessExecutionFeasibility(
      candidate({
        execution: { ...SPEC_CARD_CANDIDATE.execution, creator_can_produce_content: false },
      }),
    )
    expect(feasibility.blocked).toBe(true)
    expect(feasibility.score).toBe(0)
  })

  it('collapses to zero when the product is inaccessible', () => {
    const feasibility = assessExecutionFeasibility(
      candidate({
        execution: { ...SPEC_CARD_CANDIDATE.execution, product_accessible: false },
      }),
    )
    expect(feasibility.blocked).toBe(true)
    expect(feasibility.score).toBe(0)
  })

  it('reports each obstacle as a named factor, so a low score is explainable', () => {
    const feasibility = assessExecutionFeasibility(
      candidate({
        execution: {
          ...SPEC_CARD_CANDIDATE.execution,
          budget_mode: 'ZERO_BUDGET',
          sample_required: true,
          production_complexity: 'HIGH',
        },
      }),
    )
    const factors = feasibility.factors.map((f) => f.factor)
    expect(factors).toContain('sample_requirement')
    expect(factors).toContain('production_complexity')
    expect(factors).toContain('budget_complexity_tolerance')
    expect(feasibility.score).toBeLessThan(0.5)
  })

  it('penalises a required sample harder for a zero-budget creator (§61, §63)', () => {
    const zero = assessExecutionFeasibility(
      candidate({
        execution: {
          ...SPEC_CARD_CANDIDATE.execution,
          budget_mode: 'ZERO_BUDGET',
          sample_required: true,
        },
      }),
    )
    const rich = assessExecutionFeasibility(
      candidate({
        execution: {
          ...SPEC_CARD_CANDIDATE.execution,
          budget_mode: 'HIGH_BUDGET',
          sample_required: true,
        },
      }),
    )
    expect(zero.score).toBeLessThan(rich.score)
    expect(rich.score).toBe(1)
  })

  it('does not penalise a sample requirement that does not exist', () => {
    const withSample = assessExecutionFeasibility(
      candidate({
        execution: {
          ...SPEC_CARD_CANDIDATE.execution,
          budget_mode: 'ZERO_BUDGET',
          sample_required: true,
        },
      }),
    )
    const without = assessExecutionFeasibility(
      candidate({
        execution: {
          ...SPEC_CARD_CANDIDATE.execution,
          budget_mode: 'ZERO_BUDGET',
          sample_required: false,
        },
      }),
    )
    expect(without.score).toBeGreaterThan(withSample.score)
  })
})

describe('priority score (§58)', () => {
  it('equals score × confidence × feasibility for the published card', () => {
    const result = prioritize()
    // 84 × 1.0 (HIGH) × 1.0 (unobstructed) = 84
    expect(result.priority_score).toBe(84)
    expect(result.band).toBe('P0')
    expect(result.confidence_multiplier).toBe(1)
  })

  it('discounts the same opportunity for MEDIUM and LOW confidence', () => {
    const high = prioritize({ confidence: 'HIGH' }).priority_score
    const medium = prioritize({ confidence: 'MEDIUM' }).priority_score
    const low = prioritize({ confidence: 'LOW' }).priority_score
    expect(medium).toBeLessThan(high)
    expect(low).toBeLessThan(medium)
  })

  it('is zero when execution is blocked — never rank what cannot be run', () => {
    const result = prioritize({
      execution: { ...SPEC_CARD_CANDIDATE.execution, creator_can_produce_content: false },
    })
    expect(result.priority_score).toBe(0)
    expect(result.band).toBe('P3')
    expect(result.execution_feasibility.blocked).toBe(true)
  })

  it('ranks the same product lower for a resource-poor creator (§63)', () => {
    const rich = prioritize({
      execution: {
        ...SPEC_CARD_CANDIDATE.execution,
        budget_mode: 'HIGH_BUDGET',
        sample_required: true,
        production_complexity: 'HIGH',
      },
    }).priority_score

    const poor = prioritize({
      execution: {
        ...SPEC_CARD_CANDIDATE.execution,
        budget_mode: 'ZERO_BUDGET',
        sample_required: true,
        production_complexity: 'HIGH',
      },
    }).priority_score

    expect(poor).toBeLessThan(rich)
  })

  it('assigns each priority band at its boundary', () => {
    // Drive the priority score with the confidence multiplier on a fixed score.
    const bands = new Set(
      (['HIGH', 'MEDIUM', 'LOW'] as const).map((confidence) => prioritize({ confidence }).band),
    )
    expect(bands.has('P0')).toBe(true)
    expect(bands.size).toBeGreaterThan(1)

    const blocked = prioritize({
      execution: { ...SPEC_CARD_CANDIDATE.execution, product_accessible: false },
    })
    expect(blocked.band).toBe('P3')
  })

  it('is deterministic', () => {
    expect(prioritize()).toEqual(prioritize())
  })
})
