import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../..')

describe('Task 07 authorization architecture', () => {
  it('uses a forward-only role migration that preserves owner memberships', async () => {
    const sql = await readFile(path.join(ROOT, 'migrations/0004_module_16_authorization_rbac.sql'), 'utf8')
    expect(sql).toMatch(/CHECK\s*\(role IN \('owner', 'admin', 'member'\)\)/i)
    expect(sql).toMatch(/CREATE TABLE module_16\.permissions/i)
    expect(sql).toMatch(/PRIMARY KEY/i)
    expect(sql).toMatch(/CREATE INDEX idx_module_15_memberships_workspace_role_status/i)
    expect(sql).not.toMatch(/UPDATE\s+module_15\.workspace_memberships/i)
  })

  it('keeps role matrices out of opportunity route handlers', async () => {
    const route = await readFile(
      path.join(ROOT, 'src/modules/module-05-opportunity/infrastructure/http/opportunity-routes.ts'),
      'utf8',
    )
    expect(route).toContain("from '@modules/module-16-security'")
    expect(route).toContain("authenticate(c, 'opportunity.create')")
    expect(route).toContain("authenticate(c, 'opportunity.read')")
    expect(route).not.toMatch(/membership\.role\s*===/)
  })

  it('keeps tenant filtering in the repository as defense in depth', async () => {
    const repository = await readFile(
      path.join(ROOT, 'src/modules/module-05-opportunity/infrastructure/persistence/postgres-opportunity-repository.ts'),
      'utf8',
    )
    expect(repository).toMatch(/WHERE workspace_id = \$1 AND candidate_ref = \$2/)
    expect(repository).toMatch(/WHERE workspace_id = \$1 ORDER BY created_at/)
    expect(repository).toMatch(/INSERT INTO module_05\.opportunities/)
    expect(repository).toContain('record.workspaceId')
  })
})
