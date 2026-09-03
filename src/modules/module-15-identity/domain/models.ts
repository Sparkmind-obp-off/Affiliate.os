export const IDENTITY_PROVIDER = 'clerk' as const
export const ACCOUNT_STATUSES = ['active', 'suspended'] as const
export const WORKSPACE_STATUSES = ['active', 'suspended'] as const
export const MEMBERSHIP_STATUSES = ['active', 'suspended'] as const
export const MEMBERSHIP_ROLES = ['owner'] as const

export type IdentityProvider = typeof IDENTITY_PROVIDER
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]
export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[number]
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number]
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number]

export interface AuthenticatedIdentity {
  provider: IdentityProvider
  subject: string
}

export interface Account {
  id: string
  displayName: string
  status: AccountStatus
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  ownerAccountId: string
  status: WorkspaceStatus
  createdAt: string
  updatedAt: string
}

export interface WorkspaceMembership {
  id: string
  workspaceId: string
  accountId: string
  role: MembershipRole
  status: MembershipStatus
  createdAt: string
  updatedAt: string
}

export interface ResolvedIdentityContext {
  authenticatedIdentity: AuthenticatedIdentity
  account: Account
  workspace: Workspace
  membership: WorkspaceMembership
}
