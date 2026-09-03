import type { AuthenticatedIdentity, ResolvedIdentityContext } from '../domain/models.js'

export interface IdentityContextRepository {
  resolveOrProvision(identity: AuthenticatedIdentity): Promise<ResolvedIdentityContext>
}

export interface ExternalIdentityAuthenticator {
  authenticate(authorization: string | undefined): Promise<AuthenticatedIdentity>
}
