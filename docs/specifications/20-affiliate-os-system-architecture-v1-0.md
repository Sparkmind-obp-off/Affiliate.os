# 20 — AFFILIATE OS SYSTEM ARCHITECTURE v1.0

**Product:** Affiliate OS  
**Document:** System Architecture  
**Version:** v1.0  
**Status:** Architecture Definition  
**Architecture Style:** Modular Monolith + Domain-Oriented Architecture + Event-Driven Integration  
**Scope:** Module 01–19

---

# 1. PURPOSE

Dokumen ini menjadi:

> **SYSTEM-LEVEL BLUEPRINT yang menyatukan seluruh Module 01–19 menjadi satu Affiliate OS yang koheren, terukur, aman, dan siap masuk ke Data Model, API Contract, UX/UI, dan Implementation Blueprint.**

Module 01–19 menjelaskan domain masing-masing.

Dokumen 20 menjelaskan:

```text
BAGAIMANA SEMUANYA TERHUBUNG
```

---

# 2. ARCHITECTURAL GOAL

Affiliate OS harus menjadi:

```text
MODULAR
TRACEABLE
TENANT-SAFE
EVENT-DRIVEN
PLATFORM-AGNOSTIC
OBSERVABLE
AUDITABLE
EXTENSIBLE
IMPLEMENTABLE
```

Bukan sekadar kumpulan fitur.

---

# 3. ARCHITECTURE PRINCIPLE

Core principle:

```text
ONE SYSTEM
+
CLEAR DOMAIN BOUNDARIES
+
EXPLICIT CONTRACTS
+
OWNED DATA
+
CONTROLLED DEPENDENCIES
```

Setiap module harus memiliki:

```text
OWNERSHIP
BOUNDARY
PUBLIC CONTRACT
DATA AUTHORITY
EVENTS
DEPENDENCIES
```

Module tidak boleh mengambil data internal module lain secara sembarangan.

---

# 4. ARCHITECTURE STYLE

Affiliate OS menggunakan:

```text
MODULAR MONOLITH
```

dengan:

```text
BOUNDED DOMAIN MODULES
+
INTERNAL API
+
DOMAIN EVENTS
+
EXTERNAL CONNECTORS
```

Artinya:

```text
ONE CODEBASE
ONE PRIMARY APPLICATION
ONE DEPLOYMENT UNIT
```

tetapi secara internal:

```text
STRICT MODULE BOUNDARIES
```

Pendekatan ini memungkinkan development dan operasi tetap sederhana, sementara domain dapat berkembang secara independen.

---

# 5. WHY MODULAR MONOLITH

MVP tidak langsung menggunakan:

```text
20 MICROservices
```

karena akan menambah:

```text
network complexity
distributed transactions
deployment complexity
service discovery
distributed debugging
operational overhead
```

Sebaliknya:

```text
MODULAR MONOLITH
```

memberikan:

```text
SINGLE DEPLOYMENT
+
CLEAR BOUNDARIES
+
LOW LATENCY
+
EASIER DEBUGGING
+
FUTURE EXTRACTION OPTION
```

---

# 6. HIGH-LEVEL SYSTEM

```text
                         AFFILIATE OS
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   EXPERIENCE             APPLICATION           PLATFORM
      LAYER                  CORE                 LAYER
        │                     │                     │
        ↓                     ↓                     ↓
   Dashboard            Domain Modules         Connectors
   Workspace            Intelligence           TikTok
   Admin                 Execution              TikTok Shop
   Analytics             Measurement            AI
   Settings              Governance             Storage
                              │                  Notification
                              ↓
                         DATA PLATFORM
                              │
                    Events / Database / Cache
```

---

# 7. SYSTEM LAYERS

Affiliate OS terdiri dari:

```text
LAYER 1
EXPERIENCE

LAYER 2
APPLICATION

LAYER 3
DOMAIN

LAYER 4
ORCHESTRATION

LAYER 5
CONNECTOR

LAYER 6
DATA + EVENT

LAYER 7
OBSERVABILITY
```

---

# 8. EXPERIENCE LAYER

Menangani:

```text
WEB APP
DASHBOARD
WORKSPACE
ADMIN
ANALYTICS
SETTINGS
```

Tidak boleh mengandung business logic inti.

Flow:

```text
UI
 ↓
APPLICATION API
 ↓
DOMAIN
```

---

# 9. APPLICATION LAYER

Application layer menangani:

```text
USE CASE
COMMAND
QUERY
WORKFLOW ENTRY
AUTHORIZATION CONTEXT
TRANSACTION BOUNDARY
```

Contoh:

```text
CreateContent
PublishContent
ConnectTikTok
CreateCampaign
RunRecommendation
GetRevenueReport
```

---

# 10. DOMAIN LAYER

Business rules utama berada di domain module.

Contoh:

```text
Creator Fit Rule
Attribution Rule
Commission Rule
Policy Rule
Experiment Rule
Recommendation Rule
```

Domain tidak boleh bergantung langsung pada:

```text
TikTok SDK
database driver
HTTP client
UI
```

---

# 11. ORCHESTRATION LAYER

Mengatur:

```text
workflow
task
execution
retry
approval
dependency
compensation
```

