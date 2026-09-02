# 179 — MINIMAL POSTGRESQL DDL v1.0

**Document:** Affiliate OS Data Model & Database Schema  
**Section:** Minimal PostgreSQL DDL  
**Database:** PostgreSQL  
**Purpose:** Initial executable schema for MVP  
**Status:** Architecture Reference

---

## 179.1 EXTENSION

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

UUID dibuat menggunakan:

```sql
gen_random_uuid()
```

---

## 179.2 SCHEMA

```sql
CREATE SCHEMA IF NOT EXISTS module_14;
CREATE SCHEMA IF NOT EXISTS module_15;
CREATE SCHEMA IF NOT EXISTS module_16;
CREATE SCHEMA IF NOT EXISTS module_17;
CREATE SCHEMA IF NOT EXISTS module_19;
```

Schema lain dapat ditambahkan ketika module tersebut mulai diimplementasikan.

---

# 180 — MODULE 15: IDENTITY

## 180.1 Organizations

```sql
CREATE TABLE module_15.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 180.2 Workspaces

```sql
CREATE TABLE module_15.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL
        REFERENCES module_15.organizations(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (organization_id, slug)
);
```

---

## 180.3 Users

```sql
CREATE TABLE module_15.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(320) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 180.4 Memberships

```sql
CREATE TABLE module_15.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL
        REFERENCES module_15.organizations(id),
    workspace_id UUID NOT NULL
        REFERENCES module_15.workspaces(id),
    user_id UUID NOT NULL
        REFERENCES module_15.users(id),
    role VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (workspace_id, user_id)
);
```

---

# 181 — PLATFORM ACCOUNT

```sql
CREATE TABLE module_15.platform_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL
        REFERENCES module_15.organizations(id),
    workspace_id UUID NOT NULL
        REFERENCES module_15.workspaces(id),
    platform VARCHAR(50) NOT NULL,
    external_account_id VARCHAR(255) NOT NULL,
    account_type VARCHAR(50),
    display_name VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'NOT_CONNECTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (platform, external_account_id)
);
```

---

# 182 — ACCOUNT CONNECTION

```sql
CREATE TABLE module_15.account_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL
        REFERENCES module_15.platform_accounts(id),
    connection_status VARCHAR(30) NOT NULL DEFAULT 'CONNECTING',
    credential_reference TEXT,
    granted_scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
    expires_at TIMESTAMPTZ,
    last_refresh_at TIMESTAMPTZ,
    connected_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Catatan:** token OAuth tidak disimpan plaintext di database.

---

# 183 — MODULE 14: RAW EVENTS

```sql
CREATE TABLE module_14.raw_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    workspace_id UUID NOT NULL,

    platform VARCHAR(50) NOT NULL,
    source VARCHAR(100) NOT NULL,
    external_event_id VARCHAR(255),
    event_type VARCHAR(150) NOT NULL,

    payload JSONB NOT NULL,

    event_time TIMESTAMPTZ,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    correlation_id UUID,
    checksum VARCHAR(128),
    schema_version VARCHAR(30) NOT NULL DEFAULT 'v1',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 183.1 Raw Event Index

```sql
CREATE INDEX idx_raw_events_workspace_time
ON module_14.raw_events (workspace_id, event_time);

CREATE INDEX idx_raw_events_external_id
ON module_14.raw_events (platform, external_event_id);

CREATE INDEX idx_raw_events_event_type
ON module_14.raw_events (event_type);
```

---

# 184 — CANONICAL EVENTS

```sql
CREATE TABLE module_14.canonical_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    raw_event_id UUID NOT NULL
        REFERENCES module_14.raw_events(id),

    organization_id UUID NOT NULL,
    workspace_id UUID NOT NULL,

    event_type VARCHAR(150) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,

    source VARCHAR(100) NOT NULL,
    platform VARCHAR(50),

    event_time TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,

    correlation_id UUID,

    schema_version VARCHAR(30) NOT NULL DEFAULT 'v1',

    status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 185 — EVENT IDEMPOTENCY

```sql
CREATE TABLE module_14.event_deduplication (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workspace_id UUID NOT NULL,

    platform VARCHAR(50) NOT NULL,
    external_event_id VARCHAR(255) NOT NULL,

    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (
        workspace_id,
        platform,
        external_event_id
    )
);
```

Tujuan:

```text
AT-LEAST-ONCE DELIVERY
        ↓
