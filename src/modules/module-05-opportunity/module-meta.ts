/**
 * Module identity constants.
 *
 * Kept in its own file (rather than in `index.ts`) so that internal files can
 * reference the module id without importing the public contract, which would
 * create a cycle: index.ts → infrastructure/http → index.ts.
 */

export const MODULE_ID = 'module-05-opportunity' as const
export const MODULE_TITLE = 'Opportunity Engine & Scoring System' as const
