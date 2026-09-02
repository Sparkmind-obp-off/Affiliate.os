# module-19-attribution

**Title:** Attribution, Measurement & Business Truth Engine
**Architecture reference:** DOC 19 + 88
**Status:** NOT_IMPLEMENTED — foundation only

## Boundary rules

- Other modules may import **only** from `@modules/module-19-attribution` (the `index.ts` public contract).
- This module owns its own tables/schema. No other module may read or write them directly.
- Cross-module communication happens through the public contract, an application
  service, an API call, or an event — never through internal file access.

## Expected internal structure (created by the implementing task)

```text
module-19-attribution/
├── domain/           # entities, value objects, domain services
├── application/      # use cases, application services
├── infrastructure/   # repositories, adapters
└── index.ts          # public contract
```
