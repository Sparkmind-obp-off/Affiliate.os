import { AppError } from '../../../shared/errors/app-error.js'
import {
  authorize,
  permissionsForRole,
  type AuthorizationRequest,
  type Permission,
} from '../domain/authorization.js'

export function requirePermission(request: AuthorizationRequest): void {
  const decision = authorize(request)
  if (decision.effect === 'DENY') {
    throw AppError.forbidden('Operation is not permitted')
  }
}

export function authorizationSummary(role: string): {
  role: string
  permissions: readonly Permission[]
} {
  return { role, permissions: permissionsForRole(role) }
}
