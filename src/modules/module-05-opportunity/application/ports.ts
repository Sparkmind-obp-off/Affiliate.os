import type { OpportunityEvaluation } from '../domain/evaluator.js'
import type { OpportunityStatus } from '../domain/lifecycle.js'
import type { OpportunityCandidate } from '../domain/signals.js'

export interface OpportunityTenantContext {
  organizationId: string
  workspaceId: string
  userId: string
}

export interface StoredOpportunity {
  id: string
  workspace_id: string
  status: OpportunityStatus
  input: OpportunityCandidate
  evaluation: OpportunityEvaluation
  created_at: string
  updated_at: string
}

export interface CreateOpportunityRecord {
  workspaceId: string
  input: OpportunityCandidate
  evaluation: OpportunityEvaluation
}

/** Application-owned persistence port; infrastructure supplies PostgreSQL. */
export interface OpportunityRepository {
  create(record: CreateOpportunityRecord): Promise<StoredOpportunity>
  findByRef(workspaceId: string, candidateRef: string): Promise<StoredOpportunity | null>
  findById(workspaceId: string, opportunityId: string): Promise<StoredOpportunity | null>
  list(workspaceId: string, limit: number): Promise<StoredOpportunity[]>
  transition(
    workspaceId: string,
    opportunityId: string,
    from: OpportunityStatus,
    to: OpportunityStatus,
  ): Promise<StoredOpportunity | null>
}

/** Backward-compatible Task 03 recording seam for stateless evaluation callers. */
export interface OpportunityEvaluationRecorder {
  record(evaluation: OpportunityEvaluation): Promise<void>
}

/** Injected clock keeps deterministic use cases testable. */
export interface Clock {
  now(): Date
}

export const systemClock: Clock = { now: () => new Date() }
