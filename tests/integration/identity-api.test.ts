import { describe, expect, it } from 'vitest'
import { createApp } from '../../src/app/create-app.js'
import type { ExternalIdentityAuthenticator, IdentityContextRepository, ResolvedIdentityContext } from '@modules/module-15-identity'

const context: ResolvedIdentityContext = {
  authenticatedIdentity: { provider: 'clerk', subject: 'user_api_test' },
  account: { id: 'account-a', displayName: 'Account', status: 'active', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  workspace: { id: 'workspace-a', name: 'Workspace', slug: 'workspace-a', ownerAccountId: 'account-a', status: 'active', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  membership: { id: 'membership-a', workspaceId: 'workspace-a', accountId: 'account-a', role: 'owner', status: 'active', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
}

const repository: IdentityContextRepository = { resolveOrProvision: async () => context }
const authenticator: ExternalIdentityAuthenticator = {
  authenticate: async (authorization) => {
    if (authorization !== 'Bearer valid') throw new Error('unauthenticated')
    return context.authenticatedIdentity
  },
}
const app = createApp()
const env = { NODE_ENV: 'test', LOG_LEVEL: 'error', IDENTITY_REPOSITORY: repository, IDENTITY_AUTHENTICATOR: authenticator }

describe('Task 06 identity API', () => {
  it('returns current identity, account, workspace and membership context', async () => {
    const response = await app.request('http://localhost/api/v1/identity/context', { headers: { authorization: 'Bearer valid' } }, env)
    expect(response.status).toBe(200)
    expect((await response.json()) as { data: ResolvedIdentityContext }).toMatchObject({ data: context })
  })

  it.each([
    ['/api/v1/identity/account/me', 'account'],
    ['/api/v1/identity/workspace/current', 'workspace'],
    ['/api/v1/identity/membership/current', 'membership'],
  ])('serves %s through the authenticated context boundary', async (path, key) => {
    const response = await app.request(`http://localhost${path}`, { headers: { authorization: 'Bearer valid' } }, env)
    expect(response.status).toBe(200)
    expect(((await response.json()) as { data: Record<string, unknown> }).data[key]).toBeTruthy()
  })
})
