# Affiliate OS v1.0

Modular SaaS Operating System for affiliate intelligence, content operations,
performance optimization, revenue intelligence, automation, billing, and
ecosystem commerce.

> **Current state: FOUNDATION + TASK 10 CREATOR FIT FOUNDATION + PERSISTENT MODULE 05 MVP.**
> Tasks 01–03 established the foundation and deterministic Opportunity Engine.
> TASK 04 adds its minimum PostgreSQL persistence lifecycle: evaluate, persist,
> retrieve, and list workspace-owned opportunities. TASK 05 activates and verifies
> that lifecycle in production with Neon PostgreSQL, migrations `0001`–`0002`, an
> independently generated Cloudflare-managed `AUTH_SECRET`, and the workerd-native
> PostgreSQL socket adapter. TASK 06 adds Clerk-authenticated internal accounts, workspaces,
> owner memberships, transactional first-login provisioning, and explicit request tenancy context.
> TASK 07 adds deny-by-default `owner` / `admin` / `member` RBAC and enforces permissions
> on the persisted opportunity lifecycle while retaining repository-level tenant filtering.
> TASK 08 adds the deterministic `draft → active → completed` workflow, archival transitions,
> atomic tenant-scoped state updates, and the authorized lifecycle API.
> TASK 09 establishes the upstream, evidence-first Demand Discovery foundation with deterministic
> normalization/scoring, tenant-scoped persistence, duplicate protection, and authorized APIs.
> TASK 10 adds workspace-owned creator profiles, controlled capability evidence, and an explainable,
> deterministic Creator + Opportunity fit boundary without changing Module 05 scoring semantics.

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

## Completed — TASK 05 (production persistence activation)

- [x] Dedicated Neon PostgreSQL production database with migrations `0001`–`0002`
- [x] Encrypted Cloudflare production secrets for database, SSL, and authentication
- [x] Workerd package-export resolution for the production PostgreSQL TCP adapter
- [x] Authenticated create, read, list, duplicate protection, and tenant isolation verified in production
- [x] Production test record confirmed directly in PostgreSQL and safely removed
- [x] Task 03 deterministic regression preserved: **84 / STRONG / TEST_NOW / R12_TEST_NOW**

## Completed — TASK 05 hardening

- [x] Production requires TLS-enabled PostgreSQL and validates server certificates
- [x] Production rejects missing, weak, placeholder, or provider-derived `AUTH_SECRET` values
- [x] Persistent-route tokens require a valid signature, expiry, and UUID tenant claims
- [x] Logging redacts credentials found in both sensitive keys and free-form error strings
- [x] Migration execution is serialized with a PostgreSQL advisory lock and remains checksum-aware
- [x] Accidental upload/transcript artifacts were removed from the current tree and ignored going forward
- [ ] Historical credential exposure requires provider-side rotation/revocation; Git history rewrite is intentionally deferred to a separately authorized task

## Completed — TASK 06 (identity, account & tenancy foundation)

- [x] Clerk JWT verification behind an external identity boundary (RS256/JWKS)
- [x] Internal account, identity, workspace, and owner-membership model
- [x] Forward-only migration `0003` with uniqueness, foreign keys, checks, and tenant indexes
- [x] Transactional, advisory-lock-protected first-login provisioning
- [x] Explicit request-level account/workspace context and fail-closed status checks
- [x] Current context/account/workspace/membership API endpoints
- [x] Focused identity, suspension, consistency, API, and concurrency tests
- [ ] Full authorization policy/RBAC, invitations, team management, and workspace administration are intentionally deferred

## Completed — TASK 07 (authorization, RBAC & tenant access control)

- [x] Deterministic, reusable `authorize` / `requirePermission` policy boundary in Module 16
- [x] Minimal `owner`, `admin`, and `member` roles with explicit atomic permissions
- [x] Fail-closed account, workspace, membership, role, permission, ownership, and resource-tenant checks
- [x] Permission enforcement on persisted opportunity create/read/list routes
- [x] Repository-level `workspace_id` filtering retained as defense in depth
- [x] Forward-only migration `0004` preserving all Task 06 owner memberships
- [x] Focused role, suspension, privilege-escalation, tenant-isolation, API, and architecture tests
- [ ] Invitations, membership administration endpoints, ownership transfer, and custom roles remain deferred

## Completed — TASK 08 (opportunity workflow & lifecycle foundation)

