import { Hono } from 'hono'
import { successEnvelope } from '../../shared/http/envelope.js'
import type { NodeEnvSource } from '../../shared/config/env.js'
import type { AppEnv } from '../types.js'

/**
 * Health endpoint (Task 01 §20).
 *
 * HONESTY RULE: dependency health is only ever reported as `healthy` when the
 * dependency was actually probed. Because the database connectivity layer is
 * NOT implemented in Task 01, DATABASE_HEALTH reports `not_configured` or
 * `not_checked` — never `healthy`.
 *
 * The same honesty rule applies to the environment (Task 02): the report says
 * WHERE the environment value came from (`declared` vs the local-development
 * `default`) and whether diagnostics are exposed, so an operator can tell an
 * intentionally-development runtime apart from a deployment that simply never
 * declared NODE_ENV. No secret or configuration value is ever reported.
 */

export type ComponentStatus =
  | 'healthy'
  | 'degraded'
  | 'unhealthy'
  | 'not_configured'
  | 'not_checked'

export interface HealthReport {
  status: 'ok' | 'degraded'
  application_health: {
    status: ComponentStatus
    app: string
    environment: string
    /** `declared` = runtime provided NODE_ENV; `default` = fallback applied. */
    environment_source: NodeEnvSource
    /** Whether internal error diagnostics may reach clients. */
    diagnostics_exposed: boolean
    version: string
  }
  database_health: {
    status: ComponentStatus
    engine: 'postgresql'
    /** Why the status is what it is — no silent green. */
    reason: string
  }
  external_provider_health: {
    status: ComponentStatus
    reason: string
    providers: Record<string, never>
  }
  checked_at: string
}

export const APP_VERSION = '0.1.0'

export function buildHealthReport(input: {
  appName: string
  environment: string
  environmentSource: NodeEnvSource
  diagnosticsExposed: boolean
  databaseConfigured: boolean
  now: Date
}): HealthReport {
  return {
    // The process answered, so the application itself is healthy.
    status: 'ok',
    application_health: {
      status: 'healthy',
      app: input.appName,
      environment: input.environment,
      environment_source: input.environmentSource,
      diagnostics_exposed: input.diagnosticsExposed,
      version: APP_VERSION,
    },
    database_health: {
      // Connectivity probing arrives with the persistence task.
      status: input.databaseConfigured ? 'not_checked' : 'not_configured',
      engine: 'postgresql',
      reason: input.databaseConfigured
        ? 'DATABASE_URL is configured but connectivity probing is not implemented yet (pending persistence task)'
        : 'DATABASE_URL is not configured in this environment',
    },
    external_provider_health: {
      status: 'not_configured',
      reason: 'No external connectors are implemented yet (Module 17 pending)',
      providers: {},
    },
    checked_at: input.now.toISOString(),
  }
}

export const healthRoutes = new Hono<AppEnv>()

healthRoutes.get('/', (c) => {
  const config = c.get('config')
  const ctx = c.get('ctx')

  const report = buildHealthReport({
    appName: config.appName,
    environment: config.nodeEnv,
    environmentSource: config.nodeEnvSource,
    diagnosticsExposed: config.exposeDiagnostics,
    databaseConfigured: config.databaseUrl !== null,
    now: new Date(),
  })

  return c.json(
    successEnvelope(report, {
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
    }),
  )
})
