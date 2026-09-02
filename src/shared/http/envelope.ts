import { AppError } from '../errors/app-error.js'
import type { ErrorCode } from '../errors/error-codes.js'

/**
 * Response envelope.
 * Contract source: DOC 22 §222 (RESPONSE ENVELOPE) and §223 (ERROR CONTRACT).
 *
 * The envelope shape is LOCKED. Handlers must never return bare payloads.
 */

export interface ResponseMeta {
  request_id: string
  correlation_id?: string
  pagination?: {
    next_cursor: string | null
    has_more: boolean
  }
}

export interface SuccessEnvelope<T> {
  success: true
  data: T
  meta: ResponseMeta
}

export interface ErrorEnvelope {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: Record<string, unknown>
    retryable: boolean
  }
  meta: ResponseMeta
}

export type Envelope<T> = SuccessEnvelope<T> | ErrorEnvelope

export interface EnvelopeContext {
  requestId: string
  correlationId?: string
}

export function successEnvelope<T>(data: T, ctx: EnvelopeContext): SuccessEnvelope<T> {
  return {
    success: true,
    data,
    meta: buildMeta(ctx),
  }
}

export function collectionEnvelope<T>(
  data: T[],
  ctx: EnvelopeContext,
  pagination: { next_cursor: string | null; has_more: boolean },
): SuccessEnvelope<T[]> {
  return {
    success: true,
    data,
    meta: { ...buildMeta(ctx), pagination },
  }
}

/**
 * Build an error envelope.
 *
 * `exposeDetails` is false in production so that internal diagnostics
 * (validation internals, causes, stack traces) are never returned.
 */
export function errorEnvelope(
  error: AppError,
  ctx: EnvelopeContext,
  exposeDetails: boolean,
): ErrorEnvelope {
  const body: ErrorEnvelope = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
    },
    meta: buildMeta(ctx),
  }

  // VALIDATION_ERROR details are part of the client contract and are always
  // safe to expose; everything else is only exposed outside production.
  const detailsAreClientFacing = error.code === 'VALIDATION_ERROR'
  if (error.details && (detailsAreClientFacing || exposeDetails)) {
    body.error.details = error.details
  }

  return body
}

function buildMeta(ctx: EnvelopeContext): ResponseMeta {
  const meta: ResponseMeta = { request_id: ctx.requestId }
  if (ctx.correlationId) meta.correlation_id = ctx.correlationId
  return meta
}
