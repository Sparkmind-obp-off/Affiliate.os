# 14 — AFFILIATE DATA & EVENT INFRASTRUCTURE v1.0

**Product:** Affiliate OS  
**Module:** 14  
**Version:** v1.0  
**Status:** Product Architecture

---

# 1. PURPOSE

Affiliate Data & Event Infrastructure adalah:

> **data backbone dan event backbone yang mengumpulkan, menormalisasi, menyimpan, mengalirkan, dan menyediakan data kepada seluruh engine Affiliate OS.**

Modul ini menjawab:

```text
WHAT HAPPENED?
WHEN?
WHERE?
TO WHICH ENTITY?
FROM WHICH SOURCE?
WHAT CHANGED?
WHO CAUSED IT?
CAN WE TRUST THE DATA?
```

---

# 2. CORE POSITIONING

Bukan sekadar:

```text
Database
```

Bukan sekadar:

```text
Analytics Storage
```

Bukan sekadar:

```text
Webhook Receiver
```

Tetapi:

```text
AFFILIATE DATA + EVENT BACKBONE
```

yang menghubungkan:

```text
DISCOVERY
   ↓
OPPORTUNITY
   ↓
CREATOR
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
INTELLIGENCE
   ↓
EXECUTION
```

---

# 3. CORE LOOP

```text
SOURCE
  ↓
INGEST
  ↓
NORMALIZE
  ↓
VALIDATE
  ↓
STORE
  ↓
EMIT EVENT
  ↓
PROCESS
  ↓
AGGREGATE
  ↓
INTELLIGENCE
```

---

# 4. HUBUNGAN DENGAN MODULE 13

Module 13:

```text
EXECUTION
```

menghasilkan:

```text
Execution Started
Execution Completed
Execution Failed
Approval Requested
Publish Completed
Publish Failed
```

Module 14:

```text
CAPTURE
→
NORMALIZE
→
STORE
→
EMIT
```

Kemudian data tersebut dapat digunakan kembali oleh:

```text
Module 09
Performance

Module 10
Revenue

Module 11
Experiment

Module 12
Intelligence
```

---

# 5. HUBUNGAN DENGAN SEMUA MODULE

```text
MODULE 04
Demand Discovery
      ↓
DATA

MODULE 05
Opportunity
      ↓
DATA

MODULE 06
Creator Fit
      ↓
DATA

MODULE 07
Content
      ↓
DATA

MODULE 08
Distribution
      ↓
EVENT

MODULE 09
Performance
      ↓
METRICS

MODULE 10
Revenue
      ↓
TRANSACTION DATA

MODULE 11
Experiment
      ↓
EXPERIMENT EVENTS

MODULE 12
Intelligence
      ↓
RECOMMENDATION

MODULE 13
Execution
      ↓
EXECUTION EVENTS

MODULE 14
DATA + EVENT BACKBONE
```

---

# 6. CORE PRINCIPLE

Setiap important system action harus dapat menghasilkan:

```text
EVENT
```

Setiap event penting harus dapat ditelusuri kembali ke:

```text
ENTITY
SOURCE
TIME
ACTOR
CONTEXT
```

---

# 7. EVENT-FIRST PRINCIPLE

Contoh:

```text
Video Published
```

bukan hanya:

```text
database.video.status = published
```

tetapi juga:

```text
EVENT:
content.published
```

Dengan:

```text
content_id
creator_id
platform
timestamp
execution_id
source
metadata
```

---

# 8. EVENT VS STATE

Harus dibedakan:

### STATE

```text
Video.status = PUBLISHED
```

menjawab:

> Kondisinya sekarang apa?

### EVENT

```text
content.published
```

menjawab:

> Apa yang terjadi?

Keduanya dibutuhkan.

---

# 9. EVENT MODEL

Canonical event:

```text
Event
```

Fields:

```text
id
event_type
event_version
occurred_at
received_at
source
entity_type
entity_id
actor_type
actor_id
correlation_id
causation_id
payload
metadata
schema_version
```

---

# 10. EVENT ID

Setiap event harus memiliki:

```text
event_id
```

yang unique.

Contoh:

```text
evt_01KABC...
```

Tujuan:

```text
Deduplication
Tracing
Audit
Replay
Debugging
```

---

# 11. EVENT TYPE

Naming convention:

```text
domain.entity.action
```

Contoh:

