export const OPPORTUNITY_STATUSES = ['draft', 'active', 'completed', 'archived'] as const
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number]

const ALLOWED_TRANSITIONS = {
  draft: ['active', 'archived'],
  active: ['completed', 'archived'],
  completed: ['archived'],
  archived: [],
} as const satisfies Record<OpportunityStatus, readonly OpportunityStatus[]>

export function isOpportunityStatus(value: unknown): value is OpportunityStatus {
  return typeof value === 'string' && (OPPORTUNITY_STATUSES as readonly string[]).includes(value)
}

/** The single deterministic lifecycle policy for Module 05. */
export function canTransitionOpportunity(
  from: OpportunityStatus,
  to: OpportunityStatus,
): boolean {
  return (ALLOWED_TRANSITIONS[from] as readonly OpportunityStatus[]).includes(to)
}
