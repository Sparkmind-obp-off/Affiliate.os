import { z } from 'zod'
import { AppError } from '../../../../shared/errors/app-error.js'
import { CONTENT_FORMATS } from '@modules/module-06-creator-fit'
import {
  CONTENT_GENERATION_LANGUAGES,
  CONTENT_GENERATION_STATUSES,
  CONTENT_GENERATION_TYPES,
  type ContentGenerationStatus,
} from '../../domain/vocabularies.js'
import type { ContentGenerationRepository } from '../../application/ports.js'
import type { ContentGeneration, GenerationMetadata, GenerationSpecification } from '../../domain/content-generation.js'
import { generationSpecificationSchema } from '../../application/schemas.js'

export interface GenerationQueryResult<Row> { rows: Row[] }
export interface GenerationPostgresQueryExecutor {
  query<Row = Record<string, unknown>>(text: string, values?: unknown[]): Promise<GenerationQueryResult<Row>>
}
interface ContentGenerationRow {
  id: string
  workspace_id: string
  content_opportunity_id: string
  creator_id: string
  generation_spec: unknown
  content_type: string
  format: string
  language: string
  title: string
  hook: string
  body: string | null
  call_to_action: string
  status: string
  provider: string | null
  provider_model: string | null
  policy_version: string
  input_fingerprint: string
  output_fingerprint: string | null
  generation_metadata: unknown
  generated_at: Date | string | null
  created_at: Date | string
  updated_at: Date | string
}
const SELECT_COLUMNS = `id, workspace_id, content_opportunity_id, creator_id, generation_spec,
  content_type, format, language, title, hook, body, call_to_action, status, provider,
  provider_model, policy_version, input_fingerprint, output_fingerprint, generation_metadata,
  generated_at, created_at, updated_at`

export class PostgresContentGenerationRepository implements ContentGenerationRepository {
  constructor(private readonly db: GenerationPostgresQueryExecutor) {}

  async create(generation: Omit<ContentGeneration, 'id'>): Promise<ContentGeneration> {
    const result = await this.db.query<ContentGenerationRow>(
      `INSERT INTO module_08.content_generations
       (workspace_id, content_opportunity_id, creator_id, generation_spec, content_type, format,
        language, title, hook, body, call_to_action, status, provider, provider_model, policy_version,
        input_fingerprint, output_fingerprint, generation_metadata, generated_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb,$19,$20,$21)
       RETURNING ${SELECT_COLUMNS}`,
      [generation.workspaceId, generation.contentOpportunityId, generation.creatorId,
        JSON.stringify(generation.generationSpec), generation.contentType, generation.format,
        generation.language, generation.title, generation.hook, generation.body, generation.callToAction,
        generation.status, generation.provider, generation.providerModel, generation.policyVersion,
        generation.inputFingerprint, generation.outputFingerprint,
        generation.generationMetadata ? JSON.stringify(generation.generationMetadata) : null,
        generation.generatedAt, generation.createdAt, generation.updatedAt],
    )
    return requireRow(result.rows[0], 'Content generation insert returned no row')
  }

  async findById(workspaceId: string, id: string): Promise<ContentGeneration | null> {
    const result = await this.db.query<ContentGenerationRow>(
      `SELECT ${SELECT_COLUMNS} FROM module_08.content_generations
       WHERE workspace_id = $1 AND id = $2 LIMIT 1`, [workspaceId, id],
    )
    return result.rows[0] ? mapContentGenerationRow(result.rows[0]) : null
  }

  async list(workspaceId: string, limit: number): Promise<ContentGeneration[]> {
    const result = await this.db.query<ContentGenerationRow>(
      `SELECT ${SELECT_COLUMNS} FROM module_08.content_generations
       WHERE workspace_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2`, [workspaceId, limit],
    )
    return result.rows.map(mapContentGenerationRow)
  }

  async transition(
    workspaceId: string,
    id: string,
    expectedStatus: ContentGenerationStatus,
    nextStatus: ContentGenerationStatus,
    updatedAt: string,
  ): Promise<ContentGeneration | null> {
    const result = await this.db.query<ContentGenerationRow>(
      `UPDATE module_08.content_generations SET status = $4, updated_at = $5
       WHERE workspace_id = $1 AND id = $2 AND status = $3
       RETURNING ${SELECT_COLUMNS}`,
      [workspaceId, id, expectedStatus, nextStatus, updatedAt],
    )
    return result.rows[0] ? mapContentGenerationRow(result.rows[0]) : null
  }

