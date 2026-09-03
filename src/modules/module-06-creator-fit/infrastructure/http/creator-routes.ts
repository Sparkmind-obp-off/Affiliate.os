import { Hono, type Context } from 'hono'
import type { AppEnv } from '../../../../app/types.js'
import { AppError } from '../../../../shared/errors/app-error.js'
import { successEnvelope } from '../../../../shared/http/envelope.js'
import {
  ClerkJwtAuthenticator,
  createPostgresIdentityRepository,
  resolveIdentityContext,
  type ExternalIdentityAuthenticator,
  type IdentityContextRepository,
} from '@modules/module-15-identity'
import { requirePermission, type Permission } from '@modules/module-16-security'
import {
  createPostgresOpportunityRepository,
  type OpportunityRepository,
} from '@modules/module-05-opportunity'
import {
  createCreatorProfile,
  evaluateStoredCreatorFit,
  getCreatorProfile,
  listCreatorProfiles,
} from '../../application/creator-service.js'
import type { CreatorRepository } from '../../application/ports.js'
import { createPostgresCreatorRepository } from '../persistence/postgres-client.js'

export const creatorRoutes = new Hono<AppEnv>()

function resolveCreatorRepository(c: Context<AppEnv>): CreatorRepository {
  const injected = (c.env as unknown as { CREATOR_REPOSITORY?: CreatorRepository }).CREATOR_REPOSITORY
  if (injected) return injected
  const config = c.get('config')
  if (!config.databaseUrl) throw AppError.notImplemented('Creator profiles require PostgreSQL configuration')
  return createPostgresCreatorRepository(config.databaseUrl, config.databaseSsl)
}

function resolveOpportunityRepository(c: Context<AppEnv>): OpportunityRepository {
  const injected = (c.env as unknown as { OPPORTUNITY_REPOSITORY?: OpportunityRepository }).OPPORTUNITY_REPOSITORY
  if (injected) return injected
  const config = c.get('config')
  if (!config.databaseUrl) throw AppError.notImplemented('Creator fit requires PostgreSQL configuration')
  return createPostgresOpportunityRepository(config.databaseUrl, config.databaseSsl)
}

async function authenticate(c: Context<AppEnv>, permissions: readonly Permission[]): Promise<string> {
  const config = c.get('config')
  if (!config.clerkIssuer || !config.clerkJwksUrl || !config.databaseUrl) {
    throw AppError.authRequired('Creator resources require authenticated tenancy')
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
  for (const permission of permissions) requirePermission({ context: resolved, permission })
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

creatorRoutes.post('/creators', async (c) => {
  const ctx = c.get('ctx')
  const workspaceId = await authenticate(c, ['creator.create'])
  const creator = await createCreatorProfile(
    await readJsonBody(c.req.raw),
    workspaceId,
    { repository: resolveCreatorRepository(c) },
  )
  return c.json(
    successEnvelope({ creator }, { requestId: ctx.requestId, correlationId: ctx.correlationId }),
    201,
  )
})

creatorRoutes.get('/creators', async (c) => {
  const ctx = c.get('ctx')
  const workspaceId = await authenticate(c, ['creator.read'])
  const creators = await listCreatorProfiles(
    workspaceId,
    c.req.query('limit'),
    resolveCreatorRepository(c),
  )
  return c.json(successEnvelope(
    { creators, count: creators.length },
    { requestId: ctx.requestId, correlationId: ctx.correlationId },
  ))
})

creatorRoutes.post('/creators/:id/fit', async (c) => {
  const ctx = c.get('ctx')
  const workspaceId = await authenticate(c, ['creator.read', 'opportunity.read'])
  const fit = await evaluateStoredCreatorFit(
    c.req.param('id'),
    await readJsonBody(c.req.raw),
    workspaceId,
    {
      creatorRepository: resolveCreatorRepository(c),
      opportunityRepository: resolveOpportunityRepository(c),
    },
  )
  return c.json(successEnvelope(
    { fit },
    { requestId: ctx.requestId, correlationId: ctx.correlationId },
  ))
})

creatorRoutes.get('/creators/:id', async (c) => {
  const ctx = c.get('ctx')
  const workspaceId = await authenticate(c, ['creator.read'])
  const creator = await getCreatorProfile(c.req.param('id'), workspaceId, resolveCreatorRepository(c))
  return c.json(successEnvelope(
    { creator },
    { requestId: ctx.requestId, correlationId: ctx.correlationId },
  ))
})
