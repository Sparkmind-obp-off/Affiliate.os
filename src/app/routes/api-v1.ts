import { Hono } from 'hono'
import { successEnvelope } from '../../shared/http/envelope.js'
import { opportunityRoutes } from '@modules/module-05-opportunity'
import { demandRoutes } from '@modules/module-04-demand'
import { identityRoutes } from '@modules/module-15-identity'
import type { AppEnv } from '../types.js'

export interface ApiRootDescriptor {
  api: string
  version: 'v1'
  status: 'foundation' | 'mvp'
  mounted_routers: Array<{ path: string; owner_module: string }>
  pending_routers: Array<{ path: string; owner_module: string }>
}

export const API_V1_MOUNTED_ROUTERS: ApiRootDescriptor['mounted_routers'] = [
  { path: '/api/v1/affiliate', owner_module: 'module-05-opportunity' },
  { path: '/api/v1/demand', owner_module: 'module-04-demand' },
  { path: '/api/v1/identity', owner_module: 'module-15-identity' },
]

export const API_V1_PENDING_ROUTERS: ApiRootDescriptor['pending_routers'] = [
  { path: '/api/v1/analytics', owner_module: 'module-09-performance' },
  { path: '/api/v1/billing', owner_module: 'module-25-billing' },
  { path: '/api/v1/ecosystem', owner_module: 'module-26-ecosystem' },
]

export const apiV1 = new Hono<AppEnv>()
apiV1.get('/', (c) => {
  const ctx = c.get('ctx')
  return c.json(successEnvelope({ api: 'affiliate-os', version: 'v1', status: 'mvp', mounted_routers: API_V1_MOUNTED_ROUTERS, pending_routers: API_V1_PENDING_ROUTERS }, { requestId: ctx.requestId, correlationId: ctx.correlationId }))
})
apiV1.route('/affiliate', opportunityRoutes)
apiV1.route('/', demandRoutes)
apiV1.route('/identity', identityRoutes)
