# DOC 24 — IMPLEMENTATION BLUEPRINT v1.0

**Document:** Affiliate OS Implementation Blueprint  
**Module:** 24  
**Status:** Implementation Reference  
**Purpose:** Menerjemahkan System Architecture, Data Model, API Contract, dan UX/UI Architecture menjadi blueprint implementasi yang executable untuk development, testing, deployment, dan handoff.

---

# 312 — IMPLEMENTATION PURPOSE

Doc 24 menjawab:

```text
WHAT
→ WHAT IS BUILT

WHERE
→ WHERE IT LIVES

HOW
→ HOW IT WORKS

IN WHAT ORDER
→ IMPLEMENTATION SEQUENCE

HOW VERIFIED
→ TESTING

HOW RELEASED
→ CI/CD + DEPLOYMENT

HOW PROTECTED
→ SECURITY + BOUNDARY ENFORCEMENT
```

Doc 24 bukan tempat untuk mengubah business architecture.

```text
DOC 20–23
    ↓
ARCHITECTURE CONTRACT
    ↓
DOC 24
IMPLEMENTATION
```

---

# 313 — IMPLEMENTATION PRINCIPLE

Primary architecture:

```text
MODULAR MONOLITH
```

Satu deployable application dengan module boundary yang nyata.

```text
APPLICATION
│
├── Module 04
├── Module 05
├── Module 06
├── ...
├── Module 24
└── Shared Infrastructure
```

Module harus memiliki:

```text
DOMAIN
APPLICATION
PUBLIC API
INFRASTRUCTURE
TESTS
```

Internal module tidak boleh diakses module lain secara langsung. Boundary harus ditegakkan melalui struktur repository dan automated architecture tests.

---

# 314 — TECHNOLOGY BASELINE

MVP baseline:

```text
Frontend
= TypeScript + React-based application

Backend
= TypeScript modular application

API
= REST / JSON

Database
= PostgreSQL

Queue
= Redis-compatible queue / managed queue

Object Storage
= S3-compatible storage

Authentication
= Application Identity + OAuth Connectors

Observability
= Structured Logs + Metrics + Traces

CI/CD
= Git-based automated pipeline
```

Technology implementation dapat berubah selama tidak melanggar:

```text
DOMAIN BOUNDARY
API CONTRACT
DATA CONTRACT
SECURITY CONTRACT
DEPLOYMENT CONTRACT
```

---

# 315 — REPOSITORY ARCHITECTURE

Canonical repository:

```text
affiliate-os/
│
├── apps/
│   ├── web/
│   └── api/
│
├── modules/
│   ├── module-04-demand/
│   ├── module-05-opportunity/
│   ├── module-06-creator-fit/
│   ├── module-07-content/
│   ├── module-08-distribution/
│   ├── module-09-performance/
│   ├── module-10-revenue/
│   ├── module-11-experiment/
│   ├── module-12-recommendation/
│   ├── module-13-automation/
│   ├── module-14-data/
│   ├── module-15-identity/
│   ├── module-16-security/
│   ├── module-17-connectors/
│   ├── module-18-observability/
│   └── module-19-attribution/
│
├── packages/
│   ├── contracts/
│   ├── config/
│   ├── database/
│   ├── events/
│   ├── logging/
│   ├── testing/
│   └── utilities/
│
├── migrations/
│
├── infrastructure/
│
├── scripts/
│
├── tests/
│   ├── integration/
│   ├── e2e/
│   └── architecture/
│
├── docs/
│
├── .github/
│
├── package.json
├── README.md
└── CHANGELOG.md
```

---

# 316 — MODULE INTERNAL STRUCTURE

Setiap business module menggunakan:

```text
module/
│
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── services/
│   ├── rules/
│   └── events/
│
├── application/
│   ├── commands/
│   ├── queries/
│   ├── services/
│   └── handlers/
│
├── public/
│   ├── api/
│   ├── contracts/
│   └── events/
│
├── infrastructure/
│   ├── persistence/
│   ├── adapters/
│   ├── http/
│   └── workers/
│
└── tests/
    ├── unit/
    ├── integration/
    └── contract/
```

Public:

```text
public/
```

adalah satu-satunya surface yang boleh digunakan module lain.

Private:

```text
domain/
application/
infrastructure/
```

tidak boleh di-import langsung oleh module lain.

---

# 317 — MODULE OWNERSHIP MAP

```text
04 Demand
05 Opportunity
06 Creator Fit
07 Content
08 Distribution
09 Performance
10 Revenue
11 Experiment
12 Recommendation
13 Automation
14 Data/Event
15 Identity/Tenancy
16 Security/Governance
17 Connector
18 Observability/Ops
19 Attribution/Business Truth
```

