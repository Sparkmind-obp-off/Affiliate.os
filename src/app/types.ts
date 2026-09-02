import type { AppConfig } from '../shared/config/env.js'
import type { Logger } from '../shared/logging/logger.js'
import type { RequestContext } from '../shared/http/request-context.js'

/**
 * Cloudflare environment bindings.
 *
 * NOTE: PostgreSQL is not a Workers binding — it is reached over the network.
 * See docs/ARCHITECTURE-CONFLICTS.md (CONFLICT-01).
 */
export interface Bindings {
  NODE_ENV?: string
  APP_NAME?: string
  APP_URL?: string
  API_URL?: string
  LOG_LEVEL?: string
  DATABASE_URL?: string
  DATABASE_SSL?: string
  AUTH_SECRET?: string
}

export interface Variables {
  ctx: RequestContext
  config: AppConfig
  logger: Logger
}

export type AppEnv = {
  Bindings: Bindings
  Variables: Variables
}
