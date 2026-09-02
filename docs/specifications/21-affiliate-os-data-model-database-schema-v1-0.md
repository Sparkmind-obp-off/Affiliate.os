# 21 — AFFILIATE OS DATA MODEL & DATABASE SCHEMA v1.0

**Product:** Affiliate OS  
**Document:** Data Model & Database Schema  
**Version:** v1.0  
**Status:** Architecture Definition  
**Database Strategy:** Relational Database + Module-Owned Schemas  
**Primary Recommendation:** PostgreSQL  
**Architecture:** Modular Monolith  
**Scope:** Module 01–20

---

# 1. PURPOSE

Dokumen ini mendefinisikan:

```text
ENTITY
RELATIONSHIP
DATA OWNERSHIP
DATABASE SCHEMA
PRIMARY KEY
FOREIGN KEY
INDEX
ENUM
TENANT SCOPE
AUDIT
EVENT STORAGE
```

Tujuannya:

> **mengubah System Architecture menjadi struktur data yang siap diimplementasikan.**

---

# 2. ARCHITECTURAL PRINCIPLE

Database mengikuti prinsip:

```text
ONE DATABASE
+
MULTIPLE LOGICAL MODULE SCHEMAS
+
STRICT DATA OWNERSHIP
```

Artinya:

```text
Affiliate OS
     ↓
PostgreSQL
     ↓
┌──────────────┐
│ module_04    │
│ module_05    │
│ module_06    │
│ ...          │
│ module_19    │
└──────────────┘
```

Setiap module memiliki table yang menjadi tanggung jawabnya.

Pendekatan schema-per-module dapat memperkuat boundary database tanpa harus langsung memecah deployment menjadi microservices.

---

# 3. WHY RELATIONAL DATABASE

Affiliate OS membutuhkan:

```text
STRONG CONSISTENCY
TRANSACTION
RELATIONSHIP
CONSTRAINT
INDEXING
QUERYING
AUDITABILITY
```

Karena itu MVP menggunakan:

```text
POSTGRESQL
```

bukan database document sebagai primary source of truth.

---

# 4. DATABASE TOPOLOGY

```text
                    POSTGRESQL
                         │
      ┌──────────────────┼──────────────────┐
      ↓                  ↓                  ↓
IDENTITY              DOMAIN             DATA
SCHEMAS               SCHEMAS            SCHEMAS
      │                  │                  │
      └──────────────────┼──────────────────┘
                         ↓
                    READ MODELS
                         ↓
                     ANALYTICS
```

---

# 5. DATABASE BOUNDARY

Logical:

```text
module_15.*
module_16.*
module_17.*
module_18.*
module_19.*
```

Physical database tetap satu pada MVP.

Namun:

```text
MODULE A
```

tidak boleh melakukan:

```text
SELECT * FROM module_b.private_table
```

Cross-module access:

```text
PUBLIC API
atau
EVENT
```

Ini menjaga data sovereignty meskipun deployment masih satu aplikasi.

---

# 6. GLOBAL ID STRATEGY

Primary identifier menggunakan:

```text
UUID
```

atau:

```text
UUIDv7
```

untuk entity yang membutuhkan ordering berdasarkan waktu.

Format canonical:

```text
id UUID PRIMARY KEY
```

Tidak menggunakan sequential integer sebagai public identifier.

---

# 7. GLOBAL IDENTIFIERS

Core:

```text
organization_id
workspace_id
user_id
account_id
creator_id
product_id
content_id
campaign_id
workflow_id
task_id
event_id
order_id
conversion_id
attribution_id
experiment_id
recommendation_id
```

---

# 8. TENANT MODEL

Hierarchy:

```text
ORGANIZATION
      ↓
WORKSPACE
      ↓
USER
      ↓
PLATFORM ACCOUNT
```

Business data umumnya membawa:

```text
organization_id
workspace_id
```

sesuai ownership domain.

---

# 9. TENANT ISOLATION

Aturan:

```text
tenant A
≠
tenant B
```

Tidak boleh terjadi:

```text
JOIN
READ
WRITE
EXPORT
CACHE LEAK
```

antar-tenant.

Tenant isolation adalah invariant architecture.

---

# 10. COMMON COLUMN STANDARD

Entity persistent umumnya menggunakan:

```text
id
created_at
updated_at
```

Jika membutuhkan lifecycle:

```text
status
```

Jika membutuhkan deletion:

```text
deleted_at
```

Tetapi soft delete tidak digunakan otomatis untuk seluruh table.

---

# 11. AUDIT COLUMN STANDARD

Critical entity dapat memiliki:

```text
created_by
updated_by
```

Critical mutation dicatat juga dalam:

```text
audit_events
```

---

# 12. MODULE SCHEMA MAP

```text
module_01
module_02
module_03
module_04
module_05
module_06
module_07
module_08
module_09
module_10
module_11
module_12
module_13
module_14
module_15
module_16
module_17
module_18
module_19
```

Tidak semua module harus memiliki banyak table.

Beberapa module bersifat:

```text
strategy
logic
orchestration
```

dan menggunakan data dari module owner melalui contract.

---

# 13. MODULE 15 — IDENTITY DATA

Primary tables:

```text
module_15.organizations
module_15.workspaces
module_15.users
module_15.memberships
module_15.roles
module_15.platform_accounts
module_15.account_connections
module_15.sessions
```

---

# 14. ORGANIZATION

```text
organizations
```

Fields:

```text
id
name
slug
status
created_at
updated_at
```

Purpose:

```text
top-level tenant boundary
```

---

# 15. WORKSPACE

```text
workspaces
```

Fields:

```text
id
organization_id
name
slug
status
created_at
updated_at
```

Relationship:

```text
Organization
    1
    ↓
Many Workspaces
```

---

# 16. USER

```text
users
```

Fields:

```text
id
email
display_name
status
last_login_at
created_at
updated_at
```

User identity ≠ platform identity.

---

# 17. MEMBERSHIP

```text
memberships
```

Fields:

```text
id
organization_id
workspace_id
user_id
role_id
status
created_at
updated_at
```

---

# 18. ROLE

```text
roles
```

Core:

```text
OWNER
ADMIN
OPERATOR
ANALYST
VIEWER
```

---

# 19. PLATFORM ACCOUNT

```text
platform_accounts
```

Fields:

```text
id
organization_id
workspace_id
platform
external_account_id
account_type
status
display_name
created_at
updated_at
```

---

# 20. ACCOUNT CONNECTION

```text
account_connections
```

Fields:

```text
id
account_id
connection_status
token_reference
granted_scopes
expires_at
last_refresh_at
connected_at
revoked_at
created_at
updated_at
```

Token value tidak disimpan sebagai plain business data.

---

# 21. MODULE 17 — CONNECTOR DATA

Primary tables:

```text
module_17.connector_connections
module_17.connector_capabilities
module_17.connector_health
module_17.connector_requests
module_17.connector_errors
```

---

# 22. CONNECTOR CONNECTION

```text
connector_connections
```

Fields:

```text
id
account_id
platform
provider
status
credential_reference
granted_scopes
last_success_at
last_failure_at
created_at
updated_at
```

---

# 23. CONNECTOR CAPABILITY

```text
connector_capabilities
```

Examples:

```text
CONTENT_READ
CONTENT_PUBLISH
PRODUCT_READ
ORDER_READ
AFFILIATE_READ
ANALYTICS_READ
WEBHOOK
```

Fields:

```text
id
platform
capability
version
status
created_at
```

---

# 24. MODULE 14 — EVENT DATA

Primary tables:

```text
module_14.raw_events
module_14.canonical_events
module_14.event_processing
module_14.event_deduplication
module_14.dead_letter_events
module_14.event_replays
```

---

# 25. RAW EVENT

```text
raw_events
```

Fields:

```text
id
tenant_id
platform
source
external_event_id
event_type
payload
event_time
received_at
correlation_id
checksum
schema_version
created_at
```

Principle:

```text
IMMUTABLE
```

---

# 26. CANONICAL EVENT

```text
canonical_events
```

Fields:

```text
id
raw_event_id
tenant_id
event_type
entity_type
entity_id
source
platform
event_time
processed_at
correlation_id
schema_version
status
created_at
```

---

# 27. EVENT PROCESSING

```text
event_processing
```

Fields:

```text
id
event_id
consumer
status
attempt_count
first_attempt_at
last_attempt_at
processed_at
error_code
created_at
updated_at
```

---

# 28. DEAD LETTER EVENT

```text
dead_letter_events
```

Fields:

```text
id
event_id
reason
error_code
payload_reference
attempt_count
status
created_at
resolved_at
```

---

# 29. EVENT REPLAY

```text
event_replays
```

Fields:

```text
id
scope
start_time
end_time
event_type
reason
requested_by
status
started_at
completed_at
created_at
```

---

# 30. MODULE 04 — DEMAND DATA

Potential tables:

```text
module_04.demand_signals
module_04.demand_observations
module_04.demand_sources
```

---

# 31. DEMAND SIGNAL

```text
demand_signals
```

Fields:

```text
id
workspace_id
source
topic
keyword
signal_type
signal_value
confidence
observed_at
expires_at
created_at
```

---

# 32. MODULE 05 — OPPORTUNITY DATA

```text
module_05.opportunities
module_05.opportunity_scores
module_05.opportunity_evidence
```

---

# 33. OPPORTUNITY

```text
opportunities
```

Fields:

```text
id
workspace_id
source_signal_id
product_id
category
score
status
priority
created_at
updated_at
```

---

# 34. OPPORTUNITY SCORE

```text
opportunity_scores
```

Fields:

```text
id
opportunity_id
score_version
demand_score
competition_score
creator_fit_score
content_score
revenue_score
risk_score
final_score
calculated_at
```

---

# 35. MODULE 06 — CREATOR DATA

```text
module_06.creators
module_06.creator_profiles
module_06.creator_metrics
module_06.creator_fit_scores
module_06.creator_product_matches
```

---

# 36. CREATOR

```text
creators
```

Fields:

```text
id
workspace_id
platform
external_creator_id
display_name
handle
status
created_at
updated_at
```

---

# 37. CREATOR PROFILE

```text
creator_profiles
```

Fields:

```text
id
creator_id
niche
audience_profile
content_style
language
region
follower_count
profile_version
created_at
updated_at
```

---

# 38. CREATOR METRICS

```text
creator_metrics
```

Fields:

```text
id
creator_id
metric_date
views
clicks
orders
revenue
commission
engagement
created_at
```

Metrics may be stored as:

```text
daily aggregate
```

rather than duplicating raw events.

---

# 39. CREATOR FIT SCORE

```text
creator_fit_scores
```

Fields:

```text
id
creator_id
product_id
fit_version
audience_fit
content_fit
performance_fit
commercial_fit
risk_score
final_score
created_at
```

---

# 40. MODULE 07 — CONTENT DATA

```text
module_07.content_items
module_07.content_briefs
module_07.content_variants
module_07.content_assets
module_07.content_versions
```

---

# 41. CONTENT ITEM

```text
content_items
```

Fields:

```text
id
workspace_id
creator_id
opportunity_id
title
content_type
status
created_at
updated_at
```

---

# 42. CONTENT BRIEF

```text
content_briefs
```

Fields:

```text
id
content_id
hook
angle
cta
product_id
audience
brief_version
created_at
updated_at
```

---

# 43. CONTENT VERSION

```text
content_versions
```

Fields:

```text
id
content_id
version
asset_reference
caption
hashtags
generation_source
created_at
```

---

# 44. MODULE 08 — DISTRIBUTION DATA

```text
module_08.distribution_jobs
module_08.publications
module_08.content_platform_mappings
```

---

# 45. PUBLICATION

```text
publications
```

Fields:

```text
id
content_id
account_id
platform
external_post_id
status
published_at
created_at
updated_at
```

---

# 46. MODULE 09 — PERFORMANCE DATA