Core:

```text
MODULE 13
EXECUTION ORCHESTRATION
```

---

# 12. CONNECTOR LAYER

External system:

```text
TikTok
TikTok Shop
AI Provider
Storage
Notification
```

harus melalui:

```text
MODULE 17
CONNECTOR ABSTRACTION
```

Domain tidak boleh mengetahui detail API external secara langsung.

---

# 13. DATA + EVENT LAYER

Module 14 menjadi:

```text
EVENT INFRASTRUCTURE
```

yang menyediakan:

```text
INGESTION
NORMALIZATION
QUEUE
EVENT STORAGE
DEDUPLICATION
REPLAY
DLQ
LINEAGE
```

---

# 14. OBSERVABILITY LAYER

Module 18 menangani:

```text
LOG
METRIC
TRACE
HEALTH
ALERT
INCIDENT
RELIABILITY
```

Observability harus dapat mengikuti:

```text
REQUEST
 ↓
MODULE
 ↓
EVENT
 ↓
TASK
 ↓
CONNECTOR
 ↓
RESULT
```

---

# 15. CORE MODULE MAP

```text
01 PRODUCT VISION
02 MVP SCOPE
03 MARKET INTELLIGENCE
04 DEMAND DISCOVERY
05 OPPORTUNITY ENGINE
06 CREATOR FIT
07 CONTENT PRODUCTION
08 DISTRIBUTION
09 PERFORMANCE INTELLIGENCE
10 REVENUE INTELLIGENCE
11 EXPERIMENTATION
12 INTELLIGENCE + RECOMMENDATION
13 AUTOMATION + EXECUTION
14 DATA + EVENTS
15 IDENTITY + TENANCY
16 SECURITY + GOVERNANCE
17 CONNECTORS
18 OBSERVABILITY + RELIABILITY
19 ATTRIBUTION + BUSINESS TRUTH
```

---

# 16. DOMAIN GROUPING

Untuk system-level architecture, Module 01–19 dikelompokkan menjadi:

```text
STRATEGY DOMAIN
01–03

DISCOVERY DOMAIN
04–05

CREATOR + CONTENT DOMAIN
06–08

PERFORMANCE + REVENUE DOMAIN
09–10

LEARNING + INTELLIGENCE DOMAIN
11–12

EXECUTION DOMAIN
13

DATA DOMAIN
14

IDENTITY DOMAIN
15

GOVERNANCE DOMAIN
16

INTEGRATION DOMAIN
17

OPERATIONS DOMAIN
18

MEASUREMENT DOMAIN
19
```

---

# 17. CORE DOMAIN VS SUPPORTING DOMAIN

Core business differentiation:

```text
04 Demand Discovery
05 Opportunity
06 Creator Fit
07 Content
09 Performance
10 Revenue
11 Experimentation
12 Intelligence
19 Attribution
```

Supporting/platform capabilities:

```text
13 Execution
14 Data
15 Identity
16 Security
17 Connector
18 Operations
```

---

# 18. SYSTEM DEPENDENCY MODEL

High-level:

```text
01–03
  ↓
04–05
  ↓
06–08
  ↓
09–10
  ↓
11–12
  ↓
13
  ↓
14
  ↓
19
  ↓
12
```

Cross-cutting:

```text
15 Identity
16 Security
17 Connectors
18 Observability
```

berlaku terhadap seluruh system.

---

# 19. IDENTITY DEPENDENCY

Semua business operation harus dapat di-scope terhadap:

```text
Organization
 ↓
Workspace
 ↓
User
 ↓
Platform Account
```

Module 15 menjadi identity authority.

---

# 20. SECURITY DEPENDENCY

Semua sensitive operation melewati:

```text
MODULE 16
SECURITY + GOVERNANCE
```

Contoh:

```text
PUBLISH
EXPORT
CONNECT ACCOUNT
READ REVENUE
CHANGE POLICY
RUN AUTOMATION
```

---

# 21. CONNECTOR DEPENDENCY

External interaction:

```text
DOMAIN
 ↓
CAPABILITY CONTRACT
 ↓
MODULE 17
 ↓
ADAPTER
 ↓
EXTERNAL PLATFORM
```

Tidak:

```text
DOMAIN
 ↓
TIKTOK API DIRECTLY
```

---

# 22. DATA OWNERSHIP

Setiap module memiliki authority atas data domainnya.

Contoh:

```text
Module 15
→ Identity

Module 16
→ Policy

Module 17
→ Connector state

Module 18
→ Operational telemetry

Module 19
→ Attribution + Business Truth
```

Module lain tidak boleh melakukan direct write terhadap data tersebut.

Prinsip ownership dan public interface ini merupakan karakter penting modular architecture yang sehat.

---

# 23. MODULE CONTRACT

Setiap module memiliki:

```text
PUBLIC COMMANDS
PUBLIC QUERIES
PUBLIC EVENTS
PUBLIC TYPES
```

Internal implementation:

```text
PRIVATE
```

---

# 24. INTER-MODULE COMMUNICATION

Ada dua pola utama:

### Synchronous

```text
Module A
 ↓
Public API
 ↓
Module B
```

Digunakan jika:

```text
immediate response
strong consistency
simple request
```

### Asynchronous

```text
Module A
 ↓
EVENT
 ↓
Module B
```

Digunakan jika:

```text
decoupling
background processing
fan-out
long-running workflow
eventual consistency
```

---

# 25. COMMAND VS EVENT

Command:

```text
DO SOMETHING
```

Event:

```text
SOMETHING HAPPENED
```

Contoh:

```text
PublishContentCommand
```

menghasilkan:

```text
ContentPublishedEvent
```

---

# 26. CANONICAL SYSTEM FLOW

```text
USER
 ↓
IDENTITY
 ↓
AUTHORIZATION
 ↓
USE CASE
 ↓
DOMAIN MODULE
 ↓
COMMAND
 ↓
BUSINESS RULE
 ↓
EVENT
 ↓
DATA
 ↓
MEASUREMENT
 ↓
BUSINESS TRUTH
```

---

# 27. COMPLETE AFFILIATE LOOP

```text
DEMAND
 ↓
OPPORTUNITY
 ↓
CREATOR FIT
 ↓
CONTENT
 ↓
DISTRIBUTION
 ↓
PERFORMANCE
 ↓
REVENUE
 ↓
EXPERIMENT
 ↓
RECOMMENDATION
 ↓
EXECUTION
 ↓
MEASUREMENT
 ↓
BUSINESS TRUTH
 ↓
INTELLIGENCE
 ↓
DEMAND
```

Ini adalah:

> **Affiliate OS Closed Learning Loop.**

---

# 28. CONTENT LOOP

```text
Opportunity
 ↓
Creator
 ↓
Content Brief
 ↓
Content
 ↓
Publish
 ↓
Views
 ↓
Clicks
 ↓
Conversion
 ↓
Revenue
```

---

# 29. REVENUE LOOP

```text
Click
 ↓
Product
 ↓
Order
 ↓
Conversion
 ↓
Attribution
 ↓
Revenue
 ↓
Commission
 ↓
Reconciliation
```

---

# 30. INTELLIGENCE LOOP

```text
DATA
 ↓
MEASUREMENT
 ↓
SIGNAL
 ↓
ANALYSIS
 ↓
RECOMMENDATION
 ↓
EXPERIMENT
 ↓
OUTCOME
 ↓
LEARNING
```

---

# 31. AUTOMATION LOOP

```text
TRIGGER
 ↓
POLICY
 ↓
WORKFLOW
 ↓
TASK
 ↓
EXECUTION
 ↓
VALIDATION
 ↓
RESULT
 ↓
MEASUREMENT
```

---

# 32. FAILURE LOOP

Jika terjadi failure:

```text
FAILURE
 ↓
MODULE 18
 ↓
DETECT
 ↓
CLASSIFY
 ↓
RETRY / RECOVER
 ↓
ESCALATE
 ↓
RESOLVE
 ↓
AUDIT
```

---

# 33. SECURITY LOOP

```text
REQUEST
 ↓
IDENTITY
 ↓
TENANT
 ↓
PERMISSION
 ↓
POLICY
 ↓
RISK
 ↓
APPROVAL
 ↓
EXECUTION
```

---

# 34. TENANT BOUNDARY

Semua request harus membawa context:

```text
tenant_id
organization_id
workspace_id
user_id
```

Business data harus selalu scoped.

---

# 35. DATA FLOW

```text
EXTERNAL PLATFORM
       ↓
CONNECTOR
       ↓
RAW EVENT
       ↓
CANONICAL EVENT
       ↓
VALIDATION
       ↓
DOMAIN PROCESSING
       ↓
MEASUREMENT
       ↓
BUSINESS TRUTH
       ↓
INTELLIGENCE
```

---

# 36. RAW DATA PRINCIPLE

Raw data:

```text
IMMUTABLE
```

Correction:

```text
NEW EVENT
```

bukan:

```text
OVERWRITE
```

---

# 37. EVENT FLOW

```text
External Event
 ↓
Ingress
 ↓
Validation
 ↓
Deduplication
 ↓
Canonicalization
 ↓
Event Store
 ↓
Consumers
```

---

# 38. EVENT CONSUMERS

Satu event dapat dikonsumsi oleh:

```text
Performance
Revenue
Attribution
Experiment
Recommendation
Observability
Audit
```

tanpa mengubah source event.

---

# 39. EVENTUAL CONSISTENCY

Tidak semua bagian system harus synchronous.

Contoh:

```text
CONTENT PUBLISHED
```

dapat menghasilkan:

```text
Analytics Update
Recommendation Update
Performance Update
Revenue Tracking
```

secara asynchronous.

---

# 40. TRANSACTION BOUNDARY

Transaction harus berada dalam module owner.

Contoh:

```text
Module 19
→ Attribution transaction
```

Module lain tidak boleh membuka transaction internal Module 19.

---

# 41. CROSS-MODULE TRANSACTION

Tidak menggunakan distributed transaction sebagai default.

Gunakan:

```text
EVENT
+
STATE MACHINE
+
COMPENSATING ACTION
```

jika workflow melewati banyak module.

---

# 42. DATA CONSISTENCY LEVEL

```text
STRONG
```

untuk:

