import { describe, expect, it, vi } from 'vitest'
import {
  PostgresOpportunityRepository,
  executeCreateOpportunity,
  executeGetOpportunity,
  type Clock,
  type PostgresQueryExecutor,
} from '@modules/module-05-opportunity'
import { SPEC_CARD_CANDIDATE } from '../fixtures/opportunity-candidates.js'

const ISO = '2026-01-15T10:30:00.000Z'
const WORKSPACE = '22222222-2222-4222-8222-222222222222'
const clock: Clock = { now: () => new Date(ISO) }

function row(evaluation: unknown, input: unknown = SPEC_CARD_CANDIDATE) {
  return {
    id: '11111111-1111-4111-8111-111111111111', workspace_id: WORKSPACE,
    status: 'EVALUATED', evaluation_input: input, evaluation,
    created_at: ISO, updated_at: ISO,
  }
}

describe('PostgresOpportunityRepository', () => {
  it('maps and preserves deterministic evaluation data on create', async () => {
    const db = {
      query: vi.fn(async (_sql: string, values?: unknown[]) => ({
        rows: [row(JSON.parse(values![4] as string))],
      })),
    } as unknown as PostgresQueryExecutor
    const repository = new PostgresOpportunityRepository(db)
    const returned = await executeCreateOpportunity(
      { candidate: SPEC_CARD_CANDIDATE },
      WORKSPACE,
      { repository, clock },
    )
    expect((returned as { evaluation: { score: { total: number } } }).evaluation.score.total).toBe(84)
    expect((returned as { evaluation: { decision: { decision: string } } }).evaluation.decision.decision).toBe('TEST_NOW')
  })

  it('returns null and application maps it to RESOURCE_NOT_FOUND', async () => {
    const repository = new PostgresOpportunityRepository({ query: async () => ({ rows: [] }) })
    await expect(executeGetOpportunity('MISSING', WORKSPACE, repository)).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' })
  })

  it('maps PostgreSQL uniqueness violations to canonical conflict', async () => {
    const repository = new PostgresOpportunityRepository({ query: async () => { throw { code: '23505' } } })
    await expect(executeCreateOpportunity({ candidate: SPEC_CARD_CANDIDATE }, WORKSPACE, { repository, clock })).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('rejects malformed stored data without leaking it', async () => {
    const db = { query: async () => ({ rows: [row({ broken: true })] }) } as unknown as PostgresQueryExecutor
    const repository = new PostgresOpportunityRepository(db)
    await expect(repository.findByRef(WORKSPACE, 'OPP-00124')).rejects.toMatchObject({ code: 'INTERNAL_ERROR' })
  })
})