Owner menentukan:

```text
DATA
DOMAIN RULE
WRITE AUTHORITY
PUBLIC API
EVENTS
TESTS
```

---

# 318 — DEPENDENCY DIRECTION

Canonical:

```text
API
 ↓
APPLICATION
 ↓
DOMAIN
 ↓
PORT / INTERFACE
 ↓
INFRASTRUCTURE
```

Infrastructure tidak boleh menjadi domain authority.

Contoh:

```text
Domain
   ↓
ConnectorPort
   ↓
TikTokAdapter
```

Bukan:

```text
Domain
   ↓
TikTok SDK
```

Hexagonal/ports-and-adapters membantu menjaga domain tetap terisolasi dari external implementation.

---

# 319 — MODULE DEPENDENCY RULE

Allowed:

```text
Module A
   ↓
Module B.public
```

Forbidden:

```text
Module A
   ↓
Module B.domain
Module B.application
Module B.infrastructure
Module B.database
```

Forbidden juga:

```text
Module A
   ↓
Module B internal repository
```

Jika membutuhkan data:

```text
PUBLIC API
atau
EVENT
```

---

# 320 — CIRCULAR DEPENDENCY RULE

Tidak boleh:

```text
A → B
B → A
```

Jika terjadi:

```text
A ↔ B
```

gunakan:

```text
EVENT
```

atau evaluasi ulang ownership.

Architecture test harus mendeteksi circular dependency.

---

# 321 — SHARED PACKAGE RULE

`packages/` hanya boleh berisi primitive infrastructure.

Allowed:

```text
UUID
Date utilities
Money primitive
Validation primitives
Logging
Tracing
API contract utilities
Testing utilities
```

Forbidden:

```text
OpportunityBusinessRule
RevenueBusinessRule
CreatorScoringRule
AffiliatePolicy
```

Business rule harus memiliki module owner.

Shared domain menjadi coupling magnet jika tidak dikontrol; karena itu shared kernel harus minimal dan stabil.

---

# 322 — DATABASE IMPLEMENTATION

PostgreSQL tetap menjadi primary database MVP.

```text
PostgreSQL
│
├── module_14
├── module_15
├── module_16
├── module_17
└── module_19
```

Business module lainnya dapat menambahkan schema saat implementation dimulai.

Rule:

```text
ONE MODULE
    ↓
ONE DATA OWNER
```

Tidak boleh:

```text
Module A writes Module B table
```

---

# 323 — MIGRATION STRUCTURE

Migration:

```text
migrations/
├── 001_extensions.sql
├── 002_module_15_identity.sql
├── 003_module_14_events.sql
├── 004_module_16_security.sql
├── 005_module_17_connectors.sql
├── 006_module_19_attribution.sql
└── ...
```

Migration harus:

```text
ORDERED
VERSIONED
REPEATABLE IN ENVIRONMENT
AUDITABLE
```

Migration tidak boleh bergantung pada seed sebagai prerequisite.

---

# 324 — MIGRATION → SEED ORDER

Canonical:

```text
CREATE DATABASE
      ↓
CREATE EXTENSIONS
      ↓
CREATE SCHEMAS
      ↓
CREATE TABLES
      ↓
CREATE CONSTRAINTS
      ↓
CREATE INDEXES
      ↓
VERIFY MIGRATION
      ↓
SEED
      ↓
VERIFY SEED
```

Seed prerequisite dari Doc 21 tetap berlaku.

---

# 325 — SEED STRATEGY

Seed terbagi:

```text
REFERENCE SEED
DEVELOPMENT SEED
TEST FIXTURE
DEMO DATA
```

Production hanya boleh menjalankan:

```text
REFERENCE SEED
```

Contoh:

```text
roles
metric definitions
policy defaults
connector capability definitions
```

Demo data tidak boleh masuk production secara default.

---

# 326 — API IMPLEMENTATION

API layer:

```text
apps/api/
│
├── router/
├── middleware/
├── controllers/
├── serializers/
├── validators/
└── composition/
```

Controller hanya:

```text
PARSE
VALIDATE
CALL APPLICATION
SERIALIZE
```

Controller tidak boleh mengandung business logic berat.

---

# 327 — APPLICATION SERVICE

Application service bertanggung jawab atas:

```text
USE CASE
TRANSACTION BOUNDARY
AUTHORIZATION CONTEXT
DOMAIN INVOCATION
EVENT PUBLICATION
```

Contoh:

