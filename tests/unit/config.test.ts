import { describe, it, expect } from 'vitest'
import { loadConfig, ConfigError, isPostgresUrl } from '../../src/shared/config/env.js'

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
