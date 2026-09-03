import { Pool } from 'pg'
import type { DemandSignalRepository } from '../../application/ports.js'
import type { DemandSignal } from '../../domain/demand.js'

interface Row {
  id: string; workspace_id: string; problem: string; canonical_problem: string; audience: string;
  category: string | null; keyword: string | null; signal_type: DemandSignal['signalType']; signal_value: string;
  source_type: DemandSignal['sourceType']; source_ref: string | null; observed_at: Date; collected_at: Date;
  confidence: DemandSignal['confidence']; evidence: string; status: DemandSignal['status']; demand_score: string;
  created_at: Date; updated_at: Date;
}

export class PostgresDemandSignalRepository implements DemandSignalRepository {
  constructor(private readonly pool: Pool) {}

  async create(signal: Omit<DemandSignal, 'id'> & { fingerprint: string }): Promise<DemandSignal> {
    const result = await this.pool.query<Row>(
      `INSERT INTO module_04.demand_signals
       (workspace_id, problem, canonical_problem, audience, category, keyword, signal_type, signal_value,
        source_type, source_ref, observed_at, collected_at, confidence, evidence, status, demand_score, fingerprint, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING *`,
      [signal.workspaceId, signal.problem, signal.canonicalProblem, signal.audience, signal.category ?? null,
       signal.keyword ?? null, signal.signalType, signal.signalValue, signal.sourceType, signal.sourceRef ?? null,
       signal.observedAt, signal.collectedAt, signal.confidence, signal.evidence, signal.status, signal.demandScore,
       signal.fingerprint, signal.createdAt, signal.updatedAt],
    )
    return mapRow(result.rows[0])
  }

  async findById(workspaceId: string, id: string) {
    const result = await this.pool.query<Row>('SELECT * FROM module_04.demand_signals WHERE workspace_id = $1 AND id = $2', [workspaceId, id])
    return result.rows[0] ? mapRow(result.rows[0]) : null
  }

  async list(workspaceId: string, limit: number) {
    const result = await this.pool.query<Row>('SELECT * FROM module_04.demand_signals WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT $2', [workspaceId, limit])
    return result.rows.map(mapRow)
  }
}

function mapRow(row: Row): DemandSignal {
  return {
    id: row.id, workspaceId: row.workspace_id, problem: row.problem, canonicalProblem: row.canonical_problem,
    audience: row.audience, category: row.category ?? undefined, keyword: row.keyword ?? undefined,
    signalType: row.signal_type, signalValue: Number(row.signal_value), sourceType: row.source_type,
    sourceRef: row.source_ref ?? undefined, observedAt: row.observed_at.toISOString(), collectedAt: row.collected_at.toISOString(),
    confidence: row.confidence, evidence: row.evidence, status: row.status, demandScore: Number(row.demand_score),
    createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
  }
}