- [x] Central lifecycle vocabulary and transition policy: `draft`, `active`, `completed`, `archived`
- [x] Atomic compare-and-set persistence scoped by both `workspace_id` and opportunity id
- [x] `PATCH /api/v1/affiliate/opportunities/:id` protected by `opportunity.update`
- [x] Strict status-only payload validation and safe conflict/not-found behavior
- [x] Forward-only migration `0005` reconciling legacy `EVALUATED` rows to `draft`
- [x] Focused valid/invalid transition, authorization, tenant-isolation, concurrency-conflict, and API tests
- [ ] Workflow history/audit events and arbitrary/custom states remain intentionally deferred

## Completed — TASK 09 (demand discovery foundation)

- [x] Evidence-first Module 04 demand-signal domain with controlled signal/source/confidence/status vocabularies
- [x] Conservative Unicode normalization and transparent deterministic demand scoring
- [x] Tenant-scoped SHA-256 fingerprinting with authoritative PostgreSQL uniqueness
- [x] Workspace-scoped create/get/bounded-list application and repository operations
- [x] `POST`/`GET /api/v1/demand/signals` and `GET /api/v1/demand/signals/:id`
- [x] Module 15 identity/tenancy and Module 16 `demand.read` / `demand.create` authorization reuse
- [x] Forward-only migration `0006` with constraints and targeted workspace indexes
- [x] Domain, validation, duplicate, persistence, authorization, API, and tenant-isolation tests
- [ ] Provider connectors, automated discovery, AI-only inference, and automatic Opportunity creation remain deferred

## Completed — TASK 10 (creator fit & matching foundation)

- [x] Workspace-owned Creator Profile domain with controlled platform, niche, audience, format, capability, availability, commerce, and evidence vocabularies
- [x] Explicit opportunity-side matching criteria; product names are never used for hidden inference
- [x] Deterministic eight-dimension Creator Fit policy with documented weights and stable policy version
- [x] Distinct `STRONG_FIT`, `GOOD_FIT`, `WEAK_FIT`, `NO_FIT`, and `INSUFFICIENT_DATA` classifications
- [x] Separate fit score, confidence score, data coverage, positive/negative factors, and missing signals
- [x] Workspace-scoped create/get/list persistence and tenant-scoped Creator + Opportunity evaluation
- [x] Module 15 tenancy plus Module 16 `creator.read` / `creator.create` authorization reuse
- [x] Forward-only migration `0007` and authorized `/api/v1/creators` APIs
- [ ] Provider ingestion, creator discovery, AI matching, recommendation, assignment, campaigns, and fit-result persistence remain deferred

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

- [ ] Content, distribution, performance, and revenue engines; advanced creator personalization/recommendation
- [ ] Advanced/custom authorization policies beyond the Task 07 minimal RBAC matrix
- [ ] Full database schema — DOC 21 §180+ table DDL
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
| `PATCH`| `/api/v1/affiliate/opportunities/:id`           | Transition lifecycle with `{ "status": "active" }`; returns `200`.    | Clerk bearer JWT + `opportunity.update` |
| `POST` | `/api/v1/demand/signals`                        | Normalize, score, fingerprint, and persist one evidence-backed signal. | Clerk bearer JWT + `demand.create` |
| `GET`  | `/api/v1/demand/signals?limit=N`                | List workspace demand signals; default 20, maximum 100.                 | Clerk bearer JWT + `demand.read` |
| `GET`  | `/api/v1/demand/signals/:id`                    | Retrieve one workspace-owned demand signal by UUID.                     | Clerk bearer JWT + `demand.read` |
| `POST` | `/api/v1/creators`                              | Create one validated workspace-owned creator profile.                   | Clerk bearer JWT + `creator.create` |
| `GET`  | `/api/v1/creators?limit=N`                      | List workspace creator profiles; default 20, maximum 100.                | Clerk bearer JWT + `creator.read` |
| `GET`  | `/api/v1/creators/:id`                          | Retrieve one workspace-owned creator profile by UUID.                    | Clerk bearer JWT + `creator.read` |
| `POST` | `/api/v1/creators/:id/fit`                      | Evaluate deterministic fit against a tenant-owned opportunity and explicit criteria. | Clerk bearer JWT + `creator.read` + `opportunity.read` |
| `GET`  | `/api/v1/identity/context`                    | Resolve/provision current identity, account, workspace, and membership. | Clerk bearer JWT |
| `GET`  | `/api/v1/identity/account/me`                 | Return the current internal account.                                    | Clerk bearer JWT |
| `GET`  | `/api/v1/identity/workspace/current`          | Return the current workspace tenant.                                    | Clerk bearer JWT |
| `GET`  | `/api/v1/identity/membership/current`         | Return the current owner membership.                                    | Clerk bearer JWT |

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
  (`module_04`, `module_05`, `module_14`, `module_15`, `module_16`, `module_17`, `module_19`) — DOC 21 §2.
