# module-13-automation

**Title:** Automation & Execution Orchestration Engine
**Architecture reference:** DOC 13
**Status:** NOT_IMPLEMENTED — foundation only

## Boundary rules

- Other modules may import **only** from `@modules/module-13-automation` (the `index.ts` public contract).
- This module owns its own tables/schema. No other module may read or write them directly.
- Cross-module communication happens through the public contract, an application
  service, an API call, or an event — never through internal file access.

## Expected internal structure (created by the implementing task)

```text
module-13-automation/
├── domain/           # entities, value objects, domain services
├── application/      # use cases, application services
├── infrastructure/   # repositories, adapters
└── index.ts          # public contract
```
