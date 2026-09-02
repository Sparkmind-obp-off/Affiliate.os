# Architecture Conflict Register

Task: `AFFILIATE-OS-FOUNDATION-001`

Task 01 §5 requires that conflicts between the environment and the locked
architecture be **identified and documented**, never silently destroyed or
papered over. This register is that record.

Nothing here changes a locked contract. Each item states the conflict, what
Task 01 did, and what still has to be decided.

---

## CONFLICT-01 — PostgreSQL vs. the Cloudflare Workers runtime

**Locked requirement**
- DOC 24 §314: `Database = PostgreSQL`
- Task 01 §11: SQLite / in-memory / JSON-file databases are forbidden as the
  production database.

**Environment constraint**
- The deployment target is Cloudflare Pages / Workers (Task 01 §28).
- Workers have no raw TCP socket in the general case and no Node.js `net`
  module, so the standard `pg` driver cannot be used directly from a Worker.
- The sandbox has **no PostgreSQL server and no Docker**, so no live database
  was reachable during this task.

**Status: OPEN — decision required before the persistence task.**

**What Task 01 did**
- Kept PostgreSQL as the only relational target. No SQLite/D1/KV fallback was
  introduced, and an architecture test fails the build if a forbidden driver
  ever appears in `package.json`.
- Rejected non-PostgreSQL `DATABASE_URL` values in `src/shared/config/env.ts`.
- Declared **no** `d1_databases` / `kv_namespaces` binding in `wrangler.jsonc`.
- Used `pg` only in the Node-side migration runner (`scripts/migrate.mjs`),
  which runs in CI/locally — never inside the Worker.
- Reported database health as `not_configured` / `not_checked`, never `healthy`
  (Task 01 §20).

**Options for the deciding task**
1. **Cloudflare Hyperdrive** — Workers connect to managed PostgreSQL through a
   Hyperdrive binding. Keeps PostgreSQL and keeps Cloudflare.
2. **Serverless PostgreSQL over HTTP** (e.g. an HTTP/WebSocket Postgres driver)
   — works inside Workers without TCP.
3. **Move the API to a Node-compatible runtime** and keep Cloudflare for the
   frontend only. Highest change cost; breaks the single-deployable assumption.

Options 1 and 2 preserve both the database contract and the deployment
contract, so they are the recommended candidates.

---

## CONFLICT-02 — Redis queue and S3 storage vs. Workers

**Locked requirement**
- DOC 24 §314: `Queue = Redis-compatible / managed queue`,
  `Object Storage = S3-compatible storage`.

**Environment constraint**
- A Worker cannot host a long-running queue consumer, a background worker
  process, or a cron-style daemon.

**Status: OPEN — not in Task 01 scope.**

**What Task 01 did**
- Nothing was implemented. Task 01 §33/§34 forbid building queue and storage
  infrastructure here, and §34 forbids premature distributed infrastructure.
- `.env.example` documents `QUEUE_URL` and the `STORAGE_*` variables as
  `PENDING`, so the requirement stays visible instead of being forgotten.
- The outbox/queue design of DOC 22 §234 is unaffected: the outbox is a
  database table, and only the *consumer* placement is open.

---

## CONFLICT-03 — Monorepo layout (`apps/`, `packages/`) vs. this repository

**Locked requirement**
- DOC 24 §315 shows a canonical layout with `apps/web`, `apps/api`,
  `modules/module-NN-*`, and `packages/*`.

**Environment constraint**
- This repository is a single Cloudflare Pages project, and Task 01 §8 allows
  adjusting names to the framework's conventions while §8 also forbids creating
  "empty complexity merely for appearance".

**Status: RESOLVED — layout adapted, boundaries preserved.**

**Mapping actually used**

| DOC 24 §315      | This repository       | Note                                    |
| ---------------- | --------------------- | --------------------------------------- |
| `apps/api`       | `src/app/`            | HTTP shell: routes + middleware         |
| `apps/web`       | *(not created yet)*   | Frontend belongs to the UI task         |
| `modules/`       | `src/modules/`        | Same module names, same boundary rules  |
| `packages/`      | `src/shared/`         | Primitive infrastructure only           |
| `migrations/`    | `migrations/`         | Unchanged                               |
| `tests/`         | `tests/`              | `unit` + `integration` + `architecture` |

