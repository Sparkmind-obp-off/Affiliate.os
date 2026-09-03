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
import { createPostgresOpportunityRepository, type OpportunityRepository } from '@modules/module-05-opportunity'
import { createPostgresDemandSignalRepository, type DemandSignalRepository } from '@modules/module-04-demand'
import { createPostgresCreatorRepository, type CreatorRepository } from '@modules/module-06-creator-fit'
import {
  createContentOpportunity,
  evaluateStoredContentOpportunity,
  getContentOpportunity,
  listContentOpportunities,
} from '../../application/content-opportunity-service.js'
import type { ContentOpportunityRepository } from '../../application/ports.js'
import { createPostgresContentOpportunityRepository } from '../persistence/postgres-client.js'

export const contentOpportunityRoutes = new Hono<AppEnv>()

type InjectedRepositories = {
  CONTENT_OPPORTUNITY_REPOSITORY?: ContentOpportunityRepository
  OPPORTUNITY_REPOSITORY?: OpportunityRepository
  DEMAND_REPOSITORY?: DemandSignalRepository
  CREATOR_REPOSITORY?: CreatorRepository
}
function database(c: Context<AppEnv>): { url: string; ssl: boolean } {
  const config = c.get('config')
  if (!config.databaseUrl) throw AppError.notImplemented('Content opportunities require PostgreSQL configuration')
  return { url: config.databaseUrl, ssl: config.databaseSsl }
}
function contentRepository(c: Context<AppEnv>): ContentOpportunityRepository {
  const injected = c.env as unknown as InjectedRepositories
  if (injected.CONTENT_OPPORTUNITY_REPOSITORY) return injected.CONTENT_OPPORTUNITY_REPOSITORY
  const db = database(c)
  return createPostgresContentOpportunityRepository(db.url, db.ssl)
}
function opportunityRepository(c: Context<AppEnv>): OpportunityRepository {
  const injected = c.env as unknown as InjectedRepositories
  if (injected.OPPORTUNITY_REPOSITORY) return injected.OPPORTUNITY_REPOSITORY
  const db = database(c)
  return createPostgresOpportunityRepository(db.url, db.ssl)
}
function demandRepository(c: Context<AppEnv>): DemandSignalRepository {
  const injected = c.env as unknown as InjectedRepositories
  if (injected.DEMAND_REPOSITORY) return injected.DEMAND_REPOSITORY
  const db = database(c)
  return createPostgresDemandSignalRepository(db.url, db.ssl)
}
function creatorRepository(c: Context<AppEnv>): CreatorRepository {
  const injected = c.env as unknown as InjectedRepositories
  if (injected.CREATOR_REPOSITORY) return injected.CREATOR_REPOSITORY
  const db = database(c)
  return createPostgresCreatorRepository(db.url, db.ssl)
}

async function authenticate(c: Context<AppEnv>, permissions: readonly Permission[]): Promise<string> {
  const config = c.get('config')
  if (!config.clerkIssuer || !config.clerkJwksUrl || !config.databaseUrl) {
    throw AppError.authRequired('Content opportunity resources require authenticated tenancy')
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
  try { return await raw.json() } catch { throw AppError.validation('Request body is not valid JSON') }
}

contentOpportunityRoutes.post('/content-opportunities', async (c) => {
  const ctx = c.get('ctx')
  const workspaceId = await authenticate(c, ['content_opportunity.create'])
  const contentOpportunity = await createContentOpportunity(await readJsonBody(c.req.raw), workspaceId, {
    repository: contentRepository(c),
    opportunityRepository: opportunityRepository(c),
    demandRepository: demandRepository(c),
  })
  return c.json(successEnvelope(
    { contentOpportunity },
    { requestId: ctx.requestId, correlationId: ctx.correlationId },
  ), 201)
})

contentOpportunityRoutes.get('/content-opportunities', async (c) => {
  const ctx = c.get('ctx')
  const workspaceId = await authenticate(c, ['content_opportunity.read'])
  const contentOpportunities = await listContentOpportunities(
    workspaceId,
    c.req.query('limit'),
    contentRepository(c),
  )
  return c.json(successEnvelope(
    { contentOpportunities, count: contentOpportunities.length },
    { requestId: ctx.requestId, correlationId: ctx.correlationId },
  ))
})

contentOpportunityRoutes.post('/content-opportunities/:id/evaluate', async (c) => {
  const ctx = c.get('ctx')
  const workspaceId = await authenticate(c, [
    'content_opportunity.read', 'creator.read', 'opportunity.read',
  ])
  const evaluation = await evaluateStoredContentOpportunity(
    c.req.param('id'),
    await readJsonBody(c.req.raw),
    workspaceId,
    {
      repository: contentRepository(c),
      opportunityRepository: opportunityRepository(c),
      creatorRepository: creatorRepository(c),
    },
  )
  return c.json(successEnvelope(
    { evaluation },
    { requestId: ctx.requestId, correlationId: ctx.correlationId },
  ))
})

contentOpportunityRoutes.get('/content-opportunities/:id', async (c) => {
  const ctx = c.get('ctx')
  const workspaceId = await authenticate(c, ['content_opportunity.read'])
  const contentOpportunity = await getContentOpportunity(
    c.req.param('id'),
    workspaceId,
    contentRepository(c),
  )
  return c.json(successEnvelope(
    { contentOpportunity },
    { requestId: ctx.requestId, correlationId: ctx.correlationId },
  ))
})
