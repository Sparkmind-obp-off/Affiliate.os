import { describe, it, expect } from 'vitest'
import {
  createRequestContext,
  sanitizeTraceId,
  isUuidV4,
  generateRequestId,
} from '../../src/shared/http/request-context.js'

const headersOf = (init: Record<string, string>) => new Headers(init)

describe('shared/http/request-context', () => {
  it('generates a request id when the caller supplies none', () => {
    const ctx = createRequestContext(headersOf({}))
    expect(isUuidV4(ctx.requestId)).toBe(true)
    // correlation_id defaults to request_id so the chain always exists.
    expect(ctx.correlationId).toBe(ctx.requestId)
    expect(ctx.idempotencyKey).toBeNull()
  })

  it('propagates caller-supplied trace ids', () => {
    const ctx = createRequestContext(
      headersOf({
        'x-request-id': 'req-abcdef123',
        'x-correlation-id': 'corr-abcdef123',
        'idempotency-key': 'op-abcdef123',
      }),
    )
    expect(ctx.requestId).toBe('req-abcdef123')
    expect(ctx.correlationId).toBe('corr-abcdef123')
    expect(ctx.idempotencyKey).toBe('op-abcdef123')
  })

  it('rejects malformed / injected trace ids', () => {
    expect(sanitizeTraceId('short')).toBeNull()
    expect(sanitizeTraceId('has spaces here')).toBeNull()
    expect(sanitizeTraceId('inject\nnewline-attack')).toBeNull()
    expect(sanitizeTraceId('a'.repeat(200))).toBeNull()
    expect(sanitizeTraceId(null)).toBeNull()
  })

  it('falls back to a generated id when the header is malformed', () => {
    const ctx = createRequestContext(headersOf({ 'x-request-id': 'bad id!' }))
    expect(isUuidV4(ctx.requestId)).toBe(true)
  })

  it('produces unique request ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateRequestId()))
    expect(ids.size).toBe(100)
  })
})
