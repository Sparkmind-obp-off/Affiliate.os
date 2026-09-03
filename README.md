# Affiliate OS v1.0

Modular SaaS Operating System for affiliate intelligence, content operations,
performance optimization, revenue intelligence, automation, billing, and
ecosystem commerce.

> **Current state: FOUNDATION + PERSISTENT MODULE 05 MVP.**
> Tasks 01–03 established the foundation and deterministic Opportunity Engine.
> TASK 04 adds its minimum PostgreSQL persistence lifecycle: evaluate, persist,
> retrieve, and list workspace-owned opportunities. TASK 05 activated a dedicated
> Neon PostgreSQL production database and applied migrations `0001`–`0002`.
> Production persistence verification remains blocked until a valid, independently
> provisioned `AUTH_SECRET` is configured. Every other module remains
> `MODULE_STATUS = 'NOT_IMPLEMENTED'`.

---

## Project overview

- **Name:** Affiliate OS
- **Architecture:** Modular Monolith + Domain-Oriented + Event-Driven integration
- **Runtime:** TypeScript on Cloudflare Workers / Pages (Hono)
- **Database:** PostgreSQL (see [`docs/ARCHITECTURE-CONFLICTS.md`](docs/ARCHITECTURE-CONFLICTS.md) CONFLICT-01)
- **API:** Versioned REST/JSON under `/api/v1`

Architecture is governed by the locked documents DOC 20–26. Code may not
contradict them; where the environment conflicts with a locked contract, the
conflict is recorded in the conflict register rather than silently resolved.

---

## Completed — TASK 03 (first MVP vertical)

- [x] **Module 05 — Opportunity Engine & Scoring System**, end to end
  - [x] Domain layer: weighted scoring model (Opportunity Engine §10/§29),
        risk inversion (§30), classification bands (§31)
  - [x] Deterministic decision ladder with fixed precedence, rule ids and
        reason codes (§32–§37, modelled on `14a`)
  - [x] Priority model — score × confidence × execution feasibility (§58–§63)
  - [x] Machine-readable explanation (strengths / cautions, §39)
  - [x] Deterministic recommended-angle catalogue + alternatives (§40–§42)
  - [x] Batch ranking down to a TOP-N shortlist (§57)
  - [x] Application layer: use cases + validation schemas +
        `OpportunityEvaluationRecorder` persistence port (unwired, CONFLICT-06)
  - [x] HTTP adapter mounted at `/api/v1/affiliate` — canonical envelope and
        error model preserved
- [x] Reproduces the published specification card (§38) exactly: score **84**,
      `STRONG`, `TEST_NOW`
- [x] Same input ⇒ same decision (determinism verified over HTTP)
- [x] TASK 04 PostgreSQL lifecycle adapter and migration `0002`
- [x] Workspace-scoped create/retrieve/list with signed tenant claims
- [x] Fail-closed behavior when PostgreSQL or auth configuration is unavailable
- [x] TASK 04 plan in [`docs/tasks/task-04-persistence-lifecycle-plan.md`](docs/tasks/task-04-persistence-lifecycle-plan.md)

## Completed — TASK 01/02 (foundation)

- [x] Project foundation (`package.json`, TypeScript strict config, Vite, Wrangler)
- [x] Modular monolith directory foundation — 18 modules, each with a public contract
- [x] Automated architecture boundary enforcement (verified to fail on violation)
- [x] Environment configuration system with validation + `.env.example`
- [x] Secret-safe `.gitignore` and a secret-scanning architecture test
- [x] PostgreSQL migration foundation (checksum-verified, transactional runner)
- [x] Migration `0001` — `pgcrypto` extension + module schemas (no tables)
- [x] API v1 boundary
- [x] Canonical response/error envelope (DOC 22 §222/§223)
- [x] Structured logging with automatic secret redaction
- [x] Health endpoint that never falsely reports dependency health
- [x] Fail-closed diagnostics exposure for undeclared runtimes (Task 02)
- [x] CI pipeline definition

## Not implemented yet (by design)

Deliberately deferred; each belongs to its own task. TASK 03 stayed inside the
smallest viable vertical and did not expand scope:

- [x] Live PostgreSQL migration against dedicated Neon production database
- [ ] End-to-end production persistence verification (blocked on independently provisioned `AUTH_SECRET`)
- [ ] Demand discovery (Module 04) — signals are request input for now
- [ ] Creator fit, content, distribution, performance, revenue engines
- [ ] Identity / authentication / tenancy logic (Module 15)
- [ ] Policy & authorization enforcement (Module 16)
- [ ] Full database schema — DOC 21 §180+ table DDL
- [ ] Database connectivity from the Worker (see CONFLICT-01)
- [ ] TikTok / TikTok Shop connectors (Module 17)
- [ ] Duitku billing integration (DOC 25)
- [ ] Ecosystem commerce (DOC 26)
- [ ] Affiliate automation, recommendation, attribution engines
- [ ] Frontend application
- [ ] Rate limiting, audit log persistence, idempotency store

