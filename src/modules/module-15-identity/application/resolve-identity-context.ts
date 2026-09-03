import { AppError } from '../../../shared/errors/app-error.js'
import type { AuthenticatedIdentity, ResolvedIdentityContext } from '../domain/models.js'
import type { IdentityContextRepository } from './ports.js'

const SUBJECT_RE = /^[A-Za-z0-9_-]{3,255}$/

export async function resolveIdentityContext(
  identity: AuthenticatedIdentity,
  repository: IdentityContextRepository,
): Promise<ResolvedIdentityContext> {
  if (identity.provider !== 'clerk' || !SUBJECT_RE.test(identity.subject)) {
    throw AppError.authRequired('Invalid authenticated identity')
  }

  const resolved = await repository.resolveOrProvision(identity)
  if (resolved.account.status !== 'active') {
    throw AppError.forbidden('Account is not active')
  }
  if (resolved.workspace.status !== 'active' || resolved.membership.status !== 'active') {
    throw AppError.tenantAccessDenied('Workspace membership is not active')
  }
  if (
    resolved.membership.accountId !== resolved.account.id ||
    resolved.membership.workspaceId !== resolved.workspace.id
  ) {
    throw AppError.internal('Resolved identity context is inconsistent')
  }
  return resolved
}
