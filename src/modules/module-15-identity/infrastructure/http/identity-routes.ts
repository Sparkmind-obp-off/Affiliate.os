import { Hono, type Context } from 'hono'
import type { AppEnv } from '../../../../app/types.js'
import { AppError } from '../../../../shared/errors/app-error.js'
import { successEnvelope } from '../../../../shared/http/envelope.js'
import { resolveIdentityContext } from '../../application/resolve-identity-context.js'
import type { ExternalIdentityAuthenticator, IdentityContextRepository } from '../../application/ports.js'
import { ClerkJwtAuthenticator } from '../auth/clerk-jwt-authenticator.js'
import { createPostgresIdentityRepository } from '../persistence/postgres-client.js'

export const identityRoutes = new Hono<AppEnv>()

type InjectedIdentityEnv = {
  IDENTITY_AUTHENTICATOR?: ExternalIdentityAuthenticator
  IDENTITY_REPOSITORY?: IdentityContextRepository
}

function dependencies(c: Context<AppEnv>) {
  const injected = c.env as unknown as InjectedIdentityEnv
  const config = c.get('config')
  const authenticator = injected.IDENTITY_AUTHENTICATOR ?? (
    config.clerkIssuer && config.clerkJwksUrl
      ? new ClerkJwtAuthenticator({ issuer: config.clerkIssuer, jwksUrl: config.clerkJwksUrl, authorizedParty: config.clerkAuthorizedParty })
      : null
  )
  if (!authenticator) throw AppError.notImplemented('Clerk authentication is not configured')
  const repository = injected.IDENTITY_REPOSITORY ?? (
    config.databaseUrl ? createPostgresIdentityRepository(config.databaseUrl, config.databaseSsl) : null
  )
  if (!repository) throw AppError.notImplemented('Identity persistence requires PostgreSQL configuration')
  return { authenticator, repository }
}

async function current(c: Context<AppEnv>) {
  const { authenticator, repository } = dependencies(c)
  const authenticated = await authenticator.authenticate(c.req.header('authorization'))
  const resolved = await resolveIdentityContext(authenticated, repository)
  const request = c.get('ctx')
  Object.assign(request, {
    authenticatedIdentity: resolved.authenticatedIdentity,
    accountId: resolved.account.id,
    workspaceId: resolved.workspace.id,
  })
  c.get('logger').info('identity.resolved', {
    module: 'module-15-identity', action: 'resolve',
    account_id: resolved.account.id, workspace_id: resolved.workspace.id,
  })
  return resolved
}

identityRoutes.get('/context', async (c) => {
  const resolved = await current(c)
  const ctx = c.get('ctx')
  return c.json(successEnvelope(resolved, { requestId: ctx.requestId, correlationId: ctx.correlationId }))
})
identityRoutes.get('/account/me', async (c) => {
  const { account } = await current(c); const ctx = c.get('ctx')
  return c.json(successEnvelope({ account }, { requestId: ctx.requestId, correlationId: ctx.correlationId }))
})
identityRoutes.get('/workspace/current', async (c) => {
  const { workspace } = await current(c); const ctx = c.get('ctx')
  return c.json(successEnvelope({ workspace }, { requestId: ctx.requestId, correlationId: ctx.correlationId }))
})
identityRoutes.get('/membership/current', async (c) => {
  const { membership } = await current(c); const ctx = c.get('ctx')
  return c.json(successEnvelope({ membership }, { requestId: ctx.requestId, correlationId: ctx.correlationId }))
})
