import { AppError } from '../../../shared/errors/app-error.js'
import type { CreatorRepository } from '@modules/module-06-creator-fit'
import type { ContentOpportunityRepository } from '@modules/module-07-content'
import {
  CONTENT_GENERATION_POLICY_VERSION,
  assertContentGenerationTransition,
  assertFormatAllowed,
  validateGeneratedArtifact,
} from '../domain/generation-policy.js'
import type {
  ContentGeneration,
  GenerationMetadata,
  GenerationSpecification,
} from '../domain/content-generation.js'
import type { ContentGenerationStatus } from '../domain/vocabularies.js'
import { parseCreateContentGeneration, parseReviewContentGeneration } from './schemas.js'
import {
  systemGenerationClock,
  type ContentGenerationRepository,
  type GenerationClock,
  type GenerationProvider,
} from './ports.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const DEFAULT_CONTENT_GENERATION_LIST_LIMIT = 20
export const MAX_CONTENT_GENERATION_LIST_LIMIT = 100

export interface CreateContentGenerationDependencies {
  repository: ContentGenerationRepository
  contentOpportunityRepository: ContentOpportunityRepository
  creatorRepository: CreatorRepository
  clock?: GenerationClock
}

export async function createContentGeneration(
  payload: unknown,
  workspaceId: string,
  dependencies: CreateContentGenerationDependencies,
): Promise<ContentGeneration> {
  validateUuid(workspaceId, 'workspaceId', 'Workspace id is invalid')
  const input = parseCreateContentGeneration(payload)
  try {
    const [contentOpportunity, creator] = await Promise.all([
      dependencies.contentOpportunityRepository.findById(workspaceId, input.contentOpportunityId),
      dependencies.creatorRepository.findById(workspaceId, input.creatorId),
    ])
    if (!contentOpportunity) throw AppError.notFound('Content opportunity not found')
    if (!creator) throw AppError.notFound('Creator not found')
    if (contentOpportunity.status !== 'ready') {
      throw AppError.conflict('Content opportunity must be ready before generation')
    }
    assertFormatAllowed(input.format, contentOpportunity.contentFormats)

    const generationSpec: GenerationSpecification = {
      contentType: input.contentType,
      format: input.format,
      language: input.language,
      targetLength: input.targetLength,
      hook: input.hook,
      primaryAngle: contentOpportunity.primaryAngle,
      supportingAngles: [...contentOpportunity.secondaryAngles],
      targetAudience: contentOpportunity.targetAudience,
      creatorRequirements: contentOpportunity.creatorRequirements,
      executionConstraints: contentOpportunity.executionConstraints,
      evidenceReferences: contentOpportunity.evidence.map((evidence) => ({
        demandSignalId: evidence.demandSignalId,
        sourceType: evidence.sourceType,
        sourceRef: evidence.sourceRef,
        observedAt: evidence.observedAt,
      })),
      callToAction: input.callToAction,
      generationInstructions: input.generationInstructions,
    }
    const now = (dependencies.clock ?? systemGenerationClock).now().toISOString()
    const inputFingerprint = await fingerprint({
      workspaceId,
      contentOpportunityId: input.contentOpportunityId,
      creatorId: input.creatorId,
      policyVersion: CONTENT_GENERATION_POLICY_VERSION,
      generationSpec,
    })
    return await dependencies.repository.create({
      workspaceId,
      contentOpportunityId: input.contentOpportunityId,
      creatorId: input.creatorId,
      generationSpec,
      contentType: input.contentType,
      format: input.format,
      language: input.language,
      title: contentOpportunity.title,
      hook: input.hook,
      body: null,
      callToAction: input.callToAction,
      status: 'DRAFT',
      provider: null,
      providerModel: null,
      policyVersion: CONTENT_GENERATION_POLICY_VERSION,
      inputFingerprint,
      outputFingerprint: null,
      generationMetadata: null,
      generatedAt: null,
      createdAt: now,
      updatedAt: now,
    })
  } catch (error) {
    if (isUniqueViolation(error)) throw AppError.conflict('This generation specification already exists')
    if (error instanceof AppError) throw error
    throw AppError.internal('Failed to create content generation', error)
  }
}