```text
CreateOpportunity
RunWorkflow
PublishContent
ValidateConversion
GenerateRecommendation
```

---

# 328 — DOMAIN IMPLEMENTATION

Domain berisi:

```text
ENTITY
VALUE OBJECT
DOMAIN SERVICE
BUSINESS RULE
DOMAIN EVENT
```

Domain tidak boleh mengakses:

```text
HTTP
DATABASE SDK
REDIS
TIKTOK SDK
AI SDK
```

langsung.

---

# 329 — REPOSITORY CONTRACT

Domain/application mendefinisikan interface:

```ts
interface OpportunityRepository {
  findById(id: string): Promise<Opportunity | null>;
  save(opportunity: Opportunity): Promise<void>;
}
```

Infrastructure mengimplementasikan:

```text
PostgresOpportunityRepository
```

Dengan demikian database implementation dapat diganti tanpa mengubah domain.

---

# 330 — CONNECTOR IMPLEMENTATION

Structure:

```text
module-17-connectors/
│
├── public/
│   ├── contracts/
│   └── registry/
│
├── core/
│   ├── connector.ts
│   ├── capabilities.ts
│   └── errors.ts
│
├── tiktok/
│   ├── adapter.ts
│   ├── auth.ts
│   ├── api.ts
│   └── webhook.ts
│
├── tiktok-shop/
│   ├── adapter.ts
│   ├── auth.ts
│   ├── api.ts
│   └── webhook.ts
│
└── ai/
    ├── adapter.ts
    └── providers/
```

Provider-specific implementation tetap terisolasi.

---

# 331 — FRONTEND IMPLEMENTATION

```text
apps/web/
│
├── app/
│   ├── routes/
│   ├── layouts/
│   └── providers/
│
├── components/
│   ├── ui/
│   ├── data-display/
│   ├── forms/
│   └── feedback/
│
├── features/
│   ├── dashboard/
│   ├── discovery/
│   ├── creators/
│   ├── content/
│   ├── performance/
│   ├── revenue/
│   ├── experiments/
│   ├── recommendations/
│   ├── automation/
│   ├── integrations/
│   └── settings/
│
├── lib/
│   ├── api/
│   ├── auth/
│   ├── state/
│   └── telemetry/
│
└── tests/
```

Frontend mengikuti UX Architecture Doc 23.

---

# 332 — API CLIENT

Frontend tidak boleh melakukan arbitrary HTTP calls.

Canonical:

```text
UI
 ↓
Feature API Client
 ↓
Shared API Client
 ↓
Backend API
```

Contoh:

```text
useOpportunities()
createWorkflow()
getRevenue()
connectTikTok()
```

API client harus menangani:

```text
AUTH
REQUEST ID
CORRELATION ID
ERROR NORMALIZATION
RETRY SAFE REQUESTS
```

---

# 333 — STATE MANAGEMENT

State dibagi:

```text
SERVER STATE
CLIENT UI STATE
SESSION STATE
FORM STATE
```

Server state:

```text
API
```

UI state:

```text
modal
drawer
filter
tab
sort
```

Session:

```text
user
workspace
permissions
```

Tidak boleh mencampurkan seluruh state ke satu global store tanpa boundary.

---

# 334 — EVENT IMPLEMENTATION

Event flow:

```text
DOMAIN ACTION
 ↓
DOMAIN EVENT
 ↓
OUTBOX
 ↓
PUBLISHER
 ↓
CONSUMER
```

Event harus memiliki:

```text
event_id
event_type
schema_version
tenant_context
occurred_at
correlation_id
payload
```

Outbox memastikan business state dan event publication tidak kehilangan consistency.

---

# 335 — WORKER IMPLEMENTATION

Worker:

```text
QUEUE
 ↓
JOB
 ↓
VALIDATE
 ↓
EXECUTE
 ↓
RESULT
```

Worker wajib memiliki:

```text
IDEMPOTENCY
TIMEOUT
RETRY
BACKOFF
DLQ
OBSERVABILITY
```

---

# 336 — JOB STATE

Canonical:

```text
QUEUED
RUNNING
WAITING
SUCCEEDED
FAILED
CANCELLED
PAUSED
```

State transition harus deterministic.

Invalid:

```text
SUCCEEDED → RUNNING
```

kecuali explicit retry/reprocess operation membuat new attempt.

---

# 337 — TESTING PYRAMID

Testing:

```text
                 E2E
                /   \
           Integration
          /           \
      Contract       Adapter
        /               \
            Unit
```

Priority:

```text
DOMAIN
 ↓
APPLICATION
 ↓
MODULE
 ↓
API
 ↓
INTEGRATION
 ↓
E2E
```

