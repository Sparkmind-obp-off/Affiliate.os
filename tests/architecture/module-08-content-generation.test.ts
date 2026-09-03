import { describe, expect, it } from 'vitest'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../..')
const MODULE = path.join(ROOT, 'src/modules/module-08-content-generation')

describe('Task 12 content generation architecture', () => {
  it('establishes a public Module 08 generation boundary without replacing deferred distribution', async () => {
    expect(await stat(path.join(MODULE, 'index.ts'))).toBeDefined()
    expect(await stat(path.join(ROOT, 'src/modules/module-08-distribution/index.ts'))).toBeDefined()
    const publicContract = await readFile(path.join(MODULE, 'index.ts'), 'utf8')
    expect(publicContract).toContain("MODULE_ID = 'module-08-content-generation'")
    expect(publicContract).toContain('GenerationProvider')
  })

  it('adds forward-only migration 0009 with tenant ownership, provenance, and permissions', async () => {
    const sql = await readFile(path.join(ROOT, 'migrations/0009_module_08_content_generation.sql'), 'utf8')
    expect(sql).toMatch(/CREATE SCHEMA module_08/i)
    expect(sql).toMatch(/CREATE TABLE module_08\.content_generations/i)
    expect(sql).toMatch(/FOREIGN KEY \(workspace_id, content_opportunity_id\)/i)
    expect(sql).toMatch(/FOREIGN KEY \(workspace_id, creator_id\)/i)
    expect(sql).toContain('input_fingerprint')
    expect(sql).toContain('output_fingerprint')
    expect(sql).toContain("'content_generation.read'")
    expect(sql).toContain("'content_generation.create'")
    expect(sql).toContain("'content_generation.update'")
    expect(sql).not.toMatch(/DROP TABLE|TRUNCATE|DELETE FROM|UPDATE module_0[4-7]/i)
  })

  it('keeps persistence tenant-scoped and parameterized', async () => {
    const source = await readFile(path.join(MODULE, 'infrastructure/persistence/postgres-content-generation-repository.ts'), 'utf8')
    expect(source).toMatch(/WHERE workspace_id = \$1 AND id = \$2/)
    expect(source).toMatch(/WHERE workspace_id = \$1 ORDER BY created_at/)
    expect(source).toMatch(/WHERE workspace_id=\$1 AND id=\$2 AND status=\$3/)
    expect(source).not.toMatch(/WHERE id = \$1/)
  })

  it('consumes only public Module 06/07/15/16 contracts and has no vendor or publishing coupling', async () => {
    const files = [
      'domain/content-generation.ts',
      'domain/generation-policy.ts',
      'application/content-generation-service.ts',
      'infrastructure/http/content-generation-routes.ts',
    ]
    const source = (await Promise.all(files.map((file) => readFile(path.join(MODULE, file), 'utf8')))).join('\n')
    for (const module of ['module-06-creator-fit', 'module-07-content', 'module-15-identity', 'module-16-security']) {
      if (source.includes(module)) expect(source).toContain(`from '@modules/${module}'`)
    }
    expect(source).not.toMatch(/@modules\/module-[^'"\n]+\//)
    expect(source).not.toMatch(/membership\.role\s*===|role\s*===\s*['"]admin/)
    expect(source).not.toMatch(/openai|anthropic|gemini|deepseek|genspark|tiktok|instagram|youtube|publish|schedule/i)
  })

  it('centralizes versioned deterministic policy and provider abstraction', async () => {
    const policy = await readFile(path.join(MODULE, 'domain/generation-policy.ts'), 'utf8')
    const ports = await readFile(path.join(MODULE, 'application/ports.ts'), 'utf8')
    expect(policy).toContain("CONTENT_GENERATION_POLICY_VERSION = 'content-generation-v1.0.0'")
    expect(policy).toContain("DRAFT: ['REQUESTED']")
    expect(policy).not.toMatch(/Math\.random|Date\.now|fetch\(/)
    expect(ports).toContain('export interface GenerationProvider')
    expect(ports).toContain('class UnavailableGenerationProvider')
  })
})
