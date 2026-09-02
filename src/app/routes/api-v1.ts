import { Hono } from 'hono'
import { successEnvelope } from '../../shared/http/envelope.js'
import { opportunityRoutes } from '@modules/module-05-opportunity'
import type { AppEnv } from '../types.js'

/**
 * API v1 root (Task 01 §17, DOC 22 §217).
 *
 * Domain routers are each OWNED by their module and mounted here by the
 * module's own implementation task — never as raw database passthroughs, and
 * always through the module's public contract (`@modules/<module>`), so the
 * dependency stays explicit and the architecture test can see it.
 *
 * Task 03 mounts `/affiliate` (module-05-opportunity, the first MVP vertical).
 * The remaining routers stay unmounted and are reported as pending, so the API
 * root never claims a capability that does not exist.
 */

export interface ApiRootDescriptor {
  api: string
  version: 'v1'
  status: 'foundation' | 'mvp'
  /** Routers actually mounted and callable right now. */
  mounted_routers: Array<{ path: string; owner_module: string }>
  /** Routers intentionally not mounted yet, with their owning module. */
  pending_routers: Array<{ path: string; owner_module: string }>
}

export const API_V1_MOUNTED_ROUTERS: ApiRootDescriptor['mounted_routers'] = [
  { path: '/api/v1/affiliate', owner_module: 'module-05-opportunity' },
]

export const API_V1_PENDING_ROUTERS: ApiRootDescriptor['pending_routers'] = [
  { path: '/api/v1/auth', owner_module: 'module-15-identity' },
  { path: '/api/v1/organizations', owner_module: 'module-15-identity' },
  { path: '/api/v1/workspaces', owner_module: 'module-15-identity' },
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
    status: 'mvp',
    mounted_routers: API_V1_MOUNTED_ROUTERS,
    pending_routers: API_V1_PENDING_ROUTERS,
  }

  return c.json(
    successEnvelope(descriptor, {
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
    }),
  )
})

// Module 05 — Opportunity Engine & Scoring System (first MVP vertical).
apiV1.route('/affiliate', opportunityRoutes)
