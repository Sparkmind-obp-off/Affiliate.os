# 17 — AFFILIATE PLATFORM & CONNECTOR ABSTRACTION LAYER v1.0

**Product:** Affiliate OS  
**Module:** 17  
**Version:** v1.0  
**Status:** Product Architecture

---

# 1. PURPOSE

Affiliate Platform & Connector Abstraction Layer adalah:

> **integration boundary yang menghubungkan core Affiliate OS dengan external platforms, providers, APIs, storage systems, notification systems, dan services tanpa membuat core system bergantung langsung pada implementasi provider tertentu.**

Core principle:

```text
AFFILIATE OS CORE
        ↓
CONNECTOR CONTRACT
        ↓
PLATFORM ADAPTER
        ↓
EXTERNAL PLATFORM
```

---

# 2. CORE PROBLEM

Tanpa abstraction layer:

```text
CORE
 ↓
TikTok API
 ↓
TikTok-specific logic
 ↓
TikTok-specific response
```

Kemudian ketika ingin menambah:

```text
Instagram
YouTube
Shopee
Tokopedia
AI Provider B
Storage Provider B
```

core system menjadi penuh dengan:

```text
IF TIKTOK
IF SHOPEE
IF YOUTUBE
IF PROVIDER_A
IF PROVIDER_B
```

Ini harus dihindari.

---

# 3. CORE POSITIONING

Module 17 bukan:

```text
API CLIENT COLLECTION
```

Bukan:

```text
SDK WRAPPER
```

Bukan:

```text
HTTP REQUEST HELPER
```

Tetapi:

```text
PLATFORM ABSTRACTION
+
CAPABILITY CONTRACT
+
CONNECTOR LIFECYCLE
+
AUTHORIZATION BOUNDARY
+
ERROR NORMALIZATION
+
RATE LIMIT CONTROL
+
WEBHOOK ADAPTER
+
HEALTH MANAGEMENT
```

---

# 4. CORE ARCHITECTURE

```text
                    AFFILIATE OS CORE
                           │
                           ▼
                ┌────────────────────┐
                │ CAPABILITY LAYER   │
                └─────────┬──────────┘
                          │
                ┌─────────▼──────────┐
                │ CONNECTOR CONTRACT │
                └─────────┬──────────┘
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
        PLATFORM       PROVIDER      SERVICE
        ADAPTER        ADAPTER       ADAPTER
             │            │            │
             ▼            ▼            ▼
          TikTok       OpenAI/etc    Storage
             │
             ▼
       External API
```

---

# 5. ARCHITECTURAL BOUNDARY

Core system hanya mengenal:

```text
Capability
Connector
Request
Response
Error
Connection
Credential
Health
```

Core system **tidak boleh** bergantung langsung pada:

```text
TikTokHttpClient
TikTokSpecificResponse
TikTokErrorCode
TikTokEndpoint
```

di domain layer.

---

# 6. GOLDEN RULE

> **External platform implementation may depend on Affiliate OS contracts, tetapi Affiliate OS core tidak boleh bergantung pada external platform implementation.**

```text
CORE
 ↓
INTERFACE
 ↑
ADAPTER
 ↓
EXTERNAL API
```

---

# 7. CONNECTOR TYPES

Minimal:

```text
PLATFORM CONNECTOR
AI PROVIDER CONNECTOR
STORAGE CONNECTOR
NOTIFICATION CONNECTOR
ANALYTICS CONNECTOR
```

---

# 8. PLATFORM CONNECTOR

Contoh:

```text
TikTok Connector
TikTok Shop Connector
```

Future:

```text
YouTube Connector
Instagram Connector
Shopee Connector
Tokopedia Connector
```

---

# 9. AI PROVIDER CONNECTOR

Contoh:

```text
AIProvider
```

Capabilities:

```text
generate_text
generate_script
generate_caption
analyze_content
classify_content
generate_metadata
```

Core tidak perlu mengetahui apakah provider menggunakan:

```text
Provider A
Provider B
Provider C
```

---

# 10. STORAGE CONNECTOR

Contoh:

```text
StorageConnector
```

Capabilities:

```text
upload
download
delete
exists
get_metadata
generate_signed_url
```

Provider dapat berupa:

```text
Object Storage A
Object Storage B
Cloud Storage
```

---

# 11. NOTIFICATION CONNECTOR

```text
NotificationConnector
```

Capabilities:

```text
send_email
send_push
send_webhook
send_in_app
```

---

# 12. CONNECTOR CONTRACT

Setiap connector minimal memiliki:

```text
connector_id
provider
type
version
capabilities
connection
health
execute()
handleWebhook()
validate()
```

---

# 13. CONNECTOR INTERFACE

Logical contract:

```text
Connector
 ├── getMetadata()
 ├── getCapabilities()
 ├── validateConnection()
 ├── execute()
 ├── handleWebhook()
 ├── healthCheck()
 └── disconnect()
```

---

# 14. CAPABILITY MODEL

Platform tidak diasumsikan memiliki semua capability.

Contoh:

```text
TikTok
 ├── content.publish
 ├── content.upload
 ├── content.status
 └── account.profile

TikTok Shop
 ├── product.read
 ├── order.read
 ├── affiliate.read
 └── finance.read
```

Capability harus didiscover/ditentukan melalui registry, bukan diasumsikan.

---

# 15. CAPABILITY REGISTRY

```text
CapabilityRegistry
```

Fields:

```text
capability_id
connector_type
provider
version
required_permissions
required_scopes
risk_level
supported
status
```

---

# 16. CAPABILITY DISCOVERY

Core dapat bertanya:

```text
Can this connector:
    publish content?
```

Response:

```text
SUPPORTED
```

atau:

```text
NOT_SUPPORTED
```

---

# 17. CAPABILITY ≠ PERMISSION

Penting:

```text
CAPABILITY
```

berarti:

> connector secara teknis mendukung action.

Sedangkan:

```text
PERMISSION
```

berarti:

> user/account/policy boleh melakukan action tersebut.

Jadi:

```text
CAPABILITY
+
PERMISSION
+
SCOPE
+
POLICY
=
EXECUTABLE
```

---

# 18. EXECUTION CONTRACT

Flow:

```text
REQUEST
 ↓
CAPABILITY CHECK
 ↓
IDENTITY
 ↓
PERMISSION
 ↓
POLICY
 ↓
EXTERNAL SCOPE
 ↓
CONNECTOR
 ↓
EXTERNAL API
```

---

# 19. CONNECTOR REQUEST

Canonical request:

```text
ConnectorRequest
```

Fields:

```text
request_id
tenant_id
workspace_id
account_id
connector_id
capability
resource
payload
idempotency_key
timeout
correlation_id
```

---

# 20. CONNECTOR RESPONSE

Canonical response:

```text
ConnectorResponse
```

Fields:

```text
request_id
status
provider_request_id
resource_id
data
warnings
metadata
executed_at
```

---

# 21. ERROR NORMALIZATION

External provider memiliki error berbeda-beda.

Contoh:

```text
TikTok:
429
500
scope_missing
token_invalid
```

Provider lain:

```text
401
403
429
timeout
```

Core tidak boleh bergantung pada format tersebut.

---

# 22. CANONICAL ERROR MODEL

```text
ConnectorError
```

Categories:

```text
AUTHENTICATION_ERROR
AUTHORIZATION_ERROR
SCOPE_ERROR
VALIDATION_ERROR
NOT_FOUND
CONFLICT
RATE_LIMITED
TIMEOUT
NETWORK_ERROR
PLATFORM_ERROR
PROVIDER_ERROR
TEMPORARY_ERROR
UNKNOWN_ERROR
```

---

# 23. ERROR MAPPING

Contoh:

```text
External 429
 ↓
RATE_LIMITED
```

```text
External 401
 ↓
AUTHENTICATION_ERROR
```

```text
External 403
 ↓
AUTHORIZATION_ERROR
```

```text
External 5xx
 ↓
TEMPORARY_ERROR
```

---

# 24. ERROR → MODULE 13

Module 13 menerima:

```text
Canonical ConnectorError
```

kemudian menentukan:

```text
RETRY
QUEUE
PAUSE
FAIL
RECONNECT
ESCALATE
```

---

# 25. ERROR → MODULE 16

Sensitive errors dapat dikirim ke policy/security:

```text
SCOPE_ERROR
AUTHENTICATION_ERROR
ACCOUNT_SUSPENDED
SECURITY_ERROR
```

Flow:

```text
Connector
 ↓
Error
 ↓
Policy/Security
 ↓
Controlled Decision
```

---

# 26. AUTHORIZATION BOUNDARY

Connector tidak boleh menganggap:

```text
CONNECTED
```

berarti:

```text
ALL CAPABILITIES AVAILABLE
```

Authorization harus dicek terhadap capability yang diminta.

TikTok secara resmi menyatakan bahwa approval scope pada app saja belum memberikan akses ke data user; user juga harus mengotorisasi scope tersebut.

---

# 27. SCOPE MAPPING

```text
Capability
      ↓
Required Scope
      ↓
Granted Scope
      ↓
PASS / FAIL
```

Contoh:

```text
content.publish
        ↓
video.publish
        ↓
granted?
```

Untuk TikTok Content Posting API, Direct Post membutuhkan scope `video.publish` dan authorization user terkait.

---

# 28. TIKTOK CONNECTOR