Business logic harus diuji sejak awal, sementara adapter dan external integration diverifikasi melalui integration/contract tests.

---

# 338 — UNIT TEST

Unit test fokus:

```text
BUSINESS RULE
DOMAIN SERVICE
VALUE OBJECT
SCORING
CALCULATION
STATE TRANSITION
POLICY
```

Contoh:

```text
CTR calculation
CVR calculation
Opportunity score
Creator fit score
Revenue validation
Workflow transition
```

---

# 339 — MODULE TEST

Module test menggunakan public API:

```text
PUBLIC API
 ↓
MODULE
 ↓
REAL DOMAIN
 ↓
TEST DATABASE / FIXTURE
```

Tidak boleh menguji module dengan direct internal access dari test consumer.

---

# 340 — CONTRACT TEST

Contract tests wajib untuk:

```text
API
EVENT
CONNECTOR
WEBHOOK
```

Tujuan:

```text
CONTRACT CHANGE
      ↓
DETECT BREAKING CHANGE
      ↓
CI FAIL
```

---

# 341 — INTEGRATION TEST

Integration test memverifikasi:

```text
API
+
DATABASE
+
QUEUE
+
CONNECTOR ADAPTER
```

Contoh:

```text
Create workflow
 ↓
Persist workflow
 ↓
Create task
 ↓
Publish event
 ↓
Worker consumes
 ↓
Task completed
```

---

# 342 — E2E TEST

Minimum E2E:

```text
LOGIN
 ↓
SELECT WORKSPACE
 ↓
VIEW DASHBOARD
 ↓
DISCOVER OPPORTUNITY
 ↓
CREATE CONTENT
 ↓
RUN WORKFLOW
 ↓
VIEW PERFORMANCE
 ↓
VIEW REVENUE
```

E2E harus menguji critical user journey, bukan setiap kombinasi UI.

---

# 343 — SECURITY TESTING

Wajib:

```text
AUTH TEST
AUTHORIZATION TEST
TENANT ISOLATION TEST
ROLE TEST
POLICY TEST
INPUT VALIDATION
SECRET EXPOSURE TEST
WEBHOOK SIGNATURE TEST
IDEMPOTENCY TEST
RATE LIMIT TEST
```

Critical rule:

```text
Tenant A
   X
Tenant B DATA
```

harus selalu diuji.

---

# 344 — ARCHITECTURE TESTING

CI harus memverifikasi:

```text
NO CROSS-MODULE INTERNAL IMPORT
NO DIRECT CROSS-MODULE DB ACCESS
NO CIRCULAR DEPENDENCY
PUBLIC API ONLY
NO SECRET IN SOURCE
NO FORBIDDEN DEPENDENCY
```

Boundary violation:

```text
CI = FAIL
```

Bukan warning.

Architecture fitness functions memang cocok digunakan untuk membuat pelanggaran dependency/boundary menjadi build failure.

---

# 345 — CODE QUALITY GATES

Pull request wajib:

```text
FORMAT
LINT
TYPECHECK
UNIT TEST
MODULE TEST
CONTRACT TEST
ARCHITECTURE TEST
SECURITY CHECK
BUILD
```

Minimal:

```text
ALL GREEN
```

sebelum merge.

---

# 346 — CI PIPELINE

Canonical:

```text
PUSH
 ↓
INSTALL
 ↓
LINT
 ↓
TYPECHECK
 ↓
UNIT TEST
 ↓
ARCHITECTURE TEST
 ↓
CONTRACT TEST
 ↓
BUILD
 ↓
INTEGRATION TEST
 ↓
SECURITY CHECK
 ↓
ARTIFACT
```

Pull request tidak boleh merge jika required checks gagal.

---

# 347 — CD PIPELINE

```text
MERGE
 ↓
BUILD ARTIFACT
 ↓
DEPLOY STAGING
 ↓
MIGRATION CHECK
 ↓
SMOKE TEST
 ↓
E2E
 ↓
APPROVAL
 ↓
PRODUCTION
 ↓
POST-DEPLOY VERIFY
```

Deployment automation dan CI/CD sebaiknya menjadi bagian dari development workflow, bukan pekerjaan manual setelah aplikasi selesai.

---

# 348 — ENVIRONMENT STRATEGY

Minimum:

```text
LOCAL
STAGING
PRODUCTION
```

Flow:

```text
LOCAL
 ↓
PR
 ↓
STAGING
 ↓
PRODUCTION
```

Production credential tidak boleh digunakan di local/staging.

---

# 349 — CONFIGURATION MANAGEMENT

Configuration:

