import type { DemandSignal, DemandSignalInput } from '../domain/demand.js'

export interface DemandSignalRepository {
  create(signal: Omit<DemandSignal, 'id'> & { fingerprint: string }): Promise<DemandSignal>
  findById(workspaceId: string, id: string): Promise<DemandSignal | null>
  list(workspaceId: string, limit: number): Promise<DemandSignal[]>
}

export interface DemandCreateResult {
  signal: DemandSignal
  duplicate: boolean
}

export type DemandSignalDraft = DemandSignalInput
