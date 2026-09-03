import { describe, expect, it } from 'vitest'
import type { ResolvedIdentityContext } from '@modules/module-15-identity'
import {
  authorize,
  permissionsForRole,
  requirePermission,
  type Permission,
} from '@modules/module-16-security'

const ACTIVE_CONTEXT: ResolvedIdentityContext = {
  authenticatedIdentity: { provider: 'clerk', subject: 'user_task07' },
  account: {
    id: 'account-a',
    displayName: 'Account A',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  workspace: {
    id: 'workspace-a',
    name: 'Workspace A',
    slug: 'workspace-a',
    ownerAccountId: 'account-a',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  membership: {
    id: 'membership-a',
    workspaceId: 'workspace-a',
    accountId: 'account-a',
    role: 'owner',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
}

function context(
  role: 'owner' | 'admin' | 'member' = 'owner',
  overrides: Partial<ResolvedIdentityContext> = {},
): ResolvedIdentityContext {
  const accountId = role === 'owner' ? 'account-a' : `account-${role}`
  return {
    ...ACTIVE_CONTEXT,
    account: { ...ACTIVE_CONTEXT.account, id: accountId },
    workspace: { ...ACTIVE_CONTEXT.workspace },
    membership: { ...ACTIVE_CONTEXT.membership, accountId, role },
    ...overrides,
  }
}

function expectDenied(
  resolved: ResolvedIdentityContext,
  permission: string,
  reason: string,
  resource?: { workspaceId: string },
): void {
  expect(authorize({ context: resolved, permission, resource })).toEqual({ effect: 'DENY', reason })
}

describe('Task 07 deterministic authorization policy', () => {
  it.each([
    ['owner', 'workspace.manage'],
    ['admin', 'member.manage'],
    ['member', 'opportunity.create'],
  ] as const)('allows %s to use %s', (role, permission) => {
    expect(authorize({ context: context(role), permission })).toEqual({ effect: 'ALLOW', reason: 'authorized' })
  })

  it('keeps the role-permission matrix minimal and deterministic', () => {
    expect(permissionsForRole('owner')).toContain('workspace.manage')
    expect(permissionsForRole('admin')).not.toContain('workspace.manage')
    expect(permissionsForRole('member')).toEqual(['workspace.read', 'opportunity.read', 'opportunity.create', 'opportunity.update'])
  })

  it('denies missing permissions, unknown permissions, and unknown roles', () => {
    expectDenied(context('member'), 'member.manage', 'missing_permission')
    expectDenied(context('owner'), 'billing.override', 'missing_permission')
    const invalid = context('member')
    invalid.membership.role = 'superadmin' as typeof invalid.membership.role
    expectDenied(invalid, 'opportunity.read', 'invalid_role')
    expect(permissionsForRole('superadmin')).toEqual([])
  })

  it('denies suspended accounts, workspaces, and memberships', () => {
    expectDenied(context('owner', { account: { ...ACTIVE_CONTEXT.account, status: 'suspended' } }), 'workspace.read', 'inactive_account')
    expectDenied(context('owner', { workspace: { ...ACTIVE_CONTEXT.workspace, status: 'suspended' } }), 'workspace.read', 'inactive_workspace')
    expectDenied(context('owner', { membership: { ...ACTIVE_CONTEXT.membership, status: 'suspended' } }), 'workspace.read', 'missing_or_inactive_membership')
  })

  it('denies missing or inconsistent membership and invalid ownership', () => {
    expectDenied(context('member', { membership: { ...ACTIVE_CONTEXT.membership, accountId: 'other', role: 'member' } }), 'opportunity.read', 'invalid_context')
    expectDenied(context('member', { membership: { ...ACTIVE_CONTEXT.membership, workspaceId: 'other', role: 'member' } }), 'opportunity.read', 'invalid_context')
    expectDenied(context('owner', { workspace: { ...ACTIVE_CONTEXT.workspace, ownerAccountId: 'other' } }), 'workspace.read', 'invalid_context')
  })

  it('denies cross-tenant resource reads and mutations', () => {
    expectDenied(context('owner'), 'opportunity.read', 'cross_tenant_resource', { workspaceId: 'workspace-b' })
    expectDenied(context('owner'), 'opportunity.create', 'cross_tenant_resource', { workspaceId: 'workspace-b' })
  })

  it('prevents member/admin privilege escalation and ignores client-like permission strings', () => {
    expectDenied(context('member'), 'member.manage', 'missing_permission')
    expectDenied(context('admin'), 'workspace.manage', 'missing_permission')
    expectDenied(context('member'), 'owner', 'missing_permission')
  })

  it('maps denial to the canonical authorization error without leaking the reason', () => {
    const request = { context: context('member'), permission: 'workspace.manage' as Permission }
    expect(() => requirePermission(request)).toThrowError(expect.objectContaining({ code: 'FORBIDDEN', message: 'Operation is not permitted' }))
  })
})