Logical structure:

```text
TikTokConnector
 ├── AuthAdapter
 ├── ContentAdapter
 ├── AccountAdapter
 ├── WebhookAdapter
 ├── ScopeMapper
 ├── ErrorMapper
 ├── RateLimitManager
 └── HealthChecker
```

---

# 29. TIKTOK CONTENT CAPABILITIES

Minimal:

```text
content.publish
content.upload
content.status
content.webhook
```

TikTok Content Posting API saat ini mendukung Direct Post dan Upload flow; status dapat dipantau melalui polling maupun Content Posting webhooks.

---

# 30. TIKTOK DIRECT POST ADAPTER

```text
Creator Authorization
 ↓
Creator Info
 ↓
Validate Content
 ↓
Initialize Post
 ↓
Transfer Media
 ↓
Publish
 ↓
Track Status
```

Flow tersebut mengikuti struktur Direct Post API TikTok.

---

# 31. TIKTOK UPLOAD ADAPTER

```text
Prepare Content
 ↓
Initialize Upload
 ↓
Transfer
 ↓
TikTok Inbox
 ↓
Creator Review
 ↓
Creator Post
 ↓
Track Result
```

Upload flow harus diperlakukan berbeda dari Direct Post karena creator tetap memiliki tahap review/edit/posting di TikTok.

---

# 32. TIKTOK WEBHOOK ADAPTER

```text
TikTok Webhook
 ↓
Webhook Adapter
 ↓
Schema Validation
 ↓
Signature / Source Validation
 ↓
Deduplication
 ↓
Canonical Event
 ↓
Module 14
```

TikTok webhook delivery bersifat at-least-once, sehingga adapter wajib menangani duplicate event secara idempotent.

---

# 33. WEBHOOK CANONICAL EVENT

External:

```text
TikTok Event
```

diubah menjadi:

```text
PlatformEvent
```

Fields:

```text
event_id
provider
connector_id
event_type
account_id
resource_id
occurred_at
payload
schema_version
correlation_id
```

---

# 34. TIKTOK DEAUTH EVENT

Jika TikTok mengirim:

```text
authorization.removed
```

connector harus:

```text
REVOKE LOCAL ACCESS
 ↓
UPDATE CONNECTION
 ↓
STOP RELATED EXECUTION
 ↓
AUDIT
 ↓
NOTIFY
```

TikTok mendokumentasikan bahwa event tersebut menandakan user telah mencabut authorization dan token terkait sudah direvoke.

---

# 35. TIKTOK SHOP CONNECTOR

Structure:

```text
TikTokShopConnector
 ├── AuthAdapter
 ├── SellerAdapter
 ├── CreatorAdapter
 ├── ProductAdapter
 ├── OrderAdapter
 ├── AffiliateAdapter
 ├── FinanceAdapter
 ├── WebhookAdapter
 ├── ScopeMapper
 └── ErrorMapper
```

TikTok Shop API menyediakan akses programmatic ke area seperti products, orders, fulfillment, finance, dan affiliate, dengan authorization/scope yang bergantung pada use case dan user type.

---

# 36. TIKTOK SHOP AUTHORIZATION MODEL

Connector harus membedakan:

```text
SELLER
CREATOR
PARTNER
```

karena authorization/data boundary berbeda.

TikTok Shop mendokumentasikan `user_type` dan authorization path yang berbeda untuk seller, creator, dan partner.

---

# 37. ENTITY BOUNDARY

TikTok Shop endpoint dapat memiliki entity/data boundary berbeda.

Connector harus memetakan:

```text
seller
shop
account
creator
asset
```

beserta authorization type yang sesuai.

Entity tag TikTok Shop membantu menentukan data boundary dan jenis authorization, tetapi **tidak menggantikan scope check**.

---

# 38. SHOP SCOPE MODEL

```text
Capability
 ↓
Entity
 ↓
Required Scope
 ↓
Granted Scope
 ↓
Policy
 ↓
Execute
```

---

# 39. AI PROVIDER CONNECTOR

```text
AIProviderConnector
```

Capabilities:

```text
text.generate
script.generate
caption.generate
content.analyze
content.classify
metadata.generate
```

Core tidak boleh memiliki:

```text
if provider == X
```

di business logic.

---

# 40. AI PROVIDER REQUEST

```text
AIRequest
```

Fields:

```text
model
task
input
constraints
max_tokens
max_cost
temperature
timeout
metadata
```

---

# 41. AI PROVIDER RESPONSE

```text
AIResponse
```

Fields:

```text
output
usage
cost
provider_request_id
finish_reason
latency
metadata
```

---

# 42. AI FAILURE NORMALIZATION

