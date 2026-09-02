# TASK 03 — FIRST MVP VERTICAL — IMPLEMENTATION PLAN

Task id: `AFFILIATE-OS-MVP-VERTICAL-003`
Baseline: TASK 01 + TASK 02 complete (foundation, module boundaries, fail-closed diagnostics).

---

## 1. SELECTED MVP VERTICAL

**Opportunity Evaluation & Decision (Module 05 — Opportunity Engine & Scoring System).**

Concretely: given the signals a creator can actually supply today (demand, product
fit, creator fit, content potential, economics, competition, momentum, risk plus
execution context), the system returns a deterministic

```text
Opportunity Score → Classification → Decision → Priority → Explanation → Recommended Angle
```

and can rank a batch of candidates down to a TOP-N shortlist.

## 2. WHY THIS VERTICAL

Source-of-truth, not preference:

| Evidence | Location |
| --- | --- |
| Build order puts the Opportunity Engine at P0, immediately after the core data model | `docs/specifications/affiliate-os-mvp-scope-boundary-v1-0.md` §24 |
| The product's core value is explicitly the decision layer, not a product finder | `docs/specifications/affiliate-os-opportunity-engine-scoring-system-v1-0.md` §75, §76 |
| MVP success is defined as "user can explain *why* an opportunity was chosen" | MVP Scope §26 |
| The MVP decision card / scoring model is specified numerically | MVP Scope §15, §16; Opportunity Engine §10, §29–§31, §38 |
| Module 05 already owns `/api/v1/affiliate` in the mounted-router registry | `src/app/routes/api-v1.ts` (Task 01) |

It is also the smallest vertical that is **independently testable**: the scoring,
classification, decision, priority, angle and explanation rules are pure
functions of the request, so the whole vertical can be proven without any
external service.

## 3. REQUIRED MODULES

- `module-05-opportunity` — domain + application + HTTP adapter (this task).
- Existing shared primitives: config, request context, envelope, error model, logging.

## 4. OPTIONAL MODULES NOT IMPLEMENTED (DEFERRED)

`module-04-demand`, `module-06-creator-fit`, `module-07-content`,
`module-08-distribution`, `module-09-performance`, `module-10-revenue`,
`module-11-experiment`, `module-12-recommendation`, `module-13-automation`,
`module-14-data`, `module-15-identity`, `module-16-security`,
`module-17-connectors`, `module-18-observability`, `module-19-attribution`,
`module-25-billing`, `module-26-ecosystem`.

Signals that those modules will eventually *produce* are accepted as **request
input** in this task, exactly as the engine contract describes its inputs
(Opportunity Engine §4, §5, §6). No module boundary is crossed.

## 5. THE MINIMUM SLICE

### INPUT

A candidate opportunity: product reference, the eight scoring signals
(0–100, momentum may be the specified enum), evaluation confidence,
execution context (budget mode, sample requirement, production capability),
an optional competitor content-gap flag, an optional policy-risk flag, and
optional data-quality provenance (source + checked_at, MVP Scope §17).

### PROCESS

1. **Score** — weighted model, Opportunity Engine §10 / §29, with risk inverted
   per §30 (`RiskAdjusted = 100 − Risk`).
2. **Classify** — bands from §31 (EXCEPTIONAL / STRONG / TESTABLE / WATCH / PASS).
3. **Decide** — fixed-precedence rule ladder (§32–§37) modelled on the
   deterministic decision engine contract (`14a` §14A/§14D): same input +
   same model version ⇒ same decision, with reason codes and the firing rule id.
4. **Prioritise** — `score × confidence × execution feasibility` (§58, §59),
   resource-aware (§60–§63).
5. **Explain** — machine-readable strengths / cautions (§39).
6. **Recommend an angle** — deterministic angle catalogue scored on hook
   strength, problem relevance, demonstrability, novelty, proof, audience fit
   (§40–§42).
7. **Rank** — batch evaluation reduced to a TOP-N shortlist (§57).

No AI, no randomness, no wall-clock influence on the decision.

### OUTPUT

The decision card of MVP Scope §15 / Opportunity Engine §38 as JSON: total score,
classification, per-dimension components and weighted contributions, decision +
reason codes, priority score/band, execution feasibility, explanation list,
recommended angle + alternatives.

### PERSISTENCE

**None in this task — and this is a documented boundary, not an omission.**