```text
identity
permission
policy
critical state
```

```text
EVENTUAL
```

untuk:

```text
analytics
recommendation
dashboard projection
performance aggregates
```

---

# 43. SOURCE OF TRUTH HIERARCHY

```text
EXTERNAL SOURCE
      ↓
RAW EVENT
      ↓
CANONICAL EVENT
      ↓
VALIDATED DATA
      ↓
ATTRIBUTED DATA
      ↓
RECONCILED DATA
      ↓
BUSINESS TRUTH
```

Tidak boleh ada:

```text
DASHBOARD
```

yang menjadi source of truth.

---

# 44. READ MODEL

Dashboard dapat menggunakan:

```text
READ MODEL
PROJECTION
AGGREGATION
CACHE
```

tetapi:

```text
READ MODEL ≠ SOURCE OF TRUTH
```

---

# 45. WRITE MODEL

Write operation harus menuju:

```text
MODULE OWNER
```

Contoh:

```text
Revenue correction
→ Module 19

Policy change
→ Module 16

Platform connection
→ Module 17
```

---

# 46. CACHE PRINCIPLE

Cache boleh digunakan untuk:

```text
high-read data
dashboard
recommendation
platform metadata
```

tetapi cache:

```text
NOT AUTHORITATIVE
```

---

# 47. API GATEWAY

External application dapat masuk melalui:

```text
API GATEWAY
```

Flow:

```text
CLIENT
 ↓
API GATEWAY
 ↓
AUTHENTICATION
 ↓
TENANT RESOLUTION
 ↓
AUTHORIZATION
 ↓
APPLICATION API
```

---

# 48. INTERNAL API

Internal modules menggunakan:

```text
MODULE PUBLIC CONTRACT
```

bukan:

```text
DATABASE ACCESS
```

---

# 49. DATABASE ARCHITECTURE

MVP:

```text
ONE PRIMARY DATABASE
```

dengan:

```text
LOGICAL MODULE OWNERSHIP
```

Contoh:

```text
identity.*
policy.*
connector.*
execution.*
measurement.*
```

Physical schema detail akan didefinisikan pada:

```text
DOCUMENT 21
DATA MODEL & DATABASE SCHEMA
```

---

# 50. NO SHARED TABLE OWNERSHIP

Tidak boleh:

```text
Module A writes Module B table
```

Yang diperbolehkan:

```text
Module A
 ↓
Module B API
```

atau:

```text
Module A
 ↓
Event
 ↓
Module B
```

---

# 51. MODULE BOUNDARY RULE

Setiap module harus:

```text
OWN ITS DOMAIN
OWN ITS DATA
OWN ITS RULES
EXPOSE ITS CONTRACT
HIDE ITS INTERNALS
```

Boundary harus cukup dalam untuk menyembunyikan implementation detail dan cukup jelas agar perubahan bisnis tidak menyebar ke seluruh system.

---

# 52. DEPENDENCY RULE

Dependency diperbolehkan:

```text
A → B PUBLIC CONTRACT
```

Tidak diperbolehkan:

```text
A → B INTERNAL SERVICE
A → B INTERNAL MODEL
A → B DATABASE TABLE
A → B PRIVATE FUNCTION
```

---

# 53. CYCLE PREVENTION

Tidak boleh:

```text
A → B
B → A
```

tanpa alasan architecture yang eksplisit.

Cycle harus menjadi:

```text
ARCHITECTURE ERROR
```

atau dipecahkan melalui:

```text
EVENT
SHARED CONTRACT
RE-DESIGN
```

---

# 54. CROSS-CUTTING SERVICES

Cross-cutting capability:

```text
Authentication
Authorization
Audit
Logging
Telemetry
Configuration
Feature Flags
Secrets
```

tetap tidak boleh menjadi:

```text
GOD MODULE
```

---

# 55. SHARED KERNEL

Shared kernel harus sangat kecil.

Contoh yang diperbolehkan:

```text
Money
Currency
Timestamp
TenantContext
CorrelationId
Result/Error primitives
```

Tidak boleh memasukkan:

```text
Creator business rules
Revenue rules
Attribution rules
Recommendation logic
```

Shared kernel yang terlalu besar akan menjadi sumber coupling.

---

# 56. PLATFORM AGNOSTIC CORE

Core Affiliate OS tidak boleh bergantung pada:

```text
TikTok-specific terminology
```

secara langsung.

Gunakan:

```text
Canonical Domain Model
```

Kemudian connector melakukan mapping:

```text
TikTok
 ↓
Adapter
 ↓
Canonical Model
```

---

# 57. PLATFORM CAPABILITY MODEL

External platform dapat memiliki:

```text
CAPABILITY
```

Contoh:

```text
CONTENT_PUBLISH
PRODUCT_READ
ORDER_READ
AFFILIATE_READ
ANALYTICS_READ
WEBHOOK
```

System melakukan capability discovery sebelum execution.

---

# 58. AI BOUNDARY

AI dapat:

```text
ANALYZE
RECOMMEND
GENERATE
RANK
PREDICT
```

AI tidak boleh menjadi authority final untuk:

```text
SECURITY
PERMISSION
POLICY
TENANT ISOLATION
FINANCIAL TRUTH
AUDIT
```

