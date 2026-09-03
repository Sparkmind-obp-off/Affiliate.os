import { AppError } from '../../../shared/errors/app-error.js'
import {
  calculateDemandScore,
  classifyDemandStatus,
  isDemandConfidence,
  isDemandSignalType,
  isDemandSourceType,
  normalizeCanonicalProblem,
  type DemandSignalInput,
} from '../domain/demand.js'
import type { DemandSignalRepository } from './ports.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_LIST_LIMIT = 100

type CreatedDemandSignal = Awaited<ReturnType<DemandSignalRepository['create']>>

export function parseDemandInput(payload: unknown): DemandSignalInput {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw invalid()
  const p = payload as Record<string, unknown>
  const requiredStrings = ['problem', 'audience', 'signalType', 'sourceType', 'observedAt', 'confidence', 'evidence']
  for (const field of requiredStrings) {
    if (typeof p[field] !== 'string' || !p[field].trim()) throw invalid(field)
  }
  if (p.category !== undefined && typeof p.category !== 'string') throw invalid('category')
  if (p.keyword !== undefined && typeof p.keyword !== 'string') throw invalid('keyword')
  if (p.sourceRef !== undefined && typeof p.sourceRef !== 'string') throw invalid('sourceRef')
  if (typeof p.signalValue !== 'number' || !Number.isFinite(p.signalValue) || p.signalValue < 0 || p.signalValue > 100) throw invalid('signalValue')
  if (Number.isNaN(Date.parse(p.observedAt as string))) throw invalid('observedAt')
  if (!isDemandSignalType(p.signalType)) throw invalid('signalType')
  if (!isDemandSourceType(p.sourceType)) throw invalid('sourceType')
  if (!isDemandConfidence(p.confidence)) throw invalid('confidence')
  return {
    problem: p.problem as string,
    audience: p.audience as string,
    category: p.category as string | undefined,
    keyword: p.keyword as string | undefined,
    signalType: p.signalType,
    signalValue: p.signalValue,
    sourceType: p.sourceType,
    sourceRef: p.sourceRef as string | undefined,
    observedAt: p.observedAt as string,
    confidence: p.confidence,
    evidence: p.evidence as string,
  }
}

export async function createDemandSignal(
  payload: unknown,
  workspaceId: string,
  repository: DemandSignalRepository,
): Promise<CreatedDemandSignal> {
  if (!UUID_RE.test(workspaceId)) throw AppError.validation('Workspace id is invalid')
  const input = parseDemandInput(payload)
  const canonicalProblem = normalizeCanonicalProblem(input.problem)
  const collectedAt = new Date().toISOString()
  const demandScore = calculateDemandScore(input)
  const status = classifyDemandStatus(input, demandScore)
  const fingerprint = await fingerprintFor(workspaceId, input, canonicalProblem)
  try {
    return await repository.create({
      ...input,
      workspaceId,
      canonicalProblem,
      collectedAt,
      demandScore,
      status,
      createdAt: collectedAt,
      updatedAt: collectedAt,
      fingerprint,
    })
  } catch (error) {
    if (isUniqueViolation(error)) throw AppError.conflict('An equivalent demand signal already exists')
    throw AppError.internal('Failed to persist demand signal', error)
  }
}

export async function getDemandSignal(id: string, workspaceId: string, repository: DemandSignalRepository) {
  if (!UUID_RE.test(id)) throw AppError.validation('Demand signal id is invalid')
  const signal = await repository.findById(workspaceId, id)
  if (!signal) throw AppError.notFound('Demand signal not found')
  return signal
}

export async function listDemandSignals(workspaceId: string, rawLimit: string | undefined, repository: DemandSignalRepository) {
  if (!UUID_RE.test(workspaceId)) throw AppError.validation('Workspace id is invalid')
  const limit = rawLimit === undefined ? 20 : Number(rawLimit)
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIST_LIMIT) throw AppError.validation('Demand signal limit is invalid')
  return repository.list(workspaceId, limit)
}

async function fingerprintFor(workspaceId: string, input: DemandSignalInput, canonicalProblem: string): Promise<string> {
  const raw = JSON.stringify([
    workspaceId,
    canonicalProblem,
    input.audience.trim().toLowerCase(),
    input.keyword?.trim().toLowerCase() ?? '',
    input.signalType,
    input.sourceType,
    input.sourceRef?.trim() ?? '',
    input.observedAt,
  ])
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function invalid(field = '(body)'): AppError {
  return AppError.validation('Demand signal payload is invalid', {
    issues: [{ field, message: 'invalid or missing value' }],
  })
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505'
}
