# Migrations — Affiliate OS

PostgreSQL is the production database (DOC 24 §314). SQLite, in-memory and
JSON-file databases are **forbidden** as a production database.

## Rules

1. Migrations are **forward-only** and **immutable once applied**. Never edit an
   applied file — add a new one.
2. Each file is named `NNNN_snake_case_description.sql` with a zero-padded,
   strictly increasing sequence number.
3. Every migration runs inside a **single transaction**. If any statement fails,
   the whole migration rolls back and nothing is recorded as applied.
4. Applied migrations are recorded in `public.schema_migrations` together with a
   SHA-256 checksum. If a recorded file's checksum changes, the runner **fails**
   instead of silently drifting.
5. Seeds are **never** standalone. They may only run after the schema migrations
   they depend on have been COMMITTED (see `202.1 — SEED EXECUTION PREREQUISITES`).

## Dependency order

```text
PostgreSQL
    ↓
pgcrypto extension
    ↓
Schemas
    ↓
Tables
    ↓
Foreign keys / constraints
    ↓
Indexes
    ↓
Seed
```

## Usage

```bash
npm run db:migrate:status   # show applied vs pending
npm run db:migrate          # apply pending migrations
```

Requires `DATABASE_URL` to point at a PostgreSQL instance.

## Current state

| File                              | Scope                            | Status |
| --------------------------------- | -------------------------------- | ------ |
| `0001_extensions_and_schemas.sql` | `pgcrypto` + module schemas | ready |
| `0002_module_05_opportunity_lifecycle.sql` | minimum persistent Module 05 opportunity lifecycle | ready |
| `0003_module_15_identity_tenancy.sql` | Task 06 account, identity, workspace, membership, and ownership constraints | ready |
| `0004_module_16_authorization_rbac.sql` | Task 07 role constraint, permission catalog, and authorization lookup index | ready |
| `0005_module_05_opportunity_workflow.sql` | Task 08 lifecycle states, update permission, and tenant/status index | ready |
| `0006_module_04_demand_discovery.sql` | Task 09 tenant-owned demand signals, evidence, fingerprint uniqueness, permissions, and indexes | ready |
| `0007_module_06_creator_fit.sql` | Task 10 tenant-owned creator profiles, controlled capabilities, permissions, and indexes | ready |
| `0008_module_07_content_opportunity.sql` | Task 11 tenant-owned content opportunities, composite ownership, permissions, and indexes | ready |
| `0009_module_08_content_generation.sql` | Task 12 tenant-owned generation specifications, artifacts, provenance, lifecycle, permissions, and indexes | ready |

Migration `0003` establishes the minimum tenant boundary. Migration `0004` preserves existing
owner memberships, expands the allowed role vocabulary to `owner` / `admin` / `member`, and
records only the permissions required by currently implemented workspace and opportunity flows.
The deterministic role-permission matrix remains application policy in Module 16.
Migration `0005` reconciles legacy `EVALUATED` rows to `draft`, constrains the lifecycle
vocabulary, adds `opportunity.update`, and indexes tenant-scoped status queries.
Migration `0006` establishes evidence-first `module_04.demand_signals`, enforces controlled
vocabularies and bounded values, guarantees per-workspace fingerprint uniqueness, adds targeted
tenant/status/problem indexes, and registers `demand.read` / `demand.create`.
Migration `0007` creates the Module 06 schema and workspace-owned creator profiles with controlled
platform/capability/availability/evidence vocabularies, per-workspace creator-reference uniqueness,
tenant-aware indexes, and the `creator.read` / `creator.create` permissions.
Migration `0008` creates `module_07.content_opportunities`, adds a composite workspace/opportunity
reference so tenant ownership is enforced by PostgreSQL, validates controlled status/angle and JSON
shapes, adds tenant-aware indexes, and registers `content_opportunity.read` /
`content_opportunity.create`.
Migration `0009` creates `module_08.content_generations`, enforces composite tenant ownership for
content opportunities and creators, establishes provider-independent lifecycle/provenance and
fingerprint constraints, adds tenant-aware indexes, and registers `content_generation.read` /
`content_generation.create` / `content_generation.update`.