```text
module_09.performance_observations
module_09.performance_snapshots
module_09.performance_metrics
```

---

# 47. PERFORMANCE OBSERVATION

```text
performance_observations
```

Fields:

```text
id
content_id
creator_id
product_id
platform
metric_date
views
impressions
clicks
engagements
orders
revenue
created_at
```

---

# 48. MODULE 10 — REVENUE INTELLIGENCE DATA

Module 10 tidak mengambil alih ownership financial truth Module 19.

Tables:

```text
module_10.revenue_insights
module_10.commission_insights
module_10.revenue_forecasts
```

Module 10 adalah:

```text
INTELLIGENCE
```

Module 19 adalah:

```text
BUSINESS TRUTH
```

---

# 49. REVENUE INSIGHT

```text
revenue_insights
```

Fields:

```text
id
workspace_id
period_start
period_end
revenue_type
value
source_metric
calculation_version
created_at
```

---

# 50. MODULE 11 — EXPERIMENT DATA

```text
module_11.experiments
module_11.experiment_variants
module_11.experiment_exposures
module_11.experiment_results
```

---

# 51. EXPERIMENT

```text
experiments
```

Fields:

```text
id
workspace_id
name
hypothesis
status
start_at
end_at
created_at
updated_at
```

---

# 52. EXPERIMENT VARIANT

```text
experiment_variants
```

Fields:

```text
id
experiment_id
name
key
allocation_percentage
created_at
```

---

# 53. EXPERIMENT EXPOSURE

```text
experiment_exposures
```

Fields:

```text
id
experiment_id
variant_id
subject_type
subject_id
exposed_at
correlation_id
```

---

# 54. EXPERIMENT RESULT

```text
experiment_results
```

Fields:

```text
id
experiment_id
variant_id
metric
population
value
calculation_version
calculated_at
```

---

# 55. MODULE 12 — INTELLIGENCE DATA

```text
module_12.recommendations
module_12.recommendation_items
module_12.recommendation_feedback
module_12.model_runs
```

---

# 56. RECOMMENDATION

```text
recommendations
```

Fields:

```text
id
workspace_id
recommendation_type
source
model_version
confidence
status
created_at
expires_at
```

---

# 57. RECOMMENDATION ITEM

```text
recommendation_items
```

Fields:

```text
id
recommendation_id
entity_type
entity_id
rank
score
reason
created_at
```

---

# 58. RECOMMENDATION FEEDBACK

```text
recommendation_feedback
```

Fields:

```text
id
recommendation_id
actor_id
feedback_type
expected_outcome
actual_outcome
created_at
```

---

# 59. MODULE 13 — EXECUTION DATA

```text
module_13.workflows
module_13.workflow_steps
module_13.workflow_runs
module_13.tasks
module_13.task_runs
module_13.approvals
```

---

# 60. WORKFLOW

```text
workflows
```

Fields:

```text
id
workspace_id
name
trigger_type
status
version
created_at
updated_at
```

---

# 61. WORKFLOW STEP

```text
workflow_steps
```

Fields:

```text
id
workflow_id
step_key
action_type
dependency_config
configuration
position
created_at
updated_at
```

---

# 62. WORKFLOW RUN

```text
workflow_runs
```

Fields:

```text
id
workflow_id
trigger_event_id
status
started_at
completed_at
correlation_id
created_at
```

---

# 63. TASK

```text
tasks
```

Fields:

```text
id
workflow_run_id
step_id
task_type
status
priority
attempt_count
idempotency_key
created_at
updated_at
```

---

# 64. TASK RUN

```text
task_runs
```

Fields:

```text
id
task_id
attempt
executor
status
started_at
completed_at
error_code
result_reference
created_at
```

---

# 65. APPROVAL

```text
approvals
```

Fields:

```text
id
task_id
requested_by
approved_by
status
reason
requested_at
resolved_at
```

---

# 66. MODULE 16 — SECURITY DATA

```text
module_16.policies
module_16.policy_versions
module_16.policy_decisions
module_16.risk_assessments
module_16.audit_events
```

---

# 67. POLICY

```text
policies
```

Fields:

```text
id
workspace_id
policy_type
name
status
version
created_at
updated_at
```

---

# 68. POLICY DECISION

```text
policy_decisions
```

Fields:

```text
id
policy_id
actor_id
resource_type
resource_id
action
decision
risk_level
context_hash
decided_at
correlation_id
```

---

# 69. RISK ASSESSMENT

```text
risk_assessments
```

Fields:

```text
id
actor_id
resource_type
resource_id
risk_type
risk_level
score
reason
created_at
```

---

# 70. AUDIT EVENT

```text
audit_events
```

Fields:

```text
id
tenant_id
actor_id
action
resource_type
resource_id
before_state
after_state
reason
correlation_id
created_at
```

---

# 71. MODULE 18 — OBSERVABILITY DATA

Operational data:

```text
module_18.logs
module_18.metrics
module_18.traces
module_18.incidents
module_18.alerts
module_18.health_checks
```

Untuk high-volume telemetry, production implementation dapat menggunakan dedicated observability storage sehingga operational database tidak terbebani.

---

# 72. INCIDENT

```text
incidents
```

Fields:

```text
id
severity
service
module
status
detected_at
resolved_at
root_cause
created_at
updated_at
```

---

# 73. MODULE 19 — MEASUREMENT DATA

Core tables:

```text
module_19.measurement_events
module_19.touchpoints
module_19.conversions
module_19.attributions
module_19.revenues
module_19.commissions
module_19.reconciliations
module_19.metric_definitions
module_19.metric_results
module_19.business_truth_snapshots
```

---

# 74. MEASUREMENT EVENT

```text
measurement_events
```

Fields:

```text
id
canonical_event_id
tenant_id
event_type
source
platform
content_id
creator_id
product_id
campaign_id
session_id
order_id
event_time
status
created_at
```

---

# 75. TOUCHPOINT

```text
touchpoints
```

Fields:

```text
id
measurement_event_id
touchpoint_type
content_id
creator_id
product_id
click_id
session_id
occurred_at
created_at
```

---

# 76. CONVERSION

```text
conversions
```

Fields:

```text
id
order_id
external_transaction_id
source
platform
conversion_type
status
conversion_time
validated_at
created_at
updated_at
```

---

# 77. ATTRIBUTION

```text
attributions
```

Fields:

```text
id
conversion_id
touchpoint_id
model
credit
confidence
evidence
window_start
window_end
status
calculation_version
created_at
```

Invariant:

```text
SUM(credit) = 1
```

untuk model yang menggunakan full-credit normalization.

---

# 78. REVENUE

```text
revenues
```

Fields:

```text
id
conversion_id
gross_amount
refund_amount
cancellation_amount
adjustment_amount
net_amount
currency
status
source
time_basis
calculation_version
created_at
updated_at
```

---

# 79. COMMISSION

```text
commissions
```

Fields:

```text
id
conversion_id
commission_base
commission_rate
estimated_amount
actual_amount
approved_amount
payable_amount
paid_amount
reversed_amount
currency
status
calculation_version
created_at
updated_at
```

---

# 80. RECONCILIATION

```text
reconciliations
```

Fields:

```text
id
source_a
source_b
metric
period_start
period_end
value_a
value_b
variance
variance_rate
status
reason
resolved_at
created_at
```

---

# 81. METRIC DEFINITION

```text
metric_definitions
```

Fields:

```text
id
metric_id
name
definition
formula
numerator
denominator
unit
time_basis
population
source
version
status
created_at
updated_at
```

---

# 82. METRIC RESULT

```text
metric_results
```

Fields:

```text
id
metric_definition_id
scope_type
scope_id
period_start
period_end
value
status
calculated_at
calculation_version
created_at
```

---

# 83. BUSINESS TRUTH SNAPSHOT

```text
business_truth_snapshots
```

Fields:

```text
id
workspace_id
period_start
period_end
orders
confirmed_orders
gross_revenue
net_revenue
attributed_revenue
commission
refunds
cancellations
attribution_coverage
reconciliation_status
calculation_version
created_at
```

---

# 84. PRODUCT DATA

Product is a cross-domain concept, tetapi ownership harus jelas.

Canonical product identity dapat berada pada domain yang mengelola:

```text
catalog/product intelligence
```

Untuk MVP:

```text
module_05
```

dapat menjadi owner opportunity-linked product metadata jika belum ada dedicated catalog module.

Namun external product identity tetap:

```text
external_product_id
platform
account_id
```

---

# 85. PRODUCT REFERENCE

Module lain hanya menyimpan:

```text
product_id
```

atau:

```text
external_product_id
```

bukan menyalin seluruh product entity.

Jika membutuhkan detail:

```text
Product API
```

dipanggil.

---

# 86. CREATOR REFERENCE

Sama:

```text
creator_id
```

boleh disimpan di module lain sebagai reference.

Tetapi:

```text
creator profile ownership
```

tetap Module 06.

---

# 87. CONTENT REFERENCE

```text
content_id
```

menjadi reference.

Content detail tetap milik:

```text
Module 07
```

---

# 88. ORDER REFERENCE

Order financial truth berada pada:

```text
Module 19
```

atau external canonical order data sesuai source-of-truth contract.

Module lain menyimpan:

```text
order_id
```

bukan melakukan direct query terhadap revenue table.

---

# 89. CROSS-MODULE FOREIGN KEY RULE

Secara logical:

```text
creator_id
product_id
content_id
order_id
```

dapat digunakan sebagai identifiers.

Tetapi database tidak wajib membuat physical foreign key lintas schema.

Alasannya:

```text
MODULE OWNERSHIP
+
INDEPENDENT MIGRATION
+
FUTURE EXTRACTION
```

Cross-module integrity dijaga melalui:

```text
API
EVENT
VALIDATION
```

---

# 90. INTERNAL FOREIGN KEY

Foreign key **wajib** untuk relationship dalam module apabila memang diperlukan.

Contoh:

```text
workflow_steps.workflow_id
→ workflows.id
```

```text
attributions.conversion_id
→ conversions.id
```

---

# 91. INDEX STANDARD

Index wajib dipertimbangkan untuk:

```text
tenant_id
workspace_id
account_id
external_id
status
created_at
event_time
```

---

# 92. COMPOSITE INDEX

Untuk query umum:

```text
(workspace_id, created_at)
```

```text
(workspace_id, status)
```

```text
(account_id, external_id)
```

```text
(creator_id, metric_date)
```

---

# 93. EVENT INDEX

```text
external_event_id
event_type
event_time
correlation_id
checksum
```

Unique constraint digunakan jika platform/source menjamin uniqueness.

---

# 94. IDEMPOTENCY INDEX

Critical operations:

```text
idempotency_key
```

harus memiliki uniqueness sesuai scope.

Contoh:

```text
(workspace_id, idempotency_key)
```

---

# 95. EXTERNAL ID

External ID tidak boleh menjadi primary key internal.

Gunakan:

```text
id = internal UUID
```

dan:

```text
external_id
+
platform
+
account_id
```

sebagai external identity.

---

# 96. ENUM STRATEGY

Status yang sangat stabil dapat menggunakan:

```text
ENUM
```

Namun status yang sering berubah lebih aman menggunakan:

```text
VARCHAR
+
CHECK CONSTRAINT
```

atau lookup/reference table.

---

# 97. MONEY MODEL

Jangan menggunakan floating point untuk financial amount.

Gunakan:

```text
NUMERIC
```

contoh:

```text
NUMERIC(20,4)
```

dengan:

```text
currency CHAR(3)
```

---

# 98. TIMESTAMP

Gunakan:

```text
TIMESTAMP WITH TIME ZONE
```

Semua system timestamp disimpan dalam UTC.

Presentation layer mengubah ke timezone user.

---

# 99. JSONB USAGE

JSONB diperbolehkan untuk:

```text
raw external payload
connector metadata
flexible configuration
evidence
```