  async complete(
    workspaceId: string,
    id: string,
    expectedStatus: 'REQUESTED',
    completion: Pick<ContentGeneration, 'title' | 'hook' | 'body' | 'callToAction' | 'provider' | 'providerModel' | 'outputFingerprint' | 'generationMetadata' | 'generatedAt' | 'updatedAt'>,
  ): Promise<ContentGeneration | null> {
    const result = await this.db.query<ContentGenerationRow>(
      `UPDATE module_08.content_generations
       SET title=$4, hook=$5, body=$6, call_to_action=$7, provider=$8, provider_model=$9,
           output_fingerprint=$10, generation_metadata=$11::jsonb, generated_at=$12,
           status='GENERATED', updated_at=$13
       WHERE workspace_id=$1 AND id=$2 AND status=$3
       RETURNING ${SELECT_COLUMNS}`,
      [workspaceId, id, expectedStatus, completion.title, completion.hook, completion.body,
        completion.callToAction, completion.provider, completion.providerModel,
        completion.outputFingerprint, JSON.stringify(completion.generationMetadata),
        completion.generatedAt, completion.updatedAt],
    )
    return result.rows[0] ? mapContentGenerationRow(result.rows[0]) : null
  }
}

const rowSchema = z.object({
  id: z.string().uuid(), workspace_id: z.string().uuid(), content_opportunity_id: z.string().uuid(), creator_id: z.string().uuid(),
  content_type: z.enum(CONTENT_GENERATION_TYPES), format: z.enum(CONTENT_FORMATS), language: z.enum(CONTENT_GENERATION_LANGUAGES),
  title: z.string().trim().min(1), hook: z.string().trim().min(1), body: z.string().nullable(), call_to_action: z.string().trim().min(1),
  status: z.enum(CONTENT_GENERATION_STATUSES), provider: z.string().nullable(), provider_model: z.string().nullable(),
  policy_version: z.string().min(1), input_fingerprint: z.string().regex(/^[a-f0-9]{64}$/), output_fingerprint: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
})

export function mapContentGenerationRow(row: ContentGenerationRow): ContentGeneration {
  try {
    const core = rowSchema.parse(row)
    const generationSpec = generationSpecificationSchema.parse(decodeJson(row.generation_spec)) as GenerationSpecification
    const metadata = row.generation_metadata === null ? null : decodeJson(row.generation_metadata) as GenerationMetadata
    if (metadata !== null && (!metadata.attributes || typeof metadata.attributes !== 'object')) throw new Error('invalid metadata')
    if (core.status === 'GENERATED' && (!core.body || !core.provider || !core.provider_model || !core.output_fingerprint)) {
      throw new Error('generated artifact is incomplete')
    }
    return {
      id: core.id, workspaceId: core.workspace_id, contentOpportunityId: core.content_opportunity_id,
      creatorId: core.creator_id, generationSpec, contentType: core.content_type, format: core.format,
      language: core.language, title: core.title, hook: core.hook, body: core.body,
      callToAction: core.call_to_action, status: core.status, provider: core.provider,
      providerModel: core.provider_model, policyVersion: core.policy_version,
      inputFingerprint: core.input_fingerprint, outputFingerprint: core.output_fingerprint,
      generationMetadata: metadata, generatedAt: nullableIso(row.generated_at),
      createdAt: toIso(row.created_at), updatedAt: toIso(row.updated_at),
    }
  } catch (error) {
    throw AppError.internal('Stored content generation data is invalid', error)
  }
}
function requireRow(row: ContentGenerationRow | undefined, message: string): ContentGeneration {
  if (!row) throw AppError.internal(message)
  return mapContentGenerationRow(row)
}
function decodeJson(value: unknown): unknown { return typeof value === 'string' ? JSON.parse(value) : value }
function nullableIso(value: Date | string | null): string | null { return value === null ? null : toIso(value) }
function toIso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('invalid timestamp')
  return date.toISOString()
}
