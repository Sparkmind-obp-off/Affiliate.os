# module-06-creator-fit

**Title:** Creator Fit & Personalization Engine
**Architecture reference:** AFFILIATE OS — CREATOR FIT & PERSONALIZATION ENGINE v1.0
**Status:** FOUNDATION_IMPLEMENTED (Task 10)

## Ownership

This module owns workspace-scoped creator profiles, controlled capability data,
and deterministic Creator + Opportunity fit evaluation. Module 05 remains the
owner of opportunity scoring; this module consumes only its public persisted
Opportunity contract.

## Deterministic policy v1

Eight independent dimensions total 100%: niche 15%, product category 15%,
audience 15%, content format 15%, capability 15%, execution 10%, commerce 10%,
and availability 5%. Known dimensions are normalized to a 0–100 fit score.
Coverage below 60%, or fewer than four known dimensions, produces
`INSUFFICIENT_DATA` rather than `NO_FIT`.

Classification bands are `STRONG_FIT >= 85`, `GOOD_FIT >= 70`, `WEAK_FIT >= 50`,
and `NO_FIT < 50`. Confidence is reported separately as evidence reliability ×
data coverage and never changes the fit score. Every dimension emits a stable
reason code as positive, negative, or missing evidence.

## Boundary rules

- Imports from other modules use only their public `index.ts` contract.
- Creator persistence is owned by `module_06.creator_profiles`; every query is
  constrained by `workspace_id`.
- Module 15 supplies authenticated tenancy and Module 16 supplies deny-by-default
  `creator.read` / `creator.create` authorization.
- No LLM, provider connector, scraper, recommendation, assignment, or campaign
  behavior exists in this foundation.