Tetapi jangan menggunakan JSONB sebagai pengganti seluruh relational model.

---

# 100. PII

PII harus dipisahkan secara logis.

Contoh:

```text
email
phone
address
```

tidak boleh tersebar ke seluruh business tables.

Gunakan:

```text
identity ownership
+
access policy
+
encryption
```

---

# 101. TOKEN DATA

OAuth token:

```text
NEVER STORE IN NORMAL TABLE AS PLAINTEXT
```

Gunakan:

```text
secret manager
encrypted credential store
token reference
```

Database hanya menyimpan:

```text
credential_reference
```

---

# 102. SOFT DELETE

Soft delete hanya digunakan jika business membutuhkan historical visibility.

Contoh:

```text
deleted_at
```

Jangan menggunakan soft delete untuk:

```text
immutable events
audit
financial history
```

---

# 103. IMMUTABLE TABLES

Minimal:

```text
raw_events
audit_events
```

harus append-oriented.

Correction dilakukan melalui:

```text
new event
```

---

# 104. VERSIONING

Calculation-related data memiliki:

```text
calculation_version
```

Policy:

```text
policy_version
```

Event:

```text
schema_version
```

Content:

```text
content_version
```

---

# 105. DATA RETENTION

Retention dibedakan berdasarkan:

```text
raw event
operational data
analytics
audit
financial truth
PII
```

Tidak semua data memiliki retention yang sama.

---

# 106. ARCHIVE

Data volume tinggi dapat dipindahkan:

```text
HOT
 ↓
WARM
 ↓
ARCHIVE
```

tanpa mengubah canonical business identity.

---

# 107. READ MODELS

Dashboard tidak melakukan query kompleks langsung terhadap seluruh normalized tables setiap kali.

Gunakan:

```text
read_models
aggregations
materialized views
```

jika diperlukan.

---

# 108. ANALYTICS MODEL

Analytics dapat memiliki:

```text
fact tables
dimension tables
daily aggregates
```

Tetapi:

```text
ANALYTICS MODEL
≠
SOURCE OF TRUTH
```

---

# 109. FACT / DIMENSION EXAMPLE

```text
fact_affiliate_performance
```

dimensions:

```text
date
creator
content
product
platform
workspace
```

metrics:

```text
views
clicks
orders
revenue
commission
```

---

# 110. CACHE DATA

Cache:

```text
temporary
rebuildable
non-authoritative
```

Contoh:

```text
platform metadata cache
recommendation cache
dashboard cache
```

---

# 111. DATABASE TRANSACTION

Transaction digunakan di dalam module.

Contoh:

```text
CREATE ORDER
+
CREATE CONVERSION
```

jika keduanya dimiliki oleh boundary yang sama.

---

# 112. CROSS-MODULE TRANSACTION

Tidak:

```text
BEGIN
Module A
Module B
Module C
COMMIT
```

sebagai distributed transaction.

Gunakan:

```text
EVENT
STATE
COMPENSATION
```

---

# 113. OUTBOX PATTERN

Untuk critical domain event:

```text
DOMAIN CHANGE
      ↓
DATABASE TRANSACTION
      ↓
OUTBOX EVENT
      ↓
EVENT PUBLISHER
```

Tujuan:

```text
DATA CHANGE
```

dan:

```text
EVENT PUBLICATION
```

tidak kehilangan sinkronisasi.

---

# 114. OUTBOX TABLE

Setiap module yang membutuhkan transactional event publishing dapat memiliki:

```text
outbox_events
```

Fields:

```text
id
event_type
aggregate_type
aggregate_id
payload
schema_version
status
attempt_count
published_at
created_at
```

---

# 115. INBOX / IDEMPOTENCY

Consumer dapat menggunakan:

```text
inbox_events
```

untuk mencegah duplicate processing.

Fields:

```text
event_id
consumer
processed_at
status
```

---

# 116. DATA LINEAGE

Setiap business result harus dapat ditelusuri:

```text
BUSINESS TRUTH
 ↓
METRIC RESULT
 ↓
CALCULATION
 ↓
CANONICAL EVENT
 ↓
RAW EVENT
 ↓
EXTERNAL SOURCE
```

---

# 117. DATA QUALITY

MVP checks:

```text
completeness
uniqueness
validity
freshness
consistency
reconciliation
```

---

# 118. DATA QUALITY RECORD

Optional:

```text
data_quality_checks
```

Fields:

```text
id
dataset
check_type
status
score
failed_count
checked_at
```

---

# 119. MIGRATION STRUCTURE

Setiap module memiliki migration ownership:

```text
db/
 ├── module_04/
 ├── module_05/
 ├── module_06/
 ├── module_07/
 ├── module_08/
 ├── module_09/
 ├── module_10/
 ├── module_11/
 ├── module_12/
 ├── module_13/
 ├── module_14/
 ├── module_15/
 ├── module_16/
 ├── module_17/
 ├── module_18/
 └── module_19/
```

---

# 120. SEED DATA

Seed hanya untuk:

```text
roles
permissions
system policies
supported platforms
connector capabilities
metric definitions
```

bukan production business truth.

---

# 121. BACKUP

Database backup harus mencakup:

```text
schema
data
configuration metadata
```

Critical event data harus dapat dipulihkan.

---

# 122. RESTORE TEST

Backup dianggap valid hanya jika:

```text
BACKUP
 ↓
RESTORE
 ↓
VALIDATE
 ↓
APPLICATION READ
```

berhasil.

---

# 123. DATA MIGRATION SAFETY

Migration harus:

```text
versioned
audited
tested
observable
```

Destructive migration:

```text
BLOCKED BY DEFAULT
```

---

# 124. DATA ACCESS MODEL

```text
MODULE
 ↓
REPOSITORY
 ↓
OWNED SCHEMA
```

Tidak:

```text
MODULE
 ↓
GLOBAL DB CLIENT
 ↓
ANY TABLE
```

---

# 125. REPOSITORY OWNERSHIP

Contoh:

```text
module_19/
 ├── domain/
 ├── application/
 ├── infrastructure/
 │    └── repositories/
 └── contracts/
```

Repository hanya mengetahui:

```text
module_19.*
```

---

# 126. CROSS-MODULE READ

Jika Module 10 membutuhkan:

```text
confirmed_revenue
```

maka:

```text
Module 10
 ↓
Module 19 public query
```

atau:

```text
Module 19
 ↓
BusinessTruthPublished
 ↓
Module 10 projection
```

---

# 127. CROSS-MODULE WRITE

Tidak diperbolehkan:

```text
Module 10
→ INSERT module_19.revenues
```

Harus:

```text
Module 19 API
```

---

# 128. DATA CONTRACT

Setiap public data contract minimal memiliki:

```text
id
type
version
schema
owner
status
```

---

# 129. CANONICAL ENTITY RULE

Satu concept memiliki:

```text
ONE OWNER
```

Contoh:

```text
Creator
→ Module 06

Content
→ Module 07

Workflow
→ Module 13

Policy
→ Module 16

Connector
→ Module 17

Attribution
→ Module 19
```

---

# 130. DUPLICATION RULE

Duplikasi data diperbolehkan jika:

```text
READ MODEL
CACHE
ANALYTICS PROJECTION
```

tetapi harus jelas:

```text
source_of_truth
```

---

# 131. SNAPSHOT RULE

Snapshot boleh menyimpan:

```text
metric value
```

untuk historical reproducibility.

Snapshot bukan pengganti source data.

---

# 132. DATA MODEL FOR RECOMMENDATION

Recommendation menyimpan:

```text
recommendation_id
entity_id
score
reason
model_version
confidence
```

Tetapi tidak menyalin seluruh:

```text
creator
product
content
```

entity.

---

# 133. DATA MODEL FOR EXECUTION

Execution menyimpan:

```text
workflow_id
task_id
action
target_reference
connector
status
result
```

Business result tetap berasal dari measurement layer.

---

# 134. DATA MODEL FOR ATTRIBUTION

Attribution menyimpan:

```text
conversion
touchpoint
model
credit
confidence
evidence
window
version
```

Tidak menyimpan ulang seluruh raw event.

---

# 135. DATA MODEL FOR RECONCILIATION

Reconciliation menyimpan:

```text
source_a
source_b
metric
period
value_a
value_b
variance
status
reason
```

Source tetap immutable.

---

# 136. DATA MODEL FOR METRICS

Metric definition:

```text
WHAT
```

Metric result:

```text
VALUE
```

Metric lineage:

```text
WHY
```

---

# 137. DATA MODEL FOR AUDIT

Audit harus dapat menjawab:

```text
WHO
WHAT
WHEN
WHY
WHICH RESOURCE
BEFORE
AFTER
```

---

# 138. DATA MODEL FOR TENANCY

Minimum business scope:

```text
organization_id
workspace_id
```

Jika account-specific:

```text
account_id
```

Jika user-specific:

```text
user_id
```

---

# 139. TENANT INDEX RULE

Tenant-scoped tables harus memiliki index berdasarkan:

```text
workspace_id
```

atau:

```text
organization_id
```

sesuai query pattern.

---

# 140. ROW-LEVEL SECURITY

MVP dapat menambahkan PostgreSQL RLS untuk defense-in-depth pada tabel sensitif.

Namun:

```text
RLS
≠
pengganti application authorization
```

---

# 141. DATA ACCESS LAYERS

```text
PUBLIC
 ↓
APPLICATION
 ↓
DOMAIN
 ↓
REPOSITORY
 ↓
DATABASE
```

Tidak ada bypass.

---

# 142. DATA LIFECYCLE

```text
CREATE
 ↓
VALIDATE
 ↓
ACTIVE
 ↓
UPDATED
 ↓
ARCHIVED
```

Untuk immutable event:

```text
CREATE
 ↓
PROCESS
 ↓
ARCHIVE
```

---

# 143. FINANCIAL DATA LIFECYCLE

```text
ESTIMATED
 ↓
VALIDATED
 ↓
CONFIRMED
 ↓
SETTLED
 ↓
FINAL
```

Tidak semua entity harus melewati semua state.

---

# 144. ORDER DATA LIFECYCLE

```text
RECEIVED
 ↓
VALIDATED
 ↓
CONFIRMED
 ↓
CANCELLED / REFUNDED
 ↓
FINAL
```

---

# 145. COMMISSION DATA LIFECYCLE

```text
ESTIMATED
 ↓
ACTUAL
 ↓
APPROVED
 ↓
PAYABLE
 ↓
PAID
```

atau:

```text
REVERSED
```

---

# 146. SCHEMA NAMING

Format:

```text
snake_case
```

Table:

```text
plural_noun
```

Contoh:

```text
creators
content_items
workflow_runs
audit_events
```

---

# 147. COLUMN NAMING

Gunakan:

```text
snake_case
```

Contoh:

```text
created_at
external_account_id
calculation_version
```

---

# 148. STATUS NAMING

Status menggunakan uppercase semantic values:

```text
ACTIVE
PENDING
FAILED
CONFIRMED
CANCELLED
```

Database representation dapat berupa lowercase string sesuai implementation convention, tetapi semantic enum harus konsisten.

---

# 149. DATABASE SECURITY

Database credential:

```text
secret manager
```

bukan:

```text
source code
```

Production access:

```text
least privilege
```

---

# 150. DATABASE OBSERVABILITY

Monitor:

```text
connection pool
query latency
slow query
deadlock
lock wait
storage
CPU
IO
replication/backup
```

---

# 151. DATA PERFORMANCE

Critical indexes ditentukan berdasarkan:

```text
real query pattern
```

bukan:

```text
index every column
```

---

# 152. N+1 PREVENTION

Application harus mencegah:

```text
1 query parent
+
N query children
```

secara tidak terkendali.

Gunakan:

```text
batch
join within owned module
projection
cache
```

---

# 153. PAGINATION

Large collections wajib menggunakan:

```text
cursor pagination
```

untuk high-volume data.

