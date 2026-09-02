import type { Context, ErrorHandler, NotFoundHandler } from 'hono'
import { AppError } from '../../shared/errors/app-error.js'
import { errorEnvelope } from '../../shared/http/envelope.js'
import type { AppEnv } from '../types.js'

/**
 * Central error handler.
 *
 * Guarantees (Task 01 §18):
 *  - one consistent error envelope for every failure;
 *  - a machine-readable error code always present;
 *  - stack traces / internal causes NEVER present in the response body
 *    (they are logged server-side instead).
 */
export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const appError = AppError.from(err)
  const { requestId, correlationId } = resolveTrace(c)
  const config = c.get('config')
  const exposeDetails = config ? !config.isProduction : false

  const logger = c.get('logger')
  if (logger) {
    const level = appError.httpStatus >= 500 ? 'error' : 'warn'
    logger[level]('request.failed', {
      module: 'app',
      action: `${c.req.method} ${new URL(c.req.url).pathname}`,
      status: appError.httpStatus,
      error_code: appError.code,
      error_message: appError.message,
      // `cause` is redacted/normalized by the logger; never sent to clients.
      cause: appError.cause instanceof Error ? appError.cause.message : undefined,
    })
  }

  const body = errorEnvelope(appError, { requestId, correlationId }, exposeDetails)
  return c.json(body, appError.httpStatus as 400)
}

export const notFoundHandler: NotFoundHandler<AppEnv> = (c) => {
  const { requestId, correlationId } = resolveTrace(c)
  const body = errorEnvelope(
    AppError.notFound('Endpoint not found'),
    { requestId, correlationId },
    false,
  )
  return c.json(body, 404)
}

function resolveTrace(c: Context<AppEnv>): { requestId: string; correlationId: string } {
  const ctx = c.get('ctx')
  if (ctx) return { requestId: ctx.requestId, correlationId: ctx.correlationId }
  // The failure happened before context creation (e.g. invalid configuration).
  const fallback = crypto.randomUUID()
  return { requestId: fallback, correlationId: fallback }
}
