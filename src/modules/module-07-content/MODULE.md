# module-07-content

**Title:** Content Production OS
**Architecture reference:** AFFILIATE OS — CONTENT PRODUCTION OS v1.0
**Status:** FOUNDATION_IMPLEMENTED (Task 11)

## Ownership

Module 07 owns workspace-scoped Content Opportunities, controlled content angles,
audience and format criteria, evidence snapshots, and deterministic content-opportunity
evaluation. Module 04 owns demand signals, Module 05 owns Opportunity scoring, and
Module 06 owns Creator Fit; this module consumes only their public contracts.

## Deterministic policy v1

Seven dimensions total 100%: demand alignment 20%, audience alignment 15%, angle
strength 15%, format fit 15%, creator fit 15%, execution feasibility 10%, and evidence
quality 10%. Coverage below 60% or fewer than four known dimensions produces
`INSUFFICIENT_DATA`. Classification bands are `STRONG_OPPORTUNITY >= 85`,
`GOOD_OPPORTUNITY >= 70`, `WEAK_OPPORTUNITY >= 50`, and `NO_OPPORTUNITY < 50`.
Policy version: `content-opportunity-v1.0.0`.

## Boundary rules

- Other modules may import **only** from `@modules/module-07-content` (the `index.ts` public contract).
- This module owns its own tables/schema. No other module may read or write them directly.
- Cross-module communication happens through the public contract, an application
  service, an API call, or an event — never through internal file access.

## Implemented structure

```text
module-07-content/
├── domain/           # entities, value objects, domain services
├── application/      # use cases, application services
├── infrastructure/   # repositories, adapters
└── index.ts          # public contract
```

Persistence is owned by `module_07.content_opportunities`; every read is constrained
by `workspace_id`, and the composite foreign key preserves Opportunity ownership.
Module 15 tenancy and Module 16 permissions are reused without local role checks.
AI generation, providers, publishing, automation, analytics, and attribution are deferred.
