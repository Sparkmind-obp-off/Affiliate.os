import { describe, it, expect } from 'vitest'
import { createApp } from '../../src/app/create-app.js'

/**
 * Task 02 regression suite — PRODUCTION ERROR EXPOSURE.
 *
 * Reproduces the defect found at the Task 01 production checkpoint:
 * the deployed Cloudflare Pages runtime provided no NODE_ENV, so configuration
 * resolved to the `development` DEFAULT, and the error handler's
 * `!config.isProduction` gate opened internal diagnostics in production.
 *
 * The invariant asserted here is environment-independent:
 *   an internal error must never return stack traces, causes, internal
 *   exception messages, or configuration values to the caller — unless the
 *   runtime EXPLICITLY declared a development/test environment.
 */

const LEAKY_MESSAGE = 'connection to postgres://svc:s3cr3t@db.internal:5432/affiliate_os refused'

interface ErrorBody {
  success: boolean
  error?: {
    code: string
    message: string
    retryable: boolean
    details?: Record<string, unknown>
  }
  meta: { request_id: string }
}

/** An app with a route that fails the way a real dependency failure would. */
function appThatThrows() {
  const app = createApp()
  app.get('/boom', () => {
    const err = new Error(LEAKY_MESSAGE)
    err.stack = `Error: ${LEAKY_MESSAGE}\n    at PgClient.connect (/srv/internal/pg.js:118:23)`
    throw err
  })
  return app
}

async function boom(env: Record<string, string>): Promise<{ res: Response; body: ErrorBody }> {
  const res = await appThatThrows().request('http://localhost/boom', undefined, env)
  return { res, body: (await res.json()) as ErrorBody }
}

describe('production error exposure', () => {
  it('sanitizes an internal error when NODE_ENV is declared production', async () => {
    const { res, body } = await boom({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://u:p@h:5432/db',
      AUTH_SECRET: 'production-test-secret-with-32-plus-characters',
      DATABASE_SSL: 'true',
      LOG_LEVEL: 'error',
    })

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error?.code).toBe('INTERNAL_ERROR')
    expect(body.error?.message).toBe('Internal server error')
    expect(body.error?.details).toBeUndefined()
    expect(body.meta.request_id).toBeTruthy()

    const wire = JSON.stringify(body)
    expect(wire).not.toContain(LEAKY_MESSAGE)
    expect(wire).not.toContain('s3cr3t')
    expect(wire).not.toContain('PgClient.connect')
    expect(wire).not.toContain('/srv/internal')
    expect(wire).not.toContain('stack')
  })

  it('REGRESSION: sanitizes an internal error when the runtime declares NO environment', async () => {
    // Exactly the deployed Cloudflare Pages situation: no NODE_ENV var, so
    // configuration falls back to the `development` default.
    const { res, body } = await boom({ LOG_LEVEL: 'error' })

    expect(res.status).toBe(500)
    expect(body.error?.code).toBe('INTERNAL_ERROR')
    expect(body.error?.details).toBeUndefined()

    const wire = JSON.stringify(body)
    expect(wire).not.toContain(LEAKY_MESSAGE)
    expect(wire).not.toContain('s3cr3t')
    expect(wire).not.toContain('PgClient.connect')
  })

  it('REGRESSION: sanitizes an internal error for an undeclared staging runtime', async () => {
    const { body } = await boom({ NODE_ENV: 'staging', LOG_LEVEL: 'error' })
    expect(body.error?.details).toBeUndefined()
    expect(JSON.stringify(body)).not.toContain('s3cr3t')
  })

  it('keeps developer diagnostics available for an explicitly declared dev runtime', async () => {
    // Development debugging must not be weakened (Task 02 §6): the details
    // channel stays OPEN, so an AppError carrying details still surfaces them.
    const { res, body } = await appThatThrowsAppError('development')
    expect(res.status).toBe(500)
    expect(body.error?.details).toEqual({ hint: 'dev-diagnostic' })
  })

  it('closes the diagnostics channel for that same error in production', async () => {
    const { body } = await appThatThrowsAppError('production', {
      DATABASE_URL: 'postgres://u:p@h:5432/db',
      AUTH_SECRET: 'production-test-secret-with-32-plus-characters',
      DATABASE_SSL: 'true',
    })
    expect(body.error?.details).toBeUndefined()
  })

  it('still returns the canonical RESOURCE_NOT_FOUND envelope for unknown routes', async () => {
    const app = appThatThrows()
    for (const env of [
      { LOG_LEVEL: 'error' },
      { NODE_ENV: 'test', LOG_LEVEL: 'error' },
      {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://u:p@h:5432/db',
        AUTH_SECRET: 'production-test-secret-with-32-plus-characters',
        DATABASE_SSL: 'true',
        LOG_LEVEL: 'error',
      },
    ]) {
      const res = await app.request('http://localhost/nope', undefined, env)
      expect(res.status).toBe(404)
      const body = (await res.json()) as ErrorBody
      expect(body.success).toBe(false)
      expect(body.error?.code).toBe('RESOURCE_NOT_FOUND')
      expect(body.error?.retryable).toBe(false)
      expect(body.error?.details).toBeUndefined()
    }
  })
})

describe('health environment reporting', () => {
  it('marks the environment as defaulted (not declared) when the runtime is silent', async () => {
    const res = await createApp().request('http://localhost/health', undefined, {
      LOG_LEVEL: 'error',
    })
    const body = (await res.json()) as {
      data: {
        application_health: {
          environment: string
          environment_source: string
          diagnostics_exposed: boolean
        }
      }
    }

    expect(res.status).toBe(200)
    expect(body.data.application_health.environment).toBe('development')
    expect(body.data.application_health.environment_source).toBe('default')
    // The decisive assertion: a silent runtime must NOT expose diagnostics.
    expect(body.data.application_health.diagnostics_exposed).toBe(false)
  })

  it('reports a declared environment as declared', async () => {
    const res = await createApp().request('http://localhost/health', undefined, {
      NODE_ENV: 'development',
      LOG_LEVEL: 'error',
    })
    const body = (await res.json()) as {
      data: {
        application_health: { environment_source: string; diagnostics_exposed: boolean }
      }
    }
    expect(body.data.application_health.environment_source).toBe('declared')
    expect(body.data.application_health.diagnostics_exposed).toBe(true)
  })

  it('never reports secrets or configuration values', async () => {
    const res = await createApp().request('http://localhost/health', undefined, {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://svc:s3cr3t@db.internal:5432/affiliate_os',
      AUTH_SECRET: 'production-health-secret-with-32-plus-characters',
      DATABASE_SSL: 'true',
      LOG_LEVEL: 'error',
    })
    const wire = JSON.stringify(await res.json())
    expect(wire).not.toContain('s3cr3t')
    expect(wire).not.toContain('production-health-secret-with-32-plus-characters')
    expect(wire).not.toContain('db.internal')
  })
})

/** Helper: a route throwing an AppError that carries developer details. */
async function appThatThrowsAppError(
  nodeEnv: string,
  extra: Record<string, string> = {},
): Promise<{ res: Response; body: ErrorBody }> {
  const { AppError } = await import('../../src/shared/errors/app-error.js')
  const app = createApp()
  app.get('/boom-app-error', () => {
    throw new AppError('INTERNAL_ERROR', 'Internal server error', {
      details: { hint: 'dev-diagnostic' },
    })
  })
  const res = await app.request('http://localhost/boom-app-error', undefined, {
    NODE_ENV: nodeEnv,
    LOG_LEVEL: 'error',
    ...extra,
  })
  return { res, body: (await res.json()) as ErrorBody }
}