- The locked database is PostgreSQL (DOC 24 §314, Task 01 §11). `CONFLICT-01`
  in `docs/ARCHITECTURE-CONFLICTS.md` is still **OPEN**: a Cloudflare Worker
  cannot reach PostgreSQL without Hyperdrive or an HTTP driver, and no
  PostgreSQL instance exists in this environment.
- Substituting D1/KV/SQLite to "get persistence" would violate Task 01 §11 and
  is blocked by an existing architecture test.
- Therefore this vertical is deliberately **stateless and idempotent**: it is a
  pure decision-support computation. The seam for persistence exists and is
  tested — `OpportunityEvaluationRecorder` (application port). No adapter is
  wired, and no migration is added, so nothing unverifiable ships.
- Persistence-dependent routes answer `501 NOT_IMPLEMENTED` instead of
  pretending to work (see `CONFLICT-06`).

### API

Mounted under the existing v1 boundary, canonical envelope, canonical error codes:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/affiliate/opportunities/evaluate` | evaluate one candidate |
| `POST` | `/api/v1/affiliate/opportunities/rank` | evaluate a batch, return TOP-N |
| `GET` | `/api/v1/affiliate/opportunities/scoring-model` | disclose weights, bands, decision ladder |
| `GET` | `/api/v1/affiliate/opportunities` | `501 NOT_IMPLEMENTED` (needs persistence) |

`POST .../evaluate` and `POST .../rank` are computations, not resource
creations: they store nothing and return `200`, per the command form allowed by
DOC 22 §216.

### AUTHORIZATION

- The endpoints read and write **no tenant-owned data**: every input arrives in
  the request, nothing is persisted, nothing is fetched. There is no resource
  to own, therefore no ownership check to make, and no tenant context to
  enforce (DOC 22 §218 governs *authenticated* requests against tenant data).
- Module 15 (Identity/Tenancy) stays unimplemented, so no authentication
  boundary is fabricated here and **no new production secret is required**.
- The moment persistence lands, Module 15 becomes a hard prerequisite: the
  collection routes already fail closed with `501`, so no unauthenticated data
  path can be created by accident. Recorded in `CONFLICT-06`.

### FAILURE MODES

| Condition | Behaviour |
| --- | --- |
| Invalid / missing / out-of-range input | `422 VALIDATION_ERROR` + field-level `details` (client-facing by contract) |
| Malformed JSON body | `422 VALIDATION_ERROR`, no parser internals leaked |
| Batch too large (>100) or empty | `422 VALIDATION_ERROR` |
| Unknown sub-route | `404 RESOURCE_NOT_FOUND` (existing canonical handler) |
| Persistence-dependent route | `501 NOT_IMPLEMENTED`, honest reason |
| Unexpected error | `500 INTERNAL_ERROR`, sanitized (Task 02 fail-closed exposure preserved) |
| Database failure | not reachable — no database call exists in this vertical |

### TESTS

- **Unit** — reproduces the specification's own opportunity card (§38) to the
  exact published total (84); weight table sums to 1.0; clamping/rounding;
  classification band edges; every decision rule in the ladder including
  precedence; priority multipliers and zero-budget sample penalty; angle
  ordering and determinism; explanation codes; use-case validation failures;
  the recorder port being invoked when supplied and absent when not.
- **Integration** — HTTP contract of all four routes: success envelope shape,
  `422` on bad input, `501` on the persistence route, `404` on unknown
  sub-route, determinism across two identical requests.
- **Regression** — existing `/health`, `/api/v1`, unknown-route,
  error-sanitization, pages-entry and architecture suites stay green and
  untouched.
- **Architecture** — module boundary tests already walk `src/`; the new HTTP
  adapter is reached through the module's public contract via the
  `@modules/module-05-opportunity` alias.

## 6. ACCEPTANCE CRITERIA

1. `POST /api/v1/affiliate/opportunities/evaluate` returns the canonical success
   envelope with score, classification, decision, priority, explanation and a
   recommended angle.
2. The published example card of Opportunity Engine §38 is reproduced exactly
   by the implementation (score 84, STRONG, TEST NOW).
3. The same input always yields the same decision (deterministic contract).
4. Invalid input yields `422 VALIDATION_ERROR` with field details and no
   internal diagnostics.
5. A batch of candidates is ranked into a TOP-N shortlist.
6. The scoring model (weights, bands, decision ladder) is machine-readable.
7. Persistence-dependent capability is reported as `501 NOT_IMPLEMENTED`, never
   faked.
8. `npm run verify` passes: typecheck, lint, tests, build.
9. No new production secret, no new Cloudflare project, no architecture change.
