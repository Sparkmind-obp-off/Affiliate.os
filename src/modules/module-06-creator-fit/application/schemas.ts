import { z } from 'zod'
import { AppError } from '../../../shared/errors/app-error.js'
import {
  AFFILIATE_CAPABILITIES,
  AUDIENCE_SEGMENTS,
  CONTENT_FORMATS,
  CREATOR_AVAILABILITY,
  CREATOR_BUDGET_MODES,
  CREATOR_CAPABILITY_TYPES,
  CREATOR_NICHES,
  CREATOR_PLATFORMS,
  EVIDENCE_CONFIDENCE,
  EVIDENCE_SOURCES,
  normalizeMatchToken,
  type CreatorProfileInput,
} from '../domain/creator.js'
import type { CreatorFitCriteria } from '../domain/fit-policy.js'

const text = (max: number) => z.string().trim().min(1).max(max)
const capabilityLevelSchema = z.union([
  z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4),
])
const uniqueArray = <T extends z.ZodTypeAny>(schema: T, max: number) => z.array(schema).max(max)
  .refine((items) => new Set(items.map((item) => JSON.stringify(item))).size === items.length, 'must not contain duplicates')

export const creatorProfileSchema = z.object({
  creatorRef: text(128).regex(/^[A-Za-z0-9_.:-]+$/, 'must contain only letters, digits and _ . : -'),
  displayName: text(200),
  platform: z.enum(CREATOR_PLATFORMS),
  platformRef: text(200).optional(),
  primaryNiche: z.enum(CREATOR_NICHES),
  secondaryNiches: uniqueArray(z.enum(CREATOR_NICHES), 5).default([]),
  productCategories: uniqueArray(text(100), 20).default([]),
  audienceSegments: uniqueArray(z.enum(AUDIENCE_SEGMENTS), 10).default([]),
  audienceInterests: uniqueArray(text(100), 20).default([]),
  contentFormats: uniqueArray(z.enum(CONTENT_FORMATS), 11).default([]),
  capabilities: uniqueArray(z.object({
    type: z.enum(CREATOR_CAPABILITY_TYPES),
    level: capabilityLevelSchema,
  }).strict(), 9).refine(
    (items) => new Set(items.map((item) => item.type)).size === items.length,
    'capability types must be unique',
  ).default([]),
  affiliateCapability: z.enum(AFFILIATE_CAPABILITIES),
  availability: z.enum(CREATOR_AVAILABILITY),
  budgetMode: z.enum(CREATOR_BUDGET_MODES),
  sampleAccess: z.boolean(),
  evidenceSource: z.enum(EVIDENCE_SOURCES),
  evidenceConfidence: z.enum(EVIDENCE_CONFIDENCE),
}).strict()

export const creatorFitRequestSchema = z.object({
  opportunityId: z.string().uuid(),
  criteria: z.object({
    niches: uniqueArray(z.enum(CREATOR_NICHES), 10).optional(),
    productCategories: uniqueArray(text(100), 20).optional(),
    audienceSegments: uniqueArray(z.enum(AUDIENCE_SEGMENTS), 10).optional(),
    contentFormats: uniqueArray(z.enum(CONTENT_FORMATS), 11).optional(),
    capabilityRequirements: uniqueArray(z.object({
      type: z.enum(CREATOR_CAPABILITY_TYPES),
      minimumLevel: capabilityLevelSchema,
    }).strict(), 9).refine(
      (items) => new Set(items.map((item) => item.type)).size === items.length,
      'capability requirement types must be unique',
    ).optional(),
    requiresSample: z.boolean().optional(),
    minimumBudget: z.enum(CREATOR_BUDGET_MODES).optional(),
    affiliateRequired: z.boolean().optional(),
    minimumAvailability: z.enum(CREATOR_AVAILABILITY).optional(),
  }).strict(),
}).strict()

export function parseCreatorProfile(payload: unknown): CreatorProfileInput {
  const parsed = creatorProfileSchema.safeParse(payload)
  if (!parsed.success) throw validation('Creator profile payload is invalid', parsed.error)
  if (parsed.data.secondaryNiches.includes(parsed.data.primaryNiche)) {
    throw AppError.validation('Creator profile payload is invalid', {
      issues: [{ field: 'secondaryNiches', message: 'must not repeat primaryNiche' }],
    })
  }
  return {
    ...parsed.data,
    productCategories: parsed.data.productCategories.map(normalizeMatchToken),
    audienceInterests: parsed.data.audienceInterests.map(normalizeMatchToken),
  }
}

export function parseCreatorFitRequest(payload: unknown): {
  opportunityId: string
  criteria: CreatorFitCriteria
} {
  const parsed = creatorFitRequestSchema.safeParse(payload)
  if (!parsed.success) throw validation('Creator fit payload is invalid', parsed.error)
  return {
    opportunityId: parsed.data.opportunityId,
    criteria: {
      ...parsed.data.criteria,
      productCategories: parsed.data.criteria.productCategories?.map(normalizeMatchToken),
    },
  }
}

function validation(message: string, error: z.ZodError): AppError {
  return AppError.validation(message, {
    issues: error.issues.map((issue) => ({
      field: issue.path.join('.') || '(body)',
      message: issue.message,
    })),
  })
}
