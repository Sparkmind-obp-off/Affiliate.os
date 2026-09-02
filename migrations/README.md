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

Migration `0002` is intentionally limited to the Task 04 vertical. Remaining
DOC 21 table DDL is outside this task.
