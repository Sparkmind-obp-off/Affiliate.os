import { AppError } from '../../../../shared/errors/app-error.js'
import { parseCreatorProfile } from '../../application/schemas.js'
import type { CreatorRepository } from '../../application/ports.js'
import type { CreatorProfile } from '../../domain/creator.js'

export interface CreatorQueryResult<Row> { rows: Row[] }
export interface CreatorPostgresQueryExecutor {
  query<Row = Record<string, unknown>>(text: string, values?: unknown[]): Promise<CreatorQueryResult<Row>>
}

interface CreatorRow {
  id: string
  workspace_id: string
  creator_ref: string
  display_name: string
  platform: string
  platform_ref: string | null
  primary_niche: string
  secondary_niches: unknown
  product_categories: unknown
  audience_segments: unknown
  audience_interests: unknown
  content_formats: unknown
  capabilities: unknown
  affiliate_capability: string
  availability: string
  budget_mode: string
  sample_access: boolean
  evidence_source: string
  evidence_confidence: string
  created_at: Date | string
  updated_at: Date | string
}

const SELECT_COLUMNS = `id, workspace_id, creator_ref, display_name, platform, platform_ref,
  primary_niche, secondary_niches, product_categories, audience_segments, audience_interests,
  content_formats, capabilities, affiliate_capability, availability, budget_mode, sample_access,
  evidence_source, evidence_confidence, created_at, updated_at`

export class PostgresCreatorRepository implements CreatorRepository {
  constructor(private readonly db: CreatorPostgresQueryExecutor) {}

  async create(profile: Omit<CreatorProfile, 'id'>): Promise<CreatorProfile> {
    const result = await this.db.query<CreatorRow>(
      `INSERT INTO module_06.creator_profiles
       (workspace_id, creator_ref, display_name, platform, platform_ref, primary_niche,
        secondary_niches, product_categories, audience_segments, audience_interests,
        content_formats, capabilities, affiliate_capability, availability, budget_mode,
        sample_access, evidence_source, evidence_confidence, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,
        $13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING ${SELECT_COLUMNS}`,
      [
        profile.workspaceId, profile.creatorRef, profile.displayName, profile.platform,
        profile.platformRef ?? null, profile.primaryNiche, JSON.stringify(profile.secondaryNiches),
        JSON.stringify(profile.productCategories), JSON.stringify(profile.audienceSegments),
        JSON.stringify(profile.audienceInterests), JSON.stringify(profile.contentFormats),
        JSON.stringify(profile.capabilities), profile.affiliateCapability, profile.availability,
        profile.budgetMode, profile.sampleAccess, profile.evidenceSource, profile.evidenceConfidence,
        profile.createdAt, profile.updatedAt,
      ],
    )
    const row = result.rows[0]
    if (!row) throw AppError.internal('Creator profile insert returned no row')
    return mapCreatorRow(row)
  }

  async findById(workspaceId: string, id: string): Promise<CreatorProfile | null> {
    const result = await this.db.query<CreatorRow>(
      `SELECT ${SELECT_COLUMNS} FROM module_06.creator_profiles
       WHERE workspace_id = $1 AND id = $2 LIMIT 1`,
      [workspaceId, id],
    )
    return result.rows[0] ? mapCreatorRow(result.rows[0]) : null
  }

  async list(workspaceId: string, limit: number): Promise<CreatorProfile[]> {
    const result = await this.db.query<CreatorRow>(
      `SELECT ${SELECT_COLUMNS} FROM module_06.creator_profiles
       WHERE workspace_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2`,
      [workspaceId, limit],
    )
    return result.rows.map(mapCreatorRow)
  }
}

export function mapCreatorRow(row: CreatorRow): CreatorProfile {
  try {
    const input = parseCreatorProfile({
      creatorRef: row.creator_ref,
      displayName: row.display_name,
      platform: row.platform,
      platformRef: row.platform_ref ?? undefined,
      primaryNiche: row.primary_niche,
      secondaryNiches: decodeJson(row.secondary_niches),
      productCategories: decodeJson(row.product_categories),
      audienceSegments: decodeJson(row.audience_segments),
      audienceInterests: decodeJson(row.audience_interests),
      contentFormats: decodeJson(row.content_formats),
      capabilities: decodeJson(row.capabilities),
      affiliateCapability: row.affiliate_capability,
      availability: row.availability,
      budgetMode: row.budget_mode,
      sampleAccess: row.sample_access,
      evidenceSource: row.evidence_source,
      evidenceConfidence: row.evidence_confidence,
    })
    return {
      ...input,
      id: row.id,
      workspaceId: row.workspace_id,
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
    }
  } catch (error) {
    throw AppError.internal('Stored creator profile data is invalid', error)
  }
}

function decodeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  return JSON.parse(value)
}
function toIso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('invalid timestamp')
  return date.toISOString()
}
