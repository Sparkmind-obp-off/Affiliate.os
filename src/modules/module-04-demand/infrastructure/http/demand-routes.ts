import { Hono, type Context } from 'hono'
import { AppError } from '../../../../shared/errors/app-error.js'
import { successEnvelope } from '../../../../shared/http/envelope.js'
import type { AppEnv } from '../../../../app/types.js'
import {
  ClerkJwtAuthenticator,
  createPostgresIdentityRepository,
  resolveIdentityContext,
  type ExternalIdentityAuthenticator,
  type IdentityContextRepository,
} from '@modules/module-15-identity'
import { requirePermission, type Permission } from '@modules/module-16-security'
import {
  createDemandSignal,
  getDemandSignal,
  listDemandSignals,
} from '../../application/demand-service.js'
import type { DemandSignalRepository } from '../../application/ports.js'
import { createPostgresDemandSignalRepository } from '../persistence/postgres-client.js'

export const demandRoutes = new Hono<AppEnv>()

function resolveRepository(c: Context<AppEnv>): DemandSignalRepository {
  const injected = (c.env as unknown as { DEMAND_REPOSITORY?: DemandSignalRepository })
    .DEMAND_REPOSITORY
  if (injected) return injected
  const config = c.get('config')
  if (!config.databaseUrl) {
    throw AppError.notImplemented('Demand discovery requires PostgreSQL configuration')
  }
  return createPostgresDemandSignalRepository(config.databaseUrl, config.databaseSsl)
}

async function authenticate(c: Context<AppEnv>, permission: Permission): Promise<string> {
  const config = c.get('config')
  if (!config.clerkIssuer || !config.clerkJwksUrl || !config.databaseUrl) {
    throw AppError.authRequired('Demand discovery requires authenticated tenancy')
  }
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
  return resolved.workspace.id
}

async function readJsonBody(raw: Request): Promise<unknown> {
  const contentType = raw.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    throw AppError.validation('Request body must be sent as application/json')
  }
  try {
    return await raw.json()
  } catch {
    throw AppError.validation('Request body is not valid JSON')
  }
}

demandRoutes.post('/demand/signals', async (c) => {
  const ctx = c.get('ctx')
  const workspaceId = await authenticate(c, 'demand.create')
  const signal = await createDemandSignal(
    await readJsonBody(c.req.raw),
    workspaceId,
    resolveRepository(c),
  )
  return c.json(
    successEnvelope({ signal }, { requestId: ctx.requestId, correlationId: ctx.correlationId }),
    201,
  )
})

demandRoutes.get('/demand/signals', async (c) => {
  const ctx = c.get('ctx')
  const workspaceId = await authenticate(c, 'demand.read')
  const signals = await listDemandSignals(
    workspaceId,
    c.req.query('limit'),
    resolveRepository(c),
  )
  return c.json(successEnvelope(
    { signals, count: signals.length },
    { requestId: ctx.requestId, correlationId: ctx.correlationId },
  ))
})

demandRoutes.get('/demand/signals/:id', async (c) => {
  const ctx = c.get('ctx')
  const workspaceId = await authenticate(c, 'demand.read')
  const signal = await getDemandSignal(
    c.req.param('id'),
    workspaceId,
    resolveRepository(c),
  )
  return c.json(
    successEnvelope({ signal }, { requestId: ctx.requestId, correlationId: ctx.correlationId }),
  )
})
