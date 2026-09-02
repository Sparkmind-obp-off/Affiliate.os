/**
 * Angle engine.
 *
 * Contract source: OPPORTUNITY ENGINE & SCORING SYSTEM v1.0
 *   §40 recommended angle / format / hook / proof / CTA
 *   §41 possible angles for a demand+product pair
 *   §42 angle scoring dimensions
 *   §43 opportunity → best angle → hook → template
 *
 * BOUNDARY (MVP Scope §10, §19): this produces STRATEGY — an angle, a hook
 * direction, a proof mechanism, a CTA direction. It does NOT produce content,
 * scripts, video, or assets. Content production is explicitly out of MVP.
 *
 * The catalogue is deterministic and hand-authored. No AI participates: the
 * same opportunity always yields the same ranked angles.
 */

import { clampScore, resolveMomentumScore, type OpportunityCandidate } from './signals.js'

export const ANGLE_MODEL_VERSION = '1.0.0'

/** §14 content formats the MVP recognises. */
export const ANGLE_FORMATS = [
  'BEFORE_AFTER',
  'PROBLEM_SOLUTION',
  'REAL_TEST',
  'COMPARISON',
  'TUTORIAL',
  'UNBOXING',
] as const

export type AngleFormat = (typeof ANGLE_FORMATS)[number]

/** §42 — the six dimensions each angle is scored on. */
export const ANGLE_SCORE_DIMENSIONS = [
  'hook_strength',
  'problem_relevance',
  'demonstrability',
  'novelty',
  'proof',
  'audience_fit',
] as const

export type AngleScoreDimension = (typeof ANGLE_SCORE_DIMENSIONS)[number]

export interface AngleScoreBreakdown {
  hook_strength: number
  problem_relevance: number
  demonstrability: number
  novelty: number
  proof: number
  audience_fit: number
}

export interface RecommendedAngle {
  angle_id: string
  format: AngleFormat
  angle: string
  /** Hook DIRECTION, not a finished script (MVP Scope §19). */
  hook_direction: string
  proof_mechanism: string
  cta_direction: string
  /** 0–100, mean of the six §42 dimensions. */
  score: number
  breakdown: AngleScoreBreakdown
  /** Why this angle was ranked where it was. */
  rationale: string
}

interface AngleTemplate {
  angle_id: string
  format: AngleFormat
  angle: string
  hook_direction: string
  proof_mechanism: string
  cta_direction: string
  rationale: string
  /**
   * Weight of each input signal on each §42 dimension. Deterministic and
   * inspectable — the angle catalogue is a rule table, not a model.
   */
  score(input: AngleInput): AngleScoreBreakdown
}

interface AngleInput {
  demand: number
  productFit: number
  contentPotential: number
  creatorFit: number
  /** Competition HEADROOM: 100 = uncontested, 0 = saturated. */
  competition: number
  momentum: number
  contentGap: boolean
}