```text
MODEL_TIMEOUT
RATE_LIMITED
INVALID_REQUEST
CONTENT_FILTERED
PROVIDER_ERROR
TOKEN_LIMIT
NETWORK_ERROR
```

---

# 43. AI FALLBACK

Fallback tidak otomatis berarti:

```text
TRY EVERYTHING
```

Flow:

```text
Primary Provider
 ↓
Failure
 ↓
Policy Check
 ↓
Fallback Allowed?
 ↓
YES → Secondary Provider
NO  → FAIL
```

---

# 44. STORAGE CONNECTOR

Canonical:

```text
StorageConnector
```

Operations:

```text
put
get
delete
exists
metadata
signedUrl
```

---

# 45. STORAGE ABSTRACTION

Core menyimpan:

```text
object_key
storage_reference
metadata
```

bukan dependency langsung pada:

```text
bucket implementation
```

---

# 46. NOTIFICATION CONNECTOR

```text
NotificationConnector
```

Capabilities:

```text
email
push
in_app
webhook
```

---

# 47. CONNECTOR HEALTH

Setiap connector memiliki:

```text
HEALTHY
DEGRADED
AUTH_REQUIRED
RATE_LIMITED
UNAVAILABLE
DISABLED
UNKNOWN
```

---

# 48. HEALTH CHECK

```text
Connector
 ↓
Health Check
 ↓
Provider
 ↓
Response
 ↓
Health State
```

Health check tidak boleh melakukan destructive action.

---

# 49. CONNECTOR STATE MACHINE

```text
REGISTERED
 ↓
CONFIGURED
 ↓
CONNECTED
 ↓
HEALTHY
 ↓
DEGRADED
 ↓
RECOVERY
 ↓
HEALTHY
```

Alternative terminal states:

```text
DISABLED
REVOKED
REMOVED
```

---

# 50. CONNECTION STATE

Module 15 memiliki account connection state.

Module 17 harus menggunakannya:

```text
Module 15
    ↓
Connection Context
    ↓
Module 17
```

Module 17 tidak boleh membuat identity/account system sendiri.

---

# 51. CREDENTIAL BOUNDARY

Connector hanya menerima:

```text
Credential Reference
```

bukan raw secret jika tidak diperlukan.

```text
Connector
 ↓
Credential Manager
 ↓
Secret
```

Secret tetap dikontrol oleh security layer.

---

# 52. MODULE 16 INTEGRATION

Sebelum connector execution:

```text
Connector Request
 ↓
Module 16
 ↓
Authorization
 ↓
Policy
 ↓
Scope
 ↓
Risk
 ↓
Connector
```

Connector tidak boleh bypass Module 16.

---

# 53. RATE LIMIT MANAGER

Setiap connector memiliki:

```text
RateLimitManager
```

yang memahami:

```text
provider
account
endpoint
capability
quota
window
retry_after
```

---

# 54. RATE LIMIT FLOW

```text
REQUEST
 ↓
CHECK BUDGET
 ↓
AVAILABLE?
 ├── YES → EXECUTE
 └── NO  → QUEUE / RATE_LIMITED
```

---

# 55. PROVIDER-SPECIFIC RATE LIMIT

Rate limit harus disimpan sebagai metadata connector.

Contoh:

```text
TikTok capability:
content.publish

Rate:
provider-defined
```

Jangan hardcode angka platform ke domain core.

Dokumentasi TikTok, misalnya, saat ini mencantumkan rate limit tertentu pada endpoint Direct Post; angka tersebut harus dianggap sebagai provider metadata yang dapat berubah, bukan aturan domain Affiliate OS.

---

# 56. RETRY POLICY

Retry hanya untuk error:

```text
TRANSIENT
TIMEOUT
NETWORK
RATE_LIMITED
```

Tidak retry otomatis untuk:

```text
AUTHORIZATION_ERROR
SCOPE_ERROR
VALIDATION_ERROR
POLICY_DENIED
ACCOUNT_SUSPENDED
```

---

# 57. EXPONENTIAL BACKOFF

```text
retry 1
 ↓
short delay

retry 2
 ↓
longer delay

retry 3
 ↓
longer delay
```

Dengan:

```text
max_attempts
max_delay
jitter
```

---

# 58. CIRCUIT BREAKER

Jika provider gagal berulang:

```text
CLOSED
 ↓
FAILURES
 ↓
OPEN
 ↓
COOLDOWN
 ↓
HALF_OPEN
 ↓
SUCCESS → CLOSED
FAILURE → OPEN
```

---

# 59. CONNECTOR FALLBACK

Fallback hanya boleh terjadi jika:

```text
capability equivalent
+
policy allows
+
credential valid
+
provider available
```

Contoh:

```text
AI Provider A
 ↓
failure
 ↓
AI Provider B
```

tetapi:

```text
TikTok publish
```

tidak boleh otomatis dipindahkan ke platform lain karena itu bukan equivalent capability.

---

# 60. API VERSIONING

Connector harus mendukung:

```text
provider API version
```

Contoh:

```text
TikTok v2
TikTok Shop v202309
```

Core tetap:

```text
platform-neutral
```

---

# 61. VERSION ADAPTER

```text
Core Contract
      ↓
Version Adapter
      ↓
Provider API Version
```

Jika provider berubah:

```text
v1 → v2
```

yang berubah terutama:

```text
Adapter
```

bukan seluruh core.

---

# 62. SCHEMA MAPPING

External schema:

```text
ProviderObject
```

diubah menjadi:

```text
CanonicalObject
```

Contoh:

```text
TikTok Post
 ↓
Canonical ContentPublication
```

---

# 63. CANONICAL CONTENT PUBLICATION

```text
ContentPublication
```

Fields:

```text
id
account_id
platform
content_id
status
published_at
url
provider_reference
metadata
```

---

# 64. PROVIDER RAW DATA

Raw response tetap boleh disimpan di Module 14:

```text
RAW
 ↓
NORMALIZED
 ↓
CANONICAL
```

Tetapi core business logic menggunakan:

```text
CANONICAL
```

bukan raw provider object.

---

# 65. CONNECTOR OBSERVABILITY

Metrics:

```text
request_count
success_count
failure_count
latency
rate_limit_count
auth_error_count
scope_error_count
retry_count
circuit_breaker_state
```

---

# 66. CORRELATION

Semua request harus membawa:

```text
request_id
correlation_id
tenant_id
workspace_id
account_id
connector_id
```

Agar dapat ditelusuri:

```text
User
 ↓
Workflow
 ↓
Task
 ↓
Policy
 ↓
Connector
 ↓
External API
 ↓
Webhook
 ↓
Event
```

---

# 67. IDEMPOTENCY

Sensitive connector action wajib mendukung:

```text
idempotency_key
```

Jika request yang sama dikirim ulang:

```text
SAME EFFECT
```

bukan:

```text
DUPLICATE EFFECT
```

---

# 68. CONNECTOR REQUEST DEDUPLICATION

```text
idempotency_key
+
connector_id
+
account_id
```

dapat digunakan untuk mendeteksi duplicate execution.

---

# 69. WEBHOOK → CONNECTOR → MODULE 14

```text
External Platform
       ↓
Webhook
       ↓
Connector Adapter
       ↓
Validate
       ↓
Normalize
       ↓
Deduplicate
       ↓
Module 14
       ↓
Event Bus
```

---

# 70. CONNECTOR → MODULE 13

```text
Module 13
 ↓
Task
 ↓
Connector Capability
 ↓
Execution
 ↓
Result
 ↓
Task Result
```

---

# 71. CONNECTOR → MODULE 12

Module 12 menerima canonical intelligence data:

```text
Platform
 ↓
Canonical Event
 ↓
Performance Data
 ↓
Intelligence
```

Tidak perlu memahami raw provider API.

---

# 72. CONNECTOR → MODULE 15

Module 15 menyediakan:

```text
Connected Account
Credential Reference
Connection State
Granted Scope
```

Module 17 menggunakan context tersebut.

---

# 73. CONNECTOR → MODULE 16

Module 16 menyediakan:

```text
Authorization
Policy Decision
Risk Decision
Approval
Execution Permission
```

---

# 74. FULL REQUEST FLOW

```text
USER / AI / WORKFLOW
        ↓
MODULE 13
        ↓
MODULE 16
        ↓
CAPABILITY CHECK
        ↓
SCOPE CHECK
        ↓
CONNECTOR
        ↓
RATE LIMIT
        ↓
EXTERNAL API
        ↓
RESPONSE
        ↓
NORMALIZATION
        ↓
MODULE 14
        ↓
MODULE 12
```

---

# 75. CONNECTOR REGISTRY

```text
ConnectorRegistry
```

Fields:

```text
connector_id
provider
type
version
status
capabilities
health
configuration
```

---

# 76. CONNECTOR REGISTRATION

Connector harus melalui:

```text
REGISTER
 ↓
VALIDATE CONTRACT
 ↓
REGISTER CAPABILITIES
 ↓
CONFIGURE
 ↓
HEALTH CHECK
 ↓
ENABLE
```

---

# 77. CONNECTOR DISABLE

Jika connector bermasalah:

```text
DISABLE
```

harus menghentikan:

```text
NEW EXECUTION
```

tetapi tidak harus menghapus:

```text
HISTORICAL DATA
```

---

# 78. SANDBOX MODE

Connector sebaiknya memiliki:

```text
LIVE
SANDBOX
DRY_RUN
```

