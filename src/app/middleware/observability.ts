import type { MiddlewareHandler } from 'hono'
import { loadConfig, type RawEnv } from '../../shared/config/env.js'
import { createLogger } from '../../shared/logging/logger.js'
import {
  createRequestContext,
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
} from '../../shared/http/request-context.js'
import type { AppEnv } from '../types.js'

/**
 * Observability middleware.
 *
 * Responsibilities (Task 01 §19, DOC 22 §239):
 *  - resolve validated configuration for the request;
 *  - establish request_id / correlation_id;
 *  - expose a request-scoped structured logger;
 *  - echo trace headers back to the caller;
 *  - record completion status and latency.
 */
export const observability = (): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    const raw: RawEnv = { ...(c.env as unknown as RawEnv) }
    const config = loadConfig(raw)
    const ctx = createRequestContext(c.req.raw.headers)

    const logger = createLogger({ level: config.logLevel }).child({
      request_id: ctx.requestId,
      correlation_id: ctx.correlationId,
      app: config.appName,
      env: config.nodeEnv,
    })

    c.set('config', config)
    c.set('ctx', ctx)
    c.set('logger', logger)

    c.header(REQUEST_ID_HEADER, ctx.requestId)
    c.header(CORRELATION_ID_HEADER, ctx.correlationId)

    logger.debug('request.received', {
      module: 'app',
      action: `${c.req.method} ${new URL(c.req.url).pathname}`,
    })

    await next()

    logger.info('request.completed', {
      module: 'app',
      action: `${c.req.method} ${new URL(c.req.url).pathname}`,
      status: c.res.status,
      latency_ms: Date.now() - ctx.startedAt,
    })
  }
}