DEDUPLICATION
        ↓
ONE EFFECTIVE PROCESSING
```

---

# 186 — DEAD LETTER

```sql
CREATE TABLE module_14.dead_letter_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    event_id UUID NOT NULL
        REFERENCES module_14.canonical_events(id),

    reason TEXT,
    error_code VARCHAR(100),

    attempt_count INTEGER NOT NULL DEFAULT 0,

    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
```

---

# 187 — MODULE 16: AUDIT

```sql
CREATE TABLE module_16.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    workspace_id UUID NOT NULL,

    actor_id UUID,

    action VARCHAR(150) NOT NULL,

    resource_type VARCHAR(100),
    resource_id UUID,

    before_state JSONB,
    after_state JSONB,

    reason TEXT,

    correlation_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Index:

```sql
CREATE INDEX idx_audit_events_workspace_time
ON module_16.audit_events (workspace_id, created_at);

CREATE INDEX idx_audit_events_resource
ON module_16.audit_events (resource_type, resource_id);
```

---

# 188 — POLICIES

```sql
CREATE TABLE module_16.policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workspace_id UUID NOT NULL,

    policy_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    version INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 189 — POLICY DECISIONS

```sql
CREATE TABLE module_16.policy_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    policy_id UUID NOT NULL
        REFERENCES module_16.policies(id),

    actor_id UUID,

    resource_type VARCHAR(100),
    resource_id UUID,

    action VARCHAR(150) NOT NULL,

    decision VARCHAR(50) NOT NULL,

    risk_level VARCHAR(30),

    context_hash VARCHAR(128),

    correlation_id UUID,

    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 190 — MODULE 17: CONNECTOR

```sql
CREATE TABLE module_17.connector_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL,

    platform VARCHAR(50) NOT NULL,
    provider VARCHAR(100) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'DISCONNECTED',

    credential_reference TEXT,

    granted_scopes JSONB NOT NULL DEFAULT '[]'::jsonb,

    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 191 — CONNECTOR CAPABILITIES

```sql
CREATE TABLE module_17.connector_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    platform VARCHAR(50) NOT NULL,

    capability VARCHAR(100) NOT NULL,

    version VARCHAR(30) NOT NULL DEFAULT 'v1',

    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (
        platform,
        capability,
        version
    )
);
```

---

# 192 — MODULE 19: CONVERSIONS

```sql
CREATE TABLE module_19.conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    workspace_id UUID NOT NULL,

    order_id UUID,

    external_transaction_id VARCHAR(255),

    source VARCHAR(100) NOT NULL,
    platform VARCHAR(50),

    conversion_type VARCHAR(100) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',

    conversion_time TIMESTAMPTZ,

    validated_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 193 — TOUCHPOINTS

