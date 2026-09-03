import { describe, expect, it, vi } from 'vitest'
import {
  DEMAND_CONFIDENCE,
  DEMAND_SIGNAL_TYPES,
  DEMAND_SOURCE_TYPES,
  PostgresDemandSignalRepository,
  calculateDemandScore,
  classifyDemandStatus,
  createDemandSignal,
  fingerprintDemandSignal,
  getDemandSignal,
  isDemandConfidence,
  isDemandSignalType,
  isDemandSourceType,
  listDemandSignals,
  normalizeCanonicalProblem,
  parseDemandInput,
  parseDemandListLimit,
  type DemandClock,
  type DemandPostgresQueryExecutor,
  type DemandSignal,
  type DemandSignalRepository,
} from '@modules/module-04-demand'

const WORKSPACE = '22222222-2222-4222-8222-222222222222'
const OTHER_WORKSPACE = '55555555-5555-4555-8555-555555555555'
const ID = '11111111-1111-4111-8111-111111111111'
const ISO = '2026-09-02T11:00:00.000Z'
const clock: DemandClock = { now: () => new Date(ISO) }

const input = {
  problem: '  Sepatu putih kotor!  ',
  audience: 'Sneaker users',
  category: 'Cleaning',
  keyword: 'clean sneakers',
  signalType: 'conversation' as const,
  signalValue: 100,
  sourceType: 'tiktok' as const,
  sourceRef: 'video-123',
  observedAt: '2026-09-02T10:00:00.000Z',
  confidence: 'high' as const,
  evidence: 'Repeated purchase-intent comments asking where to buy.',
}

class MemoryDemandRepository implements DemandSignalRepository {
  readonly records: DemandSignal[] = []

  async create(signal: Omit<DemandSignal, 'id'>): Promise<DemandSignal> {
    if (this.records.some((record) => (
      record.workspaceId === signal.workspaceId && record.fingerprint === signal.fingerprint
    ))) {
      throw { code: '23505' }
    }
    const created = { ...signal, id: this.records.length === 0 ? ID : crypto.randomUUID() }
    this.records.push(created)
    return created
  }

  async findById(workspaceId: string, id: string): Promise<DemandSignal | null> {
    return this.records.find((record) => record.workspaceId === workspaceId && record.id === id) ?? null
  }

  async list(workspaceId: string, limit: number): Promise<DemandSignal[]> {
    return this.records.filter((record) => record.workspaceId === workspaceId).slice(0, limit)
  }
}

function storedSignal(overrides: Partial<DemandSignal> = {}): DemandSignal {
  return {
    id: ID,
    workspaceId: WORKSPACE,
    ...input,
    canonicalProblem: 'sepatu putih kotor',
    collectedAt: ISO,
    demandScore: 81,
    status: 'OPPORTUNITY_READY',
    fingerprint: 'a'.repeat(64),
    createdAt: ISO,
    updatedAt: ISO,
    ...overrides,
  }
}

function row(signal = storedSignal()) {
  return {
    id: signal.id,
    workspace_id: signal.workspaceId,
    problem: signal.problem,
    canonical_problem: signal.canonicalProblem,
    audience: signal.audience,
    category: signal.category ?? null,
    keyword: signal.keyword ?? null,
    signal_type: signal.signalType,
    signal_value: String(signal.signalValue),
    source_type: signal.sourceType,
    source_ref: signal.sourceRef ?? null,
    observed_at: signal.observedAt,
    collected_at: signal.collectedAt,
    confidence: signal.confidence,
    evidence: signal.evidence,
    status: signal.status,
    demand_score: String(signal.demandScore),
    fingerprint: signal.fingerprint,
    created_at: signal.createdAt,
    updated_at: signal.updatedAt,
  }
}

