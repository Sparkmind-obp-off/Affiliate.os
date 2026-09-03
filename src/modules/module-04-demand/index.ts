/** Public contract for Demand Discovery Engine (Task 09). */
export const MODULE_ID = 'module-04-demand' as const
export const MODULE_TITLE = 'Demand Discovery Engine' as const
export const MODULE_STATUS = 'FOUNDATION_IMPLEMENTED' as const

export { demandRoutes } from './infrastructure/http/demand-routes.js'
export {
  createDemandSignal,
  fingerprintDemandSignal,
  getDemandSignal,
  listDemandSignals,
  parseDemandInput,
  parseDemandListLimit,
  DEFAULT_DEMAND_LIST_LIMIT,
  MAX_DEMAND_LIST_LIMIT,
  type DemandServiceDependencies,
} from './application/demand-service.js'
export {
  systemDemandClock,
  type DemandClock,
  type DemandSignalRepository,
} from './application/ports.js'
export {
  DEMAND_CONFIDENCE,
  DEMAND_SIGNAL_TYPES,
  DEMAND_SOURCE_TYPES,
  DEMAND_STATUSES,
  calculateDemandScore,
  classifyDemandStatus,
  normalizeCanonicalProblem,
  isDemandConfidence,
  isDemandSignalType,
  isDemandSourceType,
  isDemandStatus,
  type DemandConfidence,
  type DemandSignal,
  type DemandSignalInput,
  type DemandSignalType,
  type DemandSourceType,
  type DemandStatus,
} from './domain/demand.js'
export {
  PostgresDemandSignalRepository,
  mapDemandSignalRow,
  type DemandPostgresQueryExecutor,
} from './infrastructure/persistence/postgres-demand-repository.js'
export { createPostgresDemandSignalRepository } from './infrastructure/persistence/postgres-client.js'