---

## Functional entry URIs

| Method | Path                                            | Description                                                            | Auth  |
| ------ | ----------------------------------------------- | ---------------------------------------------------------------------- | ----- |
| `GET`  | `/health`                                       | Liveness. Separates application / database / provider health.          | none  |
| `GET`  | `/api/v1`                                       | API version root; lists mounted and pending routers.                   | none  |
| `POST` | `/api/v1/affiliate/opportunities/evaluate`      | Evaluate one candidate → decision card. Body `{ "candidate": {...} }`. | none¹ |
| `POST` | `/api/v1/affiliate/opportunities/rank`          | Rank a batch (1–100) → TOP-N shortlist. Body `{ "candidates": [...], "shortlist_size": N }`. | none¹ |
| `GET`  | `/api/v1/affiliate/opportunities/scoring-model` | Disclose weights, bands, decision ladder, angles, determinism.         | none¹ |
| `POST` | `/api/v1/affiliate/opportunities`               | Evaluate and persist one opportunity; returns `201`.                   | bearer JWT |
| `GET`  | `/api/v1/affiliate/opportunities?limit=N`       | List workspace opportunities; default 20, maximum 100.                 | bearer JWT |
| `GET`  | `/api/v1/affiliate/opportunities/:candidateRef` | Retrieve one workspace opportunity by stable candidate reference.      | bearer JWT |

¹ These routes read and write **no tenant-owned data**: every input arrives in
the request and nothing is persisted, so there is no resource to own and no
authentication boundary is fabricated. Module 15 becomes a hard prerequisite
the moment persistence lands — see CONFLICT-06.

All other paths return the canonical `RESOURCE_NOT_FOUND` error envelope.

### Candidate input (evaluate / rank)

```json
{
  "candidate": {
    "candidate_ref": "OPP-00124",
    "product_name": "Shoe Cleaning Foam",
    "demand": 82, "product_fit": 94, "creator_fit": 88,
    "content_potential": 95, "economics": 72, "competition": 64,
    "momentum": 86, "risk": 18,
    "confidence": "HIGH",
    "execution": {
      "budget_mode": "NORMAL",
      "sample_required": false,
      "production_complexity": "LOW",
      "creator_can_produce_content": true,
      "product_accessible": true
    },
    "content_gap_identified": false,
    "policy_risk_flagged": false,
    "missing_signals": []
  }
}
```

Signals are `0–100`. Out-of-range, missing or malformed input returns
`422 VALIDATION_ERROR` with field-level `details.issues`.

### Request headers honored

| Header              | Behavior                                                        |
| ------------------- | --------------------------------------------------------------- |
| `X-Request-Id`      | Reused when well formed, otherwise a UUID v4 is generated.      |
| `X-Correlation-Id`  | Propagated; defaults to the request id.                         |
| `Idempotency-Key`   | Captured into request context (enforcement lands with writes).  |

### Response contract

Success (DOC 22 §222):

```json
{ "success": true, "data": {}, "meta": { "request_id": "uuid" } }
```

Error (DOC 22 §223):

```json
{
  "success": false,
  "error": { "code": "RESOURCE_NOT_FOUND", "message": "...", "retryable": false },
  "meta": { "request_id": "uuid" }
}
```

Stack traces and internal causes are never present in a response body.

---

## Data architecture

- **Storage service:** PostgreSQL. SQLite / in-memory / JSON-file databases are
  forbidden as production persistence and are blocked by both configuration
  validation and an architecture test.
- **Schema ownership:** one database, module-owned logical schemas
  (`module_14`, `module_15`, `module_16`, `module_17`, `module_19`) — DOC 21 §2.
- **Migrations:** forward-only, one transaction each, recorded in
  `public.schema_migrations` with a SHA-256 checksum. Editing an applied
  migration fails the runner instead of drifting silently.
- **Tables:** migration `0002` adds `module_05.opportunities`, preserving validated
  input, complete deterministic evaluation, decision metadata, lifecycle state,
  model versions, workspace ownership, and timestamps.
- **Runtime:** the PostgreSQL adapter is wired only when `DATABASE_URL` is present;
  unavailable configuration fails closed and is never replaced by D1/SQLite.

### Tenancy model (preserved, not yet implemented)

```text
ORGANIZATION → WORKSPACE → USER → MEMBERSHIP → ROLE
```

`user_id`-only authorization is forbidden as the sole mechanism (Task 01 §15).

---

## Repository structure

