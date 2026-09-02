import { describe, it, expect } from 'vitest'
import {
  loadConfig,
  ConfigError,
  isPostgresUrl,
  DIAGNOSTIC_ENVS,
} from '../../src/shared/config/env.js'

describe('shared/config/env', () => {
  it('applies safe defaults for an empty environment', () => {
    const config = loadConfig({})
    expect(config.nodeEnv).toBe('development')
    expect(config.isProduction).toBe(false)
    expect(config.databaseUrl).toBeNull()
    expect(config.authSecret).toBeNull()
  })

  it('accepts a PostgreSQL connection string', () => {
    const config = loadConfig({
      DATABASE_URL: 'postgresql://user:pw@localhost:5432/affiliate_os',
    })
    expect(config.databaseUrl).toContain('postgresql://')
  })

  it('rejects a non-PostgreSQL database (SQLite is forbidden)', () => {
    expect(() => loadConfig({ DATABASE_URL: 'file:./dev.db' })).toThrow(ConfigError)
    expect(() => loadConfig({ DATABASE_URL: 'sqlite://local.db' })).toThrow(ConfigError)
    expect(() => loadConfig({ DATABASE_URL: 'mysql://localhost/db' })).toThrow(ConfigError)
  })

  it('refuses to boot production without critical secrets', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(ConfigError)

    expect(() =>
      loadConfig({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://u:p@h:5432/db',
      }),
    ).toThrow(/AUTH_SECRET is required/)
  })

  it('boots production when configuration is complete', () => {
    const config = loadConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://u:p@h:5432/db',
      AUTH_SECRET: 'a-locally-generated-secret',
      APP_URL: 'https://affiliate-os.example.com',
      API_URL: 'https://affiliate-os.example.com/api/v1',
    })
    expect(config.isProduction).toBe(true)
  })

  it('rejects an invalid log level', () => {
    expect(() => loadConfig({ LOG_LEVEL: 'verbose' })).toThrow(ConfigError)
  })

  it('identifies postgres urls', () => {
    expect(isPostgresUrl('postgres://x')).toBe(true)
    expect(isPostgresUrl('postgresql://x')).toBe(true)
    expect(isPostgresUrl('file:./x.db')).toBe(false)
  })
})

/**
 * Task 02 — environment resolution provenance.
 *
 * The Task 01 production checkpoint exposed the real hazard: a deployed
 * runtime that declares no NODE_ENV is indistinguishable from local
 * development if only the RESOLVED value is inspected. Configuration must
 * therefore also report HOW the value was resolved, and diagnostics must be
 * fail-closed against the defaulted case.
 */
describe('shared/config/env — environment provenance (Task 02)', () => {
  it('marks a resolved-by-default environment as `default` and closes diagnostics', () => {
    const config = loadConfig({})
    expect(config.nodeEnv).toBe('development')
    expect(config.nodeEnvSource).toBe('default')
    expect(config.exposeDiagnostics).toBe(false)
  })

  it('marks an explicitly declared development environment as `declared`', () => {
    const config = loadConfig({ NODE_ENV: 'development' })
    expect(config.nodeEnvSource).toBe('declared')
    expect(config.exposeDiagnostics).toBe(true)
  })

  it('allows diagnostics for a declared test environment', () => {
    const config = loadConfig({ NODE_ENV: 'test' })
    expect(config.exposeDiagnostics).toBe(true)
  })

  it('never exposes diagnostics in production', () => {
    const config = loadConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://u:p@h:5432/db',
      AUTH_SECRET: 'a-locally-generated-secret',
    })
    expect(config.isProduction).toBe(true)
    expect(config.nodeEnvSource).toBe('declared')
    expect(config.exposeDiagnostics).toBe(false)
  })

  it('never exposes diagnostics in staging', () => {
    const config = loadConfig({ NODE_ENV: 'staging' })
    expect(config.isProduction).toBe(false)
    // Not production, yet still NOT a diagnostics environment: exposure must
    // never be derived from `!isProduction`.
    expect(config.exposeDiagnostics).toBe(false)
  })

  it('keeps DIAGNOSTIC_ENVS restricted to non-deployed environments', () => {
    expect([...DIAGNOSTIC_ENVS]).toEqual(['development', 'test'])
    expect(DIAGNOSTIC_ENVS).not.toContain('production')
    expect(DIAGNOSTIC_ENVS).not.toContain('staging')
  })
})
