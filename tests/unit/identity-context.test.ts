import { describe, expect, it } from 'vitest'
import { resolveIdentityContext, type AuthenticatedIdentity, type IdentityContextRepository, type ResolvedIdentityContext } from '@modules/module-15-identity'

const identity: AuthenticatedIdentity = { provider: 'clerk', subject: 'user_task06' }
const context: ResolvedIdentityContext = {
  authenticatedIdentity: identity,
  account: { id: 'a', displayName: 'Account', status: 'active', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  workspace: { id: 'w', name: 'Workspace', slug: 'workspace-a', ownerAccountId: 'a', status: 'active', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  membership: { id: 'm', workspaceId: 'w', accountId: 'a', role: 'owner', status: 'active', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
}

class AtomicMemoryRepository implements IdentityContextRepository {
  private provisioned: Promise<ResolvedIdentityContext> | null = null
  calls = 0
  resolveOrProvision(): Promise<ResolvedIdentityContext> {
    this.calls += 1
    this.provisioned ??= Promise.resolve(context)
    return this.provisioned
  }
}

describe('Task 06 identity and tenancy context', () => {
  it('resolves an authenticated identity to account, workspace and owner membership', async () => {
    await expect(resolveIdentityContext(identity, new AtomicMemoryRepository())).resolves.toEqual(context)
  })

  it('rejects invalid identity and suspended account or tenancy states', async () => {
    await expect(resolveIdentityContext({ provider: 'clerk', subject: '!' }, new AtomicMemoryRepository())).rejects.toMatchObject({ code: 'AUTH_REQUIRED' })
    const suspended: IdentityContextRepository = { resolveOrProvision: async () => ({ ...context, account: { ...context.account, status: 'suspended' } }) }
    await expect(resolveIdentityContext(identity, suspended)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    const wrongTenant: IdentityContextRepository = { resolveOrProvision: async () => ({ ...context, membership: { ...context.membership, workspaceId: 'other' } }) }
    await expect(resolveIdentityContext(identity, wrongTenant)).rejects.toMatchObject({ code: 'INTERNAL_ERROR' })
  })

  it('keeps concurrent first-login resolution deterministic', async () => {
    const repository = new AtomicMemoryRepository()
    const results = await Promise.all(Array.from({ length: 20 }, () => resolveIdentityContext(identity, repository)))
    expect(new Set(results.map((item) => item.account.id))).toEqual(new Set(['a']))
    expect(new Set(results.map((item) => item.workspace.id))).toEqual(new Set(['w']))
    expect(new Set(results.map((item) => item.membership.id))).toEqual(new Set(['m']))
  })
})