- **Migrations:** forward-only, one transaction each, recorded in
  `public.schema_migrations` with a SHA-256 checksum. Editing an applied
  migration fails the runner instead of drifting silently.
- **Tables:** migration `0002` adds `module_05.opportunities`. Migration `0003` adds
  `module_15.accounts`, `identities`, `workspaces`, and `workspace_memberships`, with
  a forward foreign key from opportunities to workspaces. Migration `0004` expands
  membership roles to `owner` / `admin` / `member`, adds the Module 16 permission catalog,
  and indexes workspace-role-status lookups. Migration `0005` converts legacy opportunity
  status markers to the Task 08 lifecycle, adds its CHECK constraint and tenant/status index,
  and registers `opportunity.update`. Migration `0006` adds `module_04.demand_signals`, evidence
  provenance, bounded deterministic score/status fields, per-workspace fingerprint uniqueness,
  tenant indexes, and the `demand.read` / `demand.create` permission catalog entries. Migration
  `0007` creates `module_06.creator_profiles`, controlled evidence fields, per-workspace reference
  uniqueness, tenant indexes, and `creator.read` / `creator.create` permission entries.
- **Runtime:** the PostgreSQL adapter is wired only when `DATABASE_URL` is present;
  unavailable configuration fails closed and is never replaced by D1/SQLite.

### Identity, tenancy, and authorization model

```text
CLERK IDENTITY → ACCOUNT → WORKSPACE → MEMBERSHIP → ROLE → PERMISSION → DECISION
```

Every persisted tenant-owned query remains explicitly scoped by `workspace_id`.
Module 16 denies by default when any account, workspace, membership, role, permission,
ownership, or resource-tenant invariant fails. Roles and permissions are derived from the
resolved server-side membership context; request payload overrides are ignored.

---

## Repository structure

```text
src/
├── app/                     # HTTP shell — no business logic
│   ├── create-app.ts
│   ├── middleware/          # observability, error handling
│   └── routes/              # health, api-v1
├── modules/                 # 18 locked modules, each with a public contract
│   ├── module-04-demand/        # IMPLEMENTED (TASK 09)
│   ├── module-05-opportunity/   # IMPLEMENTED (TASK 03–08)
│   ├── module-06-creator-fit/   # FOUNDATION IMPLEMENTED (TASK 10)
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
runtime). Never commit either file. Production refuses to boot without `DATABASE_URL`, `DATABASE_SSL=true`, and an
independently generated `AUTH_SECRET` of at least 32 characters. Provider credentials
(such as Clerk keys) must never be reused as `AUTH_SECRET`.

---

## Security posture

| Control                        | Status                                             |
| ------------------------------ | -------------------------------------------------- |
| Secret hygiene                 | Enforced — gitignore + secret-scanning test        |
| Config validation              | Implemented — fails closed on invalid config       |
| Input validation (Modules 04/05/06)| Implemented — strict schemas, `422` + field details |
| Fail-closed unimplemented data | Implemented — `501`, never a fake empty collection |
| Secret redaction in logs       | Implemented — structural, not caller-dependent     |
| No stack traces in responses   | Implemented                                        |
| Secure response headers        | Implemented                                        |
| Trace-header injection defense | Implemented — malformed ids rejected               |
| Persistent-route authentication| Implemented — HS256, required expiry, UUID tenant claims |
| External identity + tenancy    | Implemented — Clerk boundary + Module 15 context   |
| Authorization / RBAC boundary  | Implemented — minimal Task 07 Module 16 policy      |
| Tenant isolation enforcement   | Implemented — authorization + Modules 04/05/06 queries |
| Rate limiting                  | **PENDING**                                        |
| Audit log persistence          | **PENDING**                                        |

Anything marked PENDING is genuinely absent. No placeholder security is
implemented, because fake security is worse than none.

---

## Deployment

- **Platform:** Cloudflare Pages, deployed through the existing BYOK project with
  explicit Git commit metadata for deployment traceability.
- **Repository:** https://github.com/Sparkmind-obp-off/Affiliate.os
- **Cloudflare Pages project:** `affiliate-os`
- **Production URL:** https://affiliate-os.pages.dev
- **Status:** ✅ Active
- **Tech stack:** Hono + TypeScript + Zod + Vitest + Wrangler
- **Last updated:** 2026-09-03 (TASK 10 creator fit & matching foundation)
