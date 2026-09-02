import { describe, it, expect } from 'vitest'
import { createApp } from '../../src/app/create-app.js'
import { SPEC_CARD_CANDIDATE, candidatePayload } from '../fixtures/opportunity-candidates.js'

/**
 * HTTP contract tests for the first MVP vertical.
 *
 * These assert the shape actually sent over the wire: the canonical envelope
 * (DOC 22 §222), the canonical error contract (§223), and the honesty rule that
 * a persistence-dependent capability answers NOT_IMPLEMENTED rather than
 * faking an empty result.
 */

const app = createApp()
const ENV = { NODE_ENV: 'test', LOG_LEVEL: 'error' }
const BASE = '/api/v1/affiliate/opportunities'

interface Envelope<T> {
  success: boolean
  data: T
  error?: { code: string; message: string; retryable: boolean; details?: unknown }
  meta: { request_id: string; correlation_id?: string }
}

const request = (path: string, init?: RequestInit) =>
  app.request(`http://localhost${path}`, init, ENV)

const postJson = (path: string, body: unknown) =>
  request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

async function readBody<T>(res: Response): Promise<Envelope<T>> {
  return (await res.json()) as Envelope<T>
}

interface EvaluationData {
  evaluation: {
    candidate_ref: string
    product_name: string
    score: { total: number; classification: string; components: unknown[] }
    decision: { decision: string; rule_id: string; reason_codes: string[]; reason: string }
    priority: { priority_score: number; band: string }
    recommended_angle: { angle_id: string; format: string } | null
    alternative_angles: unknown[]
    explanation: { summary: Record<string, string>; items: unknown[] }
    evaluated_at: string
  }
  persisted: boolean
}

interface RankingData {
  shortlist: Array<{ rank: number; evaluation: { candidate_ref: string } }>
  considered_count: number
  shortlist_size: number
  decision_breakdown: Record<string, number>
}