```text
content.created
content.generated
content.validated
content.scheduled
content.published
content.failed
```

---

# 12. AFFILIATE EVENTS

Contoh:

```text
product.discovered
product.validated
opportunity.created
creator.matched
creator.selected
content.generated
content.published
content.viewed
product.clicked
product.sold
commission.recorded
experiment.started
experiment.completed
recommendation.created
workflow.started
workflow.completed
workflow.failed
```

---

# 13. EVENT VERSIONING

Event harus memiliki:

```text
schema_version
```

Contoh:

```text
content.published.v1
```

Jika schema berubah:

```text
content.published.v2
```

Tujuannya:

> perubahan schema tidak merusak consumer lama.

---

# 14. EVENT ENVELOPE

Canonical structure:

```json
{
  "event_id": "evt_123",
  "event_type": "content.published",
  "event_version": 1,
  "occurred_at": "...",
  "received_at": "...",
  "source": "tiktok",
  "entity_type": "content",
  "entity_id": "content_123",
  "actor_type": "system",
  "actor_id": "affiliate_os",
  "correlation_id": "corr_123",
  "causation_id": "task_123",
  "payload": {},
  "metadata": {}
}
```

---

# 15. SOURCE TYPES

Data dapat berasal dari:

```text
INTERNAL
API
WEBHOOK
IMPORT
USER_INPUT
SYSTEM
AI
PLATFORM
CONNECTOR
```

---

# 16. DATA INGESTION

Pipeline:

```text
External Source
      ↓
Ingestion Layer
      ↓
Raw Data
      ↓
Validation
      ↓
Normalization
      ↓
Canonical Data
```

---

# 17. INGESTION SOURCES

MVP:

```text
TikTok API
TikTok Webhook
TikTok Shop API
TikTok Shop Webhook
AI Provider
Internal Events
Manual Input
Scheduled Sync
```

TikTok saat ini menyediakan webhook yang mengirim event ke callback URL melalui HTTPS POST, dan delivery-nya bersifat best-effort at-least-once; karena itu ingestion layer wajib idempotent terhadap duplicate event.

---

# 18. WEBHOOK RECEIVER

Architecture:

```text
Webhook
   ↓
Authenticate
   ↓
Validate
   ↓
Acknowledge
   ↓
Persist Raw Event
   ↓
Queue
   ↓
Process
```

---

# 19. WEBHOOK RULE

Webhook receiver tidak boleh melakukan business processing berat sebelum acknowledgement.

Prinsip:

```text
RECEIVE
→
VALIDATE BASIC
→
ACK
→
PROCESS ASYNC
```

TikTok mensyaratkan callback webhook merespons HTTP 200 untuk acknowledgement dan dapat melakukan retry delivery ketika acknowledgement gagal.

---

# 20. RAW EVENT STORE

Simpan payload asli:

```text
RawEvent
```

Fields:

```text
id
source
received_at
headers
payload
signature_status
processing_status
```

Tujuan:

```text
Replay
Debug
Audit
Recovery
Forensics
```

---

# 21. NORMALIZATION

Data external tidak boleh langsung menjadi canonical business data.

```text
External Payload
       ↓
Adapter
       ↓
Normalizer
       ↓
Canonical Model
```

---

# 22. EXAMPLE

TikTok mungkin mengirim:

```text
publish_id
```

System internal menggunakan:

```text
external_reference
```

Maka:

```text
TikTok Adapter
→
Canonical Event
```

---

# 23. CANONICAL ENTITY

Core entities:

```text
Account
Platform
Product
Shop
Creator
Content
ContentAsset
Campaign
Opportunity
Experiment
Workflow
Task
Execution
Click
Conversion
Order
Commission
Metric
Recommendation
Event
```

---

# 24. ENTITY IDENTITY

Setiap entity memiliki:

```text
internal_id
```

dan jika berasal dari external platform:

```text
external_id
external_source
```

Contoh:

```text
content_id:
cnt_123

external_id:
tiktok_987

source:
tiktok
```

---

# 25. IDENTITY MAPPING

System harus dapat menjawab:

```text
Internal Entity
        ↕
External Entity
```

Contoh:

```text
Affiliate OS Product
        ↕
TikTok Shop Product
```

---

# 26. ENTITY RESOLUTION

Jika data masuk:

```text
same external product
```

dua kali, system tidak boleh membuat:

```text
Product A
Product B
```

secara tidak sengaja.

