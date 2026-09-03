import { z } from 'zod'
import { AppError } from '../../../shared/errors/app-error.js'
import { CONTENT_FORMATS } from '@modules/module-06-creator-fit'
import { CONTENT_ANGLES } from '@modules/module-07-content'
import {
  MAX_GENERATION_INSTRUCTIONS_LENGTH,
  MAX_GENERATION_LENGTH,
  MIN_GENERATION_LENGTH,
} from '../domain/generation-policy.js'
import {
  CONTENT_GENERATION_LANGUAGES,
  CONTENT_GENERATION_STATUSES,
  CONTENT_GENERATION_TYPES,
} from '../domain/vocabularies.js'
import type { CreateContentGenerationInput } from '../domain/content-generation.js'
import type { ContentGenerationStatus } from '../domain/vocabularies.js'

const text = (max: number) => z.string().trim().min(1).max(max)

export const generationSpecificationSchema = z.object({
  contentType: z.enum(CONTENT_GENERATION_TYPES),
  format: z.enum(CONTENT_FORMATS),
  language: z.enum(CONTENT_GENERATION_LANGUAGES),
  targetLength: z.number().int().min(MIN_GENERATION_LENGTH).max(MAX_GENERATION_LENGTH),
  hook: text(500),
  primaryAngle: z.enum(CONTENT_ANGLES),
  supportingAngles: z.array(z.enum(CONTENT_ANGLES)).max(6),
  targetAudience: z.object({
    audienceSegments: z.array(z.string()),
    audienceInterests: z.array(z.string()),
    painPoints: z.array(z.string()),
    desiredOutcome: z.string(),
  }).strict(),
  creatorRequirements: z.record(z.unknown()),
  executionConstraints: z.record(z.unknown()),
  evidenceReferences: z.array(z.object({
    demandSignalId: z.string().uuid(),
    sourceType: z.string().min(1),
    sourceRef: z.string().optional(),
    observedAt: z.string().datetime(),
  }).strict()).min(1).max(20),
  callToAction: text(500),
  generationInstructions: text(MAX_GENERATION_INSTRUCTIONS_LENGTH),
}).strict()

export const createContentGenerationSchema = z.object({
  contentOpportunityId: z.string().uuid(),
  creatorId: z.string().uuid(),
  contentType: z.enum(CONTENT_GENERATION_TYPES),
  format: z.enum(CONTENT_FORMATS),
  language: z.enum(CONTENT_GENERATION_LANGUAGES),
  targetLength: z.number().int().min(MIN_GENERATION_LENGTH).max(MAX_GENERATION_LENGTH),
  hook: text(500),
  callToAction: text(500),
  generationInstructions: text(MAX_GENERATION_INSTRUCTIONS_LENGTH),
}).strict()

export const reviewContentGenerationSchema = z.object({
  status: z.enum(CONTENT_GENERATION_STATUSES),
}).strict()

export function parseCreateContentGeneration(payload: unknown): CreateContentGenerationInput {
  const parsed = createContentGenerationSchema.safeParse(payload)
  if (!parsed.success) throw validation('Content generation payload is invalid', parsed.error)
  return parsed.data
}

export function parseReviewContentGeneration(payload: unknown): ContentGenerationStatus {
  const parsed = reviewContentGenerationSchema.safeParse(payload)
  if (!parsed.success) throw validation('Content generation review payload is invalid', parsed.error)
  return parsed.data.status
}

function validation(message: string, error: z.ZodError): AppError {
  return AppError.validation(message, {
    issues: error.issues.map((issue) => ({ field: issue.path.join('.') || '(body)', message: issue.message })),
  })
}
