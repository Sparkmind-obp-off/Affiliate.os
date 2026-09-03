export const CREATOR_PLATFORMS = ['tiktok', 'instagram', 'youtube', 'other'] as const
export type CreatorPlatform = (typeof CREATOR_PLATFORMS)[number]

export const CREATOR_NICHES = [
  'beauty', 'fashion', 'technology', 'home', 'food', 'fitness', 'education',
  'parenting', 'lifestyle', 'gaming', 'automotive', 'travel', 'finance', 'other',
] as const
export type CreatorNiche = (typeof CREATOR_NICHES)[number]

export const AUDIENCE_SEGMENTS = [
  'teens', 'young_adults', 'adults', 'parents', 'professionals', 'students',
  'families', 'enthusiasts', 'general',
] as const
export type AudienceSegment = (typeof AUDIENCE_SEGMENTS)[number]

export const CONTENT_FORMATS = [
  'talking_head', 'faceless', 'pov', 'voice_over', 'screen_recording', 'tutorial',
  'review', 'storytelling', 'demo', 'comparison', 'live',
] as const
export type ContentFormat = (typeof CONTENT_FORMATS)[number]

export const CREATOR_CAPABILITY_TYPES = [
  'video_editing', 'copywriting', 'voice_over', 'camera', 'lighting',
  'product_demonstration', 'storytelling', 'live_selling', 'graphic_design',
] as const
export type CreatorCapabilityType = (typeof CREATOR_CAPABILITY_TYPES)[number]

export const CAPABILITY_LEVELS = [0, 1, 2, 3, 4] as const
export type CapabilityLevel = (typeof CAPABILITY_LEVELS)[number]

export const AFFILIATE_CAPABILITIES = ['none', 'learning', 'experienced'] as const
export type AffiliateCapability = (typeof AFFILIATE_CAPABILITIES)[number]

export const CREATOR_AVAILABILITY = ['unavailable', 'limited', 'available'] as const
export type CreatorAvailability = (typeof CREATOR_AVAILABILITY)[number]

export const CREATOR_BUDGET_MODES = ['zero', 'low', 'medium', 'high'] as const
export type CreatorBudgetMode = (typeof CREATOR_BUDGET_MODES)[number]

export const EVIDENCE_SOURCES = ['creator_declared', 'workspace_research', 'verified_record'] as const
export type EvidenceSource = (typeof EVIDENCE_SOURCES)[number]

export const EVIDENCE_CONFIDENCE = ['low', 'medium', 'high'] as const
export type EvidenceConfidence = (typeof EVIDENCE_CONFIDENCE)[number]

export interface CreatorCapability {
  type: CreatorCapabilityType
  level: CapabilityLevel
}

export interface CreatorProfileInput {
  creatorRef: string
  displayName: string
  platform: CreatorPlatform
  platformRef?: string
  primaryNiche: CreatorNiche
  secondaryNiches: CreatorNiche[]
  productCategories: string[]
  audienceSegments: AudienceSegment[]
  audienceInterests: string[]
  contentFormats: ContentFormat[]
  capabilities: CreatorCapability[]
  affiliateCapability: AffiliateCapability
  availability: CreatorAvailability
  budgetMode: CreatorBudgetMode
  sampleAccess: boolean
  evidenceSource: EvidenceSource
  evidenceConfidence: EvidenceConfidence
}

export interface CreatorProfile extends CreatorProfileInput {
  id: string
  workspaceId: string
  createdAt: string
  updatedAt: string
}

export function normalizeMatchToken(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('und')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
