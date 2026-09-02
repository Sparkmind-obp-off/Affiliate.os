/**
 * Structured logging foundation.
 *
 * Contract source: DOC 22 §239 (request_id → correlation_id chain),
 * Module 18 (Observability), Task 01 §19.
 *
 * Every log line is a single JSON object carrying the observability fields:
 *   request_id, correlation_id, tenant_id, user_id, module, action,
 *   status, latency_ms
 *
 * Secrets are NEVER logged — sensitive keys are redacted structurally
 * rather than relying on the caller to remember.
 */

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

export interface LogContext {
  request_id?: string
  correlation_id?: string
  tenant_id?: string
  organization_id?: string
  workspace_id?: string
  user_id?: string
  module?: string
  action?: string
  status?: string | number
  latency_ms?: number
  [key: string]: unknown
}

export interface LogRecord extends LogContext {
  timestamp: string
  level: LogLevel
  message: string
}

export type LogSink = (record: LogRecord) => void

/** Keys whose values must never appear in logs. */
const REDACTED_KEY_PATTERN =
  /(password|passwd|secret|token|api[-_]?key|apikey|authorization|auth[-_]?secret|credential|private[-_]?key|cookie|session[-_]?id|signature|merchant[-_]?code|database[-_]?url|connection[-_]?string)/i

export const REDACTED = '[REDACTED]'

const MAX_DEPTH = 6

/** Recursively redact sensitive keys from an arbitrary log payload. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[TRUNCATED]'
  if (value === null || value === undefined) return value

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1))
  }

  if (value instanceof Error) {
    return { name: value.name, message: value.message }
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = REDACTED_KEY_PATTERN.test(key) ? REDACTED : redact(val, depth + 1)
    }
    return out
  }

  return value
}

export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  /** Derive a logger that always carries the given context. */
  child(context: LogContext): Logger
}

export interface LoggerOptions {
  level?: LogLevel
  base?: LogContext
  sink?: LogSink
  now?: () => Date
}

const defaultSink: LogSink = (record) => {
  const line = JSON.stringify(record)
  if (record.level === 'error') console.error(line)
  else if (record.level === 'warn') console.warn(line)
  else console.log(line)
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const level = options.level ?? 'info'
  const base = options.base ?? {}
  const sink = options.sink ?? defaultSink
  const now = options.now ?? (() => new Date())

  const emit = (recordLevel: LogLevel, message: string, context?: LogContext): void => {
    if (LEVEL_WEIGHT[recordLevel] < LEVEL_WEIGHT[level]) return
    const merged = { ...base, ...(context ?? {}) }
    const safe = redact(merged) as LogContext
    sink({
      timestamp: now().toISOString(),
      level: recordLevel,
      message,
      ...safe,
    })
  }

  return {
    debug: (message, context) => emit('debug', message, context),
    info: (message, context) => emit('info', message, context),
    warn: (message, context) => emit('warn', message, context),
    error: (message, context) => emit('error', message, context),
    child: (context) =>
      createLogger({
        level,
        base: { ...base, ...context },
        sink,
        now,
      }),
  }
}