The substance of §315 — module isolation, a shared layer restricted to
primitives, and automated boundary enforcement — is intact and tested. Only the
physical folder depth differs.

---

## CONFLICT-04 — `src/modules/*` are contract stubs, not implementations

**Status: EXPECTED — this is the Task 01 boundary, not a defect.**

Each of the 18 module folders currently contains only `index.ts` (its public
contract) and `MODULE.md` (ownership + status). Every module reports
`MODULE_STATUS = 'NOT_IMPLEMENTED'`.

This is deliberate: Task 01 §2 forbids implementing the modules, and §8 forbids
fabricating empty `domain/application/infrastructure` trees. The implementing
task creates those folders when it has real code to put in them.

---

## CONFLICT-05 — No PostgreSQL available in the sandbox

**Status: BLOCKED (environmental), migration path unverified against a live server.**

`npm run db:migrate` and `npm run db:migrate:status` were **not** executed
against a real database, because no PostgreSQL instance and no Docker were
available. The runner's file discovery, ordering, duplicate-version detection
and checksum logic are covered by architecture tests, but the SQL itself has
**not** been executed. That verification belongs to an environment that has a
PostgreSQL instance, and this document is the honest record that it did not
happen here.

---

## CONFLICT-06 — Module 05 MVP persistence lifecycle

Task: `AFFILIATE-OS-MVP-VERTICAL-003`

**Status: PARTIALLY RESOLVED BY TASK 04 — implementation complete; live database verification remains blocked by CONFLICT-05.**

**Locked requirement**
- DOC 24 §314 / Task 01 §11: the production database is PostgreSQL; SQLite,
  in-memory and JSON-file databases are forbidden and blocked by an
  architecture test.
- Opportunity Engine §38 / MVP Scope §15: the decision card is a real,
  user-visible artifact.

**The conflict**

The first MVP vertical (Module 05 — Opportunity Evaluation & Decision) can
compute the full decision card deterministically, but it cannot *store* an
evaluation: no PostgreSQL instance is reachable from the Cloudflare Workers
runtime in this environment (CONFLICT-01), and none exists in the sandbox
(CONFLICT-05).

**What TASK 03 did**

- Implemented the vertical as a **pure, stateless, idempotent computation**.
  Every input arrives in the request; nothing is read from or written to a
  database. The vertical is therefore fully verifiable today.
- Kept the persistence seam explicit and tested as an application port,
  `OpportunityEvaluationRecorder`. No adapter is wired, so nothing
  unverifiable ships. `data.persisted` in the evaluate response reports the
  truth (`false`) rather than implying storage.
- Made persistence-dependent routes **fail closed** with
  `501 NOT_IMPLEMENTED` (`GET /api/v1/affiliate/opportunities`,
  `GET /api/v1/affiliate/opportunities/:candidateRef`) instead of returning a
  misleading empty collection.
- Did **not** substitute D1/KV/SQLite to manufacture persistence, because that
  would violate a locked contract.

**Authorization consequence**

Because the vertical owns no tenant data — nothing stored, nothing fetched —
there is no resource ownership to check and no authentication boundary was
fabricated here. Module 15 (Identity/Tenancy) remains unimplemented and **no
new production secret was introduced**.

**TASK 04 update**

- Added forward-only migration `0002` and a `PostgresOpportunityRepository`.
- Added workspace-scoped create, retrieve, and list use cases/routes.
- Persistent routes require verified HS256 bearer claims containing organization,
  workspace, and user identifiers. This is the minimum authorization boundary,
  not a replacement for the future Module 15/16 ecosystem.
- The runtime adapter is configured only by `DATABASE_URL`; no D1/KV/SQLite
  fallback exists. Missing configuration still fails closed.
- The sandbox had no PostgreSQL credentials, so migration execution and live
  database E2E verification remain honestly unverified under CONFLICT-05.