---

# 59. BUSINESS TRUTH BOUNDARY

Module 19 menjadi authority untuk:

```text
ATTRIBUTION
MEASUREMENT
RECONCILIATION
BUSINESS TRUTH
```

Module lain boleh menghasilkan:

```text
signals
events
inputs
```

tetapi tidak boleh menggantikan Business Truth.

---

# 60. OBSERVABILITY BOUNDARY

Module 18 mengobservasi:

```text
SYSTEM
MODULE
WORKFLOW
TASK
EVENT
CONNECTOR
DATA PIPELINE
```

tetapi tidak menjadi owner business logic.

---

# 61. SECURITY BOUNDARY

Module 16 menjadi policy authority.

Module lain:

```text
REQUEST
 ↓
POLICY CHECK
 ↓
EXECUTE
```

---

# 62. FAILURE ISOLATION

Failure pada:

```text
TikTok
```

tidak boleh menyebabkan:

```text
Database
Identity
Business Truth
```

rusak.

Connector failure harus dapat diisolasi.

---

# 63. GRACEFUL DEGRADATION

Jika external platform unavailable:

```text
READ CACHE
QUEUE
RETRY
DEFER
```

jika policy mengizinkan.

Jangan:

```text
fake success
```

---

# 64. RETRY BOUNDARY

Retry hanya dilakukan pada error yang:

```text
TRANSIENT
```

Contoh:

```text
timeout
temporary network error
429
temporary external unavailable
```

Bukan:

```text
invalid permission
invalid payload
policy denial
authentication revoked
```

---

# 65. IDEMPOTENCY

Critical operation harus mendukung:

```text
idempotency_key
```

terutama:

```text
publish
webhook processing
commission processing
order ingestion
workflow execution
```

---

# 66. CORRELATION

Setiap major flow menggunakan:

```text
correlation_id
```

Contoh:

```text
User Action
 ↓
Workflow
 ↓
Task
 ↓
Connector
 ↓
External API
 ↓
Event
 ↓
Measurement
```

seluruhnya dapat ditelusuri.

---

# 67. TRACEABILITY

System harus dapat menjawab:

```text
WHY DID THIS HAPPEN?
```

melalui:

```text
request_id
correlation_id
workflow_id
task_id
event_id
source_id
audit_id
```

---

# 68. AUDIT TRAIL

Critical action menghasilkan:

```text
AuditEvent
```

Minimal:

```text
actor
tenant
action
resource
before
after
timestamp
source
reason
correlation_id
```

---

# 69. CONFIGURATION

Configuration dibagi:

```text
SYSTEM CONFIG
TENANT CONFIG
WORKSPACE CONFIG
ACCOUNT CONFIG
FEATURE CONFIG
POLICY CONFIG
```

Tidak boleh hard-code business policy di UI.

---

# 70. FEATURE FLAGS

Feature flags dapat digunakan untuk:

```text
MVP rollout
experimental feature
connector capability
tenant rollout
safe deployment
```

---

# 71. VERSIONING

Versioning wajib untuk:

```text
API
EVENT
SCHEMA
CALCULATION
POLICY
CONNECTOR
RECOMMENDATION MODEL
```

---

# 72. BACKWARD COMPATIBILITY

Contract change harus:

```text
ADDITIVE FIRST
```

Jika breaking:

```text
VERSION
MIGRATION
DEPRECATION
```

---

# 73. ERROR MODEL

Canonical error:

```text
error_code
message
category
retryable
source
correlation_id
details
```

Category:

```text
VALIDATION
AUTHENTICATION
AUTHORIZATION
POLICY
RATE_LIMIT
CONNECTOR
DATA
SYSTEM
BUSINESS
```

---

# 74. SECURITY MODEL

Security architecture:

```text
IDENTITY
 ↓
TENANT
 ↓
RESOURCE
 ↓
PERMISSION
 ↓
POLICY
 ↓
RISK
 ↓
APPROVAL
 ↓
EXECUTION
```

---

# 75. DATA SECURITY

Sensitive data:

```text
encrypted
scoped
audited
minimized
retained according to policy
```

Token/credential data tidak boleh masuk ke:

```text
normal logs
analytics
business tables
```

---

# 76. PERFORMANCE ARCHITECTURE

MVP prioritizes:

```text
simple
predictable
observable
```

daripada premature optimization.

Gunakan:

```text
cache
queue
batch processing
read projections
pagination
indexing
```

jika memang diperlukan.

---

# 77. SCALING STRATEGY

Initial:

```text
VERTICAL SCALE
+
HORIZONTAL APPLICATION SCALE
```

Kemudian jika bottleneck nyata:

```text
QUEUE WORKER SCALE
CONNECTOR WORKER SCALE
ANALYTICS WORKER SCALE
```

Microservice extraction hanya jika ada evidence.

---

# 78. EXTRACTION STRATEGY

Jika suatu module perlu dipisahkan:

```text
MODULE
 ↓
PUBLIC CONTRACT
 ↓
EVENT CONTRACT
 ↓
SEPARATE SERVICE
```

Tidak boleh memulai extraction dengan:

```text
DATABASE SPLIT FIRST
```