```sql
CREATE TABLE module_19.touchpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    workspace_id UUID NOT NULL,

    measurement_event_id UUID,

    touchpoint_type VARCHAR(100) NOT NULL,

    content_id UUID,
    creator_id UUID,
    product_id UUID,

    click_id VARCHAR(255),
    session_id VARCHAR(255),

    occurred_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 194 — ATTRIBUTIONS

```sql
CREATE TABLE module_19.attributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversion_id UUID NOT NULL
        REFERENCES module_19.conversions(id),

    touchpoint_id UUID NOT NULL
        REFERENCES module_19.touchpoints(id),

    model VARCHAR(50) NOT NULL,

    credit NUMERIC(12,8) NOT NULL,

    confidence NUMERIC(12,8),

    evidence JSONB,

    window_start TIMESTAMPTZ,
    window_end TIMESTAMPTZ,

    status VARCHAR(30) NOT NULL DEFAULT 'CALCULATED',

    calculation_version VARCHAR(50) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (credit >= 0),
    CHECK (credit <= 1)
);
```

---

# 195 — REVENUE

```sql
CREATE TABLE module_19.revenues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversion_id UUID NOT NULL
        REFERENCES module_19.conversions(id),

    gross_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
    refund_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
    cancellation_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
    adjustment_amount NUMERIC(20,4) NOT NULL DEFAULT 0,

    net_amount NUMERIC(20,4) NOT NULL DEFAULT 0,

    currency CHAR(3) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'ESTIMATED',

    source VARCHAR(100) NOT NULL,

    time_basis VARCHAR(50) NOT NULL,

    calculation_version VARCHAR(50) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (gross_amount >= 0),
    CHECK (refund_amount >= 0),
    CHECK (cancellation_amount >= 0)
);
```

---

# 196 — COMMISSIONS

```sql
CREATE TABLE module_19.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversion_id UUID NOT NULL
        REFERENCES module_19.conversions(id),

    commission_base NUMERIC(20,4) NOT NULL DEFAULT 0,

    commission_rate NUMERIC(12,8),

    estimated_amount NUMERIC(20,4),
    actual_amount NUMERIC(20,4),

    approved_amount NUMERIC(20,4),
    payable_amount NUMERIC(20,4),
    paid_amount NUMERIC(20,4),

    reversed_amount NUMERIC(20,4) DEFAULT 0,

    currency CHAR(3) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'ESTIMATED',

    calculation_version VARCHAR(50) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (commission_base >= 0)
);
```

---

# 197 — RECONCILIATIONS

```sql
CREATE TABLE module_19.reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    workspace_id UUID NOT NULL,

    source_a VARCHAR(100) NOT NULL,
    source_b VARCHAR(100) NOT NULL,

    metric VARCHAR(100) NOT NULL,

    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    value_a NUMERIC(20,4),
    value_b NUMERIC(20,4),

    variance NUMERIC(20,4),
    variance_rate NUMERIC(20,8),

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    reason TEXT,

    resolved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 198 — METRIC DEFINITIONS

```sql
CREATE TABLE module_19.metric_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    metric_id VARCHAR(100) NOT NULL,

    name VARCHAR(255) NOT NULL,

    definition TEXT NOT NULL,

    formula TEXT NOT NULL,

    numerator TEXT,
    denominator TEXT,

    unit VARCHAR(50),

    time_basis VARCHAR(50),

    population VARCHAR(50),

    source VARCHAR(100),

    version VARCHAR(30) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (metric_id, version)
);
```

---

# 199 — METRIC RESULTS

```sql
CREATE TABLE module_19.metric_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    metric_definition_id UUID NOT NULL
        REFERENCES module_19.metric_definitions(id),

    workspace_id UUID NOT NULL,

    scope_type VARCHAR(50) NOT NULL,
    scope_id UUID,

    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    value NUMERIC(30,10),

    status VARCHAR(50) NOT NULL DEFAULT 'CALCULATED',

    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    calculation_version VARCHAR(50) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 200 — BUSINESS TRUTH SNAPSHOT

```sql
CREATE TABLE module_19.business_truth_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    workspace_id UUID NOT NULL,

    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    orders BIGINT DEFAULT 0,
    confirmed_orders BIGINT DEFAULT 0,

    gross_revenue NUMERIC(20,4) DEFAULT 0,
    net_revenue NUMERIC(20,4) DEFAULT 0,
    attributed_revenue NUMERIC(20,4) DEFAULT 0,

    commission NUMERIC(20,4) DEFAULT 0,

    refunds NUMERIC(20,4) DEFAULT 0,
    cancellations NUMERIC(20,4) DEFAULT 0,

    attribution_coverage NUMERIC(12,8),

    reconciliation_status VARCHAR(50),

    calculation_version VARCHAR(50) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 201 — OUTBOX

Outbox adalah bagian infrastructure karena digunakan untuk menjaga konsistensi antara database transaction dan event publication.

```sql
CREATE TABLE module_14.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,

    event_type VARCHAR(150) NOT NULL,

    payload JSONB NOT NULL,

    schema_version VARCHAR(30) NOT NULL DEFAULT 'v1',

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    attempt_count INTEGER NOT NULL DEFAULT 0,

    published_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Index:

```sql
CREATE INDEX idx_outbox_pending
ON module_14.outbox_events (status, created_at);
```

---

# 202 — COMMON INDEXES

```sql
CREATE INDEX idx_workspaces_org
ON module_15.workspaces (organization_id);