describe('POST /api/v1/affiliate/opportunities/evaluate', () => {
  it('returns the decision card of the published §38 example', async () => {
    const res = await postJson(`${BASE}/evaluate`, { candidate: SPEC_CARD_CANDIDATE })
    expect(res.status).toBe(200)

    const body = await readBody<EvaluationData>(res)
    expect(body.success).toBe(true)
    expect(body.meta.request_id).toBeTruthy()

    const { evaluation } = body.data
    expect(evaluation.candidate_ref).toBe('OPP-00124')
    expect(evaluation.product_name).toBe('Shoe Cleaning Foam')
    expect(evaluation.score.total).toBe(84)
    expect(evaluation.score.classification).toBe('STRONG')
    expect(evaluation.decision.decision).toBe('TEST_NOW')
    expect(evaluation.decision.rule_id).toBe('R12_TEST_NOW')
    expect(evaluation.priority.band).toBe('P0')
    expect(evaluation.recommended_angle).not.toBeNull()
    expect(evaluation.explanation.items.length).toBeGreaterThan(0)
  })

  it('reports honestly that nothing was persisted', async () => {
    const body = await readBody<EvaluationData>(
      await postJson(`${BASE}/evaluate`, { candidate: SPEC_CARD_CANDIDATE }),
    )
    expect(body.data.persisted).toBe(false)
  })

  it('is deterministic: two identical requests return the same decision', async () => {
    const first = await readBody<EvaluationData>(
      await postJson(`${BASE}/evaluate`, { candidate: SPEC_CARD_CANDIDATE }),
    )
    const second = await readBody<EvaluationData>(
      await postJson(`${BASE}/evaluate`, { candidate: SPEC_CARD_CANDIDATE }),
    )

    expect(second.data.evaluation.score).toEqual(first.data.evaluation.score)
    expect(second.data.evaluation.decision).toEqual(first.data.evaluation.decision)
    expect(second.data.evaluation.priority).toEqual(first.data.evaluation.priority)
    expect(second.data.evaluation.recommended_angle).toEqual(
      first.data.evaluation.recommended_angle,
    )
    // Only the injected timestamp and the request id may differ.
    expect(second.meta.request_id).not.toBe(first.meta.request_id)
  })

  it('returns 422 VALIDATION_ERROR with field details for an out-of-range signal', async () => {
    const res = await postJson(`${BASE}/evaluate`, {
      candidate: candidatePayload({ demand: 150 }),
    })
    expect(res.status).toBe(422)

    const body = await readBody<unknown>(res)
    expect(body.success).toBe(false)
    expect(body.error?.code).toBe('VALIDATION_ERROR')
    expect(body.error?.retryable).toBe(false)

    const issues = (body.error?.details as { issues: Array<{ field: string; message: string }> })
      .issues
    expect(issues.some((i) => i.field === 'candidate.demand')).toBe(true)
  })

  it('returns 422 for a missing candidate', async () => {
    const res = await postJson(`${BASE}/evaluate`, {})
    expect(res.status).toBe(422)
    expect((await readBody<unknown>(res)).error?.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 for malformed JSON without leaking parser internals', async () => {
    const res = await request(`${BASE}/evaluate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"candidate": ',
    })
    expect(res.status).toBe(422)

    const body = await readBody<unknown>(res)
    expect(body.error?.code).toBe('VALIDATION_ERROR')
    const serialized = JSON.stringify(body)
    expect(serialized).not.toMatch(/SyntaxError|JSON\.parse|node_modules|at Object/)
  })

  it('rejects a non-JSON content type', async () => {
    const res = await request(`${BASE}/evaluate`, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'candidate=1',
    })
    expect(res.status).toBe(422)
    expect((await readBody<unknown>(res)).error?.code).toBe('VALIDATION_ERROR')
  })

  it('rejects GET on a command endpoint with 404, not a misleading 501', async () => {
    // `evaluate` also matches the `:candidateRef` pattern, so this asserts the
    // command names are reserved and are never diagnosed as a persistence gap.
    for (const path of [`${BASE}/evaluate`, `${BASE}/rank`]) {
      const res = await request(path)
      expect(res.status, path).toBe(404)
      expect((await readBody<unknown>(res)).error?.code).toBe('RESOURCE_NOT_FOUND')
    }
  })

  it('blocks a flagged product regardless of how strong the signals are', async () => {
    const body = await readBody<EvaluationData>(
      await postJson(`${BASE}/evaluate`, {
        candidate: candidatePayload({ policy_risk_flagged: true }),
      }),
    )
    expect(body.data.evaluation.decision.decision).toBe('PASS')
    expect(body.data.evaluation.decision.reason_codes).toEqual(['POLICY_RISK_FLAGGED'])
  })
})

describe('POST /api/v1/affiliate/opportunities/rank', () => {
  const batch = (count: number) =>
    Array.from({ length: count }, (_, i) =>
      candidatePayload({
        candidate_ref: `OPP-${String(i).padStart(3, '0')}`,
        product_name: `Product ${i}`,
        demand: 40 + ((i * 9) % 60),
        creator_fit: 35 + ((i * 13) % 65),
      }),
    )

  it('reduces a batch to a TOP-N shortlist', async () => {
    const res = await postJson(`${BASE}/rank`, { candidates: batch(20), shortlist_size: 5 })
    expect(res.status).toBe(200)

    const body = await readBody<RankingData>(res)
    expect(body.success).toBe(true)
    expect(body.data.considered_count).toBe(20)
    expect(body.data.shortlist).toHaveLength(5)
    expect(body.data.shortlist.map((s) => s.rank)).toEqual([1, 2, 3, 4, 5])

    const breakdownTotal = Object.values(body.data.decision_breakdown).reduce((a, b) => a + b, 0)
    expect(breakdownTotal).toBe(20)
  })

  it('applies the default shortlist size when none is given', async () => {
    const body = await readBody<RankingData>(
      await postJson(`${BASE}/rank`, { candidates: batch(12) }),
    )
    expect(body.data.shortlist).toHaveLength(5)
  })

  it('is deterministic across two identical batches', async () => {
    const payload = { candidates: batch(10) }
    const first = await readBody<RankingData>(await postJson(`${BASE}/rank`, payload))
    const second = await readBody<RankingData>(await postJson(`${BASE}/rank`, payload))
    expect(second.data.shortlist.map((s) => s.evaluation.candidate_ref)).toEqual(
      first.data.shortlist.map((s) => s.evaluation.candidate_ref),
    )
  })

  it('returns 422 for an empty batch', async () => {
    const res = await postJson(`${BASE}/rank`, { candidates: [] })
    expect(res.status).toBe(422)
    expect((await readBody<unknown>(res)).error?.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 for a batch above the published limit', async () => {
    const res = await postJson(`${BASE}/rank`, { candidates: batch(101) })
    expect(res.status).toBe(422)
    expect((await readBody<unknown>(res)).error?.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/v1/affiliate/opportunities/scoring-model', () => {
  interface ModelData {
    module: string
    versions: Record<string, string>
    scoring: { weights: Record<string, number>; classification_bands: unknown[] }
    decision: { thresholds: Record<string, number>; rules: Array<{ rule_id: string }> }
    priority: { formula: string }
    angles: { catalogue: unknown[] }
    determinism: string
  }

  it('discloses weights, bands, the decision ladder and the priority formula', async () => {
    const res = await request(`${BASE}/scoring-model`)
    expect(res.status).toBe(200)

    const body = await readBody<ModelData>(res)
    expect(body.success).toBe(true)
    expect(body.data.module).toBe('module-05-opportunity')
    expect(body.data.scoring.weights.demand).toBe(0.2)
    expect(body.data.scoring.classification_bands).toHaveLength(5)
    expect(body.data.decision.rules.length).toBeGreaterThanOrEqual(14)
    expect(body.data.decision.rules[0]!.rule_id).toBe('R01_POLICY_RISK_FLAGGED')
    expect(body.data.priority.formula).toContain('execution_feasibility')
    expect(body.data.angles.catalogue.length).toBeGreaterThanOrEqual(6)
    expect(body.data.versions.scoring).toBeTruthy()
  })

  it('exposes no secret or configuration value', async () => {
    const serialized = JSON.stringify(await readBody<unknown>(await request(`${BASE}/scoring-model`)))
    expect(serialized).not.toMatch(/AUTH_SECRET|DATABASE_URL|password|token/i)
  })
})

describe('persistence-dependent routes fail closed (CONFLICT-01)', () => {
  it('GET /opportunities answers 501 NOT_IMPLEMENTED instead of an empty list', async () => {
    const res = await request(BASE)
    expect(res.status).toBe(501)

    const body = await readBody<unknown>(res)
    expect(body.success).toBe(false)
    expect(body.error?.code).toBe('NOT_IMPLEMENTED')
    expect(body.error?.retryable).toBe(false)
    expect(body.error?.message).toMatch(/persistence/i)
  })

  it('GET /opportunities/:ref answers 501 NOT_IMPLEMENTED', async () => {
    const res = await request(`${BASE}/OPP-00124`)
    expect(res.status).toBe(501)
    expect((await readBody<unknown>(res)).error?.code).toBe('NOT_IMPLEMENTED')
  })

  it('never leaks a connection string in the not-implemented message', async () => {
    const serialized = JSON.stringify(await readBody<unknown>(await request(BASE)))
    expect(serialized).not.toMatch(/postgres(ql)?:\/\//)
  })
})

describe('module mount and unknown sub-routes', () => {
  it('the API root reports /affiliate as mounted, not pending', async () => {
    interface RootData {
      status: string
      mounted_routers: Array<{ path: string; owner_module: string }>
      pending_routers: Array<{ path: string }>
    }
    const body = await readBody<RootData>(await request('/api/v1'))
    expect(body.data.mounted_routers).toEqual([
      { path: '/api/v1/affiliate', owner_module: 'module-05-opportunity' },
    ])
    expect(body.data.pending_routers.map((r) => r.path)).not.toContain('/api/v1/affiliate')
  })

  it('an unknown sub-route still returns the canonical RESOURCE_NOT_FOUND', async () => {
    const res = await request('/api/v1/affiliate/opportunities/evaluate/extra/segments')
    expect(res.status).toBe(404)
    expect((await readBody<unknown>(res)).error?.code).toBe('RESOURCE_NOT_FOUND')
  })

  it('echoes trace headers on a vertical request', async () => {
    const res = await request(`${BASE}/scoring-model`, {
      headers: { 'x-request-id': 'req-opportunity-1' },
    })
    expect(res.headers.get('x-request-id')).toBe('req-opportunity-1')
  })
})
