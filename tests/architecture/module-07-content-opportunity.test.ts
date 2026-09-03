import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../..')

describe('Task 11 content opportunity architecture', () => {
  it('adds forward-only tenant-owned migration 0008 with composite opportunity ownership', async () => {
    const sql = await readFile(path.join(ROOT, 'migrations/0008_module_07_content_opportunity.sql'), 'utf8')
    expect(sql).toMatch(/CREATE SCHEMA module_07/i)
    expect(sql).toMatch(/CREATE TABLE module_07\.content_opportunities/i)
    expect(sql).toMatch(/FOREIGN KEY \(workspace_id, opportunity_id\)/i)
    expect(sql).toContain("'content_opportunity.read'")
    expect(sql).toContain("'content_opportunity.create'")
    expect(sql).not.toMatch(/DROP TABLE|TRUNCATE|DELETE FROM|UPDATE module_0[4-6]/i)
  })

  it('keeps every content persistence lookup tenant-scoped and parameterized', async () => {
    const source = await readFile(path.join(ROOT, 'src/modules/module-07-content/infrastructure/persistence/postgres-content-opportunity-repository.ts'), 'utf8')
    expect(source).toMatch(/WHERE workspace_id = \$1 AND id = \$2/)
    expect(source).toMatch(/WHERE workspace_id = \$1 ORDER BY created_at/)
    expect(source).toContain('content.workspaceId')
    expect(source).not.toMatch(/WHERE id = \$1/)
  })

  it('uses only public module contracts and has no provider, scraping, or role shortcut', async () => {
    const files = [
      'src/modules/module-07-content/domain/content-opportunity.ts',
      'src/modules/module-07-content/domain/evaluation-policy.ts',
      'src/modules/module-07-content/application/content-opportunity-service.ts',
      'src/modules/module-07-content/infrastructure/http/content-opportunity-routes.ts',
    ]
    const source = (await Promise.all(files.map((file) => readFile(path.join(ROOT, file), 'utf8')))).join('\n')
    for (const module of ['module-04-demand', 'module-05-opportunity', 'module-06-creator-fit', 'module-15-identity', 'module-16-security']) {
      if (source.includes(module)) expect(source).toContain(`from '@modules/${module}'`)
    }
    expect(source).not.toMatch(/@modules\/module-[^'"\n]+\//)
    expect(source).not.toMatch(/membership\.role\s*===|role\s*===\s*['"]admin/)
    expect(source).not.toMatch(/openai|anthropic|gemini|serper|tiktok api|scrap|crawl/i)
    expect(source).toContain('evaluateCreatorFit')
  })

  it('centralizes a documented versioned 100-percent deterministic policy', async () => {
    const source = await readFile(path.join(ROOT, 'src/modules/module-07-content/domain/evaluation-policy.ts'), 'utf8')
    expect(source).toContain("CONTENT_OPPORTUNITY_POLICY_VERSION = 'content-opportunity-v1.0.0'")
    expect(source).toContain("'INSUFFICIENT_DATA'")
    expect(source).not.toMatch(/Math\.random|Date\.now|fetch\(/)
    const weights = [...source.matchAll(/^\s{2}(?:demand_alignment|audience_alignment|angle_strength|format_fit|creator_fit|execution_feasibility|evidence_quality): (\d+),$/gm)]
      .reduce((sum, match) => sum + Number(match[1]), 0)
    expect(weights).toBe(100)
  })
})
