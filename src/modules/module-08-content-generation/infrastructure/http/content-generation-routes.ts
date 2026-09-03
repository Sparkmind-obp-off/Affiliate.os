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
import { createPostgresContentOpportunityRepository, type ContentOpportunityRepository } from '@modules/module-07-content'
import { createPostgresCreatorRepository, type CreatorRepository } from '@modules/module-06-creator-fit'
import {
  createContentGeneration,
  getContentGeneration,
  listContentGenerations,
  requestContentGeneration,
  reviewContentGeneration,
} from '../../application/content-generation-service.js'
import {
  UnavailableGenerationProvider,
  type ContentGenerationRepository,
  type GenerationProvider,
} from '../../application/ports.js'
import { createPostgresContentGenerationRepository } from '../persistence/postgres-client.js'

export const contentGenerationRoutes = new Hono<AppEnv>()

type InjectedDependencies = {
  CONTENT_GENERATION_REPOSITORY?: ContentGenerationRepository
  CONTENT_OPPORTUNITY_REPOSITORY?: ContentOpportunityRepository
  CREATOR_REPOSITORY?: CreatorRepository
  CONTENT_GENERATION_PROVIDER?: GenerationProvider
}
function database(c: Context<AppEnv>): { url: string; ssl: boolean } {
  const config = c.get('config')
  if (!config.databaseUrl) throw AppError.notImplemented('Content generations require PostgreSQL configuration')
  return { url: config.databaseUrl, ssl: config.databaseSsl }
}
function generationRepository(c: Context<AppEnv>): ContentGenerationRepository {
  const injected = c.env as unknown as InjectedDependencies
  if (injected.CONTENT_GENERATION_REPOSITORY) return injected.CONTENT_GENERATION_REPOSITORY
  const db = database(c)
  return createPostgresContentGenerationRepository(db.url, db.ssl)
}
function contentOpportunityRepository(c: Context<AppEnv>): ContentOpportunityRepository {
  const injected = c.env as unknown as InjectedDependencies
  if (injected.CONTENT_OPPORTUNITY_REPOSITORY) return injected.CONTENT_OPPORTUNITY_REPOSITORY
  const db = database(c)
  return createPostgresContentOpportunityRepository(db.url, db.ssl)
}
function creatorRepository(c: Context<AppEnv>): CreatorRepository {
  const injected = c.env as unknown as InjectedDependencies
  if (injected.CREATOR_REPOSITORY) return injected.CREATOR_REPOSITORY
  const db = database(c)
  return createPostgresCreatorRepository(db.url, db.ssl)
}
function generationProvider(c: Context<AppEnv>): GenerationProvider {
  return (c.env as unknown as InjectedDependencies).CONTENT_GENERATION_PROVIDER ?? new UnavailableGenerationProvider()
}

async function authenticate(c: Context<AppEnv>, permissions: readonly Permission[]): Promise<string> {
  const config = c.get('config')
  if (!config.clerkIssuer || !config.clerkJwksUrl || !config.databaseUrl) {
    throw AppError.authRequired('Content generation resources require authenticated tenancy')
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

contentGenerationRoutes.post('/content-generations', async (c) => {
  const ctx = c.get('ctx')
  const workspaceId = await authenticate(c, ['content_generation.create'])
  const contentGeneration = await createContentGeneration(await readJsonBody(c.req.raw), workspaceId, {
    repository: generationRepository(c),
    contentOpportunityRepository: contentOpportunityRepository(c),
    creatorRepository: creatorRepository(c),
  })
  return c.json(successEnvelope(
    { contentGeneration },
    { requestId: ctx.requestId, correlationId: ctx.correlationId },
  ), 201)
})

contentGenerationRoutes.get('/content-generations', async (c) => {
  const ctx = c.get('ctx')
  const workspaceId = await authenticate(c, ['content_generation.read'])
  const contentGenerations = await listContentGenerations(workspaceId, c.req.query('limit'), generationRepository(c))
  return c.json(successEnvelope(
    { contentGenerations, count: contentGenerations.length },
    { requestId: ctx.requestId, correlationId: ctx.correlationId },
  ))
})

contentGenerationRoutes.post('/content-generations/:id/request', async (c) => {
  const ctx = c.get('ctx')
  const workspaceId = await authenticate(c, ['content_generation.create'])
  const contentGeneration = await requestContentGeneration(
    c.req.param('id'), workspaceId, generationRepository(c), generationProvider(c),
  )
  return c.json(successEnvelope(
    { contentGeneration },
    { requestId: ctx.requestId, correlationId: ctx.correlationId },
  ))
})

contentGenerationRoutes.post('/content-generations/:id/review', async (c) => {
  const ctx = c.get('ctx')
  const workspaceId = await authenticate(c, ['content_generation.update'])
  const contentGeneration = await reviewContentGeneration(
    c.req.param('id'), await readJsonBody(c.req.raw), workspaceId, generationRepository(c),
  )
  return c.json(successEnvelope(
    { contentGeneration },
    { requestId: ctx.requestId, correlationId: ctx.correlationId },
  ))
})

contentGenerationRoutes.get('/content-generations/:id', async (c) => {
  const ctx = c.get('ctx')
  const workspaceId = await authenticate(c, ['content_generation.read'])
  const contentGeneration = await getContentGeneration(c.req.param('id'), workspaceId, generationRepository(c))
  return c.json(successEnvelope(
    { contentGeneration },
    { requestId: ctx.requestId, correlationId: ctx.correlationId },
  ))
})
