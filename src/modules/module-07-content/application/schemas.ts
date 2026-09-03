import { z } from 'zod'
import { AppError } from '../../../shared/errors/app-error.js'
import {
  AUDIENCE_SEGMENTS,
  CONTENT_FORMATS,
  CREATOR_AVAILABILITY,
  CREATOR_BUDGET_MODES,
  CREATOR_CAPABILITY_TYPES,
  CREATOR_NICHES,
  normalizeMatchToken,
} from '@modules/module-06-creator-fit'
import {
  CONTENT_ANGLES,
  CONTENT_OPPORTUNITY_STATUSES,
  type ContentOpportunityInput,
} from '../domain/content-opportunity.js'

const text = (max: number) => z.string().trim().min(1).max(max)
const capabilityLevel = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
const uniqueArray = <T extends z.ZodTypeAny>(schema: T, max: number, min = 0) => z.array(schema).min(min).max(max)
  .refine((items) => new Set(items.map((item) => JSON.stringify(item))).size === items.length, 'must not contain duplicates')

const creatorRequirementsSchema = z.object({
  niches: uniqueArray(z.enum(CREATOR_NICHES), 10).optional(),
  productCategories: uniqueArray(text(100), 20).optional(),
  audienceSegments: uniqueArray(z.enum(AUDIENCE_SEGMENTS), 10).optional(),
  contentFormats: uniqueArray(z.enum(CONTENT_FORMATS), 11).optional(),
  capabilityRequirements: uniqueArray(z.object({
    type: z.enum(CREATOR_CAPABILITY_TYPES),
    minimumLevel: capabilityLevel,
  }).strict(), 9).refine(
    (items) => new Set(items.map((item) => item.type)).size === items.length,
    'capability requirement types must be unique',
  ).optional(),
  requiresSample: z.boolean().optional(),
  minimumBudget: z.enum(CREATOR_BUDGET_MODES).optional(),
  affiliateRequired: z.boolean().optional(),
  minimumAvailability: z.enum(CREATOR_AVAILABILITY).optional(),
}).strict()

export const contentOpportunitySchema = z.object({
  opportunityId: z.string().uuid(),
  title: text(200),
  primaryAngle: z.enum(CONTENT_ANGLES),
  secondaryAngles: uniqueArray(z.enum(CONTENT_ANGLES), 6).default([]),
  targetAudience: z.object({
    audienceSegments: uniqueArray(z.enum(AUDIENCE_SEGMENTS), 10).default([]),
    audienceInterests: uniqueArray(text(100), 20).default([]),
    painPoints: uniqueArray(text(300), 20).default([]),
    desiredOutcome: text(500),
  }).strict(),
  contentFormats: uniqueArray(z.enum(CONTENT_FORMATS), 11, 1),
  creatorRequirements: creatorRequirementsSchema.default({}),
  executionConstraints: z.object({
    requiresSample: z.boolean().optional(),
    minimumBudget: z.enum(CREATOR_BUDGET_MODES).optional(),
    affiliateRequired: z.boolean().optional(),
    minimumAvailability: z.enum(CREATOR_AVAILABILITY).optional(),
  }).strict().default({}),
  demandSignalIds: uniqueArray(z.string().uuid(), 20, 1),
  status: z.enum(CONTENT_OPPORTUNITY_STATUSES).default('draft'),
}).strict()

export const evaluateContentOpportunitySchema = z.object({ creatorId: z.string().uuid() }).strict()

export function parseContentOpportunity(payload: unknown): ContentOpportunityInput {
  const parsed = contentOpportunitySchema.safeParse(payload)
  if (!parsed.success) throw validation('Content opportunity payload is invalid', parsed.error)
  if (parsed.data.secondaryAngles.includes(parsed.data.primaryAngle)) {
    throw AppError.validation('Content opportunity payload is invalid', {
      issues: [{ field: 'secondaryAngles', message: 'must not repeat primaryAngle' }],
    })
  }
  return {
    ...parsed.data,
    targetAudience: {
      ...parsed.data.targetAudience,
      audienceInterests: parsed.data.targetAudience.audienceInterests.map(normalizeMatchToken),
      painPoints: parsed.data.targetAudience.painPoints.map(normalizeMatchToken),
      desiredOutcome: normalizeMatchToken(parsed.data.targetAudience.desiredOutcome),
    },
    creatorRequirements: {
      ...parsed.data.creatorRequirements,
      productCategories: parsed.data.creatorRequirements.productCategories?.map(normalizeMatchToken),
    },
  }
}

export function parseContentEvaluation(payload: unknown): { creatorId: string } {
  const parsed = evaluateContentOpportunitySchema.safeParse(payload)
  if (!parsed.success) throw validation('Content opportunity evaluation payload is invalid', parsed.error)
  return parsed.data
}

function validation(message: string, error: z.ZodError): AppError {
  return AppError.validation(message, {
    issues: error.issues.map((issue) => ({ field: issue.path.join('.') || '(body)', message: issue.message })),
  })
}
