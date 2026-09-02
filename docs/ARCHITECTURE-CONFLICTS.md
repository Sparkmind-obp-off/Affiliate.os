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
