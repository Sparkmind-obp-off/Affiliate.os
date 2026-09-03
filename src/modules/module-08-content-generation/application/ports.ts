import type {
  ContentGeneration,
  GenerationProviderResult,
  GenerationSpecification,
} from '../domain/content-generation.js'
import type { ContentGenerationStatus } from '../domain/vocabularies.js'

export interface ContentGenerationRepository {
  create(generation: Omit<ContentGeneration, 'id'>): Promise<ContentGeneration>
  findById(workspaceId: string, id: string): Promise<ContentGeneration | null>
  list(workspaceId: string, limit: number): Promise<ContentGeneration[]>
  transition(
    workspaceId: string,
    id: string,
    expectedStatus: ContentGenerationStatus,
    nextStatus: ContentGenerationStatus,
    updatedAt: string,
  ): Promise<ContentGeneration | null>
  complete(
    workspaceId: string,
    id: string,
    expectedStatus: 'REQUESTED',
    completion: Pick<ContentGeneration, 'title' | 'hook' | 'body' | 'callToAction' | 'provider' | 'providerModel' | 'outputFingerprint' | 'generationMetadata' | 'generatedAt' | 'updatedAt'>,
  ): Promise<ContentGeneration | null>
}

export interface GenerationProvider {
  isAvailable(): boolean
  generate(request: {
    generationId: string
    specification: GenerationSpecification
    inputFingerprint: string
  }): Promise<GenerationProviderResult>
}

export interface GenerationClock { now(): Date }
export const systemGenerationClock: GenerationClock = { now: () => new Date() }

export class UnavailableGenerationProvider implements GenerationProvider {
  isAvailable(): boolean { return false }
  async generate(): Promise<GenerationProviderResult> {
    throw new Error('Generation provider is unavailable')
  }
}
