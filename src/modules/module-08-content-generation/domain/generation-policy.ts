import { AppError } from '../../../shared/errors/app-error.js'
import type { ContentFormat } from '@modules/module-06-creator-fit'
import {
  CONTENT_GENERATION_STATUSES,
  type ContentGenerationStatus,
} from './vocabularies.js'

export const CONTENT_GENERATION_POLICY_VERSION = 'content-generation-v1.0.0' as const
export const MIN_GENERATION_LENGTH = 20
export const MAX_GENERATION_LENGTH = 5_000
export const MAX_GENERATION_INSTRUCTIONS_LENGTH = 4_000

const TRANSITIONS: Readonly<Record<ContentGenerationStatus, readonly ContentGenerationStatus[]>> = {
  DRAFT: ['REQUESTED'],
  REQUESTED: ['GENERATED', 'REJECTED'],
  GENERATED: ['REVIEW_REQUIRED', 'REJECTED'],
  REVIEW_REQUIRED: ['APPROVED', 'REJECTED'],
  APPROVED: ['ARCHIVED'],
  REJECTED: ['ARCHIVED'],
  ARCHIVED: [],
}

export function isContentGenerationStatus(value: string): value is ContentGenerationStatus {
  return (CONTENT_GENERATION_STATUSES as readonly string[]).includes(value)
}

export function canTransitionContentGeneration(
  current: ContentGenerationStatus,
  next: ContentGenerationStatus,
): boolean {
  return TRANSITIONS[current].includes(next)
}

export function assertContentGenerationTransition(
  current: ContentGenerationStatus,
  next: ContentGenerationStatus,
): void {
  if (!canTransitionContentGeneration(current, next)) {
    throw AppError.conflict(`Content generation cannot transition from ${current} to ${next}`)
  }
}

export function validateGeneratedArtifact(
  artifact: { title: string; hook: string; body: string; callToAction: string },
  targetLength: number,
): void {
  const fields = Object.entries(artifact)
  if (fields.some(([, value]) => value.trim().length === 0)) {
    throw AppError.validation('Generation provider returned an incomplete artifact')
  }
  if (artifact.body.length > targetLength || artifact.body.length > MAX_GENERATION_LENGTH) {
    throw AppError.validation('Generation provider returned content beyond the allowed length')
  }
}

export function assertFormatAllowed(format: ContentFormat, allowedFormats: readonly ContentFormat[]): void {
  if (!allowedFormats.includes(format)) {
    throw AppError.validation('Generation format is not allowed by the content opportunity', {
      issues: [{ field: 'format', message: 'must be one of the content opportunity formats' }],
    })
  }
}
