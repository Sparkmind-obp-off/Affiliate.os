# module-05-opportunity

**Title:** Opportunity Engine & Scoring System
**Architecture reference:** AFFILIATE OS — OPPORTUNITY ENGINE & SCORING SYSTEM v1.0
**Status:** NOT_IMPLEMENTED — foundation only

## Boundary rules

- Other modules may import **only** from `@modules/module-05-opportunity` (the `index.ts` public contract).
- This module owns its own tables/schema. No other module may read or write them directly.
- Cross-module communication happens through the public contract, an application
  service, an API call, or an event — never through internal file access.

## Expected internal structure (created by the implementing task)

```text
module-05-opportunity/
├── domain/           # entities, value objects, domain services
├── application/      # use cases, application services
├── infrastructure/   # repositories, adapters
└── index.ts          # public contract
```