const mean = (values: number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length

const avg2 = (a: number, b: number): number => clampScore((a + b) / 2)
const avg3 = (a: number, b: number, c: number): number => clampScore((a + b + c) / 3)

/**
 * §41 — the MVP angle catalogue.
 *
 * Novelty is derived from competition headroom and the identified content gap:
 * in a saturated space (§52) a differentiated angle is where the remaining
 * novelty lives, so gap-driven angles gain and showcase-style angles lose.
 */
const CATALOGUE: readonly AngleTemplate[] = Object.freeze([
  {
    angle_id: 'ANG_BEFORE_AFTER',
    format: 'BEFORE_AFTER',
    angle: 'Show the state before, the process, and the verified result.',
    hook_direction: 'Open on the unresolved problem at its worst, before any solution is shown.',
    proof_mechanism: 'Single continuous transformation captured in one take.',
    cta_direction: 'Invite the viewer to inspect the product used in the transformation.',
    rationale:
      'Highest-leverage format when the product effect is visible: the proof and the hook are the same shot.',
    score: (i) => ({
      hook_strength: avg2(i.demand, i.contentPotential),
      problem_relevance: avg2(i.demand, i.productFit),
      demonstrability: clampScore(i.contentPotential),
      novelty: clampScore(i.contentGap ? 100 - i.competition * 0.4 : 100 - i.competition * 0.8),
      proof: clampScore(i.contentPotential * 0.7 + i.productFit * 0.3),
      audience_fit: clampScore(i.creatorFit),
    }),
  },
  {
    angle_id: 'ANG_PROBLEM_FIRST',
    format: 'PROBLEM_SOLUTION',
    angle: 'Lead with the problem and its cost, then introduce the product as the answer.',
    hook_direction: 'Name the problem in the viewer\u2019s own words within the first seconds.',
    proof_mechanism: 'Demonstrate the problem disappearing under normal use conditions.',
    cta_direction: 'Point to the product as the specific fix for the named problem.',
    rationale:
      'Works even where the transformation is less visual, because relevance carries the hook.',
    score: (i) => ({
      hook_strength: clampScore(i.demand * 0.7 + i.productFit * 0.3),
      problem_relevance: clampScore(i.demand * 0.5 + i.productFit * 0.5),
      demonstrability: clampScore(i.contentPotential * 0.8),
      novelty: clampScore(i.contentGap ? 100 - i.competition * 0.35 : 100 - i.competition * 0.7),
      proof: clampScore(i.productFit * 0.6 + i.contentPotential * 0.4),
      audience_fit: avg2(i.creatorFit, i.demand),
    }),
  },
  {
    angle_id: 'ANG_REAL_TEST',
    format: 'REAL_TEST',
    angle: 'Test the product\u2019s claim honestly, including where it underperforms.',
    hook_direction: 'Frame the claim as a question the viewer already suspects is exaggerated.',
    proof_mechanism: 'Unedited test with the failure case shown, not hidden.',
    cta_direction: 'Let the result speak, then point to the product for those it suits.',
    rationale:
      'Credibility angle: strongest where the space is saturated with uniform showcase content.',
    score: (i) => ({
      hook_strength: clampScore(i.demand * 0.55 + (100 - i.competition) * 0.45),
      problem_relevance: clampScore(i.demand * 0.6 + i.productFit * 0.4),
      demonstrability: clampScore(i.contentPotential * 0.85),
      novelty: clampScore(i.contentGap ? 100 - i.competition * 0.2 : 100 - i.competition * 0.55),
      proof: clampScore(i.contentPotential * 0.5 + i.productFit * 0.5),
      audience_fit: clampScore(i.creatorFit * 0.9),
    }),
  },
  {
    angle_id: 'ANG_COMPARISON',
    format: 'COMPARISON',
    angle: 'Compare the product against the cheaper and the expensive alternative.',
    hook_direction: 'Pose the choice the viewer is actually facing between the options.',
    proof_mechanism: 'Same task, same conditions, side by side.',
    cta_direction: 'Recommend the option that wins on the criterion the viewer cares about.',
    rationale:
      'Turns a crowded category into a decision aid; needs a genuinely contested space to matter.',
    score: (i) => ({
      hook_strength: clampScore(i.demand * 0.5 + (100 - i.competition) * 0.5),
      problem_relevance: clampScore(i.demand * 0.55 + i.productFit * 0.45),
      demonstrability: clampScore(i.contentPotential * 0.75),
      novelty: clampScore(i.contentGap ? 100 - i.competition * 0.25 : 100 - i.competition * 0.6),
      proof: clampScore(i.contentPotential * 0.45 + i.productFit * 0.55),
      audience_fit: clampScore(i.creatorFit * 0.85),
    }),
  },
  {
    angle_id: 'ANG_TUTORIAL',
    format: 'TUTORIAL',
    angle: 'Teach the outcome; the product appears as the tool that makes it work.',
    hook_direction: 'Promise a specific outcome the viewer wants to reproduce.',
    proof_mechanism: 'Reproducible step sequence the viewer can follow.',
    cta_direction: 'Reference the product as part of the method, not as the subject.',
    rationale: 'Low-friction angle for creators with method authority; needs real creator fit.',
    score: (i) => ({
      hook_strength: clampScore(i.demand * 0.45 + i.creatorFit * 0.55),
      problem_relevance: clampScore(i.demand * 0.5 + i.productFit * 0.5),
      demonstrability: clampScore(i.contentPotential * 0.7),
      novelty: clampScore(100 - i.competition * 0.5),
      proof: clampScore(i.productFit * 0.5 + i.creatorFit * 0.5),
      audience_fit: clampScore(i.creatorFit),
    }),
  },
  {
    angle_id: 'ANG_UNBOXING',
    format: 'UNBOXING',
    angle: 'First-contact reaction: what the product actually is versus how it is sold.',
    hook_direction: 'Set an expectation from the listing, then open the box against it.',
    proof_mechanism: 'Unedited first impression, including build and packaging reality.',
    cta_direction: 'Point to the product with the expectation gap stated honestly.',
    rationale:
      'Weakest of the catalogue for decision-support: easy to produce, easily saturated, thin proof.',
    score: (i) => ({
      hook_strength: clampScore(i.momentum * 0.5 + i.demand * 0.5),
      problem_relevance: clampScore(i.productFit * 0.5 + i.demand * 0.3),
      demonstrability: clampScore(i.contentPotential * 0.6),
      novelty: clampScore(100 - i.competition * 0.9),
      proof: clampScore(i.contentPotential * 0.35),
      audience_fit: avg3(i.creatorFit, i.demand, i.momentum),
    }),
  },
])

/** Build the ranked angle list for a candidate. Deterministic ordering. */
export function recommendAngles(candidate: OpportunityCandidate): RecommendedAngle[] {
  const input: AngleInput = {
    demand: clampScore(candidate.demand),
    productFit: clampScore(candidate.product_fit),
    contentPotential: clampScore(candidate.content_potential),
    creatorFit: clampScore(candidate.creator_fit),
    competition: clampScore(candidate.competition),
    momentum: resolveMomentumScore(candidate.momentum),
    contentGap: candidate.content_gap_identified,
  }

  const scored = CATALOGUE.map((template) => {
    const breakdown = template.score(input)
    const rounded: AngleScoreBreakdown = {
      hook_strength: Math.round(breakdown.hook_strength),
      problem_relevance: Math.round(breakdown.problem_relevance),
      demonstrability: Math.round(breakdown.demonstrability),
      novelty: Math.round(breakdown.novelty),
      proof: Math.round(breakdown.proof),
      audience_fit: Math.round(breakdown.audience_fit),
    }

    return {
      angle_id: template.angle_id,
      format: template.format,
      angle: template.angle,
      hook_direction: template.hook_direction,
      proof_mechanism: template.proof_mechanism,
      cta_direction: template.cta_direction,
      score: Math.round(mean(Object.values(rounded))),
      breakdown: rounded,
      rationale: template.rationale,
    } satisfies RecommendedAngle
  })

  // Sort by score, then by catalogue order for a stable tie-break: two equal
  // angles must never swap places between two identical requests.
  const order = new Map(CATALOGUE.map((t, index) => [t.angle_id, index]))
  return scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return (order.get(a.angle_id) ?? 0) - (order.get(b.angle_id) ?? 0)
  })
}

/** The angle catalogue as data, for the disclosed-model endpoint. */
export const ANGLE_CATALOGUE_DESCRIPTORS = Object.freeze(
  CATALOGUE.map(({ angle_id, format, angle, rationale }) => ({
    angle_id,
    format,
    angle,
    rationale,
  })),
)
