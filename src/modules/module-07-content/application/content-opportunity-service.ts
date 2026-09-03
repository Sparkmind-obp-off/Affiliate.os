import { AppError } from '../../../shared/errors/app-error.js'
import type { DemandSignalRepository } from '@modules/module-04-demand'
import type { OpportunityRepository } from '@modules/module-05-opportunity'
import type { CreatorRepository } from '@modules/module-06-creator-fit'
import {
  aggregateEvidenceConfidence,
  type ContentOpportunity,
  type ContentOpportunityEvidence,
} from '../domain/content-opportunity.js'
import { evaluateContentOpportunity, type ContentOpportunityEvaluation } from '../domain/evaluation-policy.js'
import { parseContentEvaluation, parseContentOpportunity } from './schemas.js'
import { systemContentClock, type ContentClock, type ContentOpportunityRepository } from './ports.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const DEFAULT_CONTENT_OPPORTUNITY_LIST_LIMIT = 20
export const MAX_CONTENT_OPPORTUNITY_LIST_LIMIT = 100

export interface CreateContentOpportunityDependencies {
  repository: ContentOpportunityRepository
  opportunityRepository: OpportunityRepository
  demandRepository: DemandSignalRepository
  clock?: ContentClock
}

export async function createContentOpportunity(
  payload: unknown,
  workspaceId: string,
  dependencies: CreateContentOpportunityDependencies,
): Promise<ContentOpportunity> {
  validateUuid(workspaceId, 'workspaceId', 'Workspace id is invalid')
  const input = parseContentOpportunity(payload)
  try {
    const opportunity = await dependencies.opportunityRepository.findById(workspaceId, input.opportunityId)
    if (!opportunity) throw AppError.notFound('Opportunity not found')
    const signals = await Promise.all(input.demandSignalIds.map((id) => dependencies.demandRepository.findById(workspaceId, id)))
    if (signals.some((signal) => signal === null)) throw AppError.notFound('Demand signal not found')
    const evidence: ContentOpportunityEvidence[] = signals.map((signal) => {
      if (!signal) throw AppError.notFound('Demand signal not found')
      return {
        demandSignalId: signal.id,
        sourceType: signal.sourceType,
        sourceRef: signal.sourceRef,
        observedAt: signal.observedAt,
        evidence: signal.evidence,
        confidence: signal.confidence,
        demandScore: signal.demandScore,
      }
    })
    const now = (dependencies.clock ?? systemContentClock).now().toISOString()
    return await dependencies.repository.create({
      workspaceId,
      opportunityId: input.opportunityId,
      title: input.title,
      primaryAngle: input.primaryAngle,
      secondaryAngles: input.secondaryAngles,
      targetAudience: input.targetAudience,
      contentFormats: input.contentFormats,
      creatorRequirements: input.creatorRequirements,
      executionConstraints: input.executionConstraints,
      evidence,
      confidence: aggregateEvidenceConfidence(evidence),
      status: input.status,
      createdAt: now,
      updatedAt: now,
    })
  } catch (error) {
    if (isUniqueViolation(error)) throw AppError.conflict('This content opportunity already exists')
    if (error instanceof AppError) throw error
    throw AppError.internal('Failed to create content opportunity', error)
  }
}

export async function getContentOpportunity(
  id: string,
  workspaceId: string,
  repository: ContentOpportunityRepository,
): Promise<ContentOpportunity> {
  validateUuid(workspaceId, 'workspaceId', 'Workspace id is invalid')
  validateUuid(id, 'id', 'Content opportunity id is invalid')
  try {
    const content = await repository.findById(workspaceId, id)
    if (!content) throw AppError.notFound('Content opportunity not found')
    return content
  } catch (error) {
    if (error instanceof AppError) throw error
    throw AppError.internal('Failed to retrieve content opportunity', error)
  }
}

export async function listContentOpportunities(
  workspaceId: string,
  rawLimit: string | undefined,
  repository: ContentOpportunityRepository,
): Promise<ContentOpportunity[]> {
  validateUuid(workspaceId, 'workspaceId', 'Workspace id is invalid')
  const limit = parseContentOpportunityListLimit(rawLimit)
  try {
    return await repository.list(workspaceId, limit)
  } catch (error) {
    throw AppError.internal('Failed to list content opportunities', error)
  }
}

export async function evaluateStoredContentOpportunity(
  id: string,
  payload: unknown,
  workspaceId: string,
  dependencies: {
    repository: ContentOpportunityRepository
    opportunityRepository: OpportunityRepository
    creatorRepository: CreatorRepository
  },
): Promise<ContentOpportunityEvaluation> {
  validateUuid(workspaceId, 'workspaceId', 'Workspace id is invalid')
  validateUuid(id, 'id', 'Content opportunity id is invalid')
  const { creatorId } = parseContentEvaluation(payload)
  try {
    const content = await dependencies.repository.findById(workspaceId, id)
    if (!content) throw AppError.notFound('Content opportunity not found')
    const [opportunity, creator] = await Promise.all([
      dependencies.opportunityRepository.findById(workspaceId, content.opportunityId),
      dependencies.creatorRepository.findById(workspaceId, creatorId),
    ])
    if (!opportunity) throw AppError.notFound('Opportunity not found')
    if (!creator) throw AppError.notFound('Creator not found')
    return evaluateContentOpportunity(content, opportunity, creator)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw AppError.internal('Failed to evaluate content opportunity', error)
  }
}

export function parseContentOpportunityListLimit(raw: string | undefined): number {
  if (raw === undefined) return DEFAULT_CONTENT_OPPORTUNITY_LIST_LIMIT
  if (!/^\d+$/.test(raw)) throw invalidLimit()
  const limit = Number(raw)
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_CONTENT_OPPORTUNITY_LIST_LIMIT) throw invalidLimit()
  return limit
}

function validateUuid(value: string, field: string, message: string): void {
  if (!UUID_RE.test(value)) throw AppError.validation(message, { issues: [{ field, message: 'must be a UUID' }] })
}
function invalidLimit(): AppError {
  return AppError.validation('Content opportunity list limit is invalid', {
    issues: [{ field: 'limit', message: `must be an integer from 1 to ${MAX_CONTENT_OPPORTUNITY_LIST_LIMIT}` }],
  })
}
function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error
    && (error as { code?: string }).code === '23505'
}
