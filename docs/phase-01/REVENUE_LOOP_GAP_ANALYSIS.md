# Phase 01 — Revenue Loop Gap Analysis

**Repository:** `Sparkmind-obp-off/Affiliate.os`  
**Audit date:** 2026-09-05  
**Target:** smallest reliable Affiliate Money Loop

## Target loop

`Discover → Validate → Select → Create → Distribute → Track → Convert → Commission → Revenue → Measure → Next Action`

## Evidence-based gap map

| Stage | Existing foundation | Audit result | Gap |
|---|---|---|---|
| Discover | Module 04 Demand Discovery | PRESENT | Provider ingestion/automated discovery remains deferred. |
| Validate | Module 05 Opportunity | PRESENT | Deterministic scoring exists. |
| Select | Opportunity decision/priority + Creator Fit | PRESENT / PARTIAL | Product/affiliate-offer selection semantics are not yet the revenue core. |
| Create | Module 07 + Module 08 | PRESENT | Generation is provider-independent and human-review aware. |
| Distribute | Distribution specification/boundary | MISSING | No completed real publishing/scheduling path is exposed. |
| Track | Performance/attribution specifications | MISSING | Click/event tracking execution is absent from the inspected API surface. |
| Convert | Revenue/conversion specification | MISSING | No completed conversion recording path is exposed. |
| Commission | Revenue/conversion specification | MISSING | No completed commission calculation/recording path is exposed. |
| Revenue | Revenue/conversion specification | MISSING | No authoritative revenue ledger execution path is exposed. |
| Measure | Performance specification | MISSING | No completed revenue-backed performance surface is mounted. |
| Next Action | Recommendation/automation specifications | DEFERRED | Should follow verified revenue data, not precede it. |

## Critical architecture conclusion

The missing part is primarily **downstream of Content Generation**. The existing upstream chain should not be rewritten merely because the money loop is incomplete.

The first implementation target should be a deterministic, auditable financial event chain:

`Affiliate Program → Affiliate Product/Offer → Affiliate Link → Click → Conversion → Commission → Revenue → Performance`

with every financial record traceable backward through its attribution identifiers.

## Required Phase 2 controls

1. **Tenant safety:** every query and mutation is scoped to the authoritative workspace/tenant context.
2. **Idempotency:** duplicate clicks, conversions, commissions, revenue events and provider/webhook deliveries cannot double-count money.
3. **Deterministic attribution:** attribution policy is explicit, versioned and replayable.
4. **Financial truth:** monetary values use exact decimal/NUMERIC semantics and explicit currency.
5. **Auditability:** every conversion/commission/revenue record has source identifiers and timestamps sufficient for reconciliation.
6. **No AI financial authority:** AI may recommend or analyze; it does not create authoritative payment, commission or revenue truth.
7. **No fake production data:** mocks/fixtures are never presented as production revenue.
8. **Human approval:** publishing/campaign/pricing actions remain approval-gated where required by the master architecture.

## P0 / P1 gaps

### P0 — integrity and security gate

- Finalize authoritative attribution identity and idempotency keys.
- Ensure all financial writes are tenant-scoped and permission-protected.
- Define exact monetary and currency contracts.
- Define reconciliation and duplicate-event behavior.

### P1 — money loop

- Affiliate Product/Offer domain.
- Affiliate Link domain.
- Click recording.
- Conversion recording.
- Commission recording.
- Revenue recording.
- Minimal performance aggregation.
- End-to-end traceability.

### P2 — execution scale

- Real platform connectors.
- Queue/worker orchestration.
- S3-compatible object storage where required.
- Webhook ingestion and retry infrastructure.

### P3 — optimization

- AI provider adapters.
- Recommendation engine activation.
- Autonomous optimization only after authoritative revenue data exists.

## Explicit non-goals for Phase 2

Do not expand Phase 2 into a full CRM, full social scheduler, full payment gateway, payout engine, mobile application, multi-vertical abstraction, autonomous campaign manager, or large analytics dashboard.

## Gate to Phase 3

Phase 3 must remain blocked until the Phase 2 E2E acceptance path is proven:

`demand → opportunity → validation → product/offer → content → review → distribution → click → conversion → commission → revenue → performance`

with traceable IDs, duplicate-event protection, tenant isolation, and a clean test/verification record.

## Evidence

The API root confirms that the current mounted surface stops at Demand, Opportunity, Creator Fit, Content Opportunity, Content Generation and Identity; analytics is still listed as pending. fileciteturn34file0

The README explicitly says publishing, analytics, recommendation, attribution and concrete AI provider adapters remain deferred. fileciteturn51file0

The existing Opportunity persistence adapter already demonstrates workspace-scoped database access and duplicate handling, which should be treated as a pattern to preserve for the revenue domain rather than duplicated inconsistently. fileciteturn43file0
