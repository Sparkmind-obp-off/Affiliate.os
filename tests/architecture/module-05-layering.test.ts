import { describe, it, expect } from 'vitest'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

/**
 * Layering tests for the first implemented module (DOC 24 §316, §328, §344).
 *
 * The generic boundary suite proves that modules do not reach into each other.
 * This suite proves the INTERNAL layering of the implemented module, which is
 * where a modular monolith actually decays first:
 *
 *   http adapter → application → domain → (port) ← infrastructure
 *
 * A domain file that imports Hono, or an app-shell file that reaches past the
 * module's public contract, must fail the build rather than be discovered
 * later during a refactor.
 */

const ROOT = path.resolve(import.meta.dirname, '../..')
const MODULE_DIR = path.join(ROOT, 'src/modules/module-05-opportunity')

async function walk(dir: string): Promise<string[]> {
  const out: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full)))
    else if (entry.name.endsWith('.ts')) out.push(full)
  }
  return out
}

const IMPORT_RE = /(?:import|export)[\s\S]{0,200}?from\s+['"]([^'"]+)['"]/g

function importsOf(source: string): string[] {
  const specifiers: string[] = []
  for (const match of source.matchAll(IMPORT_RE)) {
    if (match[1]) specifiers.push(match[1])
  }
  return specifiers
}

async function filesIn(subdir: string): Promise<Array<{ path: string; source: string }>> {
  const dir = path.join(MODULE_DIR, subdir)
  const files = await walk(dir)
  return Promise.all(
    files.map(async (file) => ({
      path: path.relative(ROOT, file),
      source: await readFile(file, 'utf8'),
    })),
  )
}

describe('module-05: layer structure', () => {
  it('has the domain / application / infrastructure layers plus a public contract', async () => {
    for (const entry of ['domain', 'application', 'infrastructure', 'index.ts']) {
      const info = await stat(path.join(MODULE_DIR, entry)).catch(() => null)
      expect(info, `missing ${entry}`).not.toBeNull()
    }
  })

  it('reports itself as IMPLEMENTED through its public contract', async () => {
    const source = await readFile(path.join(MODULE_DIR, 'index.ts'), 'utf8')
    expect(source).toContain("MODULE_STATUS = 'IMPLEMENTED'")
  })
})

describe('module-05: dependency direction (DOC 24 §328)', () => {
  it('the domain layer imports no framework, transport or driver', async () => {
    const forbidden = ['hono', 'pg', 'zod', 'node:', '@hono/']
    const violations: string[] = []

    for (const file of await filesIn('domain')) {
      for (const specifier of importsOf(file.source)) {
        if (forbidden.some((f) => specifier === f || specifier.startsWith(f))) {
          violations.push(`${file.path} → ${specifier}`)
        }
      }
    }

    expect(
      violations,
      `the domain layer must stay pure:\n${violations.join('\n')}`,
    ).toEqual([])
  })

  it('the domain layer never imports the application or infrastructure layer', async () => {
    const violations: string[] = []
    for (const file of await filesIn('domain')) {
      for (const specifier of importsOf(file.source)) {
        if (/(^|\/)(application|infrastructure)\//.test(specifier)) {
          violations.push(`${file.path} → ${specifier}`)
        }
      }
    }
    expect(violations, `inverted dependency:\n${violations.join('\n')}`).toEqual([])
  })

  it('the application layer never imports the infrastructure layer or a transport', async () => {
    const violations: string[] = []
    for (const file of await filesIn('application')) {
      for (const specifier of importsOf(file.source)) {
        if (specifier === 'hono' || specifier.startsWith('hono/')) {
          violations.push(`${file.path} → ${specifier} (transport in the application layer)`)
        }
        if (/(^|\/)infrastructure\//.test(specifier)) {
          violations.push(`${file.path} → ${specifier} (application depends on infrastructure)`)
        }
      }
    }
    expect(violations, `layer violation:\n${violations.join('\n')}`).toEqual([])
  })

  it('the HTTP adapter contains no business rule of its own', async () => {
    const adapters = await filesIn('infrastructure/http')
    expect(adapters.length).toBeGreaterThan(0)

    for (const file of adapters) {
      // Scoring/decision constants must live in the domain, never in a controller.
      expect(file.source, `${file.path} recomputes a weight`).not.toMatch(
        /0\.20|0\.15\s*\*|weight\s*[:=]\s*0\./,
      )
      // The controller must reach the domain only for serialization-level data.
      const domainImports = importsOf(file.source).filter((s) => s.includes('/domain/'))
      const allowed = file.path.endsWith('opportunity-routes.ts')
        ? ['../../domain/model-descriptor.js']
        : []
      expect(domainImports, `${file.path} imports domain internals beyond the disclosed model`).toEqual(
        allowed,
      )
    }
  })

  it('isolates PostgreSQL in the infrastructure layer without forbidden fallback stores', async () => {
    const infrastructure = await filesIn('infrastructure')
    const forbidden: string[] = []
    for (const file of infrastructure) {
      for (const specifier of importsOf(file.source)) {
        if (/^(better-sqlite3|sqlite3|lowdb|@libsql)/.test(specifier)) {
          forbidden.push(`${file.path} → ${specifier}`)
        }
      }
      expect(file.source, `${file.path} declares a D1/KV binding`).not.toMatch(/D1Database|KVNamespace/)
    }
    expect(forbidden).toEqual([])
    expect(infrastructure.some((file) => importsOf(file.source).includes('pg'))).toBe(true)
  })
})

describe('module-05: mounting through the public contract', () => {
  it('the app shell imports the router from the module contract, not from its internals', async () => {
    const source = await readFile(path.join(ROOT, 'src/app/routes/api-v1.ts'), 'utf8')
    expect(source).toContain("from '@modules/module-05-opportunity'")
    expect(source).not.toMatch(/module-05-opportunity\/(domain|application|infrastructure)/)
  })

  it('mounts the router under the v1 boundary at the path the registry assigns it', async () => {
    const source = await readFile(path.join(ROOT, 'src/app/routes/api-v1.ts'), 'utf8')
    expect(source).toMatch(/apiV1\.route\('\/affiliate', opportunityRoutes\)/)
  })

  it('does not report a mounted router as pending', async () => {
    const { API_V1_MOUNTED_ROUTERS, API_V1_PENDING_ROUTERS } = await import(
      '../../src/app/routes/api-v1.js'
    )
    const mounted = new Set(API_V1_MOUNTED_ROUTERS.map((r) => r.path))
    for (const pending of API_V1_PENDING_ROUTERS) {
      expect(mounted.has(pending.path), `${pending.path} is both mounted and pending`).toBe(false)
    }
  })
})
