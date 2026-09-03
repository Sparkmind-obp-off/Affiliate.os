# module-04-demand

**Title:** Demand Discovery Engine

**Architecture reference:** AFFILIATE OS — DEMAND DISCOVERY ENGINE v1.0

**Status:** IMPLEMENTED — Task 09 foundation

## Boundary rules

- Other modules may import only from `@modules/module-04-demand` (`index.ts`).
- Module 04 exclusively owns `module_04.demand_signals`.
- Every persisted operation requires an explicit server-derived `workspace_id`.
- Cross-module access uses this public contract, an API call, or a future event; consumers must not access internal files or tables.

## Implemented

- Manual and semi-automated evidence ingestion through `POST /api/v1/demand/signals`.
- Tenant-scoped get and bounded list operations.
- Controlled signal/source/confidence/status vocabularies.
- Conservative Unicode NFKC normalization without semantic rewriting.
- Transparent deterministic scoring based on raw signal strength, signal type, and confidence.
- Evidence maturity classification from `DISCOVERED` through `OPPORTUNITY_READY`.
- Stable SHA-256 fingerprints with PostgreSQL-enforced per-workspace uniqueness.
- Evidence provenance (`sourceType`, `sourceRef`, `observedAt`, `evidence`, and `confidence`).
- Module 15 identity/tenancy and Module 16 `demand.read` / `demand.create` authorization reuse.
- Parameterized PostgreSQL persistence and safe canonical errors.

## Opportunity Engine boundary

Module 04 produces evidence-backed demand signals for future Opportunity evaluation. It does not import Module 05 internals, duplicate its evaluation model, or automatically create an Opportunity. Future integration must consume Module 04's public contract and Module 05's public input contract.

## Deferred

Provider connectors, TikTok/TikTok Shop APIs, Serper/SerpApi, scraping/crawling, LLM discovery, AI-only inference, automated alerts, automatic Opportunity creation, dashboards, analytics, billing, queues, object storage, and a general workflow-history platform remain outside Task 09.
