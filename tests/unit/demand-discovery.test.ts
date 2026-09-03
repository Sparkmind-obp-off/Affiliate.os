import { describe, expect, it } from 'vitest'
import {
  calculateDemandScore,
  classifyDemandStatus,
  createDemandSignal,
  normalizeCanonicalProblem,
  parseDemandInput,
  type DemandSignal,
  type DemandSignalRepository,
} from '@modules/module-04-demand'

const WORKSPACE = '22222222-2222-4222-8222-222222222222'
const OTHER_WORKSPACE = '55555555-5555-4555-8555-555555555555'
const ID = '11111111-1111-4111-8111-111111111111'

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
  private readonly records = new Map<string, DemandSignal>()
  async create(signal: Omit<DemandSignal, 'id'> & { fingerprint: string }): Promise<DemandSignal> {
    if ([...this.records.values()].some((record) => record.workspaceId === signal.workspaceId && record.id === ID)) throw { code: '23505' }
    const created = { ...signal, id: ID }
    this.records.set(ID, created)
    return created
  }
  async findById(workspaceId: string, id: string): Promise<DemandSignal | null> {
    const record = this.records.get(id)
    return record?.workspaceId === workspaceId ? record : null
  }
  async list(workspaceId: string, limit: number): Promise<DemandSignal[]> {
    return [...this.records.values()].filter((record) => record.workspaceId === workspaceId).slice(0, limit)
  }
}

describe('Task 09 demand discovery foundation', () => {
  it('normalizes canonical problems deterministically', () => {
    expect(normalizeCanonicalProblem('  Sepatu PUTIH kotor!! ')).toBe('sepatu putih kotor')
  })

  it('validates the evidence-first input contract', () => {
    expect(parseDemandInput(input)).toMatchObject({ problem: input.problem, signalType: 'conversation' })
    expect(() => parseDemandInput({ ...input, signalValue: 101 })).toThrowError()
    expect(() => parseDemandInput({ ...input, evidence: '' })).toThrowError()
    expect(() => parseDemandInput({ ...input, sourceType: 'unknown' })).toThrowError()
  })

  it('applies deterministic signal and confidence weighting', () => {
    const score = calculateDemandScore(input)
    expect(score).toBe(81)
    expect(classifyDemandStatus(input, score)).toBe('OPPORTUNITY_READY')
  })

  it('persists only the current workspace and rejects malformed workspace ids', async () => {
    const repository = new MemoryDemandRepository()
    const created = await createDemandSignal(input, WORKSPACE, repository)
    expect(created.workspaceId).toBe(WORKSPACE)
    await expect(repository.findById(OTHER_WORKSPACE, ID)).resolves.toBeNull()
    await expect(createDemandSignal(input, 'not-a-uuid', repository)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })
})