```text
ENVIRONMENT VARIABLES
SECRET MANAGER
CONFIG FILE
```

Secret:

```text
NEVER COMMIT
NEVER LOG
NEVER RETURN VIA API
```

Contoh:

```text
DATABASE_URL
JWT_SECRET
OAUTH_CLIENT_SECRET
WEBHOOK_SECRET
AI_PROVIDER_KEY
```

harus berada di secure configuration system.

---

# 350 — DEPLOYMENT ARCHITECTURE

MVP:

```text
                    INTERNET
                       │
                       ▼
                 WEB APPLICATION
                       │
                       ▼
                  API APPLICATION
                  /      |       \
                 /       |        \
                ▼        ▼         ▼
           PostgreSQL   Queue    Storage
                         │
                         ▼
                       Worker
                         │
                         ▼
                    Connectors
```

Observability melingkupi seluruh runtime.

---

# 351 — DATABASE DEPLOYMENT

Production:

```text
PRIMARY POSTGRES
      +
BACKUP
      +
MONITORING
```

MVP belum membutuhkan distributed database.

Scaling path:

```text
Postgres
 ↓
Read Replica
 ↓
Analytics Store
 ↓
Event Store
 ↓
Module-specific DB
```

Hanya dilakukan jika ada evidence.

---

# 352 — BACKUP & RECOVERY

Minimum:

```text
AUTOMATED BACKUP
POINT-IN-TIME RECOVERY
RESTORE TEST
RETENTION POLICY
```

Backup dianggap valid hanya jika restore dapat diverifikasi.

---

# 353 — DEPLOYMENT MIGRATION SAFETY

Migration production:

```text
BACKUP / RECOVERY CHECK
 ↓
MIGRATION VALIDATION
 ↓
MIGRATION
 ↓
SCHEMA VERIFY
 ↓
SEED IF REQUIRED
 ↓
SMOKE TEST
```

Breaking migration tidak boleh langsung dijalankan tanpa compatibility strategy.

---

# 354 — OBSERVABILITY IMPLEMENTATION

Minimum:

```text
LOGS
METRICS
TRACES
AUDIT
HEALTH CHECK
```

Structured log:

```json
{
  "timestamp": "...",
  "level": "INFO",
  "service": "affiliate-api",
  "module": "module-13",
  "request_id": "...",
  "correlation_id": "...",
  "event": "workflow.completed"
}
```

Secret tidak boleh masuk log.

---

# 355 — HEALTH CHECK

Endpoint:

```text
/health
/readiness
/liveness
```

Health categories:

```text
APPLICATION
DATABASE
QUEUE
STORAGE
CONNECTORS
```

`liveness` tidak boleh gagal hanya karena external provider sedang down.

---

# 356 — FEATURE FLAGS

Feature flag dapat digunakan untuk:

```text
NEW_FEATURE
EXPERIMENT
CONNECTOR_ROLLOUT
UI_ROLLOUT
RISKY_CHANGE
```

Flag harus:

```text
OWNED
NAMED
AUDITABLE
REMOVABLE
```

Jangan membiarkan permanent feature-flag debt.

---

# 357 — RELEASE STRATEGY

Release:

```text
SMALL CHANGE
 ↓
TEST
 ↓
MERGE
 ↓
STAGING
 ↓
VERIFY
 ↓
PRODUCTION
```

Prefer small, reversible changes.

Critical changes dapat menggunakan:

```text
CANARY
FEATURE FLAG
ROLLBACK
```

---

# 358 — ROLLBACK STRATEGY

Application rollback:

```text
PREVIOUS ARTIFACT
```

Database rollback tidak selalu berarti:

```text
DOWN MIGRATION
```

Untuk destructive migration gunakan:

```text
EXPAND
 ↓
MIGRATE
 ↓
VERIFY
 ↓
CONTRACT
```

bukan langsung delete/rename production field.

---

# 359 — INCIDENT HANDLING

Incident flow:

```text
DETECT
 ↓
CLASSIFY
 ↓
CONTAIN
 ↓
MITIGATE
 ↓
RECOVER
 ↓
VERIFY
 ↓
POSTMORTEM
```

Incident severity:

```text
SEV-1
SEV-2
SEV-3
SEV-4
```

Business impact harus dipisahkan dari technical symptoms.

---

# 360 — IMPLEMENTATION ORDER

Build order:

```text
PHASE 0
Repository + Tooling
        ↓
PHASE 1
Foundation
        ↓
PHASE 2
Identity + Security
        ↓
PHASE 3
Data/Event Infrastructure
        ↓
PHASE 4
Connector Layer
        ↓
PHASE 5
Core Affiliate Modules
        ↓
PHASE 6
Automation
        ↓
PHASE 7
Attribution + Revenue
        ↓
PHASE 8
Frontend
        ↓
PHASE 9
Integration + E2E
        ↓
PHASE 10
Staging
        ↓
PHASE 11
Production
```

---

# 361 — PHASE 0 — REPOSITORY FOUNDATION

Deliver:

```text
✓ Git repository
✓ Package manager
✓ TypeScript config
✓ Lint
✓ Formatter
✓ Test runner
✓ Build system
✓ Environment config
✓ CI skeleton
✓ README
```

Acceptance:

```text
CLONE
 ↓
INSTALL
 ↓
TEST
 ↓
BUILD
```

berhasil dari clean environment.

---

# 362 — PHASE 1 — FOUNDATION

Implement:

```text
✓ PostgreSQL
✓ Database connection
✓ Migration runner
✓ Logging
✓ Configuration
✓ Error handling
✓ API bootstrap
✓ Event infrastructure
✓ Queue infrastructure
```

---

# 363 — PHASE 2 — IDENTITY & SECURITY

Implement:

```text
Module 15
Module 16
```

Urutan:

```text
Organization
 ↓
Workspace
 ↓
User
 ↓
Roles
 ↓
Membership
 ↓
Platform Account
 ↓
Policy
 ↓
Audit
```

Tenant isolation harus diuji sebelum business module dibuka.

---

# 364 — PHASE 3 — DATA & EVENTS

Implement:

```text
Module 14
```

Minimum:

```text
RAW EVENT
CANONICAL EVENT
DEDUPE
DLQ
OUTBOX
REPLAY
EVENT VERSION
```

---

# 365 — PHASE 4 — CONNECTORS

Implement:

```text
Module 17
```

Urutan:

```text
Connector Contract
 ↓
Capability Registry
 ↓
Credential Lifecycle
 ↓
TikTok Adapter
 ↓
TikTok Shop Adapter
 ↓
AI Adapter
 ↓
Storage Adapter
 ↓
Notification Adapter
```

Connector harus diuji sebelum business automation bergantung padanya.

---

# 366 — PHASE 5 — CORE AFFILIATE

Urutan:

```text
Demand
 ↓
Opportunity
 ↓
Creator Fit
 ↓
Content
 ↓
Distribution
 ↓
Performance
```

Module:

```text
04 → 05 → 06 → 07 → 08 → 09
```

---

# 367 — PHASE 6 — INTELLIGENCE & AUTOMATION

```text
10 Revenue
 ↓
11 Experiment
 ↓
12 Recommendation
 ↓
13 Automation
```

Automation hanya boleh menggunakan capabilities yang sudah tersedia dan authorized.

---

# 368 — PHASE 7 — BUSINESS TRUTH

Implement:

```text
19 Attribution / Business Truth
```

Flow:

```text
EVENTS
 ↓
CONVERSION
 ↓
ATTRIBUTION
 ↓
REVENUE
 ↓
COMMISSION
 ↓
RECONCILIATION
 ↓
BUSINESS TRUTH
```

---

# 369 — PHASE 8 — FRONTEND

Implement sesuai Doc 23:

```text
Shell
 ↓
Auth
 ↓
Workspace
 ↓
Dashboard
 ↓
Discovery
 ↓
Creator
 ↓
Content
 ↓
Performance
 ↓
Revenue
 ↓
Automation
 ↓
Integrations
 ↓
Settings
```

---

# 370 — PHASE 9 — INTEGRATION VALIDATION

Test complete loop:

```text
USER
 ↓
API
 ↓
DOMAIN
 ↓
DATABASE
 ↓
EVENT
 ↓
QUEUE
 ↓
CONNECTOR
 ↓
EXTERNAL PLATFORM MOCK
 ↓
WEBHOOK
 ↓
EVENT
 ↓
ATTRIBUTION
 ↓
REVENUE
 ↓
UI
```

Ini adalah **critical end-to-end architecture test**.

---

# 371 — PHASE 10 — STAGING GATE

Staging harus memenuhi:

```text
✓ Build
✓ Migration
✓ Seed
✓ API
✓ Frontend
✓ Worker
✓ Queue
✓ Connector mocks
✓ E2E
✓ Security tests
✓ Observability
✓ Backup verification
```

---

# 372 — PHASE 11 — PRODUCTION GATE

Production hanya boleh jika:

```text
ARCHITECTURE TEST = PASS
UNIT TEST = PASS
INTEGRATION TEST = PASS
E2E = PASS
SECURITY = PASS
MIGRATION = VERIFIED
BACKUP = VERIFIED
OBSERVABILITY = READY
ROLLBACK = READY
```

