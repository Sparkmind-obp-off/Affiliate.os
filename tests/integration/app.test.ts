import { describe, it, expect } from 'vitest'
import { createApp } from '../../src/app/create-app.js'

const app = createApp()
const ENV = { NODE_ENV: 'test', LOG_LEVEL: 'error' }

const request = (path: string, init?: RequestInit) =>
  app.request(`http://localhost${path}`, init, ENV)

/**
 * Wire-contract types asserted by these tests.
 * Declared here (not imported) on purpose: an integration test must verify the
 * shape actually sent over HTTP, independent of internal types.
 */
interface ComponentHealth {
  status: string
  reason?: string
}

interface HealthData {
  status: string
  application_health: ComponentHealth
  database_health: ComponentHealth
  external_provider_health: ComponentHealth
}

interface ApiRootData {
  version: string
  pending_routers: unknown[]
}

interface Envelope<T> {
  success: boolean
  data: T
  error?: { code: string; message: string; retryable: boolean; details?: unknown }
  meta: { request_id: string; correlation_id?: string }
}

async function readBody<T>(res: Response): Promise<Envelope<T>> {
  return (await res.json()) as Envelope<T>
}

describe('application HTTP shell', () => {
  it('GET /health reports application liveness', async () => {
    const res = await request('/health')
    expect(res.status).toBe(200)

    const body = await readBody<HealthData>(res)
    expect(body.success).toBe(true)
    expect(body.data.application_health.status).toBe('healthy')
    expect(body.meta.request_id).toBeTruthy()
  })

  it('GET /health does NOT falsely report database health', async () => {
    const body = await readBody<HealthData>(await request('/health'))
    // No DATABASE_URL configured and no probe implemented → must not be green.
    expect(body.data.database_health.status).toBe('not_configured')
    expect(body.data.database_health.status).not.toBe('healthy')
    expect(body.data.external_provider_health.status).not.toBe('healthy')
  })

  it('reports database as not_checked (never healthy) when configured but unprobed', async () => {
    const res = await app.request('http://localhost/health', undefined, {
      ...ENV,
      DATABASE_URL: 'postgres://u:p@h:5432/db',
    })
    const body = await readBody<HealthData>(res)
    expect(body.data.database_health.status).toBe('not_checked')
  })

  it('GET /api/v1 exposes the versioned API root', async () => {
    const res = await request('/api/v1')
    expect(res.status).toBe(200)
    const body = await readBody<ApiRootData>(res)
    expect(body.data.version).toBe('v1')
    expect(Array.isArray(body.data.pending_routers)).toBe(true)
  })

  it('returns the canonical error envelope for unknown endpoints', async () => {
    const res = await request('/api/v1/does-not-exist')
    expect(res.status).toBe(404)
    const body = await readBody<unknown>(res)
    expect(body.success).toBe(false)
    expect(body.error?.code).toBe('RESOURCE_NOT_FOUND')
    expect(body.error?.retryable).toBe(false)
    expect(body.meta.request_id).toBeTruthy()
  })

  it('echoes trace headers back to the caller', async () => {
    const res = await request('/health', {
      headers: { 'x-request-id': 'req-integration-1' },
    })
    expect(res.headers.get('x-request-id')).toBe('req-integration-1')
    expect(res.headers.get('x-correlation-id')).toBe('req-integration-1')
  })

  it('applies secure response headers', async () => {
    const res = await request('/health')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('serves CORS preflight on the API boundary', async () => {
    const res = await request('/api/v1', {
      method: 'OPTIONS',
      headers: { Origin: 'https://example.com', 'Access-Control-Request-Method': 'GET' },
    })
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy()
  })

  it('fails closed with a structured error on invalid configuration', async () => {
    const res = await app.request('http://localhost/health', undefined, {
      NODE_ENV: 'production',
      // Missing DATABASE_URL / AUTH_SECRET → configuration must be rejected.
    })
    expect(res.status).toBe(500)
    const body = await readBody<unknown>(res)
    expect(body.success).toBe(false)
    expect(body.error?.code).toBe('INTERNAL_ERROR')
    // No internal diagnostics leaked in production mode.
    expect(body.error?.details).toBeUndefined()
    expect(JSON.stringify(body)).not.toContain('AUTH_SECRET')
  })
})
