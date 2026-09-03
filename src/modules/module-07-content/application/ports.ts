import type { ContentOpportunity } from '../domain/content-opportunity.js'

export interface ContentOpportunityRepository {
  create(contentOpportunity: Omit<ContentOpportunity, 'id'>): Promise<ContentOpportunity>
  findById(workspaceId: string, id: string): Promise<ContentOpportunity | null>
  list(workspaceId: string, limit: number): Promise<ContentOpportunity[]>
}

export interface ContentClock { now(): Date }
export const systemContentClock: ContentClock = { now: () => new Date() }