Offset pagination hanya untuk:

```text
small admin datasets
```

jika sesuai.

---

# 154. HIGH-VOLUME EVENTS

Raw events dapat mencapai volume besar.

Karena itu:

```text
partitioning
retention
archive
batch insert
```

dapat digunakan setelah workload terbukti membutuhkannya.

---

# 155. DATABASE SCALING PATH

Initial:

```text
ONE POSTGRES
```

Future:

```text
READ REPLICA
 ↓
ANALYTICS STORE
 ↓
EVENT STORE
 ↓
MODULE-SPECIFIC DATABASE
```

hanya berdasarkan actual bottleneck.

---

# 156. FUTURE EXTRACTION

Jika Module 19 suatu saat menjadi service:

```text
module_19 schema
```

sudah memiliki boundary sehingga migration lebih mudah.

Begitu juga:

```text
module_14
module_17
module_18
```

---

# 157. ER HIGH-LEVEL

```text
ORGANIZATION
    │
    └── WORKSPACE
          │
          ├── USERS
          ├── ACCOUNTS
          ├── CREATORS
          ├── PRODUCTS
          ├── OPPORTUNITIES
          ├── CONTENT
          ├── EXPERIMENTS
          ├── RECOMMENDATIONS
          └── WORKFLOWS

CREATOR
   ↓
CONTENT
   ↓
PUBLICATION
   ↓
EVENT
   ↓
CLICK
   ↓
ORDER
   ↓
CONVERSION
   ↓
ATTRIBUTION
   ↓
REVENUE
   ↓
COMMISSION
   ↓
BUSINESS TRUTH
```

---

# 158. CORE ENTITY RELATIONSHIP

```text
Organization
   1
   ↓
Workspace
   1
   ├── Creator
   ├── Product
   ├── Content
   ├── Campaign
   ├── Experiment
   ├── Recommendation
   └── Workflow
```

---

# 159. PERFORMANCE RELATIONSHIP

```text
Creator
   ↓
Content
   ↓
Publication
   ↓
Performance Event
   ↓
Click
   ↓
Order
```

---

# 160. ATTRIBUTION RELATIONSHIP

```text
Order
 ↓
Conversion
 ↓
Touchpoint
 ↓
Attribution
 ↓
Credit
```

---

# 161. REVENUE RELATIONSHIP

```text
Conversion
   ├── Revenue
   └── Commission
```

Revenue dan commission sengaja dipisahkan.

---

# 162. EXPERIMENT RELATIONSHIP

```text
Experiment
   ↓
Variant
   ↓
Exposure
   ↓
Outcome
   ↓
Metric
```

---

# 163. RECOMMENDATION RELATIONSHIP

```text
Recommendation
   ↓
Recommendation Item
   ↓
Entity
   ↓
Execution
   ↓
Business Outcome
```

---

# 164. EXECUTION RELATIONSHIP

```text
Workflow
   ↓
Step
   ↓
Workflow Run
   ↓
Task
   ↓
Task Run
```

---

# 165. DATA LINEAGE RELATIONSHIP

```text
External Source
      ↓
Raw Event
      ↓
Canonical Event
      ↓
Measurement Event
      ↓
Conversion
      ↓
Attribution
      ↓
Revenue
      ↓
Metric
      ↓
Business Truth
```

---

# 166. DATABASE AUTHORITY MAP

| Data | Owner |
|---|---|
| Organization | Module 15 |
| User | Module 15 |
| Platform Account | Module 15 |
| Policy | Module 16 |
| Connector | Module 17 |
| Raw Event | Module 14 |
| Demand Signal | Module 04 |
| Opportunity | Module 05 |
| Creator | Module 06 |
| Content | Module 07 |
| Publication | Module 08 |
| Performance | Module 09 |
| Revenue Intelligence | Module 10 |
| Experiment | Module 11 |
| Recommendation | Module 12 |
| Workflow/Task | Module 13 |
| Operational Telemetry | Module 18 |
| Attribution | Module 19 |
| Business Truth | Module 19 |

---

# 167. DATA OWNERSHIP RULE

> **The module that owns the business meaning owns the data.**

Bukan:

```text
module yang pertama kali membutuhkan data
```

---

# 168. CROSS-MODULE DATA RULE

Jika Module A membutuhkan data Module B:

```text
A
 ↓
B CONTRACT
```

atau:

```text
B EVENT
 ↓
A PROJECTION
```

Tidak:

```text
A
 ↓
B TABLE
```

---

# 169. DATA DUPLICATION RULE

Allowed:

```text
projection
snapshot
cache
analytics
```

Not allowed:

```text
second source of truth
```

---

# 170. SOURCE OF TRUTH

Canonical authority:

```text
Identity
→ Module 15

Policy
→ Module 16

Connector state
→ Module 17

Raw Event
→ Module 14

Attribution
→ Module 19

Business Truth
→ Module 19
```

---

# 171. DATABASE ARCHITECTURE LOCK

```text
ONE PRIMARY POSTGRESQL
        ↓
MODULE-OWNED SCHEMAS
        ↓
MODULE-OWNED TABLES
        ↓
NO CROSS-MODULE TABLE ACCESS
        ↓
PUBLIC CONTRACT / EVENT
        ↓
READ MODEL WHEN NEEDED
```

---

# 172. MVP DATABASE SCOPE

Build:

```text
✓ PostgreSQL
✓ Module-owned schemas
✓ Identity tables
✓ Account tables
✓ Creator tables
✓ Product references
✓ Content tables
✓ Publication tables
✓ Opportunity tables
✓ Experiment tables
✓ Recommendation tables
✓ Workflow tables
✓ Task tables
✓ Event tables
✓ Audit tables
✓ Attribution tables
✓ Conversion tables
✓ Revenue tables
✓ Commission tables
✓ Reconciliation tables
✓ Metric definition tables
✓ Business truth snapshots
✓ Outbox
✓ Idempotency
✓ Migration system
✓ Backup
✓ Tenant isolation
```

---

# 173. NOT MVP