export async function requestContentGeneration(
  id: string,
  workspaceId: string,
  repository: ContentGenerationRepository,
  provider: GenerationProvider,
  clock: GenerationClock = systemGenerationClock,
): Promise<ContentGeneration> {
  const generation = await getContentGeneration(id, workspaceId, repository)
  assertContentGenerationTransition(generation.status, 'REQUESTED')
  if (!provider.isAvailable()) {
    throw AppError.notImplemented('Content generation provider is not configured')
  }
  const requestedAt = clock.now().toISOString()
  const requested = await repository.transition(workspaceId, id, 'DRAFT', 'REQUESTED', requestedAt)
  if (!requested) throw AppError.conflict('Content generation changed before the request could start')
  try {
    const result = await provider.generate({
      generationId: requested.id,
      specification: requested.generationSpec,
      inputFingerprint: requested.inputFingerprint,
    })
    validateProviderResult(result)
    validateGeneratedArtifact(result.content, requested.generationSpec.targetLength)
    const generatedAt = clock.now().toISOString()
    const outputFingerprint = await fingerprint(result.content)
    const metadata: GenerationMetadata = {
      providerRequestId: result.providerRequestId,
      usage: result.usage,
      attributes: result.metadata ?? {},
    }
    const completed = await repository.complete(workspaceId, id, 'REQUESTED', {
      ...result.content,
      provider: result.provider,
      providerModel: result.model,
      outputFingerprint,
      generationMetadata: metadata,
      generatedAt,
      updatedAt: generatedAt,
    })
    if (!completed) throw AppError.conflict('Content generation changed before provider output was stored')
    return completed
  } catch (error) {
    await repository.transition(workspaceId, id, 'REQUESTED', 'REJECTED', clock.now().toISOString()).catch(() => null)
    if (error instanceof AppError) throw error
    throw new AppError('EXTERNAL_API_ERROR', 'Content generation provider failed', { cause: error })
  }
}

export async function reviewContentGeneration(
  id: string,
  payload: unknown,
  workspaceId: string,
  repository: ContentGenerationRepository,
  clock: GenerationClock = systemGenerationClock,
): Promise<ContentGeneration> {
  const next = parseReviewContentGeneration(payload)
  const current = await getContentGeneration(id, workspaceId, repository)
  assertContentGenerationTransition(current.status, next)
  const updated = await repository.transition(workspaceId, id, current.status, next, clock.now().toISOString())
  if (!updated) throw AppError.conflict('Content generation changed before review was stored')
  return updated
}

export async function getContentGeneration(
  id: string,
  workspaceId: string,
  repository: ContentGenerationRepository,
): Promise<ContentGeneration> {
  validateUuid(workspaceId, 'workspaceId', 'Workspace id is invalid')
  validateUuid(id, 'id', 'Content generation id is invalid')
  try {
    const generation = await repository.findById(workspaceId, id)
    if (!generation) throw AppError.notFound('Content generation not found')
    return generation
  } catch (error) {
    if (error instanceof AppError) throw error
    throw AppError.internal('Failed to retrieve content generation', error)
  }
}

export async function listContentGenerations(
  workspaceId: string,
  rawLimit: string | undefined,
  repository: ContentGenerationRepository,
): Promise<ContentGeneration[]> {
  validateUuid(workspaceId, 'workspaceId', 'Workspace id is invalid')
  const limit = parseContentGenerationListLimit(rawLimit)
  try { return await repository.list(workspaceId, limit) }
  catch (error) { throw AppError.internal('Failed to list content generations', error) }
}

export function parseContentGenerationListLimit(raw: string | undefined): number {
  if (raw === undefined) return DEFAULT_CONTENT_GENERATION_LIST_LIMIT
  if (!/^\d+$/.test(raw)) throw invalidLimit()
  const limit = Number(raw)
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_CONTENT_GENERATION_LIST_LIMIT) throw invalidLimit()
  return limit
}

export async function fingerprint(value: unknown): Promise<string> {
  const canonical = canonicalJson(value)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function validateProviderResult(result: { provider: string; model: string }): void {
  if (!result.provider?.trim() || !result.model?.trim()) {
    throw AppError.validation('Generation provider returned invalid provenance')
  }
}
function validateUuid(value: string, field: string, message: string): void {
  if (!UUID_RE.test(value)) throw AppError.validation(message, { issues: [{ field, message: 'must be a UUID' }] })
}
function invalidLimit(): AppError {
  return AppError.validation('Content generation list limit is invalid', {
    issues: [{ field: 'limit', message: `must be an integer from 1 to ${MAX_CONTENT_GENERATION_LIST_LIMIT}` }],
  })
}
function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505'
}

export function isReviewTarget(status: ContentGenerationStatus): boolean {
  return status === 'REVIEW_REQUIRED' || status === 'APPROVED' || status === 'REJECTED' || status === 'ARCHIVED'
}