Harus dilakukan:

```text
Match
→
Resolve
→
Update
```

---

# 27. DEDUPLICATION

Deduplication key dapat menggunakan:

```text
source
+
event_type
+
external_event_id
```

atau kombinasi deterministic lain sesuai source.

---

# 28. IDEMPOTENT INGESTION

Jika event masuk dua kali:

```text
Event A
Event A
```

hasil canonical state tetap:

```text
ONE EFFECT
```

bukan:

```text
TWO EFFECTS
```

---

# 29. EVENT BUS

Setelah event tervalidasi:

```text
Event
 ↓
Event Bus
 ↓
Consumers
```

Consumer contoh:

```text
Performance Engine
Revenue Engine
Experiment Engine
Intelligence Engine
Notification
Automation Engine
```

---

# 30. EVENT TOPICS

Contoh:

```text
affiliate.product
affiliate.creator
affiliate.content
affiliate.performance
affiliate.revenue
affiliate.experiment
affiliate.execution
affiliate.recommendation
```

---

# 31. EVENT CONSUMER

Consumer harus:

```text
Receive
→
Validate
→
Process
→
Acknowledge
```

Jika gagal:

```text
Retry
```

Jika permanent failure:

```text
Dead Letter Queue
```

---

# 32. DEAD LETTER QUEUE

Event yang tidak dapat diproses:

```text
Event
 ↓
Retry
 ↓
Retry
 ↓
Retry
 ↓
DLQ
```

Tujuan:

```text
No Silent Data Loss
```

---

# 33. EVENT REPLAY

System harus dapat:

```text
Replay Event
```

untuk recovery atau rebuilding downstream state.

Namun replay harus mempertimbangkan:

```text
Idempotency
Side Effects
Version
Ordering
```

---

# 34. EVENT ORDERING

Tidak semua event dapat diproses tanpa urutan.

Contoh:

```text
content.created
      ↓
content.published
      ↓
content.performance_recorded
```

System harus dapat mempertahankan ordering ketika diperlukan.

---

# 35. EVENT CORRELATION

Gunakan:

```text
correlation_id
```

untuk menghubungkan satu business journey.

Contoh:

```text
Recommendation
↓
Workflow
↓
Content
↓
Publish
↓
Revenue
```

semuanya dapat memiliki:

```text
correlation_id = corr_847
```

---

# 36. CAUSATION

Gunakan:

```text
causation_id
```

untuk mengetahui:

> Event ini terjadi karena event/action apa?

Contoh:

```text
content.published
```

disebabkan oleh:

```text
workflow.task.completed
```

---

# 37. EVENT TRACE

Dengan:

```text
correlation_id
+
causation_id
```

system dapat membuat:

```text
CAUSE
 ↓
ACTION
 ↓
EVENT
 ↓
OUTCOME
```

---

# 38. DATA LAYERS

Gunakan minimal:

```text
RAW
↓
STAGING
↓
CANONICAL
↓
AGGREGATED
↓
SERVING
```

---

# 39. RAW LAYER

Menyimpan:

```text
Original Payload
```

Tidak boleh dimodifikasi secara sembarangan.

---

# 40. STAGING

Tempat:

```text
Parsing
Validation
Cleaning
Transformation
```

---

# 41. CANONICAL

Tempat data standar Affiliate OS.

Contoh:

```text
Canonical Product
Canonical Creator
Canonical Content
Canonical Order
Canonical Commission
```

---

# 42. AGGREGATED

Data yang sudah dihitung:

```text
Daily Views
Weekly CTR
Product CVR
Creator Conversion
Content GMV
Commission
Revenue
```

---

# 43. SERVING

Data siap digunakan oleh:

```text
Dashboard
API
Intelligence
Recommendation
Automation
```

---

# 44. DATA FRESHNESS

Setiap dataset harus memiliki:

```text
last_synced_at
```

dan bila relevan:

```text
data_as_of
```

Agar system tidak menyamakan:

```text
REALTIME
```

dengan:

```text
LAST SYNC 12 HOURS AGO
```

---

# 45. SYNC ENGINE

Untuk API yang tidak event-driven:

```text
Scheduler
↓
Sync Job
↓
Fetch
↓
Normalize
↓
Upsert
↓
Emit Event
```

---

# 46. FULL SYNC

Digunakan untuk:

```text
Initial Import
Recovery
Reconciliation
Historical Backfill
```

