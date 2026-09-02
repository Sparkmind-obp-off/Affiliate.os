import { z } from 'zod'

/**
 * Environment configuration.
 *
 * Rules enforced here (Task 01 §12, §13, §11):
 *  - configuration is validated at the boundary, never read ad-hoc via
 *    `process.env` deep inside modules;
 *  - no secret ever has a hardcoded production default;
 *  - the database URL must be PostgreSQL — SQLite / file / in-memory
 *    databases are rejected outside of tests.
 */

export const NODE_ENVS = ['development', 'test', 'staging', 'production'] as const
export type NodeEnv = (typeof NODE_ENVS)[number]

/**
 * Environments in which internal diagnostics may be returned to the caller.
 *
 * FAIL-CLOSED RULE (Task 02): diagnostics are exposed only when the runtime
 * environment is EXPLICITLY declared as one of these. An undeclared /
 * unrecognized environment is treated as untrusted, because a deployed runtime
 * that forgot to declare `NODE_ENV` must never be mistaken for a developer
 * laptop. `default('development')` is a convenience for local work — it is NOT
 * evidence that the process is running locally.
 */
export const DIAGNOSTIC_ENVS: readonly NodeEnv[] = ['development', 'test']

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const

const envSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVS).default('development'),
  APP_NAME: z.string().min(1).default('affiliate-os'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:3000/api/v1'),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
  DATABASE_URL: z.string().min(1).optional(),
  DATABASE_SSL: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === 'true'),
  AUTH_SECRET: z.string().min(1).optional(),
})

export type RawEnv = Record<string, string | undefined>

/**
 * How `nodeEnv` was resolved.
 *  - `declared`: the runtime explicitly provided a valid NODE_ENV;
 *  - `default`:  nothing was provided and the local-development default applied.
 */
export type NodeEnvSource = 'declared' | 'default'

export type AppConfig = Readonly<{
  nodeEnv: NodeEnv
  nodeEnvSource: NodeEnvSource
  isProduction: boolean
  /**
   * Whether internal diagnostics (error details, causes) may be returned to
   * the caller. TRUE only for an explicitly declared development/test runtime.
   */
  exposeDiagnostics: boolean
  appName: string
  appUrl: string
  apiUrl: string
  logLevel: (typeof LOG_LEVELS)[number]
  databaseUrl: string | null
  databaseSsl: boolean
  authSecret: string | null
}>

const POSTGRES_PROTOCOLS = ['postgres://', 'postgresql://']

/** A production database MUST be PostgreSQL (Task 01 §11). */
export function isPostgresUrl(url: string): boolean {
  return POSTGRES_PROTOCOLS.some((p) => url.startsWith(p))
}

export class ConfigError extends Error {
  public readonly issues: string[]
  constructor(issues: string[]) {
    super(`Invalid environment configuration:\n- ${issues.join('\n- ')}`)
    this.name = 'ConfigError'
    this.issues = issues
  }
}

export function loadConfig(raw: RawEnv): AppConfig {
  const parsed = envSchema.safeParse(raw)
  if (!parsed.success) {
    throw new ConfigError(
      parsed.error.issues.map((i) => `${i.path.join('.') || 'env'}: ${i.message}`),
    )
  }

  const value = parsed.data
  const nodeEnvSource: NodeEnvSource = raw.NODE_ENV ? 'declared' : 'default'
  const isProduction = value.NODE_ENV === 'production'
  const exposeDiagnostics = nodeEnvSource === 'declared' && DIAGNOSTIC_ENVS.includes(value.NODE_ENV)
  const issues: string[] = []

  if (value.DATABASE_URL && !isPostgresUrl(value.DATABASE_URL)) {
    issues.push('DATABASE_URL must be a PostgreSQL connection string (postgres:// or postgresql://)')
  }

  // Production must not boot without its critical secrets.
  if (isProduction) {
    if (!value.DATABASE_URL) issues.push('DATABASE_URL is required in production')
    if (!value.AUTH_SECRET) issues.push('AUTH_SECRET is required in production')
  }

  if (issues.length > 0) throw new ConfigError(issues)

  return Object.freeze({
    nodeEnv: value.NODE_ENV,
    nodeEnvSource,
    isProduction,
    exposeDiagnostics,
    appName: value.APP_NAME,
    appUrl: value.APP_URL,
    apiUrl: value.API_URL,
    logLevel: value.LOG_LEVEL,
    databaseUrl: value.DATABASE_URL ?? null,
    databaseSsl: Boolean(value.DATABASE_SSL),
    authSecret: value.AUTH_SECRET ?? null,
  })
}