describe('Task 09 demand domain', () => {
  it('accepts only controlled signal, source, and confidence vocabularies', () => {
    for (const value of DEMAND_SIGNAL_TYPES) expect(isDemandSignalType(value)).toBe(true)
    for (const value of DEMAND_SOURCE_TYPES) expect(isDemandSourceType(value)).toBe(true)
    for (const value of DEMAND_CONFIDENCE) expect(isDemandConfidence(value)).toBe(true)
    expect(isDemandSignalType('viral')).toBe(false)
    expect(isDemandSourceType('unknown')).toBe(false)
    expect(isDemandConfidence('certain')).toBe(false)
  })

  it('normalizes Unicode, casing, punctuation, and whitespace without semantic rewriting', () => {
    expect(normalizeCanonicalProblem('  Ｓｅｐａｔｕ PUTIH...\n kotor!! ')).toBe('sepatu putih kotor')
    expect(normalizeCanonicalProblem('Kulit-sensitif')).toBe('kulit-sensitif')
  })

  it('calculates a bounded deterministic score and classifies every maturity band', () => {
    expect(calculateDemandScore(input)).toBe(81)
    expect(calculateDemandScore(input)).toBe(calculateDemandScore({ ...input }))
    for (const signalType of DEMAND_SIGNAL_TYPES) {
      const score = calculateDemandScore({ ...input, signalType })
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
    expect(classifyDemandStatus(input, 81)).toBe('OPPORTUNITY_READY')
    expect(classifyDemandStatus({ ...input, confidence: 'medium' }, 81)).toBe('CONFIRMED')
    expect(classifyDemandStatus(input, 50)).toBe('VALIDATING')
    expect(classifyDemandStatus(input, 25)).toBe('OBSERVING')
    expect(classifyDemandStatus(input, 10)).toBe('DISCOVERED')
  })
})

describe('Task 09 validation and duplicate identity', () => {
  it('parses and canonicalizes a valid evidence-first input timestamp', () => {
    expect(parseDemandInput({ ...input, observedAt: '2026-09-02T12:00:00+02:00' })).toMatchObject({
      problem: 'Sepatu putih kotor!',
      observedAt: '2026-09-02T10:00:00.000Z',
      signalType: 'conversation',
    })
  })

  it.each([
    [{ ...input, problem: '' }],
    [{ ...input, evidence: '' }],
    [{ ...input, signalType: 'viral' }],
    [{ ...input, sourceType: 'unknown' }],
    [{ ...input, confidence: 'certain' }],
    [{ ...input, signalValue: -1 }],
    [{ ...input, signalValue: 101 }],
    [{ ...input, observedAt: 'tomorrow' }],
    [{ ...input, workspace_id: OTHER_WORKSPACE }],
  ])('rejects malformed or authority-bearing payload %#', (payload) => {
    expect(() => parseDemandInput(payload)).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }))
  })

  it('validates bounded integer list limits', () => {
    expect(parseDemandListLimit(undefined)).toBe(20)
    expect(parseDemandListLimit('100')).toBe(100)
    for (const raw of ['0', '101', '1.5', '-1', 'abc', ' 1']) {
      expect(() => parseDemandListLimit(raw)).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }))
    }
  })

  it('generates stable normalized fingerprints that remain tenant scoped', async () => {
    const parsed = parseDemandInput(input)
    const equivalent = parseDemandInput({
      ...input,
      problem: 'SEPATU   putih kotor???',
      audience: ' sneaker USERS ',
    })
    const first = await fingerprintDemandSignal(WORKSPACE, parsed)
    const second = await fingerprintDemandSignal(WORKSPACE, equivalent)
    const otherTenant = await fingerprintDemandSignal(OTHER_WORKSPACE, parsed)
    expect(first).toHaveLength(64)
    expect(first).toBe(second)
    expect(otherTenant).not.toBe(first)
  })

  it('maps the authoritative database uniqueness violation to a safe conflict', async () => {
    const repository = new MemoryDemandRepository()
    await createDemandSignal(input, WORKSPACE, { repository, clock })
    await expect(createDemandSignal(input, WORKSPACE, { repository, clock }))
      .rejects.toMatchObject({ code: 'CONFLICT' })
  })
})

describe('Task 09 tenant-scoped application and persistence', () => {
  it('creates, gets, and lists only within the server-derived workspace', async () => {
    const repository = new MemoryDemandRepository()
    const created = await createDemandSignal(input, WORKSPACE, { repository, clock })
    expect(created).toMatchObject({
      workspaceId: WORKSPACE,
      canonicalProblem: 'sepatu putih kotor',
      collectedAt: ISO,
      demandScore: 81,
      status: 'OPPORTUNITY_READY',
    })
    await expect(getDemandSignal(ID, WORKSPACE, repository)).resolves.toEqual(created)
    await expect(getDemandSignal(ID, OTHER_WORKSPACE, repository))
      .rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' })
    await expect(listDemandSignals(OTHER_WORKSPACE, undefined, repository)).resolves.toEqual([])
    await expect(getDemandSignal('not-a-uuid', WORKSPACE, repository))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    await expect(listDemandSignals('not-a-uuid', undefined, repository))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('uses workspace-scoped parameterized SQL for create, get, and bounded list', async () => {
    const db = {
      query: vi.fn(async (sql: string) => ({
        rows: sql.startsWith('INSERT') || sql.includes('id = $2') ? [row()] : [row()],
      })),
    } as unknown as DemandPostgresQueryExecutor
    const repository = new PostgresDemandSignalRepository(db)
    const { id, ...createInput } = storedSignal()
    expect(id).toBe(ID)
    await repository.create(createInput)
    await repository.findById(WORKSPACE, ID)
    await repository.list(WORKSPACE, 20)
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringMatching(/workspace_id = \$1 AND id = \$2/), [WORKSPACE, ID])
    expect(db.query).toHaveBeenNthCalledWith(3, expect.stringMatching(/workspace_id = \$1[\s\S]*LIMIT \$2/), [WORKSPACE, 20])
  })

  it('rejects malformed stored enum data safely', async () => {
    const db = ({
      query: async () => ({
        rows: [row(storedSignal({ status: 'INVALID' as DemandSignal['status'] }))],
      }),
    }) as unknown as DemandPostgresQueryExecutor
    const repository = new PostgresDemandSignalRepository(db)
    await expect(repository.findById(WORKSPACE, ID)).rejects.toMatchObject({ code: 'INTERNAL_ERROR' })
  })
})
