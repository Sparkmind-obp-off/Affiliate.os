import { describe, expect, it } from 'vitest'
import { createApp } from '../../src/app/create-app.js'
import type { CreateOpportunityRecord, OpportunityRepository, StoredOpportunity } from '@modules/module-05-opportunity'
import { SPEC_CARD_CANDIDATE } from '../fixtures/opportunity-candidates.js'

const SECRET = 'test-only-secret-not-for-production'
const WORKSPACE = '22222222-2222-4222-8222-222222222222'
const app = createApp()

class MemoryRepository implements OpportunityRepository {
  records: StoredOpportunity[] = []
  async create(record: CreateOpportunityRecord): Promise<StoredOpportunity> {
    if (this.records.some((r) => r.input.candidate_ref === record.input.candidate_ref)) throw Object.assign(new Error('duplicate'), { code: '23505' })
    const stored: StoredOpportunity = { id: crypto.randomUUID(), workspace_id: record.workspaceId, status: 'EVALUATED', input: record.input, evaluation: record.evaluation, created_at: record.evaluation.evaluated_at, updated_at: record.evaluation.evaluated_at }
    this.records.push(stored); return stored
  }
  async findByRef(workspaceId: string, ref: string) { return this.records.find((r) => r.workspace_id === workspaceId && r.input.candidate_ref === ref) ?? null }
  async list(workspaceId: string, limit: number) { return this.records.filter((r) => r.workspace_id === workspaceId).slice(0, limit) }
}

async function token() {
  const encode = (value: unknown) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const h = encode({ alg: 'HS256', typ: 'JWT' })
  const p = encode({ sub: '33333333-3333-4333-8333-333333333333', organization_id: '44444444-4444-4444-8444-444444444444', workspace_id: WORKSPACE, exp: Math.floor(Date.now() / 1000) + 60 })
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${h}.${p}`)))
  const s = btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${h}.${p}.${s}`
}

describe('persistent opportunity HTTP lifecycle', () => {
  it('creates, retrieves and lists a deterministic decision with canonical envelopes', async () => {
    const repo = new MemoryRepository(); const bearer = await token()
    const env = { NODE_ENV: 'test', LOG_LEVEL: 'error', AUTH_SECRET: SECRET, OPPORTUNITY_REPOSITORY: repo }
    const create = await app.request('http://localhost/api/v1/affiliate/opportunities', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` }, body: JSON.stringify({ candidate: SPEC_CARD_CANDIDATE }) }, env)
    expect(create.status).toBe(201)
    const created = (await create.json()) as { success: boolean; data: { opportunity: StoredOpportunity } }
    expect(created.success).toBe(true); expect(created.data.opportunity.evaluation.score.total).toBe(84)
    expect(created.data.opportunity.evaluation.decision.decision).toBe('TEST_NOW')

    const get = await app.request('http://localhost/api/v1/affiliate/opportunities/OPP-00124', { headers: { authorization: `Bearer ${bearer}` } }, env)
    const fetched = (await get.json()) as { data: { opportunity: StoredOpportunity } }
    expect(get.status).toBe(200); expect(fetched.data.opportunity.status).toBe('EVALUATED')
    const list = await app.request('http://localhost/api/v1/affiliate/opportunities?limit=10', { headers: { authorization: `Bearer ${bearer}` } }, env)
    const listed = (await list.json()) as { data: { count: number } }
    expect(list.status).toBe(200); expect(listed.data.count).toBe(1)
  })

  it('requires authentication and sanitizes unavailable persistence', async () => {
    const unauth = await app.request('http://localhost/api/v1/affiliate/opportunities', {}, { NODE_ENV: 'test', AUTH_SECRET: SECRET })
    expect(unauth.status).toBe(401)
    const body = JSON.stringify(await unauth.json())
    expect(body).not.toMatch(/postgres:\/\/|DATABASE_URL|stack|node_modules/i)
  })
})
