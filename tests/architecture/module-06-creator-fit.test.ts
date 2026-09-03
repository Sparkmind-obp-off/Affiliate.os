import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../..')

describe('Task 10 creator fit architecture', () => {
  it('adds one forward-only tenant-owned schema migration and minimal permissions', async () => {
    const sql = await readFile(path.join(ROOT, 'migrations/0007_module_06_creator_fit.sql'), 'utf8')
    expect(sql).toMatch(/CREATE SCHEMA module_06/i)
    expect(sql).toMatch(/CREATE TABLE module_06\.creator_profiles/i)
    expect(sql).toMatch(/workspace_id UUID NOT NULL REFERENCES module_15\.workspaces/i)
    expect(sql).toMatch(/UNIQUE \(workspace_id, creator_ref\)/i)
    expect(sql).toContain("'creator.read'")
    expect(sql).toContain("'creator.create'")
    expect(sql).not.toMatch(/ALTER TABLE module_05|UPDATE module_05/i)
  })

  it('keeps tenant filtering in Creator persistence as defense in depth', async () => {
    const repository = await readFile(path.join(
      ROOT,
      'src/modules/module-06-creator-fit/infrastructure/persistence/postgres-creator-repository.ts',
    ), 'utf8')
    expect(repository).toMatch(/WHERE workspace_id = \$1 AND id = \$2/)
    expect(repository).toMatch(/WHERE workspace_id = \$1 ORDER BY created_at/)
    expect(repository).toContain('profile.workspaceId')
  })

  it('reuses Modules 05, 15, and 16 only through their public contracts', async () => {
    const route = await readFile(path.join(
      ROOT,
      'src/modules/module-06-creator-fit/infrastructure/http/creator-routes.ts',
    ), 'utf8')
    expect(route).toContain("from '@modules/module-05-opportunity'")
    expect(route).toContain("from '@modules/module-15-identity'")
    expect(route).toContain("from '@modules/module-16-security'")
    expect(route).not.toMatch(/membership\.role\s*===/)
    expect(route).not.toMatch(/openai|tiktok api|scrap/i)
  })
})