---

# 47. INCREMENTAL SYNC

Digunakan untuk:

```text
New Data
Changed Data
Recent Metrics
```

Tujuan:

```text
Minimize API Calls
```

---

# 48. RECONCILIATION

Jika:

```text
Internal Data
```

berbeda dengan:

```text
External Platform
```

system harus dapat melakukan:

```text
Detect
→
Compare
→
Reconcile
→
Record Difference
```

---

# 49. DATA QUALITY

Setiap dataset memiliki:

```text
Completeness
Accuracy
Consistency
Freshness
Uniqueness
Validity
```

---

# 50. DATA QUALITY SCORE

Contoh:

```text
Data Quality = 94/100
```

berdasarkan:

```text
Completeness
Freshness
Validity
Consistency
```

---

# 51. DATA LINEAGE

System harus dapat menjawab:

> Data ini berasal dari mana?

Contoh:

```text
GMV
 ↓
Order
 ↓
TikTok Shop API
 ↓
Sync Job #829
 ↓
Raw Event
```

---

# 52. METRIC DEFINITION

Metrics tidak boleh hanya berupa angka.

Harus memiliki:

```text
metric_id
definition
formula
source
grain
time_window
timezone
version
```

---

# 53. EXAMPLE

```text
CTR
```

harus memiliki definisi yang eksplisit:

```text
Clicks / Impressions
```

dan bukan sekadar:

```text
ctr = 4.7
```

---

# 54. METRIC VERSIONING

Jika formula berubah:

```text
CTR v1
CTR v2
```

jangan diam-diam mengubah historical meaning.

---

# 55. TIME DIMENSION

Semua event menggunakan timestamp standar:

```text
UTC
```

Kemudian UI dapat menampilkan timezone user/account.

---

# 56. BUSINESS DATE

Untuk analytics affiliate, simpan juga:

```text
business_date
```

agar aggregation harian tidak kacau karena perbedaan timezone.

---

# 57. DATA RETENTION

Setiap data memiliki policy:

```text
Hot
Warm
Cold
Archive
Delete
```

berdasarkan:

```text
importance
cost
legal/policy
analytics requirement
```

---

# 58. PRIVACY

Data sensitif harus:

```text
Minimized
Encrypted
Access Controlled
Audited
```

Jangan menyimpan data yang tidak diperlukan.

---

# 59. SECRET DATA

Tidak boleh menyimpan:

```text
Access Token
Refresh Token
API Secret
```

di:

```text
Event Payload
Analytics Log
Application Log
```

---

# 60. ACCESS CONTROL

Data harus memiliki boundary:

```text
Organization
Workspace
Account
Platform
Shop
Creator
```

Contoh:

```text
Workspace A
≠
Workspace B
```

---

# 61. MULTI-TENANCY

Affiliate OS harus siap:

```text
Tenant
 ↓
Workspace
 ↓
Connected Account
 ↓
Data
```

Data tenant tidak boleh bocor antar tenant.

---

# 62. EVENT SECURITY

Webhook/API event harus dapat melalui:

```text
Signature Verification
Source Validation
Schema Validation
Replay Protection
Idempotency
```

---

# 63. OBSERVABILITY

Infrastructure metrics:

```text
Events Received
Events Processed
Events Failed
Events Retried
Events DLQ
Processing Latency
Sync Latency
Data Freshness
Data Quality
```

---

# 64. EVENT LATENCY

Track:

```text
occurred_at
received_at
processed_at
```

sehingga dapat dihitung:

```text
Event Delivery Latency
Event Processing Latency
End-to-End Latency
```

---

# 65. DATA FAILURE MODEL

Jika ingestion gagal:

```text
RECEIVE
 ↓
RAW STORE
 ↓
PROCESS
 ↓
FAIL
 ↓
RETRY
 ↓
DLQ
```

Raw data tidak boleh hilang hanya karena processing gagal.

---

# 66. API FAILURE

Jika external API:

```text
timeout
5xx
rate limit
```

Sync Engine:

```text
Retry
→
Backoff
→
Resume
```

dengan policy yang sesuai.

---

# 67. WEBHOOK FAILURE

Jika webhook processing gagal:

```text
Webhook
 ↓
Persist Raw
 ↓
ACK
 ↓
Async Processing
```

sehingga kegagalan business processing tidak otomatis menyebabkan kehilangan event.

---

# 68. EVENT CONTRACT

