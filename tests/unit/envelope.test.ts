import { describe, it, expect } from 'vitest'
import {
  successEnvelope,
  collectionEnvelope,
  errorEnvelope,
} from '../../src/shared/http/envelope.js'
import { AppError } from '../../src/shared/errors/app-error.js'
import { ERROR_CODES, ERROR_HTTP_STATUS } from '../../src/shared/errors/error-codes.js'

const ctx = { requestId: 'req-1', correlationId: 'corr-1' }

describe('shared/http/envelope', () => {
  it('matches the DOC 22 success envelope', () => {
    const body = successEnvelope({ id: 'x' }, ctx)
    expect(body).toEqual({
      success: true,
      data: { id: 'x' },
      meta: { request_id: 'req-1', correlation_id: 'corr-1' },
    })
  })

  it('matches the DOC 22 collection envelope', () => {
    const body = collectionEnvelope([1, 2], ctx, { next_cursor: 'c1', has_more: true })
    expect(body.meta.pagination).toEqual({ next_cursor: 'c1', has_more: true })
    expect(body.data).toEqual([1, 2])
  })

  it('matches the DOC 22 error envelope', () => {
    const body = errorEnvelope(AppError.notFound(), ctx, false)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('RESOURCE_NOT_FOUND')
    expect(body.error.retryable).toBe(false)
    expect(body.meta.request_id).toBe('req-1')
  })

  it('always exposes validation details (client contract)', () => {
    const error = AppError.validation('Invalid body', { field: 'email' })
    const body = errorEnvelope(error, ctx, false)
    expect(body.error.details).toEqual({ field: 'email' })
  })

  it('hides internal details when details are not client-facing', () => {
    const error = new AppError(ERROR_CODES.INTERNAL_ERROR, 'Internal server error', {
      details: { query: 'SELECT * FROM users' },
    })
    const production = errorEnvelope(error, ctx, false)
    expect(production.error.details).toBeUndefined()

    const development = errorEnvelope(error, ctx, true)
    expect(development.error.details).toEqual({ query: 'SELECT * FROM users' })
  })

  it('never serializes a stack trace or cause', () => {
    const cause = new Error('db connection string postgres://u:secret@h/db')
    const error = AppError.internal('Internal server error', cause)
    const serialized = JSON.stringify(errorEnvelope(error, ctx, true))
    expect(serialized).not.toContain('secret')
    expect(serialized).not.toContain('stack')
  })

  it('marks transient failures as retryable', () => {
    expect(errorEnvelope(new AppError(ERROR_CODES.RATE_LIMITED, 'slow down'), ctx, false).error.retryable).toBe(true)
    expect(errorEnvelope(new AppError(ERROR_CODES.TIMEOUT, 'timeout'), ctx, false).error.retryable).toBe(true)
  })

  it('maps every error code to an http status', () => {
    for (const code of Object.values(ERROR_CODES)) {
      expect(ERROR_HTTP_STATUS[code]).toBeGreaterThanOrEqual(400)
    }
  })

  it('normalizes unknown throwables to INTERNAL_ERROR', () => {
    const error = AppError.from('something odd')
    expect(error.code).toBe('INTERNAL_ERROR')
    expect(error.message).toBe('Internal server error')
    expect(AppError.from(AppError.notFound()).code).toBe('RESOURCE_NOT_FOUND')
  })
})
