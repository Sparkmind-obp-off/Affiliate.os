# module-05-opportunity

**Title:** Opportunity Engine & Scoring System
**Architecture reference:** AFFILIATE OS — OPPORTUNITY ENGINE & SCORING SYSTEM v1.0
**Status:** IMPLEMENTED — evaluation, persistence, and Task 08 lifecycle foundation

## Boundary rules

- Other modules may import **only** from `@modules/module-05-opportunity` (the `index.ts` public contract).
- This module owns its own tables/schema. No other module may read or write them directly.
- Cross-module communication happens through the public contract, an application
  service, an API call, or an event — never through internal file access.

## Implemented boundary

- Deterministic evaluation remains immutable and preserves the Task 03 regression.
- Persistent opportunities are scoped by `workspace_id` in every repository operation.
- Lifecycle policy is centralized in the domain: `draft → active → completed`, with archival from each non-archived state.
- Lifecycle mutations require Module 16 `opportunity.update` authorization and use an atomic status compare-and-set update.
- HTTP routes parse and serialize only; lifecycle rules and SQL remain outside the transport.

## Internal structure

```text
module-05-opportunity/
├── domain/           # entities, value objects, domain services
├── application/      # use cases, application services
├── infrastructure/   # repositories, adapters
└── index.ts          # public contract
```