---

# 79. DRY RUN

Contoh:

```text
TikTok Publish
```

Dry run hanya:

```text
validate
authorize
policy check
connector mapping
```

tanpa:

```text
actual publish
```

---

# 80. CONTRACT TEST

Setiap connector wajib memiliki:

```text
Authentication Test
Capability Test
Request Mapping Test
Response Mapping Test
Error Mapping Test
Rate Limit Test
Webhook Test
Idempotency Test
Health Test
```

---

# 81. PROVIDER CONTRACT TEST

Tujuannya memastikan:

```text
Provider API
```

masih kompatibel dengan:

```text
Connector Contract
```

---

# 82. CONNECTOR SECURITY

Connector tidak boleh:

```text
log raw token
log secrets
bypass policy
bypass tenant
bypass scope
execute unknown capability
```

---

# 83. TENANT ISOLATION

Setiap connector request harus memiliki:

```text
tenant_id
workspace_id
account_id
```

dan validasi bahwa:

```text
account belongs to workspace
workspace belongs to tenant
```

---

# 84. CROSS-TENANT PROTECTION

Request:

```text
Tenant A
→ Account Tenant B
```

hasil:

```text
DENY
```

sebelum external API dipanggil.

---

# 85. UNKNOWN CAPABILITY

Jika:

```text
capability
```

tidak terdaftar:

```text
DENY
```

Tidak boleh:

```text
dynamic arbitrary endpoint call
```

---

# 86. ARBITRARY API PROTECTION

MVP **tidak** menyediakan:

```text
POST /connector/raw
```

yang memungkinkan user/AI mengirim arbitrary HTTP request ke provider.

Semua external action harus melalui:

```text
REGISTERED CAPABILITY
```

---

# 87. AI CONNECTOR SAFETY

AI tidak boleh berkata:

```text
Call TikTok endpoint X
```

dan connector langsung menjalankannya.

Flow:

```text
AI
 ↓
Tool Request
 ↓
Capability Registry
 ↓
Policy
 ↓
Connector Contract
 ↓
Execute
```

---

# 88. CONNECTOR CONFIGURATION

Configuration dapat mencakup:

```text
base_url
api_version
timeout
retry_policy
rate_limit_policy
webhook_config
environment
```

Secret tetap berada pada:

```text
Secret Manager
```

---

# 89. PROVIDER ENVIRONMENT

```text
DEVELOPMENT
STAGING
PRODUCTION
```

Configuration tidak boleh tercampur.

---

# 90. PROVIDER HEALTH DASHBOARD

Minimal:

```text
Connector
Status
Last Health Check
Success Rate
Latency
Error Rate
Rate Limit
Auth State
Version
```

---

# 91. CONNECTOR LIFECYCLE

```text
DISCOVER
 ↓
REGISTER
 ↓
CONFIGURE
 ↓
AUTHORIZE
 ↓
CONNECT
 ↓
HEALTHY
 ↓
EXECUTE
 ↓
MONITOR
 ↓
UPDATE
 ↓
DISABLE / REMOVE
```

---

# 92. CONNECTOR UPDATE

Jika provider API berubah:

```text
NEW ADAPTER
 ↓
CONTRACT TEST
 ↓
SANDBOX
 ↓
CANARY
 ↓
PRODUCTION
```

---

# 93. BACKWARD COMPATIBILITY

Core contract harus sebisa mungkin:

```text
STABLE
```

sementara adapter dapat:

```text
EVOLVE
```

---

# 94. PROVIDER DEPRECATION

Jika provider menghentikan API:

```text
DEPRECATED
 ↓
MIGRATION NOTICE
 ↓
NEW ADAPTER
 ↓
MIGRATION
 ↓
OLD ADAPTER DISABLE
```

---

# 95. CONNECTOR METADATA

```text
ConnectorMetadata
```

Fields:

```text
provider
display_name
connector_type
api_version
supported_regions
supported_capabilities
auth_type
status
```

---

# 96. REGION AWARENESS

Connector dapat memiliki:

```text
supported_regions
```

karena capability atau authorization dapat berbeda berdasarkan market/provider configuration.

Jangan mengasumsikan:

```text
one platform
=
one global capability set
```

---

# 97. TIKTOK DOMAIN CONFIGURATION

TikTok integration harus memperhatikan:

```text
trusted domains
URL verification
callback URL
webhook URL
```

karena TikTok memiliki development configuration yang mengatur trusted domains, webhook callback, dan URL verification.

---

# 98. CONNECTOR SECURITY FLOW

```text
REQUEST
 ↓
TENANT VALIDATION
 ↓
ACCOUNT VALIDATION
 ↓
AUTHENTICATION
 ↓
SCOPE VALIDATION
 ↓
POLICY VALIDATION
 ↓
CAPABILITY VALIDATION
 ↓
RATE LIMIT
 ↓
EXECUTION
```

