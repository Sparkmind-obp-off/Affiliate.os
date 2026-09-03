export const DEMAND_SIGNAL_TYPES = [
  'problem',
  'search',
  'conversation',
  'content',
  'commercial_intent',
  'transaction',
  'creator',
  'trend',
] as const
export type DemandSignalType = (typeof DEMAND_SIGNAL_TYPES)[number]

export const DEMAND_SOURCE_TYPES = [
  'tiktok',
  'tiktok_shop',
  'search',
  'social',
  'marketplace',
  'creator_content',
  'user_input',
  'external_research',
] as const
export type DemandSourceType = (typeof DEMAND_SOURCE_TYPES)[number]

export const DEMAND_CONFIDENCE = ['low', 'medium', 'high', 'very_high'] as const
export type DemandConfidence = (typeof DEMAND_CONFIDENCE)[number]

export const DEMAND_STATUSES = [
  'DISCOVERED',
  'OBSERVING',
  'VALIDATING',
  'CONFIRMED',
  'OPPORTUNITY_READY',
] as const
export type DemandStatus = (typeof DEMAND_STATUSES)[number]

export interface DemandSignalInput {
  problem: string
  audience: string
  category?: string
  keyword?: string
  signalType: DemandSignalType
  signalValue: number
  sourceType: DemandSourceType
  sourceRef?: string
  observedAt: string
  confidence: DemandConfidence
  evidence: string
}

export interface DemandSignal extends DemandSignalInput {
  id: string
  workspaceId: string
  canonicalProblem: string
  collectedAt: string
  demandScore: number
  status: DemandStatus
  fingerprint: string
  createdAt: string
  updatedAt: string
}

export function isDemandSignalType(value: unknown): value is DemandSignalType {
  return typeof value === 'string' && (DEMAND_SIGNAL_TYPES as readonly string[]).includes(value)
}

export function isDemandSourceType(value: unknown): value is DemandSourceType {
  return typeof value === 'string' && (DEMAND_SOURCE_TYPES as readonly string[]).includes(value)
}

export function isDemandConfidence(value: unknown): value is DemandConfidence {
  return typeof value === 'string' && (DEMAND_CONFIDENCE as readonly string[]).includes(value)
}

export function isDemandStatus(value: unknown): value is DemandStatus {
  return typeof value === 'string' && (DEMAND_STATUSES as readonly string[]).includes(value)
}

/**
 * Conservative canonicalization used for comparison and fingerprinting.
 * It intentionally avoids stemming, translation, or semantic rewriting.
 */
export function normalizeCanonicalProblem(problem: string): string {
  return problem
    .normalize('NFKC')
    .toLocaleLowerCase('und')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Explicit, bounded and reproducible foundation score (0–100). */
export function calculateDemandScore(input: DemandSignalInput): number {
  const signal = Math.max(0, Math.min(100, input.signalValue))
  const signalTypeWeight: Record<DemandSignalType, number> = {
    transaction: 1,
    commercial_intent: 0.95,
    conversation: 0.9,
    search: 0.8,
    problem: 0.8,
    creator: 0.75,
    content: 0.55,
    trend: 0.45,
  }
  const confidenceWeight: Record<DemandConfidence, number> = {
    low: 0.55,
    medium: 0.75,
    high: 0.9,
    very_high: 1,
  }
  return Math.round(signal * signalTypeWeight[input.signalType] * confidenceWeight[input.confidence] * 100) / 100
}

/** Status communicates evidence maturity; it never creates an opportunity. */
export function classifyDemandStatus(input: DemandSignalInput, score: number): DemandStatus {
  if (score >= 80 && (input.confidence === 'high' || input.confidence === 'very_high')) {
    return 'OPPORTUNITY_READY'
  }
  if (score >= 65) return 'CONFIRMED'
  if (score >= 40) return 'VALIDATING'
  if (score >= 20) return 'OBSERVING'
  return 'DISCOVERED'
}
