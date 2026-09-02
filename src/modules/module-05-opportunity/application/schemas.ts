/**
 * Application-layer input validation.
 *
 * Contract source: DOC 22 §216 (canonical API structure), §223 (error
 * contract); DOC 24 §326 (a controller only parses, validates, calls the
 * application service, and serializes).
 *
 * Validation lives in the application layer, not in the HTTP adapter, so the
 * same use case is safe when invoked from another transport later.
 */

import { z } from 'zod'
import {
  BUDGET_MODES,
  CONFIDENCE_LEVELS,
  MOMENTUM_STATES,
  OPPORTUNITY_DIMENSIONS,
  PRODUCTION_COMPLEXITY,
} from '../domain/signals.js'
import { MAX_SHORTLIST_SIZE } from '../domain/evaluator.js'

/** A 0–100 signal. Out-of-range values are REJECTED, not silently clamped. */
const signalScore = z
  .number({ invalid_type_error: 'must be a number between 0 and 100' })
  .finite()
  .min(0)
  .max(100)

const momentumSchema = z.union([z.enum(MOMENTUM_STATES), signalScore])

const executionSchema = z.object({
  budget_mode: z.enum(BUDGET_MODES),
  sample_required: z.boolean(),
  production_complexity: z.enum(PRODUCTION_COMPLEXITY),
  creator_can_produce_content: z.boolean(),
  product_accessible: z.boolean(),
})

const provenanceSchema = z.object({
  source: z.string().min(1).max(200),
  checked_at: z.string().datetime({ offset: true }),
})

export const candidateSchema = z.object({
  candidate_ref: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[A-Za-z0-9_.:-]+$/, 'must contain only letters, digits and _ . : -'),
  product_name: z.string().min(1).max(300),
  demand: signalScore,
  product_fit: signalScore,
  creator_fit: signalScore,
  content_potential: signalScore,
  economics: signalScore,
  /** Competition HEADROOM: 100 = uncontested, 0 = saturated. */
  competition: signalScore,
  momentum: momentumSchema,
  /** Risk EXPOSURE: 0 = none, 100 = extreme. */
  risk: signalScore,
  confidence: z.enum(CONFIDENCE_LEVELS),
  execution: executionSchema,
  content_gap_identified: z.boolean().default(false),
  policy_risk_flagged: z.boolean().default(false),
  missing_signals: z.array(z.enum(OPPORTUNITY_DIMENSIONS)).max(8).default([]),
  provenance: provenanceSchema.optional(),
})

export const evaluateRequestSchema = z.object({
  candidate: candidateSchema,
})

export const MAX_BATCH_SIZE = 100

export const rankRequestSchema = z.object({
  candidates: z.array(candidateSchema).min(1).max(MAX_BATCH_SIZE),
  shortlist_size: z.number().int().min(1).max(MAX_SHORTLIST_SIZE).optional(),
})

export type EvaluateRequest = z.infer<typeof evaluateRequestSchema>
export type RankRequest = z.infer<typeof rankRequestSchema>

/** Field-level validation detail — safe to return to the client (DOC 22 §223). */
export interface FieldIssue {
  field: string
  message: string
}

export function toFieldIssues(error: z.ZodError): FieldIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    message: issue.message,
  }))
}
