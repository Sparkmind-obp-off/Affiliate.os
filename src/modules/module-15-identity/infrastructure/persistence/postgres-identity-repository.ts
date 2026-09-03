import type { Pool, PoolClient } from 'pg'
import { AppError } from '../../../../shared/errors/app-error.js'
import type { IdentityContextRepository } from '../../application/ports.js'
import type { AuthenticatedIdentity, ResolvedIdentityContext } from '../../domain/models.js'

type ContextRow = {
  provider: string; provider_subject: string
  account_id: string; display_name: string; account_status: string; account_created_at: Date | string; account_updated_at: Date | string
  workspace_id: string; workspace_name: string; workspace_slug: string; owner_account_id: string; workspace_status: string; workspace_created_at: Date | string; workspace_updated_at: Date | string
  membership_id: string; membership_role: string; membership_status: string; membership_created_at: Date | string; membership_updated_at: Date | string
}

const CONTEXT_SQL = `
SELECT i.provider, i.provider_subject,
  a.id AS account_id, a.display_name, a.status AS account_status, a.created_at AS account_created_at, a.updated_at AS account_updated_at,
  w.id AS workspace_id, w.name AS workspace_name, w.slug AS workspace_slug, w.owner_account_id, w.status AS workspace_status, w.created_at AS workspace_created_at, w.updated_at AS workspace_updated_at,
  m.id AS membership_id, m.role AS membership_role, m.status AS membership_status, m.created_at AS membership_created_at, m.updated_at AS membership_updated_at
FROM module_15.identities i
JOIN module_15.accounts a ON a.id = i.account_id
JOIN module_15.workspace_memberships m ON m.account_id = a.id
JOIN module_15.workspaces w ON w.id = m.workspace_id
WHERE i.provider = $1 AND i.provider_subject = $2
ORDER BY CASE WHEN m.role = 'owner' THEN 0 ELSE 1 END, m.created_at
LIMIT 1`

export class PostgresIdentityContextRepository implements IdentityContextRepository {
  constructor(private readonly pool: Pick<Pool, 'connect'>) {}

  async resolveOrProvision(identity: AuthenticatedIdentity): Promise<ResolvedIdentityContext> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${identity.provider}:${identity.subject}`])
      let row = await findContext(client, identity)
      if (!row) {
        const existingIdentity = await client.query<{ id: string }>(
          `SELECT id FROM module_15.identities
           WHERE provider = $1 AND provider_subject = $2 LIMIT 1`,
          [identity.provider, identity.subject],
        )
        if (existingIdentity.rows[0]) {
          throw AppError.tenantAccessDenied('Workspace membership is not available')
        }
        const account = await client.query<{ id: string }>(
          `INSERT INTO module_15.accounts (display_name) VALUES ($1) RETURNING id`,
          ['Affiliate OS account'],
        )
        const accountId = required(account.rows[0]?.id)
        const workspace = await client.query<{ id: string }>(
          `INSERT INTO module_15.workspaces (name, slug, owner_account_id)
           VALUES ($1, 'workspace-' || replace(gen_random_uuid()::text, '-', ''), $2) RETURNING id`,
          ['My Workspace', accountId],
        )
        const workspaceId = required(workspace.rows[0]?.id)
        await client.query(
          `INSERT INTO module_15.identities (provider, provider_subject, account_id) VALUES ($1, $2, $3)`,
          [identity.provider, identity.subject, accountId],
        )
        await client.query(
          `INSERT INTO module_15.workspace_memberships (workspace_id, account_id, role) VALUES ($1, $2, 'owner')`,
          [workspaceId, accountId],
        )
        row = await findContext(client, identity)
      }
      if (!row) throw AppError.internal('Identity provisioning did not produce a context')
      await client.query('COMMIT')
      return mapContext(row)
    } catch (error) {
      await rollback(client)
      if (error instanceof AppError) throw error
      if (isPgCode(error, '23505')) throw AppError.conflict('Identity or membership already exists')
      if (isPgCode(error, '23503')) throw AppError.notFound('Required account or workspace does not exist')
      throw AppError.internal('Identity persistence failed', error)
    } finally {
      client.release()
    }
  }
}

async function findContext(client: PoolClient, identity: AuthenticatedIdentity): Promise<ContextRow | null> {
  const result = await client.query<ContextRow>(CONTEXT_SQL, [identity.provider, identity.subject])
  return result.rows[0] ?? null
}

async function rollback(client: PoolClient): Promise<void> {
  try { await client.query('ROLLBACK') } catch { /* original error wins */ }
}

function required(value: string | undefined): string {
  if (!value) throw AppError.internal('Database did not return a generated identifier')
  return value
}
function isPgCode(error: unknown, code: string): boolean {
  return !!error && typeof error === 'object' && 'code' in error && error.code === code
}
function iso(value: Date | string): string { return (value instanceof Date ? value : new Date(value)).toISOString() }
function mapContext(row: ContextRow): ResolvedIdentityContext {
  if (row.provider !== 'clerk' || !['active', 'suspended'].includes(row.account_status) || !['active', 'suspended'].includes(row.workspace_status) || !['active', 'suspended'].includes(row.membership_status) || !['owner', 'admin', 'member'].includes(row.membership_role)) {
    throw AppError.internal('Stored identity context is invalid')
  }
  return {
    authenticatedIdentity: { provider: 'clerk', subject: row.provider_subject },
    account: { id: row.account_id, displayName: row.display_name, status: row.account_status as 'active' | 'suspended', createdAt: iso(row.account_created_at), updatedAt: iso(row.account_updated_at) },
    workspace: { id: row.workspace_id, name: row.workspace_name, slug: row.workspace_slug, ownerAccountId: row.owner_account_id, status: row.workspace_status as 'active' | 'suspended', createdAt: iso(row.workspace_created_at), updatedAt: iso(row.workspace_updated_at) },
    membership: { id: row.membership_id, workspaceId: row.workspace_id, accountId: row.account_id, role: row.membership_role as 'owner' | 'admin' | 'member', status: row.membership_status as 'active' | 'suspended', createdAt: iso(row.membership_created_at), updatedAt: iso(row.membership_updated_at) },
  }
}
