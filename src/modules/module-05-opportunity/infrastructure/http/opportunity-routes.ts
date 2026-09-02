/**
 * HTTP adapter for Module 05 (DOC 24 §316 `infrastructure/http`, §326).
 *
 * The controller only: PARSE → VALIDATE (via the application layer) →
 * CALL APPLICATION → SERIALIZE. It contains no business logic and it never
 * invents a second response format: every response goes through the canonical
 * envelope and the canonical error model.
 *
 * Endpoint contract (Opportunity Engine §72, adapted to DOC 22 §216 which
 * mandates the `/api/v1` prefix):
 *
 *   POST /api/v1/affiliate/opportunities/evaluate       evaluate one candidate
 *   POST /api/v1/affiliate/opportunities/rank           evaluate a batch → TOP N
 *   GET  /api/v1/affiliate/opportunities/scoring-model   disclose the model
 *   GET  /api/v1/affiliate/opportunities                 501 (needs persistence)
 *
 * `evaluate` and `rank` are computations, not resource creations: they persist
 * nothing and answer 200, per the command form allowed by DOC 22 §216.
 */

import { Hono } from 'hono'
import { AppError } from '../../../../shared/errors/app-error.js'
import { successEnvelope } from '../../../../shared/http/envelope.js'
import type { AppEnv } from '../../../../app/types.js'
import {
  executeEvaluateOpportunity,
  executeRankOpportunities,
} from '../../application/evaluate-opportunity.js'
import { MAX_BATCH_SIZE } from '../../application/schemas.js'
import { describeScoringModel } from '../../domain/model-descriptor.js'
import { MODULE_ID } from '../../module-meta.js'

/** Read a JSON body without leaking parser internals (DOC 22 §223). */
async function readJsonBody(raw: Request): Promise<unknown> {
  const contentType = raw.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    throw AppError.validation('Request body must be sent as application/json', {
      issues: [{ field: 'content-type', message: 'expected application/json' }],
    })
  }

  try {
    return await raw.json()
  } catch {
    // The parser message is deliberately discarded: it is an internal detail.
    throw AppError.validation('Request body is not valid JSON', {
      issues: [{ field: '(body)', message: 'malformed JSON' }],
    })
  }
}

export const opportunityRoutes = new Hono<AppEnv>()

/**
 * Disclose the scoring model.
 *
 * A decision-support score that cannot be inspected cannot be trusted, and
 * MVP Scope §16 states the weights are a starting hypothesis to be calibrated.
 * Publishing them makes a recorded decision replayable.
 */
opportunityRoutes.get('/opportunities/scoring-model', (c) => {
  const ctx = c.get('ctx')
  return c.json(
    successEnvelope(describeScoringModel(), {
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
    }),
  )
})

opportunityRoutes.post('/opportunities/evaluate', async (c) => {
  const ctx = c.get('ctx')
  const logger = c.get('logger')
  const payload = await readJsonBody(c.req.raw)

  const { evaluation, recorded } = await executeEvaluateOpportunity(payload)

  logger?.info('opportunity.evaluated', {
    module: MODULE_ID,
    action: 'evaluate',
    candidate_ref: evaluation.candidate_ref,
    score: evaluation.score.total,
    classification: evaluation.score.classification,
    decision: evaluation.decision.decision,
    decision_rule: evaluation.decision.rule_id,
    persisted: recorded,
  })

  return c.json(
    successEnvelope(
      { evaluation, persisted: recorded },
      { requestId: ctx.requestId, correlationId: ctx.correlationId },
    ),
  )
})

opportunityRoutes.post('/opportunities/rank', async (c) => {
  const ctx = c.get('ctx')
  const logger = c.get('logger')
  const payload = await readJsonBody(c.req.raw)

  const ranking = executeRankOpportunities(payload)

  logger?.info('opportunity.ranked', {
    module: MODULE_ID,
    action: 'rank',
    considered: ranking.considered_count,
    shortlisted: ranking.shortlist_size,
  })

  return c.json(
    successEnvelope(ranking, { requestId: ctx.requestId, correlationId: ctx.correlationId }),
  )
})

/**
 * Stored-opportunity collection.
 *
 * HONESTY RULE (same rule the health endpoint follows): a capability that
 * requires persistence is reported as NOT_IMPLEMENTED, never faked with an
 * empty list. An empty `200 []` would be indistinguishable from "you have no
 * opportunities" and would hide the fact that nothing is being stored.
 * See docs/ARCHITECTURE-CONFLICTS.md CONFLICT-01 / CONFLICT-06.
 */
const persistenceUnavailable = (): never => {
  throw AppError.notImplemented(
    'Stored opportunities require the PostgreSQL persistence layer, which is not implemented yet (see CONFLICT-01). Evaluation is available at POST /api/v1/affiliate/opportunities/evaluate.',
  )
}

opportunityRoutes.get('/opportunities', () => persistenceUnavailable())

/**
 * Sub-paths that are COMMANDS, not resource identifiers.
 *
 * A candidate reference is allowed to look like a word (`^[A-Za-z0-9_.:-]+$`),
 * so `GET /opportunities/evaluate` would otherwise be captured by the
 * `:candidateRef` route below and answered with `501 NOT_IMPLEMENTED`. That
 * would be a misleading diagnosis: the caller used the wrong method on an
 * existing command endpoint, and nothing about persistence is involved.
 * These names are therefore reserved and answer the canonical 404.
 */
const RESERVED_SUBPATHS = new Set(['evaluate', 'rank', 'scoring-model'])

opportunityRoutes.get('/opportunities/:candidateRef', (c) => {
  const ref = c.req.param('candidateRef')
  if (RESERVED_SUBPATHS.has(ref)) {
    throw AppError.notFound('Endpoint not found')
  }
  return persistenceUnavailable()
})

/** Batch limit is part of the published contract, so expose it. */
export const OPPORTUNITY_MAX_BATCH_SIZE = MAX_BATCH_SIZE
