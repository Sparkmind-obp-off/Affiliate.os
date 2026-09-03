# module-04-demand

**Title:** Demand Discovery Engine
**Architecture reference:** AFFILIATE OS — DEMAND DISCOVERY ENGINE v1.0
**Status:** IMPLEMENTED — Task 09 foundation

## Boundary rules

- Other modules may import **only** from `@modules/module-04-demand` (the `index.ts` public contract).
- This module owns its own tables/schema. No other module may read or write them directly.
- Cross-module communication happens through the public contract, an application service, an API call, or an event — never through internal file access.

## Task 09 scope

- Manual and semi-automated demand signal ingestion.
- Evidence-first normalization, canonical problem derivation, confidence, score, and status.
- PostgreSQL persistence scoped by `workspace_id`.
- Module 16 RBAC for `demand.read` and `demand.create`.
- Provider connectors, scraping, AI-only inference, alerts, and automatic opportunity creation remain deferred.
