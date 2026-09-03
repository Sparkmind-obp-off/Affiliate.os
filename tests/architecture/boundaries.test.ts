import { describe, it, expect } from 'vitest'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

/**
 * Architecture tests (DOC 24 §344).
 *
 * CI must verify:
 *   NO CROSS-MODULE INTERNAL IMPORT
 *   NO DIRECT CROSS-MODULE DB ACCESS
 *   PUBLIC API ONLY
 *   NO SECRET IN SOURCE
 *   NO FORBIDDEN DEPENDENCY
 *
 * A boundary violation must FAIL the build.
 */

const ROOT = path.resolve(import.meta.dirname, '../..')
const SRC = path.join(ROOT, 'src')
const MODULES = path.join(SRC, 'modules')

async function walk(dir: string, exts = ['.ts', '.tsx']): Promise<string[]> {
  const out: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full, exts)))
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(full)
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

describe('architecture: module boundaries', () => {
  it('every module exposes a public contract (index.ts)', async () => {
    const modules = await readdir(MODULES, { withFileTypes: true })
    const dirs = modules.filter((m) => m.isDirectory()).map((m) => m.name)
    expect(dirs.length).toBeGreaterThan(0)

    for (const dir of dirs) {
      const indexPath = path.join(MODULES, dir, 'index.ts')
      const info = await stat(indexPath).catch(() => null)
      expect(info, `module "${dir}" is missing its public contract index.ts`).not.toBeNull()
    }
  })

  it('modules are named following the locked registry convention', async () => {
    const modules = await readdir(MODULES, { withFileTypes: true })
    for (const entry of modules.filter((m) => m.isDirectory())) {
      expect(entry.name, `invalid module folder name "${entry.name}"`).toMatch(
        /^module-\d{2}-[a-z][a-z-]*$/,
      )
    }
  })

  it('no module reaches into another module internals', async () => {
    const files = await walk(SRC)
    const violations: string[] = []

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      const relative = path.relative(ROOT, file)
      const ownModule = relative.startsWith('src/modules/')
        ? relative.split(path.sep)[2]
        : null

      for (const specifier of importsOf(source)) {
        // Alias form: '@modules/<module>' is legal, '@modules/<module>/<deep>' is not.
        const alias = /^@modules\/([^/]+)(\/.+)?$/.exec(specifier)
        if (alias) {
          const target = alias[1]
          if (alias[2] && target !== ownModule) {
            violations.push(`${relative} → ${specifier} (deep import into "${target}")`)
          }
          continue
        }

        // Relative form: a relative path may never leave the owning module.
        // Cross-module access must go through the '@modules/<module>' alias so
        // the dependency is explicit and greppable.
        if (specifier.startsWith('.')) {
          const resolved = path.relative(ROOT, path.resolve(path.dirname(file), specifier))
          const other = /^src[/\\]modules[/\\]([^/\\]+)[/\\]/.exec(resolved)
          if (other && other[1] !== ownModule) {
            violations.push(
              `${relative} → ${specifier} (relative path crosses into "${other[1]}"; ` +
                `use the @modules/${other[1]} public contract instead)`,
            )
          }
        }
      }
    }

    expect(violations, `cross-module internal imports detected:\n${violations.join('\n')}`).toEqual(
      [],
    )
  })

  it('shared infrastructure never depends on a business module', async () => {
    const files = await walk(path.join(SRC, 'shared'))
    const violations: string[] = []
    for (const file of files) {
      const source = await readFile(file, 'utf8')
      for (const specifier of importsOf(source)) {
        if (specifier.includes('@modules/') || specifier.includes('modules/module-')) {
          violations.push(`${path.relative(ROOT, file)} → ${specifier}`)
        }
      }
    }
    expect(violations, `shared → module dependency detected:\n${violations.join('\n')}`).toEqual([])
  })

  it('no hidden global business layer exists', async () => {
    const forbidden = [
      'src/services/everything.ts',
      'src/utils/businessLogic.ts',
      'src/helpers/allModules.ts',
      'src/services',
      'src/helpers',
    ]
    for (const candidate of forbidden) {
      const info = await stat(path.join(ROOT, candidate)).catch(() => null)
      expect(info, `forbidden global business layer present: ${candidate}`).toBeNull()
    }
  })
})