Setiap event memiliki contract:

```text
event_type
version
required_fields
optional_fields
producer
consumer
schema
```

---

# 69. CONTRACT VALIDATION

Event invalid:

```text
Missing event_id
Missing timestamp
Invalid entity
Invalid schema
```

harus:

```text
REJECT
```

atau diarahkan ke error pipeline sesuai source.

---

# 70. SCHEMA REGISTRY

System memiliki:

```text
Event Schema Registry
```

berisi:

```text
Event Name
Version
Schema
Producer
Consumers
Compatibility
```

---

# 71. BACKWARD COMPATIBILITY

Perubahan event harus memperhatikan:

```text
Existing Consumers
```

Jangan:

```text
Change Schema
→
Break Everything
```

---

# 72. DATA CONTRACT

Selain event contract, entity penting memiliki:

```text
Data Contract
```

Contoh:

```text
Product Contract
Creator Contract
Content Contract
Order Contract
Commission Contract
```

---

# 73. SOURCE OF TRUTH

Setiap field penting harus memiliki:

```text
Source of Truth
```

Contoh:

```text
TikTok Shop Order
→
TikTok Shop API
```

bukan:

```text
AI generated estimate
```

---

# 74. ESTIMATED VS VERIFIED

Data harus dibedakan:

```text
VERIFIED
ESTIMATED
INFERRED
PREDICTED
```

AI prediction tidak boleh disamakan dengan actual revenue.

---

# 75. EVENT CATEGORIES

```text
DOMAIN EVENT
INTEGRATION EVENT
SYSTEM EVENT
USER EVENT
ANALYTICS EVENT
EXECUTION EVENT
ERROR EVENT
```

---

# 76. DOMAIN EVENT

Contoh:

```text
product.validated
creator.matched
content.published
commission.recorded
```

---

# 77. SYSTEM EVENT

Contoh:

```text
sync.started
sync.completed
sync.failed
connector.expired
queue.backpressure
```

---

# 78. EXECUTION EVENT

Contoh:

```text
workflow.started
task.started
task.completed
task.failed
approval.requested
approval.approved
```

---

# 79. ANALYTICS EVENT

Contoh:

```text
metric.updated
performance.snapshot.created
revenue.snapshot.created
```

---

# 80. EVENT FLOW

Contoh lengkap:

```text
TikTok
   ↓
Webhook
   ↓
Webhook Receiver
   ↓
Raw Event Store
   ↓
Event Validator
   ↓
Normalizer
   ↓
Canonical Event
   ↓
Event Bus
   ├── Performance
   ├── Revenue
   ├── Experiment
   ├── Intelligence
   └── Automation
```

TikTok sendiri menyediakan mekanisme webhook untuk event dan Content Posting API menyediakan webhook/status mechanism untuk hasil publishing, sehingga architecture event-driven ini cocok untuk menangkap perubahan external tanpa hanya mengandalkan polling.

---

# 81. TIKTOK SHOP EVENT FLOW

```text
TikTok Shop
      ↓
API / Webhook
      ↓
Raw Event
      ↓
Normalize
      ↓
Canonical Event
      ↓
Event Bus
      ↓
Affiliate OS
```

TikTok Shop Partner Center saat ini menyediakan domain API Events/Webhooks dan memisahkan API access berdasarkan authorization/scope, sehingga connector harus membawa metadata source, token scope, dan entity boundary.

---

# 82. AFFILIATE REVENUE EVENT

Contoh:

```text
affiliate.order.created
```

kemudian:

```text
affiliate.commission.created
```

kemudian:

```text
affiliate.commission.confirmed
```

System tidak boleh menganggap:

```text
ORDER
=
FINAL COMMISSION
```

---

# 83. PERFORMANCE EVENT

Contoh:

```text
content.metrics.updated
```

payload:

```text
views
likes
comments
shares
clicks
ctr
watch_time
```

---

# 84. REVENUE EVENT

```text
order.created
order.completed
commission.pending
commission.confirmed
commission.reversed
refund.created
```

---

# 85. EXPERIMENT EVENT

```text
experiment.created
experiment.started
variant.exposed
variant.completed
experiment.completed
winner.detected
```

---

# 86. INTELLIGENCE EVENT

```text
signal.detected
recommendation.created
recommendation.updated
recommendation.accepted
recommendation.rejected
```

---

# 87. AUTOMATION EVENT

