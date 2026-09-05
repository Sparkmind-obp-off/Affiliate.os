# Phase 01 — Phase 02 Implementation Plan

**Repository:** `Sparkmind-obp-off/Affiliate.os`  
**Status:** READY FOR EXECUTION AFTER PHASE 01 REVIEW  
**Rule:** This document is a plan only. It does not authorize automatic Phase 03 work.

## Objective

Build the smallest reliable Affiliate Money Loop without rewriting the proven upstream foundations.

## Implementation order

### 1. Revenue Domain Foundation

Create authoritative domain contracts for Order, OrderItem, Payment/Transaction where required, Commission, Revenue and Expense. Keep financial truth independent from AI and UI.

### 2. Affiliate Product / Offer Mapping

Model the relationship:

`Merchant → Affiliate Program → Affiliate Product → Affiliate Offer`

Required controls: tenant ownership, explicit commission terms, currency, status/lifecycle, deterministic identifiers.

### 3. Attribution Foundation

Define the canonical attribution record and policy. It must connect campaign/content/link/click/conversion identifiers and carry a versioned attribution method.

### 4. Distribution Foundation

Introduce the smallest distribution abstraction required to create a publishable artifact without building a complete social scheduler. Manual/mock/internal adapters are acceptable for development, but must be clearly labeled and cannot generate fake production revenue.

### 5. Click Tracking

Record affiliate-link clicks with tenant-safe identifiers, timestamp, source metadata and idempotency protection.

### 6. Conversion Tracking

Record conversions from an authoritative source. Enforce duplicate protection and deterministic association to the attributed click/link/offer.

### 7. Commission Tracking

Calculate or ingest commission according to an explicit deterministic contract. Persist exact monetary value, currency, source conversion and calculation/version metadata.

### 8. Revenue Recording

Create the authoritative revenue record. Revenue must be derivable/reconcilable from upstream transaction/commission evidence and must never depend on an LLM response.

### 9. Performance Measurement

Add minimal metrics necessary to answer: clicks, conversions, conversion rate, commission, revenue and basic per-content/offer performance. Avoid a large dashboard.

### 10. End-to-End Integration

Connect the upstream foundation to the money loop while preserving existing module boundaries:

`Demand → Opportunity → Creator Fit → Content Opportunity → Content Generation → Review → Distribution → Link → Click → Conversion → Commission → Revenue → Performance`

### 11. Testing

Required suites:

- domain/unit tests;
- repository/integration tests;
- API contract tests;
- tenant-isolation tests;
- authorization tests;
- duplicate-event/idempotency tests;
- attribution replay tests;
- monetary precision tests;
- E2E money-loop test;
- architecture boundary tests.

### 12. Production Readiness

Before declaring completion, verify:

- PostgreSQL migrations execute successfully against the actual target environment;
- Worker-compatible PostgreSQL connectivity is proven;
- secrets are runtime-managed and not committed;
- production TLS is enforced;
- observability covers financial writes and failures without leaking secrets;
- webhook/event retries cannot double-count revenue;
- rollback/recovery behavior is documented.

## Recommended commit sequence

1. `feat(revenue): add financial domain foundation`
2. `feat(affiliate): add product and offer mapping`
3. `feat(attribution): add deterministic attribution foundation`
4. `feat(distribution): add minimal distribution boundary`
5. `feat(tracking): add affiliate click tracking`
6. `feat(conversion): add conversion recording`
7. `feat(commission): add commission recording`
8. `feat(revenue): add authoritative revenue ledger`
9. `feat(performance): add minimal revenue metrics`
10. `test(e2e): prove affiliate money loop`
11. `chore(hardening): production readiness verification`

## Stop conditions

Stop and return to architecture review if any implementation requires:

- replacing PostgreSQL with D1/KV/SQLite;
- creating a second authentication/RBAC system;
- putting core business logic into Make/queues/AI prompts;
- making AI the source of truth for money;
- bypassing tenant boundaries;
- silently changing an existing public contract;
- extracting shared core before the semantics are stable and reusable by at least two verticals.

## Phase 2 acceptance gate

Phase 2 is complete only when a single test scenario can produce traceable IDs across the complete money loop and demonstrate that a duplicate external event does not duplicate commission or revenue.

Phase 3 is **not** part of this plan and must not begin automatically after Phase 2.

## Evidence basis

The current API composition shows the upstream foundation is mounted while analytics remains pending. fileciteturn34file0

The repository already uses PostgreSQL repositories with workspace-scoped queries and conflict handling in Module 05; this pattern should be preserved. fileciteturn43file0

The repository CI already includes typecheck, lint, unit, architecture, integration/contract and build gates. fileciteturn49file0

The architecture register requires unresolved runtime/database conflicts to remain explicit rather than being papered over. fileciteturn40file0