CREATE INDEX idx_memberships_workspace
ON module_15.memberships (workspace_id);

CREATE INDEX idx_accounts_workspace
ON module_15.platform_accounts (workspace_id);

CREATE INDEX idx_connections_account
ON module_15.account_connections (account_id);

CREATE INDEX idx_conversions_workspace_time
ON module_19.conversions (workspace_id, conversion_time);

CREATE INDEX idx_attributions_conversion
ON module_19.attributions (conversion_id);

CREATE INDEX idx_revenues_conversion
ON module_19.revenues (conversion_id);

CREATE INDEX idx_commissions_conversion
ON module_19.commissions (conversion_id);

CREATE INDEX idx_metric_results_workspace_period
ON module_19.metric_results (
    workspace_id,
    period_start,
    period_end
);

CREATE INDEX idx_business_truth_workspace_period
ON module_19.business_truth_snapshots (
    workspace_id,
    period_start,
    period_end
);
```

---

# 203 — MINIMAL SEED

## Roles

```sql
INSERT INTO module_15.roles
(name)
VALUES
('OWNER'),
('ADMIN'),
('OPERATOR'),
('ANALYST'),
('VIEWER');
```

> Jika implementasi menggunakan `role` sebagai enum/string langsung pada `memberships`, table `roles` dapat dihilangkan dari MVP. Pilih **satu canonical strategy**, jangan menjalankan dua model sekaligus.

---

# 204 — INITIAL METRIC DEFINITIONS

```sql
INSERT INTO module_19.metric_definitions
(
    metric_id,
    name,
    definition,
    formula,
    numerator,
    denominator,
    unit,
    time_basis,
    population,
    source,
    version
)
VALUES
(
    'affiliate_ctr',
    'Affiliate CTR',
    'Persentase eligible clicks terhadap eligible impressions.',
    'clicks / impressions * 100',
    'eligible_clicks',
    'eligible_impressions',
    'PERCENT',
    'EVENT_TIME',
    'ELIGIBLE_EVENTS',
    'CANONICAL_EVENTS',
    'v1'
),
(
    'affiliate_cvr',
    'Affiliate CVR',
    'Persentase valid conversions terhadap eligible clicks.',
    'valid_conversions / eligible_clicks * 100',
    'valid_conversions',
    'eligible_clicks',
    'PERCENT',
    'CONVERSION_TIME',
    'VALID_EVENTS',
    'CANONICAL_EVENTS',
    'v1'
),
(
    'affiliate_epc',
    'Affiliate EPC',
    'Affiliate earnings per eligible click.',
    'affiliate_earnings / eligible_clicks',
    'affiliate_earnings',
    'eligible_clicks',
    'CURRENCY_PER_CLICK',
    'PAYMENT_TIME',
    'PAID_EVENTS',
    'COMMISSION',
    'v1'
);
```

---

# 205 — ZERO DENOMINATOR RULE

DDL tidak boleh memaksa:

```text
0 / 0 = 0
```

Application/analytics layer wajib menghasilkan:

```text
NULL
```

atau:

```text
NOT_AVAILABLE
```

jika denominator = 0.

---

# 206 — FINANCIAL PRECISION RULE

Semua financial amount:

```text
NUMERIC
```

bukan:

```text
FLOAT
DOUBLE
```

Canonical:

```sql
NUMERIC(20,4)
```

untuk monetary values.

---

# 207 — IMMUTABILITY RULE

Table:

```text
module_14.raw_events
module_16.audit_events
```

bersifat append-oriented.

Correction dilakukan melalui:

```text
NEW EVENT
```

bukan:

```text
UPDATE ORIGINAL EVENT
```

---

# 208 — DDL BOUNDARY RULE

DDL ini **minimal executable foundation**, bukan final production migration.

Production migration nantinya harus menambahkan:

```text
constraints
RLS
permissions
triggers
updated_at automation
partitioning
retention
encryption strategy
backup policy
```

berdasarkan implementation environment.

---

# 209 — DDL ARCHITECTURE

Final structure:

```text
POSTGRESQL
│
├── module_14
│   ├── raw_events
│   ├── canonical_events
│   ├── event_deduplication
│   ├── dead_letter_events
│   └── outbox_events
│
├── module_15
│   ├── organizations
│   ├── workspaces
│   ├── users
│   ├── memberships
│   ├── platform_accounts
│   └── account_connections
│
├── module_16
│   ├── policies
│   ├── policy_decisions
│   └── audit_events
│
├── module_17
│   ├── connector_connections
│   └── connector_capabilities
│
└── module_19
    ├── conversions
    ├── touchpoints
    ├── attributions
    ├── revenues
    ├── commissions
    ├── reconciliations
    ├── metric_definitions
    ├── metric_results
    └── business_truth_snapshots
