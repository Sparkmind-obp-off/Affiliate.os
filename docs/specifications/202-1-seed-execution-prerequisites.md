# 202.1 — SEED EXECUTION PREREQUISITES

Seed **tidak boleh dieksekusi secara standalone**. Seed hanya boleh dijalankan setelah migration schema berhasil.

## Prerequisite Order

```text
PostgreSQL
    ↓
pgcrypto extension
    ↓
Schemas
    ↓
Tables
    ↓
Foreign Keys / Constraints
    ↓
Indexes
    ↓
Seed
```

Minimal prerequisite:

```text
1. PostgreSQL database tersedia
2. Extension pgcrypto tersedia
3. Schema module_14 tersedia
4. Schema module_15 tersedia
5. Schema module_16 tersedia
6. Schema module_17 tersedia
7. Schema module_19 tersedia
8. Seluruh table dependency telah berhasil dibuat
9. Transaction migration sebelumnya telah COMMITTED
10. Database user memiliki permission INSERT pada target seed table
```

### Seed Dependency

Untuk role seed:

```text
module_15
    ↓
roles
    ↓
role seed
```

Untuk metric seed:

```text
module_19
    ↓
metric_definitions
    ↓
metric definition seed
```

Seed **tidak boleh** dijalankan apabila dependency table belum tersedia.

### Execution Rule

Seed runner wajib melakukan preflight:

```text
CHECK DATABASE
      ↓
CHECK SCHEMA
      ↓
CHECK TABLE
      ↓
CHECK PERMISSION
      ↓
CHECK MIGRATION STATE
      ↓
EXECUTE SEED
```

Jika salah satu check gagal:

```text
SEED = ABORT
```

bukan:

```text
PARTIAL SEED
```

### Transaction Rule

Seed harus transactional per logical seed batch:

```sql
BEGIN;

-- seed roles
-- seed metric definitions

COMMIT;
```

Jika terjadi error:

```text
ROLLBACK
```

Tidak boleh meninggalkan kondisi seed setengah terisi.

### Idempotency Rule

Seed harus aman dijalankan ulang.

Canonical pattern:

```sql
INSERT ... 
ON CONFLICT (...) DO NOTHING;
```

atau mekanisme equivalent yang deterministic.

Target:

```text
RUN #1 → INSERT
RUN #2 → NO DUPLICATE
RUN #3 → NO DUPLICATE
```

### Migration Gate

Seed hanya boleh dijalankan apabila migration state memenuhi:

```text
DATABASE_SCHEMA_VERSION
        >=
REQUIRED_SCHEMA_VERSION
```

Jika migration belum memenuhi version minimum:

```text
MIGRATION INCOMPLETE
        ↓
SEED ABORT
```

### Operational Principle

```text
MIGRATION
   ↓
VERIFY
   ↓
SEED
   ↓
VERIFY SEED
   ↓
READY
```

Bukan:

```text
RUN SEED
   ↓
HOPE TABLE EXISTS
```

### Acceptance Criteria

```text
AC-21-SEED-01
Seed tidak dapat berjalan tanpa target table.

AC-21-SEED-02
Seed memverifikasi schema dependency sebelum execution.

AC-21-SEED-03
Seed gagal secara deterministic jika migration belum complete.

AC-21-SEED-04
Seed tidak meninggalkan partial state ketika terjadi error.

AC-21-SEED-05
Seed dapat dijalankan ulang tanpa duplicate data.

AC-21-SEED-06
Seed hanya menggunakan canonical table strategy.

AC-21-SEED-07
Role seed membutuhkan module_15.roles.

AC-21-SEED-08
Metric seed membutuhkan module_19.metric_definitions.

AC-21-SEED-09
Seed execution dapat diaudit melalui migration/deployment logs.

AC-21-SEED-10
Seed verification dilakukan setelah execution.
```