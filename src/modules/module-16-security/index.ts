/** Public contract for Authorization, RBAC & Tenant Access Control (Task 07). */
export const MODULE_ID = 'module-16-security' as const
export const MODULE_TITLE = 'Security, Policy & Governance Engine' as const
export const MODULE_STATUS = 'FOUNDATION_IMPLEMENTED' as const

export * from './domain/authorization.js'
export * from './application/authorize.js'
