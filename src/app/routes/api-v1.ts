import { Hono } from 'hono'
import { successEnvelope } from '../../shared/http/envelope.js'
import type { AppEnv } from '../types.js'

/**
 * API v1 root (Task 01 §17, DOC 22 §217).
 *
 * Only the version root is mounted in Task 01. Domain routers
 * (/auth, /organizations, /workspaces, /affiliate, /analytics, /billing,
 * /ecosystem) are each owned by their module and are mounted by their own
 * dedicated task — NOT here, and never as raw database passthroughs.
 */

export interface ApiRootDescriptor {
  api: string
  version: 'v1'
  status: 'foundation'
  /** Routers intentionally not mounted yet, with their owning module. */
  pending_routers: Array<{ path: string; owner_module: string }>
}

export const API_V1_PENDING_ROUTERS: ApiRootDescriptor['pending_routers'] = [
  { path: '/api/v1/auth', owner_module: 'module-15-identity' },
  { path: '/api/v1/organizations', owner_module: 'module-15-identity' },
  { path: '/api/v1/workspaces', owner_module: 'module-15-identity' },
  { path: '/api/v1/affiliate', owner_module: 'module-05-opportunity' },
  { path: '/api/v1/analytics', owner_module: 'module-09-performance' },
  { path: '/api/v1/billing', owner_module: 'module-25-billing' },
  { path: '/api/v1/ecosystem', owner_module: 'module-26-ecosystem' },
]

export const apiV1 = new Hono<AppEnv>()

apiV1.get('/', (c) => {
  const ctx = c.get('ctx')
  const descriptor: ApiRootDescriptor = {
    api: 'affiliate-os',
    version: 'v1',
    status: 'foundation',
    pending_routers: API_V1_PENDING_ROUTERS,
  }

  return c.json(
    successEnvelope(descriptor, {
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
    }),
  )
})
