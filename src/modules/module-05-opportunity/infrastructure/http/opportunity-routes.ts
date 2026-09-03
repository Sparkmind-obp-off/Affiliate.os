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

import { Hono, type Context } from 'hono'
import { AppError } from '../../../../shared/errors/app-error.js'
import { successEnvelope } from '../../../../shared/http/envelope.js'
import type { AppEnv } from '../../../../app/types.js'
import {
  executeEvaluateOpportunity,
  executeRankOpportunities,
} from '../../application/evaluate-opportunity.js'
import {
  executeCreateOpportunity,
  executeGetOpportunity,
  executeListOpportunities,
  executeTransitionOpportunity,
  parseOpportunityListLimit,
} from '../../application/opportunity-lifecycle.js'
import type { OpportunityRepository } from '../../application/ports.js'
import { MAX_BATCH_SIZE } from '../../application/schemas.js'
import { describeScoringModel } from '../../domain/model-descriptor.js'
import { createPostgresOpportunityRepository } from '../persistence/postgres-client.js'
import { MODULE_ID } from '../../module-meta.js'
import { authenticateOpportunityRequest } from './opportunity-auth.js'
import {
  ClerkJwtAuthenticator,
  createPostgresIdentityRepository,
  resolveIdentityContext,
  type ExternalIdentityAuthenticator,
  type IdentityContextRepository,
} from '@modules/module-15-identity'
import { requirePermission, type Permission } from '@modules/module-16-security'

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

/** Resolve persistence only at the infrastructure edge. */
function resolveRepository(c: Context<AppEnv>): OpportunityRepository {
  const injected = (c.env as unknown as { OPPORTUNITY_REPOSITORY?: OpportunityRepository })
    .OPPORTUNITY_REPOSITORY
  if (injected) return injected
  const config = c.get('config')
  if (!config.databaseUrl) {
    throw AppError.notImplemented('Persistent opportunities require PostgreSQL configuration')
  }
  return createPostgresOpportunityRepository(config.databaseUrl, config.databaseSsl)
}

async function authenticate(c: Context<AppEnv>, permission: Permission) {
  const config = c.get('config')
  if (config.clerkIssuer && config.clerkJwksUrl && config.databaseUrl) {
    const injected = c.env as unknown as {
      IDENTITY_AUTHENTICATOR?: ExternalIdentityAuthenticator
      IDENTITY_REPOSITORY?: IdentityContextRepository
    }
    const authenticator = injected.IDENTITY_AUTHENTICATOR ?? new ClerkJwtAuthenticator({
      issuer: config.clerkIssuer,
      jwksUrl: config.clerkJwksUrl,
      authorizedParty: config.clerkAuthorizedParty,
    })
    const repository = injected.IDENTITY_REPOSITORY ?? createPostgresIdentityRepository(
      config.databaseUrl,
      config.databaseSsl,
    )
    const identity = await authenticator.authenticate(c.req.header('authorization'))
    const resolved = await resolveIdentityContext(identity, repository)
    requirePermission({ context: resolved, permission })
    Object.assign(c.get('ctx'), {
      authenticatedIdentity: resolved.authenticatedIdentity,
      accountId: resolved.account.id,
      workspaceId: resolved.workspace.id,
    })
    return {
      userId: resolved.account.id,
      organizationId: resolved.workspace.id,
      workspaceId: resolved.workspace.id,
    }
  }
  // Task 05 compatibility path for existing signed tenant claims and regression tests.
  return authenticateOpportunityRequest(c.req.header('authorization'), config.authSecret)
}

opportunityRoutes.post('/opportunities', async (c) => {
  const ctx = c.get('ctx')
  const tenant = await authenticate(c, 'opportunity.create')
  const repository = resolveRepository(c)
  const payload = await readJsonBody(c.req.raw)
  const opportunity = await executeCreateOpportunity(payload, tenant.workspaceId, { repository })
  return c.json(
    successEnvelope({ opportunity }, { requestId: ctx.requestId, correlationId: ctx.correlationId }),
    201,
  )
})

opportunityRoutes.get('/opportunities', async (c) => {
  const ctx = c.get('ctx')
  const tenant = await authenticate(c, 'opportunity.read')
  const repository = resolveRepository(c)
  const limit = parseOpportunityListLimit(c.req.query('limit'))
  const opportunities = await executeListOpportunities(tenant.workspaceId, limit, repository)
  return c.json(
    successEnvelope(
      { opportunities, count: opportunities.length },
      { requestId: ctx.requestId, correlationId: ctx.correlationId },
    ),
  )
})

const RESERVED_SUBPATHS = new Set(['evaluate', 'rank', 'scoring-model'])

opportunityRoutes.patch('/opportunities/:id', async (c) => {
  const ctx = c.get('ctx')
  const tenant = await authenticate(c, 'opportunity.update')
  const payload = await readJsonBody(c.req.raw)
  const opportunity = await executeTransitionOpportunity(
    c.req.param('id'),
    payload,
    tenant.workspaceId,
    resolveRepository(c),
  )
  return c.json(
    successEnvelope({ opportunity }, { requestId: ctx.requestId, correlationId: ctx.correlationId }),
  )
})

opportunityRoutes.get('/opportunities/:candidateRef', async (c) => {
  const ref = c.req.param('candidateRef')
  if (RESERVED_SUBPATHS.has(ref)) throw AppError.notFound('Endpoint not found')
  const ctx = c.get('ctx')
  const tenant = await authenticate(c, 'opportunity.read')
  const opportunity = await executeGetOpportunity(ref, tenant.workspaceId, resolveRepository(c))
  return c.json(
    successEnvelope({ opportunity }, { requestId: ctx.requestId, correlationId: ctx.correlationId }),
  )
})

/** Batch limit is part of the published contract, so expose it. */
export const OPPORTUNITY_MAX_BATCH_SIZE = MAX_BATCH_SIZE