describe('architecture: Cloudflare runtime build', () => {
  it('resolves workerd-specific package exports for PostgreSQL TCP support', async () => {
    const viteConfig = await readFile(path.join(ROOT, 'vite.config.ts'), 'utf8')
    expect(viteConfig).toMatch(/conditions:\s*\[[^\]]*['"]workerd['"]/)
    expect(viteConfig).toMatch(/external:\s*\[[^\]]*['"]cloudflare:sockets['"]/)
  })
})

describe('architecture: forbidden dependencies', () => {
  it('does not depend on a forbidden database driver or premature infrastructure', async () => {
    const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })

    // SQLite / in-memory databases are forbidden as production persistence.
    const forbidden = [
      'sqlite3',
      'better-sqlite3',
      'lowdb',
      'nedb',
      'mongodb',
      'mysql',
      'mysql2',
      // premature distributed infrastructure (Task 01 §34)
      'kafkajs',
      'node-rdkafka',
    ]
    for (const name of forbidden) {
      expect(deps, `forbidden dependency "${name}" present`).not.toContain(name)
    }
  })

  it('keeps PostgreSQL as the only relational driver', async () => {
    const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(deps).toContain('pg')
  })
})

describe('architecture: secret hygiene', () => {
  it('contains no hardcoded secrets in source', async () => {
    const files = [
      ...(await walk(SRC)),
      ...(await walk(path.join(ROOT, 'scripts'), ['.mjs'])),
    ]

    // Patterns for actual credential material, not for the names of env vars.
    const patterns: Array<{ label: string; re: RegExp }> = [
      { label: 'live postgres credentials', re: /postgres(?:ql)?:\/\/[^\s'"/]+:[^\s'"@]+@(?!host|HOST)/ },
      { label: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
      { label: 'private key block', re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
      { label: 'github token', re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
      { label: 'slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
      { label: 'assigned secret literal', re: /(?:AUTH_SECRET|API_KEY|CLOUDFLARE_API_TOKEN)\s*[:=]\s*['"][A-Za-z0-9+/=_-]{24,}['"]/ },
    ]

    const violations: string[] = []
    for (const file of files) {
      const source = await readFile(file, 'utf8')
      for (const { label, re } of patterns) {
        if (re.test(source)) {
          violations.push(`${path.relative(ROOT, file)}: ${label}`)
        }
      }
    }
    expect(violations, `possible secrets in source:\n${violations.join('\n')}`).toEqual([])
  })

  it('rejects credential-like upload artifacts at the repository root', async () => {
    const entries = await readdir(ROOT)
    const forbiddenName = /(?:\.gnspark$|gnspark.*\.txt$|credential.*\.txt$|api[._-]?key.*\.txt$|secret.*\.txt$|token.*\.txt$)/i
    const violations = entries.filter((entry) => forbiddenName.test(entry))
    expect(violations, `credential-like root artifacts detected: ${violations.join(', ')}`).toEqual([])
  })

  it('gitignores every secret-bearing file', async () => {
    const gitignore = await readFile(path.join(ROOT, '.gitignore'), 'utf8')
    for (const entry of [
      '.env',
      '.dev.vars',
      '*.pem',
      '*.key',
      '*credential*.txt',
      '*api-key*.txt',
      '*api.key*.txt',
      '*secret*.txt',
      '*token*.txt',
      '*.gnspark',
      '*gnspark*.txt',
      'node_modules/',
    ]) {
      expect(gitignore, `.gitignore missing "${entry}"`).toContain(entry)
    }
  })

  it('.env.example carries no real credential values', async () => {
    const example = await readFile(path.join(ROOT, '.env.example'), 'utf8')
    expect(example).not.toMatch(/\bAKIA[0-9A-Z]{16}\b/)
    expect(example).not.toMatch(/\bgh[pousr]_[A-Za-z0-9]{20,}\b/)
    // The DB placeholder must stay a placeholder.
    expect(example).toMatch(/DATABASE_URL=postgresql:\/\/USER:PASSWORD@HOST/)
  })
})

describe('architecture: database policy', () => {
  it('migrations are forward-only, uniquely versioned SQL files', async () => {
    const dir = path.join(ROOT, 'migrations')
    const files = (await readdir(dir)).filter((f) => f.endsWith('.sql'))
    expect(files.length).toBeGreaterThan(0)

    const versions = new Set<string>()
    for (const file of files) {
      const match = /^(\d{4})_[a-z0-9_]+\.sql$/.exec(file)
      expect(match, `migration "${file}" violates the NNNN_snake_case.sql convention`).not.toBeNull()
      const version = match![1]!
      expect(versions.has(version), `duplicate migration version ${version}`).toBe(false)
      versions.add(version)
    }
  })

  it('the foundation migration creates the module schemas from DOC 21', async () => {
    const sql = await readFile(
      path.join(ROOT, 'migrations', '0001_extensions_and_schemas.sql'),
      'utf8',
    )
    expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS pgcrypto')
    for (const schema of ['module_05', 'module_14', 'module_15', 'module_16', 'module_17', 'module_19']) {
      expect(sql).toContain(`CREATE SCHEMA IF NOT EXISTS ${schema}`)
    }
    // Task 01 boundary: schemas only, no tables yet.
    expect(sql).not.toMatch(/CREATE TABLE/i)
  })
})
