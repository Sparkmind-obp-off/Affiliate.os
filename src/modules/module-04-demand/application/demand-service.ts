import { z } from 'zod'
import { AppError } from '../../../shared/errors/app-error.js'
import {
  DEMAND_CONFIDENCE,
  DEMAND_SIGNAL_TYPES,
  DEMAND_SOURCE_TYPES,
  calculateDemandScore,
  classifyDemandStatus,
  normalizeCanonicalProblem,
  type DemandSignal,
  type DemandSignalInput,
} from '../domain/demand.js'
import {
  systemDemandClock,
  type DemandClock,
  type DemandSignalRepository,
} from './ports.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const DEFAULT_DEMAND_LIST_LIMIT = 20
export const MAX_DEMAND_LIST_LIMIT = 100

const trimmedText = (maximum: number) => z.string().trim().min(1).max(maximum)
const optionalTrimmedText = (maximum: number) => trimmedText(maximum).optional()

const demandInputSchema = z.object({
  problem: trimmedText(1_000),
  audience: trimmedText(500),
  category: optionalTrimmedText(200),
  keyword: optionalTrimmedText(300),
  signalType: z.enum(DEMAND_SIGNAL_TYPES),
  signalValue: z.number().finite().min(0).max(100),
  sourceType: z.enum(DEMAND_SOURCE_TYPES),
  sourceRef: optionalTrimmedText(2_000),
  observedAt: z.string().datetime({ offset: true }),
  confidence: z.enum(DEMAND_CONFIDENCE),
  evidence: trimmedText(10_000),
}).strict()

export interface DemandServiceDependencies {
  repository: DemandSignalRepository
  clock?: DemandClock
}

export function parseDemandInput(payload: unknown): DemandSignalInput {
  const parsed = demandInputSchema.safeParse(payload)
  if (!parsed.success) {
    throw AppError.validation('Demand signal payload is invalid', {
      issues: parsed.error.issues.map((issue) => ({
        field: issue.path.join('.') || '(body)',
        message: issue.message,
      })),
    })
  }
  return {
    ...parsed.data,
    observedAt: new Date(parsed.data.observedAt).toISOString(),
  }
}

export async function createDemandSignal(
  payload: unknown,
  workspaceId: string,
  dependencies: DemandServiceDependencies | DemandSignalRepository,
): Promise<DemandSignal> {
  validateWorkspaceId(workspaceId)
  const input = parseDemandInput(payload)
  const canonicalProblem = normalizeCanonicalProblem(input.problem)
  if (!canonicalProblem) {
    throw AppError.validation('Demand signal payload is invalid', {
      issues: [{ field: 'problem', message: 'must contain letters or numbers' }],
    })
  }

  const dependenciesWithClock = isDependencies(dependencies)
    ? dependencies
    : { repository: dependencies }
  const collectedAt = (dependenciesWithClock.clock ?? systemDemandClock).now().toISOString()
  const demandScore = calculateDemandScore(input)
  const status = classifyDemandStatus(input, demandScore)
  const fingerprint = await fingerprintDemandSignal(workspaceId, input, canonicalProblem)

  try {
    return await dependenciesWithClock.repository.create({
      ...input,
      workspaceId,
      canonicalProblem,
      collectedAt,
      demandScore,
      status,
      fingerprint,
      createdAt: collectedAt,
      updatedAt: collectedAt,
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw AppError.conflict('An equivalent demand signal already exists')
    }
    if (error instanceof AppError) throw error
    throw AppError.internal('Failed to persist demand signal', error)
  }
}

export async function getDemandSignal(
  id: string,
  workspaceId: string,
  repository: DemandSignalRepository,
): Promise<DemandSignal> {
  validateWorkspaceId(workspaceId)
  if (!UUID_RE.test(id)) {
    throw AppError.validation('Demand signal id is invalid', {
      issues: [{ field: 'id', message: 'must be a UUID' }],
    })
  }
  try {
    const signal = await repository.findById(workspaceId, id)
    if (!signal) throw AppError.notFound('Demand signal not found')
    return signal
  } catch (error) {
    if (error instanceof AppError) throw error
    throw AppError.internal('Failed to retrieve demand signal', error)
  }
}

export async function listDemandSignals(
  workspaceId: string,
  rawLimit: string | undefined,
  repository: DemandSignalRepository,
): Promise<DemandSignal[]> {
  validateWorkspaceId(workspaceId)
  const limit = parseDemandListLimit(rawLimit)
  try {
    return await repository.list(workspaceId, limit)
  } catch (error) {
    throw AppError.internal('Failed to list demand signals', error)
  }
}

export function parseDemandListLimit(raw: string | undefined): number {
  if (raw === undefined) return DEFAULT_DEMAND_LIST_LIMIT
  if (!/^\d+$/.test(raw)) throw invalidLimit()
  const limit = Number(raw)
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_DEMAND_LIST_LIMIT) {
    throw invalidLimit()
  }
  return limit
}

/** Stable SHA-256 identity for one tenant-owned source observation. */
export async function fingerprintDemandSignal(
  workspaceId: string,
  input: DemandSignalInput,
  canonicalProblem = normalizeCanonicalProblem(input.problem),
): Promise<string> {
  validateWorkspaceId(workspaceId)
  const raw = JSON.stringify([
    workspaceId,
    canonicalProblem,
    normalizeFingerprintText(input.audience),
    normalizeFingerprintText(input.category ?? ''),
    normalizeFingerprintText(input.keyword ?? ''),
    input.signalType,
    input.sourceType,
    normalizeFingerprintText(input.sourceRef ?? ''),
    new Date(input.observedAt).toISOString(),
  ])
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function normalizeFingerprintText(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('und').replace(/\s+/g, ' ').trim()
}

function validateWorkspaceId(workspaceId: string): void {
  if (!UUID_RE.test(workspaceId)) {
    throw AppError.validation('Workspace id is invalid', {
      issues: [{ field: 'workspaceId', message: 'must be a UUID' }],
    })
  }
}

function invalidLimit(): AppError {
  return AppError.validation('Demand signal limit is invalid', {
    issues: [{ field: 'limit', message: `must be an integer from 1 to ${MAX_DEMAND_LIST_LIMIT}` }],
  })
}

function isDependencies(
  value: DemandServiceDependencies | DemandSignalRepository,
): value is DemandServiceDependencies {
  return 'repository' in value
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: string }).code === '23505'
}
