import type { ContentFormat, CreatorFitCriteria } from '@modules/module-06-creator-fit'
import type { ContentAngle, ContentOpportunityEvidence, ExecutionConstraints, TargetAudience } from '@modules/module-07-content'
import type {
  ContentGenerationLanguage,
  ContentGenerationStatus,
  ContentGenerationType,
} from './vocabularies.js'

export interface GenerationSpecification {
  contentType: ContentGenerationType
  format: ContentFormat
  language: ContentGenerationLanguage
  targetLength: number
  hook: string
  primaryAngle: ContentAngle
  supportingAngles: ContentAngle[]
  targetAudience: TargetAudience
  creatorRequirements: CreatorFitCriteria
  executionConstraints: ExecutionConstraints
  evidenceReferences: Array<Pick<ContentOpportunityEvidence, 'demandSignalId' | 'sourceType' | 'sourceRef' | 'observedAt'>>
  callToAction: string
  generationInstructions: string
}

export interface GenerationMetadata {
  providerRequestId?: string
  usage?: Record<string, number>
  attributes: Record<string, string | number | boolean | null>
}

export interface ContentGeneration {
  id: string
  workspaceId: string
  contentOpportunityId: string
  creatorId: string
  generationSpec: GenerationSpecification
  contentType: ContentGenerationType
  format: ContentFormat
  language: ContentGenerationLanguage
  title: string
  hook: string
  body: string | null
  callToAction: string
  status: ContentGenerationStatus
  provider: string | null
  providerModel: string | null
  policyVersion: string
  inputFingerprint: string
  outputFingerprint: string | null
  generationMetadata: GenerationMetadata | null
  generatedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateContentGenerationInput {
  contentOpportunityId: string
  creatorId: string
  contentType: ContentGenerationType
  format: ContentFormat
  language: ContentGenerationLanguage
  targetLength: number
  hook: string
  callToAction: string
  generationInstructions: string
}

export interface GeneratedArtifact {
  title: string
  hook: string
  body: string
  callToAction: string
}

export interface GenerationProviderResult {
  provider: string
  model: string
  content: GeneratedArtifact
  metadata?: Record<string, string | number | boolean | null>
  usage?: Record<string, number>
  providerRequestId?: string
}
