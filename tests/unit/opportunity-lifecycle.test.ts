import { describe, expect, it } from 'vitest'
import {
  canTransitionOpportunity,
  executeTransitionOpportunity,
  type OpportunityRepository,
  type OpportunityStatus,
  type StoredOpportunity,
} from '@modules/module-05-opportunity'
import { SPEC_CARD_CANDIDATE } from '../fixtures/opportunity-candidates.js'

const WORKSPACE = '22222222-2222-4222-8222-222222222222'
const ID = '11111111-1111-4111-8111-111111111111'
const ISO = '2026-01-01T00:00:00.000Z'

function opportunity(status: OpportunityStatus): StoredOpportunity {
  return {
    id: ID,
    workspace_id: WORKSPACE,
    status,
    input: SPEC_CARD_CANDIDATE,
    evaluation: {
      candidate_ref: SPEC_CARD_CANDIDATE.candidate_ref,
      product_name: SPEC_CARD_CANDIDATE.product_name,
      evaluated_at: ISO,
      score: { total: 84, classification: 'STRONG', dimensions: {} },
      decision: { decision: 'TEST_NOW', rule_id: 'R12_TEST_NOW', reason_codes: [] },
      priority: { priority_score: 84, band: 'HIGH', execution_feasibility: { score: 1, reasons: [] } },
      explanation: { strengths: [], cautions: [] },
      recommended_angle: { primary: { id: 'x', title: 'x', rationale: 'x', format: 'DEMO' }, alternatives: [] },
    } as unknown as StoredOpportunity['evaluation'],
    created_at: ISO,
    updated_at: ISO,
  }
}

class LifecycleRepository implements OpportunityRepository {
  constructor(public record: StoredOpportunity | null, private readonly conflict = false) {}
  async create(): Promise<StoredOpportunity> { throw new Error('not used') }
  async findByRef(): Promise<StoredOpportunity | null> { return this.record }
  async findById(workspaceId: string, id: string): Promise<StoredOpportunity | null> {
    return this.record?.workspace_id === workspaceId && this.record.id === id ? this.record : null
  }
  async list(): Promise<StoredOpportunity[]> { return this.record ? [this.record] : [] }
  async transition(workspaceId: string, id: string, from: OpportunityStatus, to: OpportunityStatus): Promise<StoredOpportunity | null> {
    if (this.conflict || !this.record || this.record.workspace_id !== workspaceId || this.record.id !== id || this.record.status !== from) return null
    this.record = { ...this.record, status: to, updated_at: '2026-01-02T00:00:00.000Z' }
    return this.record
  }
}

describe('Task 08 deterministic opportunity lifecycle', () => {
  it.each([
    ['draft', 'active'],
    ['draft', 'archived'],
    ['active', 'completed'],
    ['active', 'archived'],
    ['completed', 'archived'],
  ] as const)('allows %s -> %s', (from, to) => {
    expect(canTransitionOpportunity(from, to)).toBe(true)
  })

  it.each([
    ['completed', 'active'],
    ['archived', 'active'],
    ['archived', 'completed'],
    ['draft', 'completed'],
    ['active', 'draft'],
    ['draft', 'draft'],
  ] as const)('rejects %s -> %s', (from, to) => {
    expect(canTransitionOpportunity(from, to)).toBe(false)
  })

  it('persists a valid transition through the tenant-scoped compare-and-set port', async () => {
    const repository = new LifecycleRepository(opportunity('active'))
    const result = await executeTransitionOpportunity(ID, { status: 'completed' }, WORKSPACE, repository)
    expect(result.status).toBe('completed')
  })

  it('rejects invalid, missing, cross-tenant, and stale transitions safely', async () => {
    await expect(executeTransitionOpportunity(ID, { status: 'active' }, WORKSPACE, new LifecycleRepository(opportunity('completed')))).rejects.toMatchObject({ code: 'CONFLICT' })
    await expect(executeTransitionOpportunity(ID, { status: 'active' }, '55555555-5555-4555-8555-555555555555', new LifecycleRepository(opportunity('draft')))).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' })
    await expect(executeTransitionOpportunity(ID, { status: 'active', workspace_id: WORKSPACE }, WORKSPACE, new LifecycleRepository(opportunity('draft')))).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    await expect(executeTransitionOpportunity(ID, { status: 'active' }, WORKSPACE, new LifecycleRepository(opportunity('draft'), true))).rejects.toMatchObject({ code: 'CONFLICT' })
  })
})