---

# 99. CONNECTOR FAILURE FLOW

```text
EXECUTION
 ↓
ERROR
 ↓
NORMALIZE
 ↓
CLASSIFY
 ↓
RETRYABLE?
 ├── YES → RETRY / QUEUE
 └── NO
       ↓
    CONTROLLED FAILURE
       ↓
    AUDIT
       ↓
    EVENT
```

---

# 100. MODULE DEPENDENCY MAP

```text
MODULE 12
INTELLIGENCE
      │
      ▼
MODULE 13
EXECUTION
      │
      ▼
MODULE 16
SECURITY
      │
      ▼
MODULE 17
CONNECTOR
      │
 ┌────┼─────────────┐
 ▼    ▼             ▼
TikTok TikTok Shop  AI
 │       │           │
 ▼       ▼           ▼
External Platforms / Providers
      │
      ▼
MODULE 14
DATA + EVENTS
```

Module 15 berada di sisi identity/account context:

```text
MODULE 15
IDENTITY + ACCOUNT
        ↓
MODULE 17
CONNECTOR
```

---

# 101. MVP CONNECTORS

Build now:

```text
✓ TikTok Connector
✓ TikTok Shop Connector
✓ AI Provider Connector
✓ Storage Connector
✓ Notification Connector
```

---

# 102. MVP CONNECTOR CAPABILITIES

### TikTok

```text
✓ Account authorization
✓ Content upload
✓ Content publish
✓ Content status
✓ Webhook
✓ Connection health
✓ Scope validation
```

### TikTok Shop

```text
✓ Authorization
✓ Product read
✓ Affiliate-related read
✓ Account/shop context
✓ Scope validation
✓ Connection health
```

Exact endpoint/capability availability tetap mengikuti authorization, scope, market, app approval, dan API version provider.

---

# 103. MVP CORE INFRASTRUCTURE

```text
✓ Connector contract
✓ Connector registry
✓ Capability registry
✓ Capability discovery
✓ Request normalization
✓ Response normalization
✓ Error normalization
✓ Credential reference
✓ Scope mapping
✓ Rate-limit manager
✓ Retry manager
✓ Circuit breaker
✓ Health check
✓ Webhook adapter
✓ Idempotency
✓ Observability
✓ API version abstraction
✓ Sandbox / dry-run
✓ Contract testing
```

---

# 104. MVP INTEGRATION

Harus terintegrasi dengan:

```text
Module 12
Module 13
Module 14
Module 15
Module 16
```

---

# 105. NOT MVP

```text
✗ Arbitrary API proxy
✗ Dynamic arbitrary endpoint execution
✗ Automatic connector generation by AI
✗ Unlimited third-party connector marketplace
✗ Complex service mesh
✗ Multi-region distributed connector fabric
✗ Autonomous provider switching
✗ Cross-platform automatic publishing without policy
✗ Secret exposure to AI
✗ Provider-specific logic inside core domain
```

---

# 106. FUTURE

```text
Connector Marketplace
Self-Service Connector SDK
Connector Generator
Advanced Capability Discovery
Cross-Platform Capability Graph
Smart Provider Routing
Provider Cost Optimization
Automatic Version Migration
Multi-Provider AI Routing
Connector Reliability Intelligence
Predictive Failure Detection
```

---

# 107. REAL MOAT

Moat Module 17 bukan:

```text
BANYAK API
```

Tetapi:

```text
CORE DOMAIN
+
STABLE CONTRACT
+
CAPABILITY GRAPH
+
POLICY BOUNDARY
+
NORMALIZED DATA
+
PROVIDER ADAPTERS
+
HEALTH INTELLIGENCE
```

Sehingga Affiliate OS dapat berubah dari:

```text
TikTok Tool
```

menjadi:

```text
PLATFORM-AGNOSTIC AFFILIATE OPERATING SYSTEM
```

---

# 108. ACCEPTANCE CRITERIA — MVP