---

# 373 — DEFINITION OF DONE

Task dianggap selesai jika:

```text
CODE
✓ Implemented

TEST
✓ Passing

BOUNDARY
✓ Validated

DATABASE
✓ Migrated

API
✓ Contract compliant

UI
✓ Implemented if applicable

SECURITY
✓ Checked

OBSERVABILITY
✓ Added

DOCUMENTATION
✓ Updated

CI
✓ Green

GIT
✓ Committed
```

Tidak ada:

```text
"works locally"
```

sebagai satu-satunya acceptance criterion.

---

# 374 — GIT WORKFLOW

Branch:

```text
main
develop
feature/*
fix/*
chore/*
```

Flow:

```text
TASK
 ↓
BRANCH
 ↓
IMPLEMENT
 ↓
TEST
 ↓
COMMIT
 ↓
PUSH
 ↓
PR
 ↓
CI
 ↓
REVIEW
 ↓
MERGE
```

Commit harus kecil dan traceable.

Contoh:

```text
feat(module-05): add opportunity scoring
fix(module-17): handle expired connector token
test(module-19): add attribution reconciliation cases
```

---

# 375 — TRACEABILITY MATRIX

Setiap implementation task harus memiliki:

```text
TASK ID
 ↓
DOC SECTION
 ↓
MODULE
 ↓
CODE PATH
 ↓
TEST
 ↓
COMMIT
 ↓
DEPLOYMENT
```

Contoh:

```text
IMP-005
 ↓
Doc 22 §225
 ↓
Module 13
 ↓
workflow/idempotency
 ↓
idempotency.spec.ts
 ↓
commit abc123
 ↓
staging
```

---

# 376 — IMPLEMENTATION TASK FORMAT

Setiap task menggunakan:

```text
TASK ID
TITLE
SOURCE DOC
MODULE
OBJECTIVE
INPUT
OUTPUT
DEPENDENCIES
FILES
ACCEPTANCE CRITERIA
TESTS
SECURITY
OBSERVABILITY
COMMIT
STATUS
```

Tidak boleh ada implementation task tanpa acceptance criteria.

---

# 377 — MASTER IMPLEMENTATION DEPENDENCY

```text
DOC 20
SYSTEM ARCHITECTURE
        ↓
DOC 21
DATA MODEL
        ↓
DOC 22
API CONTRACT
        ↓
DOC 23
UX/UI
        ↓
DOC 24
IMPLEMENTATION
        ↓
REPOSITORY
        ↓
TEST
        ↓
DEPLOY
```

---

# 378 — MVP IMPLEMENTATION BOUNDARY

MVP wajib menghasilkan:

```text
ONE DEPLOYABLE APPLICATION
+
ONE PRIMARY DATABASE
+
QUEUE/WORKER
+
OBJECT STORAGE
+
CONNECTOR LAYER
+
WEB APPLICATION
+
CI/CD
+
OBSERVABILITY
```

Tidak wajib:

```text
MICROSERVICES
KUBERNETES
SERVICE MESH
MULTI-REGION
GLOBAL DISTRIBUTED DB
```

---

# 379 — SCALING / EXTRACTION RULE

Module tidak boleh diekstrak hanya karena:

```text
"microservices terlihat lebih professional"
```

Extraction membutuhkan evidence:

```text
HIGH LOAD
HIGH INCIDENT BLAST RADIUS
INDEPENDENT SCALING NEED
INDEPENDENT DEPLOYMENT NEED
TEAM OWNERSHIP
SECURITY ISOLATION
```

Jika extraction diperlukan:

```text
EXISTING PUBLIC CONTRACT
        ↓
EXTRACT IMPLEMENTATION
        ↓
NETWORK BOUNDARY
        ↓
PRESERVE CONTRACT
```

Dengan begitu modular monolith menjadi **jalan evolusi yang terkontrol**, bukan temporary code dump.

---

# 380 — IMPLEMENTATION ANTI-PATTERNS

Dilarang:

```text
✗ Direct cross-module DB write
✗ Deep import into another module
✗ Business logic in controller
✗ Business logic in UI
✗ Provider SDK inside domain
✗ Secret in repository
✗ Silent tenant fallback
✗ Unbounded retry
✗ Non-idempotent destructive retry
✗ Hardcoded external IDs
✗ Unversioned events
✗ Manual production-only configuration
✗ Merge with failing architecture tests
✗ Giant shared utility containing domain rules
```

---

