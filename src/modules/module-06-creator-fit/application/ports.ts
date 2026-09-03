import type { CreatorProfile } from '../domain/creator.js'

export interface CreatorRepository {
  create(profile: Omit<CreatorProfile, 'id'>): Promise<CreatorProfile>
  findById(workspaceId: string, id: string): Promise<CreatorProfile | null>
  list(workspaceId: string, limit: number): Promise<CreatorProfile[]>
}

export interface CreatorClock { now(): Date }
export const systemCreatorClock: CreatorClock = { now: () => new Date() }
