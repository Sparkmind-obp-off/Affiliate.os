import { AppError } from '../../../shared/errors/app-error.js'
import { evaluateOpportunity } from '../domain/evaluator.js'
import type { OpportunityCandidate } from '../domain/signals.js'
import { describeScoringModel } from '../domain/model-descriptor.js'
import { parseEvaluateInput } from './evaluate-opportunity.js'
import {
  systemClock,
  type Clock,
  type OpportunityRepository,
  type StoredOpportunity,
} from './ports.js'

export const DEFAULT_OPPORTUNITY_LIST_LIMIT = 20
export const MAX_OPPORTUNITY_LIST_LIMIT = 100

export interface OpportunityLifecycleDeps {
  repository: OpportunityRepository
  clock?: Clock
}

export async function executeCreateOpportunity(
  payload: unknown,
  workspaceId: string,
  deps: OpportunityLifecycleDeps,
): Promise<StoredOpportunity> {
  const input = parseEvaluateInput(payload)
  const evaluation = evaluateOpportunity(input, (deps.clock ?? systemClock).now().toISOString())
  try {
    return await deps.repository.create({ workspaceId, input, evaluation })
  } catch (error) {
    if (error instanceof AppError) throw error
    throw AppError.internal('Failed to persist the opportunity', error)
  }
}

export async function executeGetOpportunity(
  candidateRef: string,
  workspaceId: string,
  repository: OpportunityRepository,
): Promise<StoredOpportunity> {
  if (!/^[A-Za-z0-9_.:-]{1,128}$/.test(candidateRef)) {
    throw AppError.validation('Opportunity reference is invalid', {
      issues: [{ field: 'candidateRef', message: 'invalid candidate reference' }],
    })
  }
  try {
    const opportunity = await repository.findByRef(workspaceId, candidateRef)
    if (!opportunity) throw AppError.notFound('Opportunity not found')
    return opportunity
  } catch (error) {
    if (error instanceof AppError) throw error
    throw AppError.internal('Failed to retrieve the opportunity', error)
  }
}

export function parseOpportunityListLimit(raw: string | undefined): number {
  if (raw === undefined) return DEFAULT_OPPORTUNITY_LIST_LIMIT
  if (!/^\d+$/.test(raw)) throw invalidLimit()
  const limit = Number(raw)
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_OPPORTUNITY_LIST_LIMIT) {
    throw invalidLimit()
  }
  return limit
}

export async function executeListOpportunities(
  workspaceId: string,
  limit: number,
  repository: OpportunityRepository,
): Promise<StoredOpportunity[]> {
  try {
    return await repository.list(workspaceId, limit)
  } catch (error) {
    throw AppError.internal('Failed to list opportunities', error)
  }
}

function invalidLimit(): AppError {
  return AppError.validation('Opportunity list limit is invalid', {
    issues: [{ field: 'limit', message: `must be an integer from 1 to ${MAX_OPPORTUNITY_LIST_LIMIT}` }],
  })
}

/** Persisted metadata must identify every deterministic model involved. */
export function opportunityModelVersions(): Record<string, string> {
  return { ...describeScoringModel().versions }
}

export type { OpportunityCandidate }