Boundary harus jelas terlebih dahulu.

---

# 79. EXTRACTION CANDIDATES

Potential future candidates:

```text
Module 14 Data Infrastructure
Module 17 Connector Layer
Module 18 Observability
Module 19 Measurement
```

Tetapi:

```text
NOT MVP REQUIREMENT
```

---

# 80. SYSTEM DEPENDENCY MATRIX

| Module | Depends On | Primary Output |
|---|---|---|
| 01 | — | Product direction |
| 02 | 01 | MVP boundary |
| 03 | 01 | Market intelligence |
| 04 | 03,14 | Demand signals |
| 05 | 04 | Opportunities |
| 06 | 05 | Creator fit |
| 07 | 06 | Content |
| 08 | 07,13,17 | Distribution |
| 09 | 08,14 | Performance |
| 10 | 09,19 | Revenue intelligence |
| 11 | 09,19 | Experiment result |
| 12 | 09,10,11,19 | Recommendations |
| 13 | 12,16,17 | Execution |
| 14 | 17 | Canonical events |
| 15 | — | Identity/account context |
| 16 | 15 | Policy decisions |
| 17 | 15 | External capability |
| 18 | All | Operational visibility |
| 19 | 14,17 | Business truth |

---

# 81. SYSTEM DEPENDENCY GRAPH

```text
                    ┌─────────────┐
                    │ 15 IDENTITY │
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │16 SECURITY  │
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │17 CONNECTOR │
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │14 DATA/EVENT│
                    └──────┬──────┘
                           ↓
01 → 03 → 04 → 05 → 06 → 07 → 08
                           ↓
                     09 PERFORMANCE
                           ↓
                      10 REVENUE
                           ↓
                  11 EXPERIMENTATION
                           ↓
                    12 INTELLIGENCE
                           ↓
                     13 EXECUTION
                           ↓
                    19 BUSINESS TRUTH
                           ↓
                     12 LEARNING
```

Module 18:

```text
OBSERVES ALL
```

---

# 82. PRIMARY SYSTEM FLOW

```text
USER
 ↓
MODULE 15
IDENTITY
 ↓
MODULE 16
SECURITY
 ↓
MODULE 12
INTELLIGENCE
 ↓
MODULE 13
EXECUTION
 ↓
MODULE 17
CONNECTOR
 ↓
EXTERNAL PLATFORM
 ↓
MODULE 14
EVENT
 ↓
MODULE 19
MEASUREMENT
 ↓
MODULE 10
REVENUE INTELLIGENCE
 ↓
MODULE 12
LEARNING
```

---

# 83. READ FLOW

```text
USER
 ↓
API
 ↓
QUERY
 ↓
READ MODEL
 ↓
DASHBOARD
```

Read flow tidak boleh melakukan unintended business mutation.

---

# 84. WRITE FLOW

```text
USER
 ↓
API
 ↓
AUTH
 ↓
POLICY
 ↓
COMMAND
 ↓
DOMAIN
 ↓
PERSIST
 ↓
EVENT
```

---

# 85. EXTERNAL EVENT FLOW

```text
PLATFORM
 ↓
WEBHOOK/API
 ↓
CONNECTOR
 ↓
INGESTION
 ↓
VALIDATION
 ↓
DEDUPLICATION
 ↓
CANONICAL EVENT
 ↓
EVENT BUS
 ↓
DOMAIN CONSUMERS
```

---

# 86. BUSINESS TRUTH FLOW

```text
CANONICAL EVENTS
 ↓
VALIDATION
 ↓
ATTRIBUTION
 ↓
CONVERSION
 ↓
RECONCILIATION
 ↓
REVENUE
 ↓
COMMISSION
 ↓
BUSINESS TRUTH
```

---

# 87. SYSTEM HEALTH FLOW

```text
REQUEST
 ↓
LOG
 ↓
METRIC
 ↓
TRACE
 ↓
ALERT
 ↓
INCIDENT
 ↓
RECOVERY
```

---

# 88. ARCHITECTURE QUALITY ATTRIBUTES

Affiliate OS harus memenuhi:

```text
SECURITY
RELIABILITY
OBSERVABILITY
TRACEABILITY
MAINTAINABILITY
EXTENSIBILITY
PERFORMANCE
SCALABILITY
DATA INTEGRITY
TENANT ISOLATION
```

---

# 89. ARCHITECTURAL INVARIANTS

Tidak boleh dilanggar:

```text
1. Tenant isolation selalu aktif.
2. Security policy tidak dapat dilewati oleh AI.
3. Raw source event immutable.
4. Business truth memiliki lineage.
5. Module tidak mengakses internal module lain.
6. External platform hanya melalui connector.
7. Critical execution memiliki idempotency.
8. Unknown state tidak dipaksa menjadi success.
9. Estimated value tidak disamakan dengan final value.
10. Metric harus memiliki definition dan version.
11. Source discrepancy tidak boleh disembunyikan.
12. Audit trail tidak boleh dihapus secara normal.
13. Dependency cycle tidak diperbolehkan.
14. Read model bukan source of truth.
15. Dashboard bukan business authority.
```

---

# 90. ANTI-PATTERN

