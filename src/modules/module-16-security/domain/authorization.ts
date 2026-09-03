import type { ResolvedIdentityContext } from '@modules/module-15-identity'

export const PERMISSIONS = [
  'workspace.read',
  'workspace.manage',
  'member.read',
  'member.manage',
  'opportunity.read',
  'opportunity.create',
] as const

export type Permission = (typeof PERMISSIONS)[number]
export type AuthorizationEffect = 'ALLOW' | 'DENY'
export type AuthorizationReason =
  | 'authorized'
  | 'invalid_context'
  | 'inactive_account'
  | 'inactive_workspace'
  | 'missing_or_inactive_membership'
  | 'invalid_role'
  | 'missing_permission'
  | 'cross_tenant_resource'

export interface TenantResource {
  workspaceId: string
}

export interface AuthorizationRequest {
  context: ResolvedIdentityContext
  permission: string
  resource?: TenantResource
}

export interface AuthorizationDecision {
  effect: AuthorizationEffect
  reason: AuthorizationReason
}

const ROLE_PERMISSIONS = {
  owner: PERMISSIONS,
  admin: [
    'workspace.read',
    'member.read',
    'member.manage',
    'opportunity.read',
    'opportunity.create',
  ],
  member: [
    'workspace.read',
    'opportunity.read',
    'opportunity.create',
  ],
} as const satisfies Record<string, readonly Permission[]>

export type AuthorizationRole = keyof typeof ROLE_PERMISSIONS

const deny = (reason: Exclude<AuthorizationReason, 'authorized'>): AuthorizationDecision => ({
  effect: 'DENY',
  reason,
})

export function permissionsForRole(role: string): readonly Permission[] {
  return isAuthorizationRole(role) ? ROLE_PERMISSIONS[role] : []
}

export function isPermission(permission: string): permission is Permission {
  return (PERMISSIONS as readonly string[]).includes(permission)
}

export function isAuthorizationRole(role: string): role is AuthorizationRole {
  return Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role)
}

/**
 * Deterministic, deny-by-default authorization policy.
 *
 * Authentication and persistence remain outside this pure domain boundary. The
 * caller supplies the resolved Module 15 context, and this function verifies
 * every account, workspace, membership, role, permission, and resource-tenant
 * invariant before returning ALLOW.
 */
export function authorize(request: AuthorizationRequest): AuthorizationDecision {
  const { context, permission, resource } = request
  const { account, workspace, membership } = context

  if (
    !account.id ||
    !workspace.id ||
    !membership.id ||
    membership.accountId !== account.id ||
    membership.workspaceId !== workspace.id ||
    (membership.role === 'owner' && workspace.ownerAccountId !== account.id)
  ) {
    return deny('invalid_context')
  }
  if (account.status !== 'active') return deny('inactive_account')
  if (workspace.status !== 'active') return deny('inactive_workspace')
  if (membership.status !== 'active') return deny('missing_or_inactive_membership')
  if (!isAuthorizationRole(membership.role)) return deny('invalid_role')
  const granted = ROLE_PERMISSIONS[membership.role] as readonly Permission[]
  if (!isPermission(permission) || !granted.includes(permission)) {
    return deny('missing_permission')
  }
  if (resource && resource.workspaceId !== workspace.id) return deny('cross_tenant_resource')

  return { effect: 'ALLOW', reason: 'authorized' }
}