```

---

# 210 — DDL ACCEPTANCE CRITERIA

```text
AC-21-DDL-01
PostgreSQL dapat membuat seluruh schema MVP.

AC-21-DDL-02
Organization dapat dibuat.

AC-21-DDL-03
Workspace terhubung ke Organization.

AC-21-DDL-04
User dapat dibuat.

AC-21-DDL-05
Membership dapat menghubungkan User ke Workspace.

AC-21-DDL-06
Platform Account dapat dibuat.

AC-21-DDL-07
OAuth connection reference dapat disimpan.

AC-21-DDL-08
Raw event dapat disimpan.

AC-21-DDL-09
External event dapat dideduplikasi.

AC-21-DDL-10
Canonical event dapat dibuat dari raw event.

AC-21-DDL-11
Failed event dapat masuk DLQ.

AC-21-DDL-12
Outbox event dapat disimpan.

AC-21-DDL-13
Policy decision dapat diaudit.

AC-21-DDL-14
Connector state dapat disimpan.

AC-21-DDL-15
Conversion dapat dibuat.

AC-21-DDL-16
Touchpoint dapat dibuat.

AC-21-DDL-17
Attribution dapat menyimpan credit.

AC-21-DDL-18
Revenue dapat menyimpan gross dan net.

AC-21-DDL-19
Commission dapat memisahkan estimated dan actual.

AC-21-DDL-20
Reconciliation dapat menyimpan variance.

AC-21-DDL-21
Metric definition dapat versioned.

AC-21-DDL-22
Metric result dapat disimpan berdasarkan period.

AC-21-DDL-23
Business truth snapshot dapat disimpan.

AC-21-DDL-24
Financial values menggunakan NUMERIC.

AC-21-DDL-25
Timestamp menggunakan TIMESTAMPTZ.

AC-21-DDL-26
External ID tidak digunakan sebagai internal primary key.

AC-21-DDL-27
Critical event dapat diproses secara idempotent.

AC-21-DDL-28
Module ownership tetap terjaga.

AC-21-DDL-29
DDL dapat menjadi foundation Document 22.

AC-21-DDL-30
Schema dapat dimigrasikan tanpa mengubah architecture boundary.
```

---

# 211 — FINAL DDL PRINCIPLE

```text
DATA MODEL
     ↓
MODULE OWNERSHIP
     ↓
POSTGRESQL SCHEMA
     ↓
TABLE
     ↓
CONSTRAINT
     ↓
INDEX
     ↓
MIGRATION
```

Bukan:

```text
FEATURE
 ↓
CREATE TABLE RANDOM
```

---

# 212 — ARCHITECTURE LOCK UPDATE

**Doc 21 sekarang mencakup:**

```text
✓ Entity Model
✓ Relationship Model
✓ Data Ownership
✓ Tenant Model
✓ Database Topology
✓ PostgreSQL Strategy
✓ Schema Boundary
✓ Event Model
✓ Financial Model
✓ Metric Model
✓ Audit Model
✓ Data Lineage
✓ Migration Strategy
✓ Minimal PostgreSQL DDL
✓ Index Strategy
✓ Idempotency
✓ Outbox
✓ Acceptance Criteria
```

### STATUS

```text
MODULE 21
DATA MODEL & DATABASE SCHEMA

ARCHITECTURE = LOCKED
DDL FOUNDATION = LOCKED
MVP DATA BOUNDARY = LOCKED
```

**Catatan implementasi:** bagian ini sudah cukup sebagai **foundation DDL MVP**, tetapi belum dimaksudkan sebagai migration production final. Saat masuk tahap implementation, DDL ini sebaiknya dipecah menjadi migration files per module agar ownership dan deployment tetap konsisten.