Jangan membangun:

```text
GOD SERVICE
```

```text
GOD DATABASE
```

```text
GOD MODEL
```

```text
GOD MODULE
```

```text
DIRECT PLATFORM CALLS EVERYWHERE
```

```text
CROSS-MODULE TABLE WRITES
```

```text
BUSINESS LOGIC INSIDE UI
```

```text
AI AS SECURITY AUTHORITY
```

```text
DASHBOARD AS SOURCE OF TRUTH
```

---

# 91. ARCHITECTURAL TESTING

CI harus dapat memeriksa:

```text
allowed dependencies
forbidden imports
module boundaries
cycle detection
contract compatibility
schema ownership
tenant isolation
```

Boundary architecture sebaiknya ditegakkan secara otomatis, bukan hanya berdasarkan konvensi developer.

---

# 92. SYSTEM TEST LEVELS

```text
UNIT TEST
 ↓
MODULE TEST
 ↓
CONTRACT TEST
 ↓
INTEGRATION TEST
 ↓
END-TO-END TEST
 ↓
ARCHITECTURE TEST
```

---

# 93. MVP DEPLOYMENT

MVP:

```text
WEB APPLICATION
+
API
+
WORKER
+
DATABASE
+
QUEUE
+
OBJECT STORAGE
+
OBSERVABILITY
```

Tidak wajib:

```text
MICROSERVICE MESH
SERVICE DISCOVERY
KUBERNETES
DISTRIBUTED TRANSACTION
```

---

# 94. MVP INFRASTRUCTURE

Logical:

```text
                    CLIENT
                      ↓
                  WEB / API
                      ↓
             ┌────────┴────────┐
             ↓                 ↓
          APP CORE           WORKER
             ↓                 ↓
             └───────┬─────────┘
                     ↓
                  DATABASE
                     ↓
                   QUEUE
                     ↓
                EVENT FLOW
```

External:

```text
TikTok
TikTok Shop
AI
Storage
Notification
```

melalui Module 17.

---

# 95. DEPLOYMENT BOUNDARY

MVP:

```text
ONE DEPLOYABLE APPLICATION
```

Internal modules:

```text
01–19
```

tetap terisolasi secara logical.

---

# 96. OBSERVABILITY REQUIREMENT

Setiap major operation harus memiliki:

```text
request_id
correlation_id
tenant_id
module
operation
duration
status
error_code
```

---

# 97. DISASTER RECOVERY PRINCIPLE

Critical data harus memiliki:

```text
backup
restore strategy
audit
replay capability
```

Event infrastructure harus memungkinkan controlled:

```text
REPLAY
```

---

# 98. MIGRATION PRINCIPLE

Schema migration:

```text
FORWARD
VERSIONED
REVERSIBLE WHEN POSSIBLE
AUDITED
```

Jangan melakukan destructive migration tanpa:

```text
backup
migration plan
rollback strategy
```

---

# 99. ARCHITECTURE DECISION RECORDS

Architecture decisions penting harus dicatat sebagai ADR:

```text
ADR-001
Modular Monolith

ADR-002
Module Boundary

ADR-003
Data Ownership

ADR-004
Event Architecture

ADR-005
Connector Abstraction

ADR-006
Security Authority

ADR-007
Business Truth Authority
```

---

# 100. SYSTEM OF RECORD

Authority:

```text
Identity
→ Module 15

Security
→ Module 16

External Platform Access
→ Module 17

Operational Health
→ Module 18

Measurement + Business Truth
→ Module 19

Domain Intelligence
→ Module 12
```

---

# 101. ARCHITECTURE COMPLETENESS

Dengan Module 20, kita sekarang memiliki:

```text
DOMAIN ARCHITECTURE
        +
SYSTEM ARCHITECTURE
```

Tetapi belum memiliki secara detail:

```text
DATABASE SCHEMA
API CONTRACT
UX/UI
IMPLEMENTATION TRACEABILITY
```

Itulah fungsi:

```text
21
22
23
24
```

---

# 102. NEXT DOCUMENT DEPENDENCY

```text
20 SYSTEM ARCHITECTURE
          ↓
21 DATA MODEL
          ↓
22 API CONTRACT
          ↓
23 UX/UI ARCHITECTURE
          ↓
24 IMPLEMENTATION BLUEPRINT
```

Urutan ini **dikunci**.

---

# 103. ACCEPTANCE CRITERIA

