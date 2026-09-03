/** Public contract for Demand Discovery Engine (Task 09). */
export const MODULE_ID = 'module-04-demand' as const
export const MODULE_TITLE = 'Demand Discovery Engine' as const
export const MODULE_STATUS = 'FOUNDATION_IMPLEMENTED' as const

export { demandRoutes } from './infrastructure/http/demand-routes.js'
export { createDemandSignal, getDemandSignal, listDemandSignals, parseDemandInput } from './application/demand-service.js'
export type { DemandSignalRepository, DemandCreateResult, DemandSignalDraft } from './application/ports.js'
export {
  DEMAND_CONFIDENCE, DEMAND_SIGNAL_TYPES, DEMAND_SOURCE_TYPES, DEMAND_STATUSES,
  calculateDemandScore, classifyDemandStatus, normalizeCanonicalProblem,
  isDemandConfidence, isDemandSignalType, isDemandSourceType,
  type DemandConfidence, type DemandSignal, type DemandSignalInput, type DemandSignalType,
  type DemandSourceType, type DemandStatus,
} from './domain/demand.js'
export { PostgresDemandSignalRepository } from './infrastructure/persistence/postgres-demand-repository.js'
export { createPostgresDemandSignalRepository } from './infrastructure/persistence/postgres-client.js'
