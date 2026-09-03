import type { ContentFormat } from '@modules/module-06-creator-fit'

export const CONTENT_GENERATION_STATUSES = [
  'DRAFT',
  'REQUESTED',
  'GENERATED',
  'REVIEW_REQUIRED',
  'APPROVED',
  'REJECTED',
  'ARCHIVED',
] as const
export type ContentGenerationStatus = (typeof CONTENT_GENERATION_STATUSES)[number]

export const CONTENT_GENERATION_TYPES = [
  'SCRIPT',
  'CAPTION',
  'HOOK',
  'PRODUCT_REVIEW',
  'EDUCATIONAL_POST',
  'TUTORIAL',
  'COMPARISON',
  'STORY',
  'FAQ',
  'LISTICLE',
] as const
export type ContentGenerationType = (typeof CONTENT_GENERATION_TYPES)[number]

export const CONTENT_GENERATION_LANGUAGES = ['id', 'en'] as const
export type ContentGenerationLanguage = (typeof CONTENT_GENERATION_LANGUAGES)[number]

export type GenerationContentFormat = ContentFormat