```text
AC-20-01
Module 01–19 memiliki posisi jelas dalam system.

AC-20-02
Setiap module memiliki boundary.

AC-20-03
Setiap module memiliki data ownership.

AC-20-04
Inter-module communication menggunakan public contract.

AC-20-05
Cross-module database access dilarang.

AC-20-06
External platform hanya melalui Module 17.

AC-20-07
Identity authority berada pada Module 15.

AC-20-08
Security authority berada pada Module 16.

AC-20-09
Observability authority berada pada Module 18.

AC-20-10
Business truth authority berada pada Module 19.

AC-20-11
AI tidak menjadi security authority.

AC-20-12
Raw events tetap immutable.

AC-20-13
System mendukung synchronous communication.

AC-20-14
System mendukung asynchronous event communication.

AC-20-15
Critical operations mendukung idempotency.

AC-20-16
System memiliki correlation model.

AC-20-17
System memiliki canonical error model.

AC-20-18
System memiliki versioning strategy.

AC-20-19
System memiliki tenant isolation.

AC-20-20
System memiliki dependency rules.

AC-20-21
Dependency cycle dapat dideteksi.

AC-20-22
Read model tidak menjadi source of truth.

AC-20-23
Dashboard tidak menjadi business authority.

AC-20-24
System dapat melakukan controlled replay.

AC-20-25
System dapat melakukan controlled backfill.

AC-20-26
Failure external platform dapat diisolasi.

AC-20-27
Retry hanya dilakukan untuk retryable error.

AC-20-28
Policy denial tidak dapat di-bypass oleh retry.

AC-20-29
Connector failure tidak mengubah business truth secara palsu.

AC-20-30
Business flow dapat ditelusuri dari request sampai outcome.

AC-20-31
Event flow dapat ditelusuri dari source sampai consumer.

AC-20-32
Critical action memiliki audit trail.

AC-20-33
Module dapat diuji secara independen.

AC-20-34
Architecture test dapat memeriksa module boundary.

AC-20-35
MVP dapat berjalan sebagai modular monolith.

AC-20-36
Future service extraction tidak memerlukan redesign total.

AC-20-37
Data ownership dapat dipetakan.

AC-20-38
System dependency graph terdokumentasi.

AC-20-39
Core business loop terdokumentasi.

AC-20-40
Failure/recovery loop terdokumentasi.

AC-20-41
Security loop terdokumentasi.

AC-20-42
Revenue loop terdokumentasi.

AC-20-43
Intelligence loop terdokumentasi.

AC-20-44
Automation loop terdokumentasi.

AC-20-45
Document 21 memiliki input architecture yang jelas.

AC-20-46
Document 22 memiliki input architecture yang jelas.

AC-20-47
Document 23 memiliki input architecture yang jelas.

AC-20-48
Document 24 memiliki input architecture yang jelas.

AC-20-49
Tidak ada module baru yang dibutuhkan untuk melengkapi system-level architecture MVP.

AC-20-50
System Architecture dapat menjadi single reference untuk seluruh Module 01–19.
```

---

# 104. DEFINITION OF DONE

Document 20 selesai apabila:

```text
MODULES
   ↓
BOUNDARIES
   ↓
DEPENDENCIES
   ↓
DATA OWNERSHIP
   ↓
CONTRACTS
   ↓
EVENT FLOW
   ↓
SECURITY FLOW
   ↓
EXECUTION FLOW
   ↓
BUSINESS FLOW
   ↓
DEPLOYMENT MODEL
```

semuanya telah memiliki definisi yang konsisten.

---

# 105. FINAL SYSTEM ARCHITECTURE

```text
                         AFFILIATE OS
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
 EXPERIENCE              CORE DOMAIN            PLATFORM
       │                      │                      │
       │              ┌───────┴────────┐             │
       │              │                │             │
       ↓              ↓                ↓             ↓
    WEB APP       DISCOVERY        INTELLIGENCE   CONNECTORS
    ADMIN         CREATOR          EXECUTION      TikTok
    ANALYTICS     CONTENT          MEASUREMENT    TikTok Shop
                   REVENUE         GOVERNANCE     AI
                                      │           Storage
                                      ↓
                                  DATA/EVENT
                                      │
                                      ↓
                                 OBSERVABILITY
```

---

# 106. FINAL CLOSED LOOP

```text
        ┌─────────────────────────────┐
        │                             ↓
    DISCOVER → DECIDE → CREATE → PUBLISH
        ↑                         ↓
        │                     MEASURE
        │                         ↓
    LEARN ← RECOMMEND ← ATTRIBUTE ← CONVERT
        │
        └──────── BUSINESS TRUTH
```

---

# 107. ARCHITECTURE LOCK

## MODULE 20 — AFFILIATE OS SYSTEM ARCHITECTURE v1.0

Status:

```text
SYSTEM BOUNDARY        = LOCKED
MODULE MAP             = LOCKED
DEPENDENCY MODEL       = LOCKED
DATA OWNERSHIP         = LOCKED
COMMUNICATION MODEL    = LOCKED
EVENT MODEL             = LOCKED
SECURITY POSITION       = LOCKED
CONNECTOR POSITION      = LOCKED
OBSERVABILITY POSITION  = LOCKED
DEPLOYMENT STRATEGY     = LOCKED
MVP ARCHITECTURE        = LOCKED
```

### Final architectural decision:

> **Affiliate OS v1.0 dibangun sebagai Modular Monolith dengan bounded domain modules, explicit public contracts, event-driven integration, centralized governance, platform-agnostic core, dan single source of truth per domain.**

```text
01–19
   ↓
20 SYSTEM ARCHITECTURE
   ↓
21 DATA MODEL
   ↓
22 API CONTRACT
   ↓
23 UX/UI
   ↓
24 IMPLEMENTATION BLUEPRINT
   ↓
ARCHITECTURE COMPLETE
   ↓
BUILD
```

**Tidak perlu menambah Module 25 untuk melengkapi architecture MVP.**