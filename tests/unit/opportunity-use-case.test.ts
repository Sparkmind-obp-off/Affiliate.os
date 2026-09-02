import { describe, it, expect, vi } from 'vitest'
import {
  DEFAULT_SHORTLIST_SIZE,
  MAX_BATCH_SIZE,
  executeEvaluateOpportunity,
  executeRankOpportunities,
  rankOpportunities,
  type Clock,
  type OpportunityCandidate,
  type OpportunityEvaluation,
  type OpportunityEvaluationRecorder,
} from '@modules/module-05-opportunity'
import { AppError } from '../../src/shared/errors/app-error.js'
import { SPEC_CARD_CANDIDATE, candidate } from '../fixtures/opportunity-candidates.js'

/**
 * Application-layer unit tests.
 *
 * Contract: DOC 24 §327 (an application service owns the use case), DOC 22
 * §223 (validation is a client-facing contract with field detail), and the
 * persistence boundary documented in `application/ports.ts` — the recorder is
 * OPTIONAL and its absence must not change the computed result.
 */

/** Frozen clock: the use case must not read the wall clock itself. */
const FIXED_ISO = '2026-01-15T10:30:00.000Z'
const fixedClock: Clock = { now: () => new Date(FIXED_ISO) }

describe('use case: evaluate — validation (DOC 22 §223)', () => {
  it('accepts the published card and returns the full decision card', async () => {
    const { evaluation, recorded } = await executeEvaluateOpportunity(
      { candidate: SPEC_CARD_CANDIDATE },
      { clock: fixedClock },
    )

    expect(evaluation.candidate_ref).toBe('OPP-00124')
    expect(evaluation.score.total).toBe(84)
    expect(evaluation.score.classification).toBe('STRONG')
    expect(evaluation.decision.decision).toBe('TEST_NOW')
    expect(evaluation.priority.priority_score).toBe(84)
    expect(evaluation.recommended_angle).not.toBeNull()
    expect(evaluation.alternative_angles).toHaveLength(2)
    expect(evaluation.explanation.items.length).toBeGreaterThan(0)
    expect(evaluation.evaluated_at).toBe(FIXED_ISO)
    expect(recorded).toBe(false)
  })

  it('rejects a missing candidate with a field-level VALIDATION_ERROR', async () => {
    await expect(executeEvaluateOpportunity({})).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      httpStatus: 422,
    })
  })

  it('rejects an out-of-range signal instead of silently clamping it', async () => {
    const thrown: unknown = await executeEvaluateOpportunity({
      candidate: { ...SPEC_CARD_CANDIDATE, demand: 140 },
    }).catch((e: unknown) => e)

    expect(thrown).toBeInstanceOf(AppError)
    const error = thrown as AppError
    expect(error.code).toBe('VALIDATION_ERROR')
    const issues = (error.details as { issues: Array<{ field: string }> }).issues
    expect(issues.some((i) => i.field === 'candidate.demand')).toBe(true)
  })

  it('rejects a non-numeric signal', async () => {
    await expect(
      executeEvaluateOpportunity({
        candidate: { ...SPEC_CARD_CANDIDATE, economics: 'high' },
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('rejects an unknown momentum state', async () => {
    await expect(
      executeEvaluateOpportunity({
        candidate: { ...SPEC_CARD_CANDIDATE, momentum: 'EXPLODING' },
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('rejects an incomplete execution context — creator reality is required', async () => {
    await expect(
      executeEvaluateOpportunity({
        candidate: {
          ...SPEC_CARD_CANDIDATE,
          execution: { budget_mode: 'NORMAL', sample_required: false },
        },
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('rejects an unsafe candidate reference', async () => {
    await expect(
      executeEvaluateOpportunity({
        candidate: { ...SPEC_CARD_CANDIDATE, candidate_ref: '<script>alert(1)</script>' },
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('rejects an unknown missing-signal dimension', async () => {
    await expect(
      executeEvaluateOpportunity({
        candidate: { ...SPEC_CARD_CANDIDATE, missing_signals: ['vibes'] },
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('rejects provenance without a real timestamp', async () => {
    await expect(
      executeEvaluateOpportunity({
        candidate: {
          ...SPEC_CARD_CANDIDATE,
          provenance: { source: 'research', checked_at: 'yesterday' },
        },
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('defaults the optional flags rather than demanding them', async () => {
    const payload = { ...SPEC_CARD_CANDIDATE } as Record<string, unknown>
    delete payload.content_gap_identified
    delete payload.policy_risk_flagged
    delete payload.missing_signals

    const { evaluation } = await executeEvaluateOpportunity(
      { candidate: payload },
      { clock: fixedClock },
    )
    expect(evaluation.decision.decision).toBe('TEST_NOW')
  })

  it('never leaks internal diagnostics through the validation details', async () => {
    const thrown: unknown = await executeEvaluateOpportunity({ candidate: {} }).catch(
      (e: unknown) => e,
    )
    const serialized = JSON.stringify((thrown as AppError).details)
    expect(serialized).not.toMatch(/ZodError|node_modules|at Object|\.ts:\d+/)
  })
})

describe('use case: evaluate — persistence port (ports.ts boundary)', () => {
  it('records the evaluation when a recorder is supplied', async () => {
    const record = vi.fn(async (_evaluation: OpportunityEvaluation): Promise<void> => undefined)
    const recorder: OpportunityEvaluationRecorder = { record }

    const { evaluation, recorded } = await executeEvaluateOpportunity(
      { candidate: SPEC_CARD_CANDIDATE },
      { clock: fixedClock, recorder },
    )

    expect(record).toHaveBeenCalledTimes(1)
    const recordedEvaluation = record.mock.calls[0]![0]
    expect(recordedEvaluation.candidate_ref).toBe(evaluation.candidate_ref)
    expect(recorded).toBe(true)
  })

  it('produces the identical result whether or not a recorder is present', async () => {
    const withoutRecorder = await executeEvaluateOpportunity(
      { candidate: SPEC_CARD_CANDIDATE },
      { clock: fixedClock },
    )
    const withRecorder = await executeEvaluateOpportunity(
      { candidate: SPEC_CARD_CANDIDATE },
      { clock: fixedClock, recorder: { record: async () => undefined } },
    )
    expect(withRecorder.evaluation).toEqual(withoutRecorder.evaluation)
  })

  it('surfaces a recorder failure as INTERNAL_ERROR without leaking the cause message', async () => {
    const recorder: OpportunityEvaluationRecorder = {
      record: async () => {
        throw new Error('connection to postgres://svc:s3cr3t@db.internal:5432/db refused')
      },
    }

    const thrown: unknown = await executeEvaluateOpportunity(
      { candidate: SPEC_CARD_CANDIDATE },
      { clock: fixedClock, recorder },
    ).catch((e: unknown) => e)

    expect(thrown).toBeInstanceOf(AppError)
    const error = thrown as AppError
    expect(error.code).toBe('INTERNAL_ERROR')
    expect(error.message).not.toContain('s3cr3t')
  })
})

describe('use case: rank (§57)', () => {
  function batch(count: number): OpportunityCandidate[] {
    return Array.from({ length: count }, (_, i) =>
      candidate({
        candidate_ref: `OPP-${String(i).padStart(3, '0')}`,
        product_name: `Product ${i}`,
        demand: 40 + ((i * 7) % 60),
        creator_fit: 30 + ((i * 11) % 70),
      }),
    )
  }

  it('reduces a large batch to the default shortlist size', () => {
    const ranking = executeRankOpportunities(
      { candidates: batch(40) },
      { clock: fixedClock },
    )
    expect(ranking.considered_count).toBe(40)
    expect(ranking.shortlist).toHaveLength(DEFAULT_SHORTLIST_SIZE)
    expect(ranking.shortlist_size).toBe(DEFAULT_SHORTLIST_SIZE)
  })

  it('honours an explicit shortlist size', () => {
    const ranking = executeRankOpportunities(
      { candidates: batch(20), shortlist_size: 3 },
      { clock: fixedClock },
    )
    expect(ranking.shortlist).toHaveLength(3)
  })

  it('ranks by priority score, descending, with sequential ranks', () => {
    const ranking = executeRankOpportunities({ candidates: batch(15) }, { clock: fixedClock })
    ranking.shortlist.forEach((entry, index) => {
      expect(entry.rank).toBe(index + 1)
      if (index > 0) {
        expect(entry.evaluation.priority.priority_score).toBeLessThanOrEqual(
          ranking.shortlist[index - 1]!.evaluation.priority.priority_score,
        )
      }
    })
  })

  it('summarises the whole batch so nothing silently disappears', () => {
    const ranking = executeRankOpportunities({ candidates: batch(12) }, { clock: fixedClock })
    const counted = Object.values(ranking.decision_breakdown).reduce((a, b) => a + b, 0)
    expect(counted).toBe(12)
  })

  it('is deterministic across two identical batches', () => {
    const input = { candidates: batch(10) }
    const first = executeRankOpportunities(input, { clock: fixedClock })
    const second = executeRankOpportunities(input, { clock: fixedClock })
    expect(first).toEqual(second)
  })

  it('breaks a tie deterministically by candidate reference', () => {
    const identical = [
      candidate({ candidate_ref: 'B-002' }),
      candidate({ candidate_ref: 'A-001' }),
      candidate({ candidate_ref: 'C-003' }),
    ]
    const ranking = rankOpportunities(identical, FIXED_ISO, 3)
    expect(ranking.shortlist.map((s) => s.evaluation.candidate_ref)).toEqual([
      'A-001',
      'B-002',
      'C-003',
    ])
  })

  it('rejects an empty batch', () => {
    expect(() => executeRankOpportunities({ candidates: [] })).toThrowError(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    )
  })

  it(`rejects a batch larger than ${MAX_BATCH_SIZE}`, () => {
    expect(() => executeRankOpportunities({ candidates: batch(MAX_BATCH_SIZE + 1) })).toThrowError(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    )
  })

  it('rejects an invalid shortlist size', () => {
    expect(() =>
      executeRankOpportunities({ candidates: batch(3), shortlist_size: 0 }),
    ).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }))
  })

  it('never shortlists an opportunity the creator cannot execute above one they can', () => {
    const runnable = candidate({ candidate_ref: 'RUNNABLE' })
    const blocked = candidate({
      candidate_ref: 'BLOCKED',
      demand: 100,
      product_fit: 100,
      creator_fit: 100,
      content_potential: 100,
      economics: 100,
      execution: { ...SPEC_CARD_CANDIDATE.execution, product_accessible: false },
    })

    const ranking = rankOpportunities([blocked, runnable], FIXED_ISO, 2)
    expect(ranking.shortlist[0]!.evaluation.candidate_ref).toBe('RUNNABLE')
  })
})