# 381 — FINAL IMPLEMENTATION ARCHITECTURE

```text
                         GIT REPOSITORY
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
            WEB              API             WORKER
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                     MODULAR MONOLITH
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
    DOMAIN                  EVENTS                CONNECTORS
       │                       │                       │
       ▼                       ▼                       ▼
   POSTGRES                 QUEUE               EXTERNAL APIs
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               ▼
                        OBSERVABILITY
                               │
                         CI/CD PIPELINE
                               │
                  ┌────────────┴────────────┐
                  ▼                         ▼
               STAGING                 PRODUCTION
```

---

# 382 — IMPLEMENTATION ACCEPTANCE CRITERIA

```text
AC-24-01
Repository structure follows module boundaries.

AC-24-02
Each business module owns its domain and data.

AC-24-03
Cross-module access only uses public contracts/events.

AC-24-04
Cross-module internal imports are rejected by CI.

AC-24-05
Circular dependencies are rejected.

AC-24-06
Database migrations are versioned and ordered.

AC-24-07
Seed execution follows migration prerequisites.

AC-24-08
API implementation follows Doc 22.

AC-24-09
Frontend implementation follows Doc 23.

AC-24-10
Connector implementation remains isolated.

AC-24-11
Domain does not directly depend on external SDKs.

AC-24-12
Idempotency is implemented for required side effects.

AC-24-13
Workers support retry and DLQ.

AC-24-14
Events use versioned contracts.

AC-24-15
Tenant isolation is covered by automated tests.

AC-24-16
Security policies are tested.

AC-24-17
Unit tests cover critical business rules.

AC-24-18
Integration tests cover persistence and adapters.

AC-24-19
Contract tests cover API/events/connectors.

AC-24-20
E2E covers critical user journeys.

AC-24-21
CI blocks merge when required tests fail.

AC-24-22
Deployment is automated.

AC-24-23
Production migration has a verification gate.

AC-24-24
Production backup and restore strategy exists.

AC-24-25
Observability exists before production.

AC-24-26
Rollback strategy exists.

AC-24-27
Implementation tasks are traceable to architecture docs.

AC-24-28
Every completed task has acceptance evidence.

AC-24-29
MVP remains a modular monolith.

AC-24-30
No premature microservice extraction is introduced.
```

---

# 383 — FINAL IMPLEMENTATION LOCK

```text
REPOSITORY STRUCTURE       = LOCKED
MODULE STRUCTURE           = LOCKED
MODULE OWNERSHIP           = LOCKED
DEPENDENCY RULES           = LOCKED
DATABASE OWNERSHIP         = LOCKED
MIGRATION STRATEGY         = LOCKED
SEED STRATEGY              = LOCKED
API IMPLEMENTATION         = LOCKED
CONNECTOR IMPLEMENTATION   = LOCKED
EVENT IMPLEMENTATION       = LOCKED
WORKER MODEL               = LOCKED
TESTING STRATEGY           = LOCKED
ARCHITECTURE TESTING       = LOCKED
SECURITY TESTING           = LOCKED
CI PIPELINE                = LOCKED
CD PIPELINE                = LOCKED
ENVIRONMENT MODEL          = LOCKED
OBSERVABILITY              = LOCKED
BACKUP / RECOVERY          = LOCKED
ROLLBACK PRINCIPLE         = LOCKED
IMPLEMENTATION ORDER       = LOCKED
DEFINITION OF DONE         = LOCKED
TRACEABILITY               = LOCKED
MVP BOUNDARY               = LOCKED
SCALING / EXTRACTION RULE  = LOCKED
```

# 384 — MASTER DOCUMENT CHAIN

```text
DOC 01–19
DOMAIN + INTELLIGENCE + PLATFORM FOUNDATION
             ↓
DOC 20
SYSTEM ARCHITECTURE
             ↓
DOC 21
DATA MODEL & DATABASE SCHEMA
             ↓
DOC 22
API & INTEGRATION CONTRACT
             ↓
DOC 23
UX/UI ARCHITECTURE
             ↓
DOC 24
IMPLEMENTATION BLUEPRINT
             ↓
IMPLEMENTATION
             ↓
TESTING
             ↓
DEPLOYMENT
             ↓
PRODUCTION
```

# 385 — FINAL STATUS

```text
DOC 20 = COMPLETE + LOCKED
DOC 21 = COMPLETE + LOCKED
DOC 22 = COMPLETE + LOCKED
DOC 23 = COMPLETE + LOCKED
DOC 24 = COMPLETE + LOCKED
```

**Affiliate OS Architecture Foundation v1.0 → IMPLEMENTATION-READY.**