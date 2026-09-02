import { AppError } from '../../../../shared/errors/app-error.js'
import { evaluateRequestSchema } from '../../application/schemas.js'
import { opportunityModelVersions } from '../../application/opportunity-lifecycle.js'
import type {
  CreateOpportunityRecord,
  OpportunityRepository,
  StoredOpportunity,
} from '../../application/ports.js'

export interface QueryResult<Row> { rows: Row[] }
export interface PostgresQueryExecutor {
  query<Row = Record<string, unknown>>(text: string, values?: unknown[]): Promise<QueryResult<Row>>
}

type OpportunityRow = {
  id: string
  workspace_id: string
  status: string
  evaluation_input: unknown
  evaluation: unknown
  created_at: Date | string
  updated_at: Date | string
}

const SELECT_COLUMNS = `id, workspace_id, status, evaluation_input, evaluation, created_at, updated_at`

export class PostgresOpportunityRepository implements OpportunityRepository {
  constructor(private readonly db: PostgresQueryExecutor) {}

  async create(record: CreateOpportunityRecord): Promise<StoredOpportunity> {
    const e = record.evaluation
    try {
      const result = await this.db.query<OpportunityRow>(
        `INSERT INTO module_05.opportunities (
          workspace_id, candidate_ref, product_name, evaluation_input, evaluation,
          score, score_band, decision, rule_id, reason_codes, priority, confidence,
          execution_feasibility, selected_angle, model_versions, evaluated_at
        ) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14::jsonb,$15::jsonb,$16)
        RETURNING ${SELECT_COLUMNS}`,
        [
          record.workspaceId, e.candidate_ref, e.product_name, JSON.stringify(record.input),
          JSON.stringify(e), e.score.total, e.score.classification, e.decision.decision,
          e.decision.rule_id, JSON.stringify(e.decision.reason_codes), e.priority.priority_score,
          record.input.confidence, e.priority.execution_feasibility.score,
          JSON.stringify(e.recommended_angle), JSON.stringify(opportunityModelVersions()), e.evaluated_at,
        ],
      )
      return mapOpportunityRow(requiredRow(result.rows))
    } catch (error) {
      if (isUniqueViolation(error)) throw AppError.conflict('An opportunity with this reference already exists')
      if (error instanceof AppError) throw error
      throw error
    }
  }

  async findByRef(workspaceId: string, candidateRef: string): Promise<StoredOpportunity | null> {
    const result = await this.db.query<OpportunityRow>(
      `SELECT ${SELECT_COLUMNS} FROM module_05.opportunities
       WHERE workspace_id = $1 AND candidate_ref = $2 LIMIT 1`,
      [workspaceId, candidateRef],
    )
    return result.rows[0] ? mapOpportunityRow(result.rows[0]) : null
  }

  async list(workspaceId: string, limit: number): Promise<StoredOpportunity[]> {
    const result = await this.db.query<OpportunityRow>(
      `SELECT ${SELECT_COLUMNS} FROM module_05.opportunities
       WHERE workspace_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2`,
      [workspaceId, limit],
    )
    return result.rows.map(mapOpportunityRow)
  }
}

export function mapOpportunityRow(row: OpportunityRow): StoredOpportunity {
  const parsedInput = evaluateRequestSchema.safeParse({ candidate: decodeJson(row.evaluation_input) })
  const evaluation = decodeJson(row.evaluation)
  if (!parsedInput.success || !isEvaluation(evaluation) || row.status !== 'EVALUATED') {
    throw AppError.internal('Stored opportunity data is invalid')
  }
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    status: 'EVALUATED',
    input: parsedInput.data.candidate,
    evaluation,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  }
}

function requiredRow(rows: OpportunityRow[]): OpportunityRow {
  const row = rows[0]
  if (!row) throw AppError.internal('Database did not return the created opportunity')
  return row
}
function decodeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try { return JSON.parse(value) } catch { throw AppError.internal('Stored opportunity data is invalid') }
}
function isEvaluation(value: unknown): value is StoredOpportunity['evaluation'] {
  if (!value || typeof value !== 'object') return false
  const e = value as Record<string, unknown>
  return typeof e.candidate_ref === 'string' && typeof e.product_name === 'string' &&
    typeof e.evaluated_at === 'string' && !!e.score && !!e.decision && !!e.priority && !!e.explanation
}
function toIso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw AppError.internal('Stored opportunity timestamp is invalid')
  return date.toISOString()
}
function isUniqueViolation(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error && error.code === '23505'
}