```text
✗ Multi-database per module
✗ Distributed database
✗ Global data warehouse
✗ Blockchain storage
✗ Cross-region active-active database
✗ Fully autonomous schema generation
✗ Complex event-sourcing for every domain
✗ Real-time OLAP cluster
```

---

# 174. ACCEPTANCE CRITERIA

```text
AC-21-01
Setiap major domain memiliki data owner.

AC-21-02
Organization dan Workspace dapat dimodelkan.

AC-21-03
User dan Membership dapat dimodelkan.

AC-21-04
Platform Account dapat dimodelkan.

AC-21-05
Connector state dapat disimpan.

AC-21-06
Raw event dapat disimpan secara immutable.

AC-21-07
Canonical event dapat disimpan.

AC-21-08
Event deduplication dapat dilakukan.

AC-21-09
Dead-letter event dapat disimpan.

AC-21-10
Event replay dapat dicatat.

AC-21-11
Opportunity dapat disimpan.

AC-21-12
Creator dapat disimpan.

AC-21-13
Creator fit score dapat disimpan.

AC-21-14
Content dapat disimpan.

AC-21-15
Content version dapat disimpan.

AC-21-16
Publication dapat ditelusuri ke content.

AC-21-17
Performance observation dapat disimpan.

AC-21-18
Experiment dapat disimpan.

AC-21-19
Experiment variant dapat disimpan.

AC-21-20
Experiment exposure dapat disimpan.

AC-21-21
Recommendation dapat disimpan.

AC-21-22
Recommendation feedback dapat disimpan.

AC-21-23
Workflow dapat disimpan.

AC-21-24
Task dapat disimpan.

AC-21-25
Task run dapat ditelusuri.

AC-21-26
Approval dapat disimpan.

AC-21-27
Policy decision dapat diaudit.

AC-21-28
Audit event dapat disimpan.

AC-21-29
Conversion dapat disimpan.

AC-21-30
Attribution dapat disimpan.

AC-21-31
Attribution credit dapat dihitung.

AC-21-32
Revenue dapat dipisahkan dari commission.

AC-21-33
Estimated dan actual commission dapat dipisahkan.

AC-21-34
Reconciliation record dapat disimpan.

AC-21-35
Variance dapat disimpan.

AC-21-36
Metric definition dapat disimpan.

AC-21-37
Metric calculation version dapat disimpan.

AC-21-38
Business truth snapshot dapat disimpan.

AC-21-39
Cross-module table ownership dapat dicegah secara architecture.

AC-21-40
External ID tidak menjadi primary internal ID.

AC-21-41
Critical financial amount menggunakan exact decimal type.

AC-21-42
Timestamp disimpan secara timezone-aware.

AC-21-43
Critical operations memiliki idempotency key.

AC-21-44
Critical events dapat menggunakan outbox pattern.

AC-21-45
Tenant-scoped data memiliki tenant boundary.

AC-21-46
PII tidak tersebar ke seluruh business table.

AC-21-47
OAuth token tidak disimpan sebagai plaintext business data.

AC-21-48
Immutable event tidak dapat di-overwrite secara normal.

AC-21-49
Schema migration dapat dilakukan secara versioned.

AC-21-50
Database architecture siap menjadi input Document 22 API Contract.
```

---

# 175. DEFINITION OF DONE

Document 21 selesai apabila:

```text
MODULE
 ↓
ENTITY
 ↓
TABLE
 ↓
RELATIONSHIP
 ↓
OWNERSHIP
 ↓
INDEX
 ↓
CONSTRAINT
 ↓
TENANT SCOPE
 ↓
AUDIT
 ↓
MIGRATION
```

sudah memiliki definisi yang konsisten.

---

# 176. FINAL DATA ARCHITECTURE

```text
                       AFFILIATE OS
                            │
                       POSTGRESQL
                            │
      ┌─────────────────────┼─────────────────────┐
      │                     │                     │
   IDENTITY              DOMAIN                DATA
      │                     │                     │
  module_15          module_04–13          module_14
  module_16          module_19             module_18
  module_17
      │                     │                     │
      └─────────────────────┼─────────────────────┘
                            ↓
                     READ / ANALYTICS
                            ↓
                       EXPERIENCE
```

---

# 177. FINAL DATA FLOW

```text
EXTERNAL PLATFORM
        ↓
RAW EVENT
        ↓
CANONICAL EVENT
        ↓
DOMAIN DATA
        ↓
MEASUREMENT
        ↓
ATTRIBUTION
        ↓
REVENUE
        ↓
BUSINESS TRUTH
        ↓
READ MODEL
        ↓
DASHBOARD
```

---

# 178. ARCHITECTURE LOCK

## MODULE 21 — AFFILIATE OS DATA MODEL & DATABASE SCHEMA v1.0

Status:

```text
DATABASE STRATEGY       = LOCKED
ENTITY MODEL            = LOCKED
DATA OWNERSHIP          = LOCKED
TENANT MODEL            = LOCKED
IDENTIFIER STRATEGY     = LOCKED
EVENT MODEL             = LOCKED
FINANCIAL MODEL         = LOCKED
AUDIT MODEL             = LOCKED
METRIC MODEL            = LOCKED
MIGRATION STRATEGY      = LOCKED
MVP DATABASE SCOPE      = LOCKED
```

Final principle:

> **Database Affiliate OS bukan tempat semua module mengambil data sesuka hati. Database adalah kumpulan domain-owned data boundaries. Setiap module memiliki authority atas data yang dimilikinya, sedangkan module lain berkomunikasi melalui contract, event, atau read projection.**

```text
01–19
   ↓
20 SYSTEM ARCHITECTURE
   ↓
21 DATA MODEL
   ↓
22 API + INTEGRATION CONTRACT
   ↓
23 UX/UI ARCHITECTURE
   ↓
24 IMPLEMENTATION BLUEPRINT
   ↓
BUILD
```

**Doc 21 LOCKED. Tidak perlu menambah module/domain baru hanya untuk melengkapi data architecture MVP.**