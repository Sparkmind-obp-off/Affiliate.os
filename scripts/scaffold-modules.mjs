#!/usr/bin/env node
/**
 * One-shot scaffolding helper for the modular monolith boundary.
 *
 * Creates, for each locked module, a minimal but MEANINGFUL public contract:
 *   <module>/index.ts      → the ONLY legal import surface for other modules
 *   <module>/MODULE.md      → ownership + architecture reference + status
 *
 * It intentionally does NOT create empty domain/application/infrastructure
 * folders (Task 01 §8: no empty complexity merely for appearance). Those
 * folders are created by the task that actually implements the module.
 */
import { mkdir, writeFile, access } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const MODULES_DIR = path.join(ROOT, 'src', 'modules')

/** Locked module registry — DOC 24 §315 repository architecture. */
const MODULES = [
  ['module-04-demand', 'Demand Discovery Engine', 'AFFILIATE OS — DEMAND DISCOVERY ENGINE v1.0'],
  ['module-05-opportunity', 'Opportunity Engine & Scoring System', 'AFFILIATE OS — OPPORTUNITY ENGINE & SCORING SYSTEM v1.0'],
  ['module-06-creator-fit', 'Creator Fit & Personalization Engine', 'AFFILIATE OS — CREATOR FIT & PERSONALIZATION ENGINE v1.0'],
  ['module-07-content', 'Content Production OS', 'AFFILIATE OS — CONTENT PRODUCTION OS v1.0'],
  ['module-08-distribution', 'Distribution & Content Deployment OS', 'AFFILIATE OS — DISTRIBUTION & CONTENT DEPLOYMENT OS v1.0'],
  ['module-09-performance', 'Performance Intelligence & Optimization Engine', 'AFFILIATE OS — PERFORMANCE INTELLIGENCE & OPTIMIZATION ENGINE v1.0'],
  ['module-10-revenue', 'Revenue & Conversion Intelligence Engine', 'AFFILIATE OS — REVENUE & CONVERSION INTELLIGENCE ENGINE v1.0'],
  ['module-11-experiment', 'Experimentation & Growth Loop Engine', 'DOC 11'],
  ['module-12-recommendation', 'Intelligence & Recommendation Engine', 'DOC 12'],
  ['module-13-automation', 'Automation & Execution Orchestration Engine', 'DOC 13'],
  ['module-14-data', 'Data & Event Infrastructure', 'DOC 14'],
  ['module-15-identity', 'Identity, Account & Tenancy Architecture', 'DOC 15 + ADDENDUM'],
  ['module-16-security', 'Security, Policy & Governance Engine', 'DOC 16 + 14A'],
  ['module-17-connectors', 'Platform & Connector Abstraction Layer', 'DOC 17'],
  ['module-18-observability', 'Observability, Reliability & Operations Engine', 'DOC 18'],
  ['module-19-attribution', 'Attribution, Measurement & Business Truth Engine', 'DOC 19 + 88'],
  ['module-25-billing', 'Billing & Monetization Architecture', 'DOC 25'],
  ['module-26-ecosystem', 'Ecosystem & Digital Commerce Architecture', 'DOC 26'],
]

const indexTemplate = (slug, title, doc) => `/**
 * ${title.toUpperCase()}
 * Module: ${slug}
 * Architecture reference: ${doc}
 *
 * PUBLIC CONTRACT — this file is the ONLY legal import surface of this module.
 * Other modules MUST import from '@modules/${slug}' and MUST NOT reach into
 * this module's internal folders (enforced by tests/architecture).
 *
 * STATUS: NOT_IMPLEMENTED (foundation only, AFFILIATE-OS-FOUNDATION-001).
 * Domain, application, and infrastructure layers are added by this module's
 * own dedicated implementation task.
 */

export const MODULE_ID = '${slug}' as const
export const MODULE_TITLE = '${title}' as const
export const MODULE_STATUS = 'NOT_IMPLEMENTED' as const
`

const manifestTemplate = (slug, title, doc) => `# ${slug}

**Title:** ${title}
**Architecture reference:** ${doc}
**Status:** NOT_IMPLEMENTED — foundation only

## Boundary rules

- Other modules may import **only** from \`@modules/${slug}\` (the \`index.ts\` public contract).
- This module owns its own tables/schema. No other module may read or write them directly.
- Cross-module communication happens through the public contract, an application
  service, an API call, or an event — never through internal file access.

## Expected internal structure (created by the implementing task)

\`\`\`text
${slug}/
├── domain/           # entities, value objects, domain services
├── application/      # use cases, application services
├── infrastructure/   # repositories, adapters
└── index.ts          # public contract
\`\`\`
`

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

let created = 0
let skipped = 0

for (const [slug, title, doc] of MODULES) {
  const dir = path.join(MODULES_DIR, slug)
  await mkdir(dir, { recursive: true })

  const indexPath = path.join(dir, 'index.ts')
  if (await exists(indexPath)) {
    skipped++
  } else {
    await writeFile(indexPath, indexTemplate(slug, title, doc), 'utf8')
    created++
  }

  const manifestPath = path.join(dir, 'MODULE.md')
  if (!(await exists(manifestPath))) {
    await writeFile(manifestPath, manifestTemplate(slug, title, doc), 'utf8')
  }
}

console.log(`modules scaffolded: ${MODULES.length} (created=${created}, preserved=${skipped})`)
