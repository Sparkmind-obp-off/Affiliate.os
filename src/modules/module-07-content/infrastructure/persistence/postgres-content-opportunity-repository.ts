import { AppError } from '../../../../shared/errors/app-error.js'
import type { ContentOpportunityRepository } from '../../application/ports.js'
import { contentOpportunitySchema } from '../../application/schemas.js'
import {
  aggregateEvidenceConfidence,
  type ContentOpportunity,
  type ContentOpportunityEvidence,
} from '../../domain/content-opportunity.js'

export interface ContentQueryResult<Row> { rows: Row[] }
export interface ContentPostgresQueryExecutor {
  query<Row = Record<string, unknown>>(text: string, values?: unknown[]): Promise<ContentQueryResult<Row>>
}
interface ContentOpportunityRow {
  id: string
  workspace_id: string
  opportunity_id: string
  title: string
  primary_angle: string
  secondary_angles: unknown
  target_audience: unknown
  content_formats: unknown
  creator_requirements: unknown
  execution_constraints: unknown
  evidence: unknown
  confidence: string
  status: string
  created_at: Date | string
  updated_at: Date | string
}
const SELECT_COLUMNS = `id, workspace_id, opportunity_id, title, primary_angle, secondary_angles,
  target_audience, content_formats, creator_requirements, execution_constraints, evidence,
  confidence, status, created_at, updated_at`

export class PostgresContentOpportunityRepository implements ContentOpportunityRepository {
  constructor(private readonly db: ContentPostgresQueryExecutor) {}

  async create(content: Omit<ContentOpportunity, 'id'>): Promise<ContentOpportunity> {
    const result = await this.db.query<ContentOpportunityRow>(
      `INSERT INTO module_07.content_opportunities
       (workspace_id, opportunity_id, title, primary_angle, secondary_angles, target_audience,
        content_formats, creator_requirements, execution_constraints, evidence, confidence,
        status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12,$13,$14)
       RETURNING ${SELECT_COLUMNS}`,
      [
        content.workspaceId, content.opportunityId, content.title, content.primaryAngle,
        JSON.stringify(content.secondaryAngles), JSON.stringify(content.targetAudience),
        JSON.stringify(content.contentFormats), JSON.stringify(content.creatorRequirements),
        JSON.stringify(content.executionConstraints), JSON.stringify(content.evidence),
        content.confidence, content.status, content.createdAt, content.updatedAt,
      ],
    )
    const row = result.rows[0]
    if (!row) throw AppError.internal('Content opportunity insert returned no row')
    return mapContentOpportunityRow(row)
  }

  async findById(workspaceId: string, id: string): Promise<ContentOpportunity | null> {
    const result = await this.db.query<ContentOpportunityRow>(
      `SELECT ${SELECT_COLUMNS} FROM module_07.content_opportunities
       WHERE workspace_id = $1 AND id = $2 LIMIT 1`,
      [workspaceId, id],
    )
    return result.rows[0] ? mapContentOpportunityRow(result.rows[0]) : null
  }

  async list(workspaceId: string, limit: number): Promise<ContentOpportunity[]> {
    const result = await this.db.query<ContentOpportunityRow>(
      `SELECT ${SELECT_COLUMNS} FROM module_07.content_opportunities
       WHERE workspace_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2`,
      [workspaceId, limit],
    )
    return result.rows.map(mapContentOpportunityRow)
  }
}

export function mapContentOpportunityRow(row: ContentOpportunityRow): ContentOpportunity {
  try {
    const secondaryAngles = decodeJson(row.secondary_angles)
    const targetAudience = decodeJson(row.target_audience)
    const contentFormats = decodeJson(row.content_formats)
    const creatorRequirements = decodeJson(row.creator_requirements)
    const executionConstraints = decodeJson(row.execution_constraints)
    const evidence = decodeJson(row.evidence) as ContentOpportunityEvidence[]
    const parsed = contentOpportunitySchema.omit({ demandSignalIds: true }).safeParse({
      opportunityId: row.opportunity_id,
      title: row.title,
      primaryAngle: row.primary_angle,
      secondaryAngles,
      targetAudience,
      contentFormats,
      creatorRequirements,
      executionConstraints,
      status: row.status,
    })
    if (!parsed.success || !Array.isArray(evidence) || evidence.length === 0) throw new Error('invalid stored content opportunity')
    if (row.confidence !== aggregateEvidenceConfidence(evidence)) throw new Error('invalid stored confidence')
    return {
      ...parsed.data,
      id: row.id,
      workspaceId: row.workspace_id,
      evidence,
      confidence: row.confidence as ContentOpportunity['confidence'],
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
    }
  } catch (error) {
    throw AppError.internal('Stored content opportunity data is invalid', error)
  }
}
function decodeJson(value: unknown): unknown { return typeof value === 'string' ? JSON.parse(value) : value }
function toIso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('invalid timestamp')
  return date.toISOString()
}