```text
AC-01
Core domain tidak bergantung langsung pada provider-specific API implementation.

AC-02
Setiap external action melewati registered capability.

AC-03
Unknown capability tidak dapat dieksekusi.

AC-04
Unknown connector tidak dapat dieksekusi.

AC-05
Connector request memiliki tenant/workspace/account context.

AC-06
Cross-tenant connector execution selalu ditolak.

AC-07
Connector tidak dapat bypass Module 16.

AC-08
Required external scope diperiksa sebelum execution.

AC-09
Credential tidak terekspos ke frontend atau logs.

AC-10
External provider errors dinormalisasi menjadi canonical error.

AC-11
Retry hanya dilakukan untuk retryable error.

AC-12
Rate limit menghasilkan controlled queue/backoff behavior.

AC-13
Duplicate execution dengan idempotency key tidak menghasilkan duplicate side effect.

AC-14
Webhook duplicate tidak menghasilkan duplicate business event.

AC-15
Webhook dapat dinormalisasi menjadi canonical event.

AC-16
Connector health dapat dipantau.

AC-17
Connector dapat di-disable tanpa menghapus historical data.

AC-18
Provider API version dapat diubah tanpa perubahan besar pada core domain.

AC-19
TikTok capability dapat dipetakan ke required scope.

AC-20
TikTok Shop capability dapat membedakan authorization/data boundary.

AC-21
AI provider dapat diganti tanpa perubahan pada content domain.

AC-22
Storage provider dapat diganti tanpa perubahan pada content domain.

AC-23
Notification provider dapat diganti tanpa perubahan pada workflow domain.

AC-24
Connector memiliki contract tests.

AC-25
Dry-run tidak menghasilkan external side effect.

AC-26
Sensitive execution memiliki correlation ID end-to-end.

AC-27
Connector failure dapat diteruskan ke Module 13 untuk controlled recovery.

AC-28
Connector events dapat diteruskan ke Module 14.

AC-29
Connection state berasal dari Module 15.

AC-30
Security/policy decision berasal dari Module 16.

AC-31
AI tidak dapat melakukan arbitrary external API call.

AC-32
Provider-specific implementation berada di adapter layer.

AC-33
Core system hanya bergantung pada canonical contracts.

AC-34
Connector failure tidak menyebabkan uncontrolled execution.

AC-35
Connector dapat menjalankan capability secara deterministic berdasarkan contract + context.
```

---

# 109. DEFINITION OF DONE

Module 17 MVP dianggap selesai apabila:

```text
CORE
 ↓
CAPABILITY
 ↓
POLICY
 ↓
CONNECTOR
 ↓
EXTERNAL PLATFORM
 ↓
NORMALIZED RESULT
 ↓
EVENT
```

berjalan end-to-end.

Dan:

```text
TikTok
TikTok Shop
AI
Storage
Notification
```

dapat ditukar/dikembangkan tanpa merombak core Affiliate OS.

---

# 110. FINAL ARCHITECTURE PRINCIPLE

```text
CORE SHOULD KNOW
WHAT IT WANTS TO DO.

CONNECTOR SHOULD KNOW
HOW A PROVIDER DOES IT.

POLICY SHOULD KNOW
WHETHER IT MAY BE DONE.

EXECUTION SHOULD KNOW
WHEN TO DO IT.

EVENT SYSTEM SHOULD KNOW
WHAT HAPPENED.

INTELLIGENCE SHOULD KNOW
WHAT TO LEARN FROM IT.
```

---

# 111. FINAL DEFINITION

> **Affiliate Platform & Connector Abstraction Layer adalah integration control boundary yang menerjemahkan capability dan intent dari Affiliate OS menjadi execution yang kompatibel dengan external platform/provider, sambil menjaga authentication, authorization, scope, policy, rate limit, error handling, versioning, webhook, observability, dan tenant isolation tetap terpisah dari core business domain.**

---

# 112. RELATIONSHIP DENGAN MODULE 16

Sekarang boundary-nya menjadi sangat jelas:

```text
MODULE 16
SECURITY + GOVERNANCE
        ↓
"BOLEHKAH?"
        ↓
MODULE 17
CONNECTOR
        ↓
"BAGAIMANA CARANYA?"
        ↓
EXTERNAL PLATFORM
```

Dan:

```text
MODULE 13
" KAPAN / DALAM WORKFLOW APA?"
```

Jadi:

```text
12 = THINK 🧠
13 = EXECUTE ⚙️
14 = REMEMBER / EVENT 🧬
15 = IDENTIFY 🔐
16 = GOVERN 🛡️
17 = CONNECT 🌐
```

---

# 113. SCOPE LOCK

**17 — AFFILIATE PLATFORM & CONNECTOR ABSTRACTION LAYER v1.0 — APPROVED**

Core:

```text
ABSTRACT
→
DISCOVER
→
AUTHORIZE
→
VALIDATE
→
ADAPT
→
EXECUTE
→
NORMALIZE
→
OBSERVE
```

Next architecture layer setelah ini secara natural adalah:

```text
18 — AFFILIATE OBSERVABILITY, RELIABILITY & OPERATIONS ENGINE v1.0
```

yang menjadi lapisan untuk memastikan seluruh:

```text
12 Intelligence
13 Execution
14 Data
15 Identity
16 Governance
17 Connectors
```

dapat dipantau, di-debug, di-recover, dan dioperasikan secara production-grade.