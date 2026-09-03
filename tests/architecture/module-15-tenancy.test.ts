import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../..')

describe('Task 06 database tenancy invariants', () => {
  it('enforces identity, workspace, membership, and ownership constraints', async () => {
    const sql = await readFile(path.join(ROOT, 'migrations/0003_module_15_identity_tenancy.sql'), 'utf8')
    expect(sql).toMatch(/UNIQUE\s*\(provider, provider_subject\)/i)
    expect(sql).toMatch(/slug VARCHAR\(128\) NOT NULL UNIQUE/i)
    expect(sql).toMatch(/owner_account_id UUID NOT NULL REFERENCES module_15\.accounts\(id\)/i)
    expect(sql).toMatch(/UNIQUE\s*\(workspace_id, account_id\)/i)
    expect(sql).toMatch(/FOREIGN KEY \(workspace_id\) REFERENCES module_15\.workspaces\(id\)/i)
  })

  it('keeps provisioning transactional and serialized by external identity', async () => {
    const source = await readFile(path.join(ROOT, 'src/modules/module-15-identity/infrastructure/persistence/postgres-identity-repository.ts'), 'utf8')
    expect(source).toContain("client.query('BEGIN')")
    expect(source).toContain('pg_advisory_xact_lock')
    expect(source).toContain("client.query('COMMIT')")
    expect(source).toContain("client.query('ROLLBACK')")
  })
})
