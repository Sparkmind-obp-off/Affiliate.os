/** Public contract for Identity, Account & Tenancy (Task 06). */
export const MODULE_ID = 'module-15-identity' as const
export const MODULE_TITLE = 'Identity, Account & Tenancy Architecture' as const
export const MODULE_STATUS = 'FOUNDATION_IMPLEMENTED' as const

export * from './domain/models.js'
export * from './application/ports.js'
export * from './application/resolve-identity-context.js'
export * from './infrastructure/auth/clerk-jwt-authenticator.js'
export * from './infrastructure/persistence/postgres-identity-repository.js'
export { createPostgresIdentityRepository } from './infrastructure/persistence/postgres-client.js'
export { identityRoutes } from './infrastructure/http/identity-routes.js'
