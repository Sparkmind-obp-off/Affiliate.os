import { describe, it, expect } from 'vitest'
import { createLogger, redact, REDACTED, type LogRecord } from '../../src/shared/logging/logger.js'

function capture() {
  const records: LogRecord[] = []
  return { records, sink: (r: LogRecord) => records.push(r) }
}

describe('shared/logging/logger', () => {
  it('emits structured records with observability fields', () => {
    const { records, sink } = capture()
    const logger = createLogger({ level: 'debug', sink })

    logger.info('request.completed', {
      request_id: 'req-1',
      correlation_id: 'corr-1',
      tenant_id: 'tenant-1',
      user_id: 'user-1',
      module: 'app',
      action: 'GET /health',
      status: 200,
      latency_ms: 12,
    })

    expect(records).toHaveLength(1)
    const record = records[0]!
    expect(record.level).toBe('info')
    expect(record.message).toBe('request.completed')
    expect(record.request_id).toBe('req-1')
    expect(record.latency_ms).toBe(12)
    expect(typeof record.timestamp).toBe('string')
  })

  it('respects the configured level threshold', () => {
    const { records, sink } = capture()
    const logger = createLogger({ level: 'warn', sink })
    logger.debug('ignored')
    logger.info('ignored')
    logger.warn('kept')
    logger.error('kept')
    expect(records.map((r) => r.level)).toEqual(['warn', 'error'])
  })

  it('never logs secrets', () => {
    const { records, sink } = capture()
    const logger = createLogger({ level: 'debug', sink })

    logger.info('boot', {
      DATABASE_URL: 'postgres://user:hunter2@host/db',
      AUTH_SECRET: 'super-secret',
      api_key: 'abc123',
      authorization: 'Bearer xyz',
      nested: { password: 'p', privateKey: 'k', safe: 'ok' },
    })

    const serialized = JSON.stringify(records[0])
    expect(serialized).not.toContain('hunter2')
    expect(serialized).not.toContain('super-secret')
    expect(serialized).not.toContain('abc123')
    expect(serialized).not.toContain('Bearer xyz')
    expect(serialized).toContain(REDACTED)
    expect(serialized).toContain('ok')
  })

  it('propagates child context', () => {
    const { records, sink } = capture()
    const logger = createLogger({ level: 'debug', sink }).child({ request_id: 'req-9' })
    logger.info('hello', { module: 'identity' })
    expect(records[0]!.request_id).toBe('req-9')
    expect(records[0]!.module).toBe('identity')
  })

  it('normalizes Error values without leaking stack traces', () => {
    const result = redact({ err: new Error('boom') }) as { err: Record<string, unknown> }
    expect(result.err).toEqual({ name: 'Error', message: 'boom' })
    expect(result.err).not.toHaveProperty('stack')
  })
})
