/**
 * Disclosed model descriptor.
 *
 * MVP Scope §16 states the scoring weights are a STARTING HYPOTHESIS to be
 * calibrated once real data exists, and Opportunity Engine §7 insists the score
 * is a decision-support signal rather than absolute truth. Both are only
 * honest if the model is inspectable, so the weights, bands, decision ladder,
 * priority multipliers and angle catalogue are published as data.
 */

import { ANGLE_CATALOGUE_DESCRIPTORS, ANGLE_MODEL_VERSION } from './angles.js'
import {
  DECISION_MODEL_VERSION,
  DECISION_RULE_DESCRIPTORS,
  DECISION_THRESHOLDS,
} from './decision.js'
import { EXPLANATION_MODEL_VERSION } from './explanation.js'
import {
  CONFIDENCE_MULTIPLIER,
  PRIORITY_MODEL_VERSION,
  SAMPLE_PENALTY,
  COMPLEXITY_MULTIPLIER,
  BUDGET_COMPLEXITY_TOLERANCE,
} from './priority.js'
import {
  CLASSIFICATION_BANDS,
  DIMENSION_WEIGHTS,
  SCORING_MODEL_VERSION,
} from './scoring.js'
import { DEFAULT_SHORTLIST_SIZE, MAX_SHORTLIST_SIZE } from './evaluator.js'
import { MOMENTUM_STATE_SCORE, OPPORTUNITY_DIMENSIONS } from './signals.js'

export function describeScoringModel() {
  return {
    module: 'module-05-opportunity',
    source: 'AFFILIATE OS — OPPORTUNITY ENGINE & SCORING SYSTEM v1.0',
    versions: {
      scoring: SCORING_MODEL_VERSION,
      decision: DECISION_MODEL_VERSION,
      priority: PRIORITY_MODEL_VERSION,
      angle: ANGLE_MODEL_VERSION,
      explanation: EXPLANATION_MODEL_VERSION,
    },
    scoring: {
      dimensions: OPPORTUNITY_DIMENSIONS,
      weights: DIMENSION_WEIGHTS,
      /** Documented so `competition` and `risk` cannot be misread. */
      polarity: {
        competition: 'HEADROOM — 100 = uncontested content space, 0 = saturated',
        risk: 'EXPOSURE — 0 = no risk, 100 = extreme risk; inverted as 100 - risk before weighting',
      },
      momentum_state_scores: MOMENTUM_STATE_SCORE,
      classification_bands: CLASSIFICATION_BANDS,
      note: 'Weights are a starting hypothesis (MVP Scope §16) and are expected to be calibrated once experiment data exists.',
    },
    decision: {
      thresholds: DECISION_THRESHOLDS,
      /** Fixed precedence — the first matching rule wins (14A §14D). */
      rules: DECISION_RULE_DESCRIPTORS,
    },
    priority: {
      formula: 'priority = opportunity_score × confidence_multiplier × execution_feasibility',
      confidence_multiplier: CONFIDENCE_MULTIPLIER,
      sample_penalty: SAMPLE_PENALTY,
      complexity_multiplier: COMPLEXITY_MULTIPLIER,
      budget_complexity_tolerance: BUDGET_COMPLEXITY_TOLERANCE,
      bands: { P0: '>= 70', P1: '>= 55', P2: '>= 40', P3: '< 40' },
    },
    angles: {
      catalogue: ANGLE_CATALOGUE_DESCRIPTORS,
      scored_on: [
        'hook_strength',
        'problem_relevance',
        'demonstrability',
        'novelty',
        'proof',
        'audience_fit',
      ],
      boundary:
        'Strategy only — angle, hook direction, proof mechanism, CTA direction. Content production is out of MVP scope (MVP Scope §19).',
    },
    ranking: {
      default_shortlist_size: DEFAULT_SHORTLIST_SIZE,
      max_shortlist_size: MAX_SHORTLIST_SIZE,
    },
    determinism:
      'Same candidate + same model versions ⇒ same score, decision, priority and angle ordering. No AI, randomness or clock participates in the decision.',
  }
}

export type ScoringModelDescriptor = ReturnType<typeof describeScoringModel>
