import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import workerApp from '../../src/index.js'

const ENV = { NODE_ENV: 'test', LOG_LEVEL: 'error' }

interface ErrorEnvelope {
  success: boolean
  error?: { code: string; message: string; retryable: boolean }
  meta: { request_id: string }
}

/**
 * Cloudflare Pages entry contract.
 *
 * `@hono/vite-cloudflare-pages` does NOT deploy `src/index.ts` directly. It
 * generates an outer Hono worker that does:
 *
 *   worker.route('/', app)
 *   worker.notFound(app.notFoundHandler)
 *
 * `route()` does not transfer the inner not-found handler, so the wrapper reads
 * it off the app object. If `app.notFoundHandler` is `undefined` (Hono v4 keeps
 * it in a private field), the deployed worker answers unknown paths with an
 * empty `200` instead of the canonical `RESOURCE_NOT_FOUND` envelope.
 *
 * These tests reproduce the generated wrapper so the regression is caught by
 * `npm run test` instead of only in a deployed environment.
 */
describe('cloudflare pages entry (generated wrapper)', () => {
  it('exposes notFoundHandler to the bundler wrapper', () => {
    expect(typeof (workerApp as unknown as { notFoundHandler?: unknown }).notFoundHandler).toBe(
      'function',
    )
  })

  it('returns the canonical RESOURCE_NOT_FOUND envelope through the wrapper', async () => {
    const worker = buildGeneratedWrapper()

    const res = await worker.request('http://localhost/definitely-not-a-route', undefined, ENV)

    expect(res.status).toBe(404)
    const body = (await res.json()) as ErrorEnvelope
    expect(body.success).toBe(false)
    expect(body.error?.code).toBe('RESOURCE_NOT_FOUND')
    expect(body.error?.retryable).toBe(false)
    expect(body.meta.request_id).toBeTruthy()
  })

  it('still serves real routes through the wrapper', async () => {
    const worker = buildGeneratedWrapper()

    const res = await worker.request('http://localhost/health', undefined, ENV)

    expect(res.status).toBe(200)
  })
})

/** Mirror of the entry template in `@hono/vite-cloudflare-pages/dist/entry.js`. */
function buildGeneratedWrapper(): Hono {
  const worker = new Hono()
  const app = workerApp as unknown as Hono & { notFoundHandler: Parameters<Hono['notFound']>[0] }
  worker.route('/', app)
  worker.notFound(app.notFoundHandler)
  return worker
}