```text
workflow.created
workflow.started
workflow.completed
workflow.failed
task.started
task.completed
task.failed
```

---

# 88. DATA PIPELINE

```text
SOURCE
 ↓
INGESTION
 ↓
RAW
 ↓
VALIDATION
 ↓
NORMALIZATION
 ↓
CANONICAL
 ↓
EVENT BUS
 ↓
PROCESSORS
 ↓
AGGREGATION
 ↓
SERVING
```

---

# 89. DATA PROCESSORS

MVP:

```text
Product Processor
Creator Processor
Content Processor
Performance Processor
Revenue Processor
Experiment Processor
Execution Processor
```

---

# 90. STORAGE ARCHITECTURE

Logical separation:

```text
Operational DB
      +
Event Store
      +
Object Storage
      +
Analytics Store
```

Tidak harus langsung menjadi physical distributed system.

---

# 91. MVP ARCHITECTURE

Untuk MVP:

```text
Modular Monolith
+
PostgreSQL
+
Object Storage
+
Queue
+
Event Tables
+
Background Workers
```

Jangan langsung:

```text
20 Microservices
```

---

# 92. EVENT TABLE

Contoh:

```text
events
```

Fields:

```text
id
event_type
version
source
entity_type
entity_id
occurred_at
received_at
correlation_id
causation_id
payload
metadata
created_at
```

---

# 93. RAW EVENTS TABLE

```text
raw_events
```

Fields:

```text
id
source
external_event_id
headers
payload
received_at
signature_status
processing_status
processed_at
error
```

---

# 94. ENTITY MAPPING TABLE

```text
external_entity_mappings
```

Fields:

```text
id
source
entity_type
internal_id
external_id
external_account_id
created_at
updated_at
```

---

# 95. SYNC JOB

```text
sync_jobs
```

Fields:

```text
id
connector
entity_type
mode
started_at
completed_at
records_fetched
records_created
records_updated
records_failed
status
error
```

---

# 96. DATA QUALITY TABLE

```text
data_quality_checks
```

Fields:

```text
dataset
check_type
score
failed_records
checked_at
```

---

# 97. CORE SERVICES

```text
Ingestion Service
Webhook Service
Normalization Service
Event Service
Event Bus
Event Consumer
Sync Service
Entity Resolution Service
Data Quality Service
Metric Service
Data Lineage Service
Data Access Service
```

---

# 98. SYSTEM ARCHITECTURE

```text
             EXTERNAL WORLD
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
    TikTok      TikTok Shop    AI/API
       │            │            │
       └────────────┼────────────┘
                    ▼
             INGESTION LAYER
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
      WEBHOOK              API SYNC
          │                   │
          └─────────┬─────────┘
                    ▼
              RAW EVENT STORE
                    │
                    ▼
              VALIDATION
                    │
                    ▼
              NORMALIZATION
                    │
                    ▼
             CANONICAL DATA
                    │
                    ▼
                EVENT BUS
          ┌─────────┼─────────┐
          ▼         ▼         ▼
     PERFORMANCE  REVENUE  EXPERIMENT
          │         │         │
          └─────────┼─────────┘
                    ▼
               INTELLIGENCE
                    │
                    ▼
               AUTOMATION
                    │
                    ▼
                EXECUTION
```

---

# 99. DATA → INTELLIGENCE

Module 12 harus dapat membaca:

```text
Historical Data
+
Current State
+
Recent Events
+
Performance
+
Revenue
+
Execution Outcomes
```

---

# 100. EVENT → AUTOMATION

Module 13 dapat menerima:

```text
EVENT
```

sebagai trigger.

Contoh:

```text
revenue.drop.detected
        ↓
Optimization Workflow
```

---

# 101. EVENT → EXPERIMENT

```text
content.performance.updated
        ↓
Performance Engine
        ↓
Signal
        ↓
Experiment Recommendation
        ↓
Module 13
```

---

# 102. EVENT → REVENUE

```text
Content Published
        ↓
Clicks
        ↓
Orders
        ↓
Commission
        ↓
Revenue
```

Setiap tahap dapat menghasilkan event.

---

# 103. DATA → DECISION

Final pipeline:

```text
DATA
 ↓
EVENT
 ↓
SIGNAL
 ↓
INSIGHT
 ↓
RECOMMENDATION
 ↓
EXECUTION
 ↓
OUTCOME
 ↓
DATA
```

