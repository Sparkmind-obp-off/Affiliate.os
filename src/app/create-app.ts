import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { observability } from './middleware/observability.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import { healthRoutes } from './routes/health.js'
import { apiV1 } from './routes/api-v1.js'
import type { AppEnv } from './types.js'

/**
 * Application composition root.
 *
 * The app is a MODULAR MONOLITH (DOC 24 §313): one deployable application
 * whose modules stay logically isolated. This file wires the HTTP shell only —
 * it must never contain business logic.
 */
export function createApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>()

  app.onError(errorHandler)
  app.notFound(notFoundHandler)

  app.use('*', secureHeaders())
  app.use('*', observability())
  app.use('/api/*', cors())

  // Liveness / readiness surface.
  app.route('/health', healthRoutes)

  // Versioned API boundary.
  app.route('/api/v1', apiV1)

  return app
}