```text
src/
├── app/                     # HTTP shell — no business logic
│   ├── create-app.ts
│   ├── middleware/          # observability, error handling
│   └── routes/              # health, api-v1
├── modules/                 # 18 locked modules, each with a public contract
│   ├── module-05-opportunity/   # IMPLEMENTED (TASK 03)
│   │   ├── domain/          # scoring, decision, priority, angles, explanation
│   │   ├── application/     # use cases, schemas, ports
│   │   ├── infrastructure/  # http adapter
│   │   ├── index.ts         # the ONLY legal import surface
│   │   └── MODULE.md
│   └── module-NN-name/      # contract stub (NOT_IMPLEMENTED)
│       ├── index.ts
│       └── MODULE.md
└── shared/                  # primitive infrastructure only
    ├── config/  errors/  http/  logging/

migrations/                  # PostgreSQL, forward-only
scripts/                     # migration runner, module scaffolding
tests/
├── unit/  integration/  architecture/
docs/
├── specifications/           # normalized product and architecture source documents
│   └── README.md              # complete specification catalog
├── tasks/                     # per-task implementation plans
└── ARCHITECTURE-CONFLICTS.md
```

### Specification documents

The normalized source specifications, including DOC 11–26, live in the
[`docs/specifications`](docs/specifications/README.md) catalog. The original
ZIP is retained only as an import source; use the catalog for repository links.

### Module boundary rule

A module may be imported only through `@modules/<module>`. Reaching into
another module's internals — by deep alias or by relative path — fails the
build. `src/shared` may never depend on a business module.

---

## Developer guide

```bash
npm install

npm run typecheck        # tsc --noEmit (strict)
npm run lint             # eslint, zero warnings tolerated
npm run test             # unit + integration + architecture
npm run build            # vite build → dist/
npm run verify           # all of the above, in CI order

npm run db:migrate:status   # requires a reachable PostgreSQL
npm run db:migrate
```

Local preview on Cloudflare's runtime:

```bash
npm run build
npx wrangler pages dev dist --ip 0.0.0.0 --port 3000
curl http://localhost:3000/health
```

Exercise the MVP vertical:

```bash
curl -X POST http://localhost:3000/api/v1/affiliate/opportunities/evaluate \
  -H 'content-type: application/json' \
  -d '{"candidate":{"candidate_ref":"OPP-00124","product_name":"Shoe Cleaning Foam","demand":82,"product_fit":94,"creator_fit":88,"content_potential":95,"economics":72,"competition":64,"momentum":86,"risk":18,"confidence":"HIGH","execution":{"budget_mode":"NORMAL","sample_required":false,"production_complexity":"LOW","creator_can_produce_content":true,"product_accessible":true},"content_gap_identified":false,"policy_risk_flagged":false,"missing_signals":[]}}'
```

### Configuration

Copy `.env.example` to `.env` (Node tooling) and/or `.dev.vars` (Workers
runtime). Never commit either file. Production refuses to boot without
`DATABASE_URL` and `AUTH_SECRET`.

---

## Security posture

| Control                        | Status                                             |
| ------------------------------ | -------------------------------------------------- |
| Secret hygiene                 | Enforced — gitignore + secret-scanning test        |
| Config validation              | Implemented — fails closed on invalid config       |
| Input validation (Module 05)   | Implemented — Zod schemas, `422` + field details   |
| Fail-closed unimplemented data | Implemented — `501`, never a fake empty collection |
| Secret redaction in logs       | Implemented — structural, not caller-dependent     |
| No stack traces in responses   | Implemented                                        |
| Secure response headers        | Implemented                                        |
| Trace-header injection defense | Implemented — malformed ids rejected               |
| Persistent-route authentication| Implemented — minimum HS256 signed tenant claims  |
| Full identity ecosystem        | **PENDING** — Module 15 task                       |
| Authorization / policy engine  | **PENDING** — Module 16 task                       |
| Tenant isolation enforcement   | Implemented for Module 05 repository queries       |
| Rate limiting                  | **PENDING**                                        |
| Audit log persistence          | **PENDING**                                        |

Anything marked PENDING is genuinely absent. No placeholder security is
implemented, because fake security is worse than none.

---

## Deployment

- **Platform:** Cloudflare Pages, via Git integration (Task 01 §28/§29).
  Direct-upload lock-in is deliberately avoided.
- **Repository:** https://github.com/Sparkmind-obp-off/Affiliate.os
- **Cloudflare Pages project:** `affiliate-os`
- **Production URL:** https://affiliate-os.pages.dev
- **Status:** ✅ Active
- **Tech stack:** Hono + TypeScript + Zod + Vitest + Wrangler
- **Last updated:** 2026-09-03 (TASK 05 database activation; auth-dependent production verification blocked)
