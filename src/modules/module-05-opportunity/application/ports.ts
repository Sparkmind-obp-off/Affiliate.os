/**
 * Application ports (DOC 24 §318, §329).
 *
 * The domain/application layer OWNS these interfaces; infrastructure
 * implements them. Dependency direction is API → application → domain → port →
 * infrastructure, never the reverse.
 *
 * PERSISTENCE BOUNDARY — read this before adding an adapter.
 *
 * The locked production database is PostgreSQL (DOC 24 §314) and
 * `docs/ARCHITECTURE-CONFLICTS.md` CONFLICT-01 is still OPEN: a Cloudflare
 * Worker cannot reach PostgreSQL without Hyperdrive or an HTTP driver, and no
 * PostgreSQL instance exists in the current environment. Substituting D1/KV/
 * SQLite would violate Task 01 §11.
 *
 * This task therefore ships the PORT ONLY. No adapter is registered, and the
 * use case works correctly with the recorder absent — an evaluation is a pure
 * computation, so nothing is lost by not storing it. Capabilities that genuinely
 * require storage answer NOT_IMPLEMENTED instead of pretending to work.
 */

import type { OpportunityEvaluation } from '../domain/evaluator.js'

/**
 * Records a completed evaluation for later learning (§47 feedback loop, §66
 * proprietary learning). Optional by design: see the boundary note above.
 */
export interface OpportunityEvaluationRecorder {
  record(evaluation: OpportunityEvaluation): Promise<void>
}

/**
 * Reads stored opportunities.
 *
 * Declared so the shape of the future contract is explicit, and so the HTTP
 * adapter can honestly report that the capability is unavailable rather than
 * inventing a response. NOT implemented in this task.
 */
export interface OpportunityReadRepository {
  findByRef(candidateRef: string): Promise<OpportunityEvaluation | null>
  list(limit: number): Promise<OpportunityEvaluation[]>
}

/** Injected clock — keeps the use case deterministic under test. */
export interface Clock {
  now(): Date
}

export const systemClock: Clock = { now: () => new Date() }
