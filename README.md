# Affiliate OS v1.0

Modular SaaS Operating System for affiliate intelligence, content operations,
performance optimization, revenue intelligence, automation, billing, and
ecosystem commerce.

> **Current state: FOUNDATION ONLY.**
> Task `AFFILIATE-OS-FOUNDATION-001` establishes the repository, the module
> boundary, and the shared infrastructure. **No business module is implemented
> yet.** Every module reports `MODULE_STATUS = 'NOT_IMPLEMENTED'`.

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

## Completed in this task

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
- [x] 47 passing tests (unit + integration + architecture)
- [x] CI pipeline definition

## Not implemented yet (by design)

Task 01 §33 explicitly excludes these; each belongs to its own task:

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

| Method | Path          | Description                                                     | Auth |
| ------ | ------------- | --------------------------------------------------------------- | ---- |
| `GET`  | `/health`     | Liveness. Separates application / database / provider health.   | none |
| `GET`  | `/api/v1`     | API version root; lists routers pending implementation.         | none |

All other paths return the canonical `RESOURCE_NOT_FOUND` error envelope.

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
- **Tables:** none yet. DOC 21 §180+ table DDL is applied by the data-model task,
  before any seed runs (`202.1 — SEED EXECUTION PREREQUISITES`).

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
│   └── module-NN-name/
│       ├── index.ts         # the ONLY legal import surface
│       └── MODULE.md
└── shared/                  # primitive infrastructure only
    ├── config/  errors/  http/  logging/

migrations/                  # PostgreSQL, forward-only
scripts/                     # migration runner, module scaffolding
tests/
├── unit/  integration/  architecture/
docs/
└── ARCHITECTURE-CONFLICTS.md
```

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
| Secret redaction in logs       | Implemented — structural, not caller-dependent     |
| No stack traces in responses   | Implemented                                        |
| Secure response headers        | Implemented                                        |
| Trace-header injection defense | Implemented — malformed ids rejected               |
| Authentication                 | **PENDING** — Module 15 task                       |
| Authorization / policy engine  | **PENDING** — Module 16 task                       |
| Tenant isolation enforcement   | **PENDING** — model preserved, not yet enforced    |
| Rate limiting                  | **PENDING**                                        |
| Audit log persistence          | **PENDING**                                        |

Anything marked PENDING is genuinely absent. No placeholder security is
implemented, because fake security is worse than none.

---

## Deployment

- **Platform:** Cloudflare Pages, via Git integration (Task 01 §28/§29).
  Direct-upload lock-in is deliberately avoided.
- **Repository:** https://github.com/Sparkmind-obp-off/Affiliate.os
- **Production URL:** not deployed yet.
- **Tech stack:** Hono + TypeScript + Zod + Vitest + Wrangler
- **Last updated:** 2026-09-02
