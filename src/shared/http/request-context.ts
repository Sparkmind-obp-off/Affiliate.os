/**
 * Request context primitives.
 *
 * Contract source: DOC 22 §221 (request envelope), §239 (traceability chain).
 * Every request carries a request_id; correlation_id is propagated when the
 * caller supplies one so a chain of work stays traceable end to end.
 */

export const REQUEST_ID_HEADER = 'x-request-id'
export const CORRELATION_ID_HEADER = 'x-correlation-id'
export const IDEMPOTENCY_KEY_HEADER = 'idempotency-key'

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SAFE_ID_RE = /^[A-Za-z0-9_.:-]{8,128}$/

export function generateRequestId(): string {
  return crypto.randomUUID()
}

export function isUuidV4(value: string): boolean {
  return UUID_V4_RE.test(value)
}

/**
 * Accept a caller-supplied trace id only when it is well formed.
 * An untrusted header must never flow unvalidated into logs.
 */
export function sanitizeTraceId(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!SAFE_ID_RE.test(trimmed)) return null
  return trimmed
}

export interface RequestContext {
  requestId: string
  correlationId: string
  /** Present only when the caller supplied a valid Idempotency-Key. */
  idempotencyKey: string | null
  startedAt: number
  authenticatedIdentity?: { provider: 'clerk'; subject: string }
  accountId?: string
  workspaceId?: string
}

export function createRequestContext(
  headers: { get(name: string): string | null },
  now: () => number = () => Date.now(),
): RequestContext {
  const requestId = sanitizeTraceId(headers.get(REQUEST_ID_HEADER)) ?? generateRequestId()
  const correlationId = sanitizeTraceId(headers.get(CORRELATION_ID_HEADER)) ?? requestId
  const idempotencyKey = sanitizeTraceId(headers.get(IDEMPOTENCY_KEY_HEADER))

  return {
    requestId,
    correlationId,
    idempotencyKey,
    startedAt: now(),
  }
}