Ini membentuk:

> **Affiliate OS Closed-Loop Data Architecture.**

---

# 104. MVP SCOPE

### BUILD NOW

```text
✓ Canonical data model
✓ Event model
✓ Event envelope
✓ Event versioning
✓ Raw event storage
✓ Webhook receiver
✓ API ingestion
✓ Data normalization
✓ Entity mapping
✓ Deduplication
✓ Idempotent processing
✓ Basic event bus
✓ Event consumers
✓ Retry
✓ Dead Letter Queue
✓ Event replay
✓ Correlation ID
✓ Causation ID
✓ Basic data quality
✓ Sync engine
✓ Incremental sync
✓ Full sync
✓ Data freshness
✓ Basic lineage
✓ Metric definitions
✓ Module 12 data handoff
✓ Module 13 event handoff
```

---

# 105. MVP CONNECTORS

Prioritas:

```text
1. TikTok
2. TikTok Shop
3. Affiliate OS Internal Events
4. AI Provider
5. Storage
```

TikTok Shop API access harus tetap mengikuti authorization dan scope yang tersedia untuk app/account terkait; jangan mengasumsikan semua endpoint tersedia hanya karena connector sudah terhubung.

---

# 106. NOT MVP

```text
✗ Massive distributed event mesh
✗ Global multi-region streaming
✗ Real-time ML feature store
✗ Complex CDC infrastructure
✗ Unlimited event replay
✗ Autonomous schema evolution
✗ Enterprise data lakehouse
✗ Multi-cloud data replication
✗ Advanced stream processing cluster
```

---

# 107. FUTURE

```text
Real-Time Event Streaming
Data Lakehouse
Feature Store
Real-Time Recommendation
Predictive Event Processing
Cross-Platform Event Graph
Advanced Data Lineage
Event Sourcing
CQRS
Real-Time Anomaly Detection
Data Mesh
```

---

# 108. THE REAL MOAT

Moat Module 14 bukan:

```text
DATABASE
```

tetapi:

```text
DATA
+
EVENTS
+
IDENTITY
+
LINEAGE
+
HISTORY
+
OUTCOMES
```

Semakin banyak execution terjadi:

```text
MORE EXECUTION
      ↓
MORE EVENTS
      ↓
MORE DATA
      ↓
MORE SIGNALS
      ↓
BETTER INTELLIGENCE
      ↓
BETTER EXECUTION
```

---

# 109. CORE CLOSED LOOP

```text
DISCOVER
   ↓
VALIDATE
   ↓
CREATE
   ↓
PUBLISH
   ↓
MEASURE
   ↓
SELL
   ↓
LEARN
   ↓
RECOMMEND
   ↓
EXECUTE
   ↓
MEASURE AGAIN
```

Semua aktivitas tersebut akhirnya masuk ke:

```text
MODULE 14
DATA + EVENT BACKBONE
```

---

# 110. FINAL DEFINITION

> **Affiliate Data & Event Infrastructure adalah backbone data dan event yang menerima data dari berbagai source, menyimpan raw evidence, melakukan validation dan normalization, membentuk canonical entities, mengelola event dengan versioning, idempotency, correlation, retry, replay, serta menyediakan data dan event yang reliable bagi Performance, Revenue, Experimentation, Intelligence, dan Automation Engine.**

---

# 111. SCOPE LOCK

**14 — AFFILIATE DATA & EVENT INFRASTRUCTURE v1.0 — APPROVED**

Core:

```text
INGEST
→
VALIDATE
→
NORMALIZE
→
STORE
→
EMIT
→
PROCESS
→
AGGREGATE
→
SERVE
→
LEARN
```

---

# 112. NEXT MODULE

```text
15 — AFFILIATE IDENTITY, ACCOUNT & TENANCY ARCHITECTURE v1.0
```

Fokus Modul 15:

```text
User
Organization
Workspace
Affiliate Account
TikTok Account
TikTok Shop Account
Creator Identity
Seller Identity
Platform Identity
OAuth
Connection
Permission
Role
RBAC
Multi-Tenancy
Data Isolation
Account Linking
Identity Mapping
```

Karena setelah **Module 14 = sistem saraf + data backbone**, kita perlu memastikan **siapa yang memiliki data, akun mana yang terhubung, siapa yang boleh mengakses, dan bagaimana satu user dapat mengoperasikan banyak account/platform secara aman.**