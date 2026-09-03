import { AppError } from '../../../shared/errors/app-error.js'
import type { OpportunityRepository } from '@modules/module-05-opportunity'
import type { CreatorProfile } from '../domain/creator.js'
import { evaluateCreatorFit, type CreatorFitResult } from '../domain/fit-policy.js'
import { parseCreatorFitRequest, parseCreatorProfile } from './schemas.js'
import {
  systemCreatorClock,
  type CreatorClock,
  type CreatorRepository,
} from './ports.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const DEFAULT_CREATOR_LIST_LIMIT = 20
export const MAX_CREATOR_LIST_LIMIT = 100

export async function createCreatorProfile(
  payload: unknown,
  workspaceId: string,
  dependencies: { repository: CreatorRepository; clock?: CreatorClock },
): Promise<CreatorProfile> {
  validateWorkspaceId(workspaceId)
  const input = parseCreatorProfile(payload)
  const now = (dependencies.clock ?? systemCreatorClock).now().toISOString()
  try {
    return await dependencies.repository.create({
      ...input,
      workspaceId,
      createdAt: now,
      updatedAt: now,
    })
  } catch (error) {
    if (isUniqueViolation(error)) throw AppError.conflict('A creator with this reference already exists')
    if (error instanceof AppError) throw error
    throw AppError.internal('Failed to persist creator profile', error)
  }
}

export async function getCreatorProfile(
  id: string,
  workspaceId: string,
  repository: CreatorRepository,
): Promise<CreatorProfile> {
  validateWorkspaceId(workspaceId)
  validateUuid(id, 'id', 'Creator id is invalid')
  try {
    const profile = await repository.findById(workspaceId, id)
    if (!profile) throw AppError.notFound('Creator not found')
    return profile
  } catch (error) {
    if (error instanceof AppError) throw error
    throw AppError.internal('Failed to retrieve creator profile', error)
  }
}

export async function listCreatorProfiles(
  workspaceId: string,
  rawLimit: string | undefined,
  repository: CreatorRepository,
): Promise<CreatorProfile[]> {
  validateWorkspaceId(workspaceId)
  const limit = parseCreatorListLimit(rawLimit)
  try {
    return await repository.list(workspaceId, limit)
  } catch (error) {
    throw AppError.internal('Failed to list creator profiles', error)
  }
}

export async function evaluateStoredCreatorFit(
  creatorId: string,
  payload: unknown,
  workspaceId: string,
  dependencies: {
    creatorRepository: CreatorRepository
    opportunityRepository: OpportunityRepository
  },
): Promise<CreatorFitResult> {
  validateWorkspaceId(workspaceId)
  validateUuid(creatorId, 'id', 'Creator id is invalid')
  const request = parseCreatorFitRequest(payload)
  try {
    const [creator, opportunity] = await Promise.all([
      dependencies.creatorRepository.findById(workspaceId, creatorId),
      dependencies.opportunityRepository.findById(workspaceId, request.opportunityId),
    ])
    if (!creator) throw AppError.notFound('Creator not found')
    if (!opportunity) throw AppError.notFound('Opportunity not found')
    return evaluateCreatorFit(creator, opportunity, request.criteria)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw AppError.internal('Failed to evaluate creator fit', error)
  }
}

export function parseCreatorListLimit(raw: string | undefined): number {
  if (raw === undefined) return DEFAULT_CREATOR_LIST_LIMIT
  if (!/^\d+$/.test(raw)) throw invalidLimit()
  const limit = Number(raw)
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_CREATOR_LIST_LIMIT) throw invalidLimit()
  return limit
}

function validateWorkspaceId(workspaceId: string): void {
  validateUuid(workspaceId, 'workspaceId', 'Workspace id is invalid')
}
function validateUuid(value: string, field: string, message: string): void {
  if (!UUID_RE.test(value)) {
    throw AppError.validation(message, { issues: [{ field, message: 'must be a UUID' }] })
  }
}
function invalidLimit(): AppError {
  return AppError.validation('Creator list limit is invalid', {
    issues: [{ field: 'limit', message: `must be an integer from 1 to ${MAX_CREATOR_LIST_LIMIT}` }],
  })
}
function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error
    && (error as { code?: string }).code === '23505'
}
