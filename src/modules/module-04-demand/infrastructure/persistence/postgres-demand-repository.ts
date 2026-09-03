import { AppError } from '../../../../shared/errors/app-error.js'
import type { DemandSignalRepository } from '../../application/ports.js'
import {
  isDemandConfidence,
  isDemandSignalType,
  isDemandSourceType,
  isDemandStatus,
  type DemandSignal,
} from '../../domain/demand.js'

export interface QueryResult<Row> { rows: Row[] }
export interface DemandPostgresQueryExecutor {
  query<Row = Record<string, unknown>>(text: string, values?: unknown[]): Promise<QueryResult<Row>>
}

interface DemandSignalRow {
  id: string
  workspace_id: string
  problem: string
  canonical_problem: string
  audience: string
  category: string | null
  keyword: string | null
  signal_type: string
  signal_value: string | number
  source_type: string
  source_ref: string | null
  observed_at: Date | string
  collected_at: Date | string
  confidence: string
  evidence: string
  status: string
  demand_score: string | number
  fingerprint: string
  created_at: Date | string
  updated_at: Date | string
}

const SELECT_COLUMNS = `id, workspace_id, problem, canonical_problem, audience, category,
  keyword, signal_type, signal_value, source_type, source_ref, observed_at, collected_at,
  confidence, evidence, status, demand_score, fingerprint, created_at, updated_at`

export class PostgresDemandSignalRepository implements DemandSignalRepository {
  constructor(private readonly db: DemandPostgresQueryExecutor) {}

  async create(signal: Omit<DemandSignal, 'id'>): Promise<DemandSignal> {
    const result = await this.db.query<DemandSignalRow>(
      `INSERT INTO module_04.demand_signals
       (workspace_id, problem, canonical_problem, audience, category, keyword, signal_type, signal_value,
        source_type, source_ref, observed_at, collected_at, confidence, evidence, status, demand_score,
        fingerprint, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING ${SELECT_COLUMNS}`,
      [
        signal.workspaceId,
        signal.problem,
        signal.canonicalProblem,
        signal.audience,
        signal.category ?? null,
        signal.keyword ?? null,
        signal.signalType,
        signal.signalValue,
        signal.sourceType,
        signal.sourceRef ?? null,
        signal.observedAt,
        signal.collectedAt,
        signal.confidence,
        signal.evidence,
        signal.status,
        signal.demandScore,
        signal.fingerprint,
        signal.createdAt,
        signal.updatedAt,
      ],
    )
    return mapDemandSignalRow(requiredRow(result.rows))
  }

  async findById(workspaceId: string, id: string): Promise<DemandSignal | null> {
    const result = await this.db.query<DemandSignalRow>(
      `SELECT ${SELECT_COLUMNS} FROM module_04.demand_signals
       WHERE workspace_id = $1 AND id = $2 LIMIT 1`,
      [workspaceId, id],
    )
    return result.rows[0] ? mapDemandSignalRow(result.rows[0]) : null
  }

  async list(workspaceId: string, limit: number): Promise<DemandSignal[]> {
    const result = await this.db.query<DemandSignalRow>(
      `SELECT ${SELECT_COLUMNS} FROM module_04.demand_signals
       WHERE workspace_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2`,
      [workspaceId, limit],
    )
    return result.rows.map(mapDemandSignalRow)
  }
}

export function mapDemandSignalRow(row: DemandSignalRow): DemandSignal {
  if (
    !isDemandSignalType(row.signal_type)
    || !isDemandSourceType(row.source_type)
    || !isDemandConfidence(row.confidence)
    || !isDemandStatus(row.status)
  ) {
    throw AppError.internal('Stored demand signal data is invalid')
  }
  const signalValue = Number(row.signal_value)
  const demandScore = Number(row.demand_score)
  if (!Number.isFinite(signalValue) || !Number.isFinite(demandScore)) {
    throw AppError.internal('Stored demand signal data is invalid')
  }
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    problem: row.problem,
    canonicalProblem: row.canonical_problem,
    audience: row.audience,
    category: row.category ?? undefined,
    keyword: row.keyword ?? undefined,
    signalType: row.signal_type,
    signalValue,
    sourceType: row.source_type,
    sourceRef: row.source_ref ?? undefined,
    observedAt: toIso(row.observed_at),
    collectedAt: toIso(row.collected_at),
    confidence: row.confidence,
    evidence: row.evidence,
    status: row.status,
    demandScore,
    fingerprint: row.fingerprint,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

function requiredRow<Row>(rows: Row[]): Row {
  const row = rows[0]
  if (!row) throw AppError.internal('Demand signal insert returned no row')
  return row
}

function toIso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw AppError.internal('Stored demand signal data is invalid')
  return date.toISOString()
}
