/**
 * Use case: EVALUATE OPPORTUNITY.
 *
 * Contract source: DOC 24 §327 — an application service owns the use case, the
 * authorization context, the domain invocation, and (later) event publication.
 * Domain rules live in `../domain`; this file coordinates only.
 */

import { AppError } from '../../../shared/errors/app-error.js'
import {
  DEFAULT_SHORTLIST_SIZE,
  evaluateOpportunity,
  rankOpportunities,
  type OpportunityEvaluation,
  type OpportunityRanking,
} from '../domain/evaluator.js'
import type { OpportunityCandidate } from '../domain/signals.js'
import {
  evaluateRequestSchema,
  rankRequestSchema,
  toFieldIssues,
  type FieldIssue,
} from './schemas.js'
import { systemClock, type Clock, type OpportunityEvaluationRecorder } from './ports.js'

export interface EvaluateOpportunityDeps {
  clock?: Clock
  /**
   * Optional (see `ports.ts` persistence boundary). When absent the evaluation
   * is simply not recorded; the returned result is unaffected.
   */
  recorder?: OpportunityEvaluationRecorder
}

/**
 * Parse an untrusted payload into a validated candidate.
 * Throws a canonical VALIDATION_ERROR with client-safe field details.
 */
export function parseEvaluateInput(payload: unknown): OpportunityCandidate {
  const parsed = evaluateRequestSchema.safeParse(payload)
  if (!parsed.success) {
    throw validationError(toFieldIssues(parsed.error))
  }
  return parsed.data.candidate as OpportunityCandidate
}

export function parseRankInput(payload: unknown): {
  candidates: OpportunityCandidate[]
  shortlistSize: number
} {
  const parsed = rankRequestSchema.safeParse(payload)
  if (!parsed.success) {
    throw validationError(toFieldIssues(parsed.error))
  }
  return {
    candidates: parsed.data.candidates as OpportunityCandidate[],
    shortlistSize: parsed.data.shortlist_size ?? DEFAULT_SHORTLIST_SIZE,
  }
}

function validationError(issues: FieldIssue[]): AppError {
  return AppError.validation('Opportunity evaluation input is invalid', { issues })
}

/**
 * Evaluate a single candidate.
 *
 * A recorder failure must never corrupt a correct evaluation: the result is
 * already computed and is returned regardless. The failure is surfaced to the
 * caller through `recorded`, so a silent success is impossible.
 */
export async function executeEvaluateOpportunity(
  payload: unknown,
  deps: EvaluateOpportunityDeps = {},
): Promise<{ evaluation: OpportunityEvaluation; recorded: boolean }> {
  const candidate = parseEvaluateInput(payload)
  const clock = deps.clock ?? systemClock
  const evaluation = evaluateOpportunity(candidate, clock.now().toISOString())

  if (!deps.recorder) {
    return { evaluation, recorded: false }
  }

  try {
    await deps.recorder.record(evaluation)
    return { evaluation, recorded: true }
  } catch (cause) {
    throw AppError.internal('Failed to record the opportunity evaluation', cause)
  }
}

/** Evaluate a batch and reduce it to a shortlist (§57). */
export function executeRankOpportunities(
  payload: unknown,
  deps: EvaluateOpportunityDeps = {},
): OpportunityRanking {
  const { candidates, shortlistSize } = parseRankInput(payload)
  const clock = deps.clock ?? systemClock
  return rankOpportunities(candidates, clock.now().toISOString(), shortlistSize)
}
