#!/usr/bin/env node
/**
 * PostgreSQL migration runner (foundation).
 *
 * Design rules:
 *  - forward-only, one transaction per migration;
 *  - applied migrations are checksum-verified to detect drift;
 *  - the runner NEVER prints DATABASE_URL or any credential;
 *  - `status` works offline for the file listing but requires a database
 *    connection to report what is actually applied — it never guesses.
 *
 * Usage:
 *   node scripts/migrate.mjs status
 *   node scripts/migrate.mjs up
 */
import { readdir, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const MIGRATIONS_DIR = path.join(ROOT, 'migrations')
const FILE_RE = /^(\d{4})_[a-z0-9_]+\.sql$/

const MIGRATIONS_TABLE_DDL = `
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version      VARCHAR(20) PRIMARY KEY,
  name         TEXT        NOT NULL,
  checksum     CHAR(64)    NOT NULL,
  applied_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`

function sha256(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

async function loadMigrationFiles() {
  const entries = await readdir(MIGRATIONS_DIR)
  const files = entries.filter((f) => FILE_RE.test(f)).sort()

  const seen = new Set()
  const migrations = []
  for (const file of files) {
    const version = FILE_RE.exec(file)[1]
    if (seen.has(version)) {
      throw new Error(`Duplicate migration version detected: ${version}`)
    }
    seen.add(version)
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
    migrations.push({ version, name: file, sql, checksum: sha256(sql) })
  }
  return migrations
}

function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('ERROR: DATABASE_URL is not set. Cannot reach PostgreSQL.')
    console.error('       Set it in your environment (see .env.example). NOT_CONFIGURED.')
    process.exit(2)
  }
  if (!/^postgres(ql)?:\/\//.test(url)) {
    console.error('ERROR: DATABASE_URL must be a PostgreSQL connection string.')
    process.exit(2)
  }
  return url
}

async function connect() {
  const connectionString = requireDatabaseUrl()
  let pg
  try {
    pg = await import('pg')
  } catch {
    console.error('ERROR: the "pg" package is not installed. Run: npm install')
    process.exit(2)
  }
  const client = new pg.default.Client({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  })
  await client.connect()
  return client
}

async function readApplied(client) {
  await client.query(MIGRATIONS_TABLE_DDL)
  const res = await client.query(
    'SELECT version, name, checksum, applied_at FROM public.schema_migrations ORDER BY version',
  )
  return new Map(res.rows.map((r) => [r.version, r]))
}

function assertNoDrift(migrations, applied) {
  for (const migration of migrations) {
    const record = applied.get(migration.version)
    if (record && record.checksum !== migration.checksum) {
      throw new Error(
        `Migration ${migration.name} was modified after being applied ` +
          `(checksum mismatch). Applied migrations are immutable — add a new migration instead.`,
      )
    }
  }
}

async function commandStatus() {
  const migrations = await loadMigrationFiles()
  const client = await connect()
  try {
    const applied = await readApplied(client)
    assertNoDrift(migrations, applied)
    console.log('version  status    name')
    for (const m of migrations) {
      const state = applied.has(m.version) ? 'APPLIED' : 'PENDING'
      console.log(`${m.version}     ${state.padEnd(9)} ${m.name}`)
    }
    const pending = migrations.filter((m) => !applied.has(m.version)).length
    console.log(`\ntotal=${migrations.length} pending=${pending}`)
  } finally {
    await client.end()
  }
}

async function commandUp() {
  const migrations = await loadMigrationFiles()
  const client = await connect()
  try {
    // Serialize concurrent deploy runners. The session-scoped lock is released
    // automatically when the client closes, including failure paths.
    await client.query("SELECT pg_advisory_lock(hashtext('affiliate-os:migrations'))")
    const applied = await readApplied(client)
    assertNoDrift(migrations, applied)

    const pending = migrations.filter((m) => !applied.has(m.version))
    if (pending.length === 0) {
      console.log('No pending migrations. Database schema is up to date.')
      return
    }

    for (const migration of pending) {
      console.log(`applying ${migration.name} ...`)
      try {
        await client.query('BEGIN')
        await client.query(migration.sql)
        await client.query(
          'INSERT INTO public.schema_migrations (version, name, checksum) VALUES ($1, $2, $3)',
          [migration.version, migration.name, migration.checksum],
        )
        await client.query('COMMIT')
        console.log(`  ✓ ${migration.name}`)
      } catch (error) {
        await client.query('ROLLBACK')
        throw new Error(`migration ${migration.name} failed and was rolled back: ${error.message}`)
      }
    }
    console.log(`\napplied ${pending.length} migration(s).`)
  } finally {
    await client.end()
  }
}

const command = process.argv[2] ?? 'status'
const commands = { status: commandStatus, up: commandUp }

if (!commands[command]) {
  console.error(`Unknown command "${command}". Expected: status | up`)
  process.exit(1)
}

commands[command]().catch((error) => {
  // Never print the connection string / credentials.
  console.error(`MIGRATION ERROR: ${error.message}`)
  process.exit(1)
})
