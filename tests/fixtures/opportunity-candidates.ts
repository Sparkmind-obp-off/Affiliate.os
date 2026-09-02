/**
 * Shared test fixtures for Module 05.
 *
 * The anchor fixture is the opportunity card published in the source
 * specification (OPPORTUNITY ENGINE & SCORING SYSTEM v1.0 §38). It is kept in
 * one place so that every suite asserts against the SAME published example: if
 * the engine ever stops reproducing that card, the whole vertical fails, not
 * just one test.
 */

import type { OpportunityCandidate } from '@modules/module-05-opportunity'

/** The §38 opportunity card, verbatim: score 84, STRONG, TEST NOW. */
export const SPEC_CARD_CANDIDATE: OpportunityCandidate = Object.freeze({
  candidate_ref: 'OPP-00124',
  product_name: 'Shoe Cleaning Foam',
  demand: 82,
  product_fit: 94,
  creator_fit: 88,
  content_potential: 95,
  economics: 72,
  competition: 64,
  momentum: 86,
  risk: 18,
  confidence: 'HIGH',
  execution: Object.freeze({
    budget_mode: 'NORMAL',
    sample_required: false,
    production_complexity: 'LOW',
    creator_can_produce_content: true,
    product_accessible: true,
  }),
  content_gap_identified: false,
  policy_risk_flagged: false,
  missing_signals: [],
}) as OpportunityCandidate

/** Build a variant of the published card without mutating the fixture. */
export function candidate(overrides: Partial<OpportunityCandidate> = {}): OpportunityCandidate {
  return {
    ...SPEC_CARD_CANDIDATE,
    ...overrides,
    execution: { ...SPEC_CARD_CANDIDATE.execution, ...(overrides.execution ?? {}) },
    missing_signals: overrides.missing_signals ?? [],
  }
}

/** The same card as a JSON request body for the HTTP suites. */
export function candidatePayload(
  overrides: Partial<OpportunityCandidate> = {},
): Record<string, unknown> {
  return candidate(overrides) as unknown as Record<string, unknown>
}
