import type { DemandSignal } from '../domain/demand.js'

export interface DemandSignalRepository {
  create(signal: Omit<DemandSignal, 'id'>): Promise<DemandSignal>
  findById(workspaceId: string, id: string): Promise<DemandSignal | null>
  list(workspaceId: string, limit: number): Promise<DemandSignal[]>
}

export interface DemandClock {
  now(): Date
}

export const systemDemandClock: DemandClock = { now: () => new Date() }
