# AFFILIATE OS — EXTERNAL STACK MASTER INVENTORY

**Version:** v1.0  
**Status:** Source-of-Truth Dependency Inventory  
**Repository:** `Sparkmind-obp-off/Affiliate.os`  
**Last audited:** 2026-09-03

---

## 1. PURPOSE

Dokumen ini adalah master inventory seluruh external stack/dependency yang terlihat dari source-of-truth Affiliate OS.

Tujuan:

- memastikan tidak ada external dependency penting yang terlewat;
- membedakan dependency **wajib sekarang**, **wajib saat capability tertentu diaktifkan**, dan **future/optional**;
- mencegah implementasi provider sebelum boundary dan scope jelas;
- menjaga core Affiliate OS tetap provider-independent;
- menjadi input resmi untuk Task berikutnya dan deployment planning.

**Golden rule:** jangan membuat credential, integration, provider implementation, atau production dependency hanya karena provider tersebut tercantum di dokumen. Capability dan MVP scope harus menjadi pemicu implementasi.

---

## 2. EXECUTIVE DECISION

| External Stack / Dependency | Status | Kapan diperlukan | Provider / pilihan saat ini | Credential / verification |
|---|---|---|---|---|
| Cloudflare Pages / Workers runtime | **WAJIB SEKARANG** | Deployment/runtime MVP | Cloudflare | Cloudflare account + deployment credentials |
| PostgreSQL | **WAJIB SEKARANG** | Persistent production data | Neon PostgreSQL Free recommended | `DATABASE_URL`, SSL as required |
| Authentication | **WAJIB UNTUK IDENTITY MVP** | Saat Module 15 diaktifkan | Clerk recommended | Clerk application credentials/config |
| TikTok Shop / TikTok platform | **MVP DOMAIN, BUKAN NATIVE API DEPENDENCY** | Manual input/export sudah cukup untuk MVP; API nanti | TikTok / TikTok Shop | Developer app + scopes when native connector activated |
| TikTok Developer App | **WAJIB SAAT NATIVE TIKTOK CONNECTOR DIAKTIFKAN** | Direct API integration | TikTok for Developers | Client Key/Secret + product/scope approval; review may apply |
| TikTok Shop API | **CAPABILITY-DEPENDENT** | Jika product/order/affiliate/finance API dibangun | TikTok Shop | App + authorization/scopes; product-specific requirements |
| LLM provider | **CAPABILITY-DEPENDENT** | Jika AI-assisted capability masuk implementation | Provider-agnostic; Groq initial candidate | Provider API key |
| Search / external research provider | **CAPABILITY-DEPENDENT** | Jika automated external research diaktifkan | Provider-agnostic; SerpApi candidate | API key |
| Object storage | **FUTURE / CAPABILITY-DEPENDENT** | Media/assets bila storage eksternal diperlukan | S3-compatible; Cloudflare R2 candidate | endpoint/bucket/access credentials |
| Queue | **FUTURE / CAPABILITY-DEPENDENT** | Async jobs/automation bila diperlukan | Redis-compatible per current env contract | queue connection credential |
| Billing / payment | **FUTURE** | SaaS monetization, bukan core MVP loop | Duitku documented as pending | merchant code/API key |
| Notification provider | **FUTURE / CAPABILITY-DEPENDENT** | Email/push/external notifications | Provider-independent | provider credential |
| Analytics provider | **FUTURE / CAPABILITY-DEPENDENT** | External analytics beyond core performance data | Provider-independent | provider-specific |
| Domain/DNS/HTTPS | **WAJIB UNTUK PRODUCTION OPERATIONS** | Production URL, callbacks/verification when needed | Cloudflare | DNS/account access |

---

## 3. ARCHITECTURAL RULE

Source-of-truth Module 17 menetapkan bahwa core tidak boleh bergantung langsung pada provider tertentu.

```text
AFFILIATE OS CORE
        ↓
CAPABILITY / CONNECTOR CONTRACT
        ↓
PROVIDER ADAPTER
        ↓
EXTERNAL SERVICE / API
```

Core mengenal contract seperti:

- Capability
- Connector
- Request
- Response
- Error
- Connection
- Credential
- Health

Core **tidak boleh** menyebarkan implementasi provider-specific ke domain/business logic.

---

## 4. MVP BOUNDARY — HAL PALING PENTING

MVP resmi berfokus pada:

```text
DISCOVER
  ↓
EVALUATE
  ↓
SELECT
  ↓
TEST
  ↓
MEASURE
  ↓
LEARN
  ↓
ITERATE
```

Primary validation environment adalah **TikTok Shop Affiliate**.

Namun native TikTok API integration **secara eksplisit bukan dependency MVP**. MVP dapat menggunakan:

```text
Affiliate OS
   ↓
Export / Manual Input
   ↓
TikTok
   ↓
Performance
   ↓
Affiliate OS
```

Native API berada pada jalur future/capability activation:

```text
Affiliate OS
   ↓
TikTok Connector
   ↓
TikTok API
```

Jadi **jangan menahan MVP hanya karena TikTok Developer App belum dibuat**.

---

## 5. STACK DETAIL

### A. Cloudflare

**Role:** production runtime/deployment.

Digunakan untuk deployment Affiliate OS. Production project yang sudah ada adalah `affiliate-os`.

**Status:** WAJIB SEKARANG.

**Do not:** membuat project baru tanpa alasan; mengubah runtime hanya demi provider baru.

---

### B. PostgreSQL

**Role:** production persistence.

Repository secara eksplisit menetapkan PostgreSQL sebagai production database dan melarang SQLite/in-memory/JSON files sebagai production database.

Current environment contract:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/affiliate_os
DATABASE_SSL=false
```

Neon PostgreSQL Free adalah provider yang dipilih sebagai target MVP karena kompatibel dengan PostgreSQL-native repository tanpa mengubah architecture.

**Status:** WAJIB SEKARANG.

**Current blocker:** production `DATABASE_URL` belum tersedia/terkonfigurasi.

---

### C. Authentication

Module 15 adalah identity/account/tenancy backbone.

Environment contract saat ini sudah menyiapkan:

```text
AUTH_SECRET
SESSION_COOKIE_NAME
auth/session TTL
```

Clerk adalah provider yang dipilih untuk authentication layer, sementara organization/workspace/membership/role tetap menjadi domain Affiliate OS.

```text
Clerk
  ↓ authentication
Affiliate OS Module 15
  ↓
User → Organization → Workspace → Membership → Role
```

**Status:** WAJIB untuk identity/authenticated MVP, tetapi provider implementation mengikuti task yang secara resmi mengaktifkan Module 15.

**Do not:** mengganti tenancy/authorization internal dengan provider auth.

---

### D. TikTok Developer / TikTok API

**Role:** native platform integration.

Module 17 sudah menyediakan abstraction untuk TikTok Connector, termasuk:

- AuthAdapter
- ContentAdapter
- AccountAdapter
- WebhookAdapter
- ScopeMapper
- ErrorMapper
- RateLimitManager
- HealthChecker

Namun MVP scope menyatakan native TikTok integration bukan dependency MVP.

**Status:** CAPABILITY-DEPENDENT / FUTURE untuk native connector.

Jika native connector diaktifkan, urutan eksternal:

```text
TikTok Developer Account
        ↓
Developer App
        ↓
Products / Scopes
        ↓
Sandbox / Testing
        ↓
App Review (jika required)
        ↓
Live
        ↓
Affiliate OS TikTok Connector
```

**Credential:** jangan pernah mengarang `TIKTOK_CLIENT_KEY` atau `TIKTOK_CLIENT_SECRET`.

**Verification:** tidak boleh diasumsikan selalu sama untuk semua TikTok product. Requirement review/business verification bergantung pada product/capability yang digunakan.

---

### E. TikTok Shop API

**Role:** product/order/affiliate/finance platform integration.

Module 17 mendefinisikan TikTok Shop Connector dengan adapter untuk seller, creator, product, order, affiliate, finance, dan webhook.

Tetapi MVP saat ini tidak membutuhkan native TikTok Shop API untuk menjalankan core validation loop.

**Status:** CAPABILITY-DEPENDENT.

Aktif hanya jika requirement MVP/future task secara eksplisit membutuhkan API capability tertentu.

Scope dan authorization harus ditentukan per capability; connected account tidak berarti semua capability otomatis tersedia.

---

### F. LLM / AI Provider

Module 17 mendefinisikan `AIProviderConnector` dan menjaga core bebas dari provider lock-in.

Capabilities yang sudah dirancang:

```text
generate_text
generate_script
generate_caption
analyze_content
classify_content
generate_metadata
```

Candidate awal untuk development/validation: **Groq**.

Secondary/alternative: Gemini, OpenAI, atau provider lain yang memenuhi contract.

**Status:** CAPABILITY-DEPENDENT.

**Rule:** jangan install/integrasikan provider hanya karena provider disebut di inventory. Implement hanya ketika capability AI masuk task yang aktif.

---

### G. Search / External Research Provider

Demand Discovery dapat menggunakan external research, tetapi MVP secara eksplisit tidak membutuhkan massive scraping atau automatic crawling seluruh internet.

Candidate provider yang sudah dipertimbangkan: **SerpApi**.

**Status:** CAPABILITY-DEPENDENT.

Jangan menjadikan SerpApi sebagai hard dependency sebelum exact data source requirement ditetapkan.

---

### H. Object Storage

Module 17 mendefinisikan Storage Connector dengan operasi:

```text
put / upload
get / download
delete
exists
metadata
signedUrl
```

Current `.env.example` menyiapkan S3-compatible contract:

```text
STORAGE_ENDPOINT
STORAGE_BUCKET
STORAGE_ACCESS_KEY_ID
STORAGE_SECRET_ACCESS_KEY
```

**Status:** FUTURE / CAPABILITY-DEPENDENT.

MVP Content Production secara eksplisit berada di luar core; karena itu object storage tidak boleh dipaksakan sebagai MVP dependency tanpa requirement asset/media yang nyata.

Cloudflare R2 adalah candidate natural jika capability ini nanti diperlukan, tetapi provider final harus diputuskan pada task implementasi storage.

---

### I. Queue

Current `.env.example` menyiapkan:

```text
QUEUE_URL
```

dan menyebut queue sebagai Redis-compatible.

Module 17 juga menetapkan bahwa canonical connector errors dapat diteruskan ke Module 13 untuk keputusan:

```text
RETRY
QUEUE
PAUSE
FAIL
RECONNECT
ESCALATE
```

**Status:** FUTURE / CAPABILITY-DEPENDENT.

Jangan membangun queue infrastructure hanya untuk membuat MVP terlihat lebih kompleks. Aktifkan ketika asynchronous execution, retries, webhook processing, atau automation benar-benar membutuhkan queue.

---

### J. Billing / Payment

Current `.env.example` mendokumentasikan:

```text
Duitku
DUITKU_MERCHANT_CODE
DUITKU_API_KEY
DUITKU_ENVIRONMENT
```

dan menandainya **PENDING / FUTURE**.

**Status:** FUTURE.

Tidak ada alasan memasukkan payment gateway ke core MVP validation loop kecuali scope produk berubah menjadi paid SaaS billing pada task terpisah.

---

### K. Notification

Module 17 menyediakan Notification Connector dengan capability:

```text
email
push
in_app
webhook
```

**Status:** FUTURE / CAPABILITY-DEPENDENT.

Tidak ada provider wajib yang boleh dipilih tanpa use case konkret.

---

### L. Analytics / External Analytics

Module 17 mendefinisikan Analytics Connector sebagai salah satu connector type.

Namun MVP Performance & Winner Analytics dapat bekerja dari data eksperimen yang dicatat/ditarik tanpa mewajibkan analytics SaaS eksternal.

**Status:** FUTURE / CAPABILITY-DEPENDENT.

---

### M. Domain / DNS / HTTPS

Production deployment membutuhkan domain/runtime endpoint yang stabil. Domain juga dapat menjadi dependency ketika external platform meminta website, privacy policy, redirect URI, atau URL verification.

**Status:** WAJIB UNTUK PRODUCTION OPERATIONS; external verification dependency hanya ketika integration terkait diaktifkan.

---

## 6. CREDENTIAL INVENTORY

Credential yang sudah dikenal dari repository:

```text
DATABASE_URL
AUTH_SECRET
TIKTOK_CLIENT_KEY
TIKTOK_CLIENT_SECRET
STORAGE_ENDPOINT
STORAGE_BUCKET
STORAGE_ACCESS_KEY_ID
STORAGE_SECRET_ACCESS_KEY
QUEUE_URL
DUITKU_MERCHANT_CODE
DUITKU_API_KEY
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Potential provider-specific credentials untuk future capabilities:

```text
CLERK credentials/config
LLM provider API key
Search provider API key
Notification provider credential
Analytics provider credential
```

**Security rule:** credential nyata hanya boleh disimpan melalui secure environment/secrets manager. Tidak boleh masuk Git, source code, prompt publik, issue, README, atau chat.

---

## 7. WHAT MUST EXIST BEFORE EACH STAGE

### Stage A — Current production foundation

Required:

- Cloudflare production project
- PostgreSQL production database
- `DATABASE_URL`
- migration verification/execution
- authentication implementation when Module 15 task is activated
- `AUTH_SECRET` when auth is activated

Not required yet:

- TikTok Developer App
- TikTok Client Key/Secret
- storage credentials
- queue
- Duitku
- LLM key
- search provider key

### Stage B — AI capability activation

Required:

- AIProvider contract
- selected provider account
- provider API key
- cost/rate-limit policy
- fallback policy if applicable

### Stage C — Native TikTok connector activation

Required:

- TikTok Developer account
- TikTok app
- exact product selection
- exact scopes
- redirect/callback URLs where applicable
- test/sandbox path where applicable
- review/approval if required
- production credentials
- webhook endpoint if webhook capability is enabled

### Stage D — Storage activation

Required:

- selected object storage
- bucket
- endpoint/config
- credentials
- lifecycle/security policy

### Stage E — Queue/automation activation

Required:

- queue provider
- queue URL/connection
- retry policy
- idempotency policy
- dead-letter/failure handling if required

### Stage F — SaaS billing activation

Required:

- payment provider account
- merchant credentials
- sandbox validation
- webhook contract
- reconciliation/audit design

---

## 8. DO NOT BLOCK MVP ON THESE

Unless a new approved scope explicitly changes the MVP boundary, the following must **not** block the core validation loop:

```text
TikTok native API approval
TikTok Direct Post
TikTok Shop API
Object storage
Queue infrastructure
Duitku billing
External analytics SaaS
AI video/image/voice providers
Multi-platform connectors
```

MVP can operate with manual/export/import flows where the MVP scope says so.

---

## 9. CURRENT BLOCKERS VS FUTURE SETUP

### Current real blockers

1. Production PostgreSQL connection/`DATABASE_URL`.
2. Migration precondition verification (`module_05` schema must exist before Module 05 migration is executed).
3. Authentication implementation/configuration when Module 15 task begins.

### Future setup blockers

1. TikTok Developer App only when native TikTok connector is activated.
2. LLM provider credential only when AI capability is activated.
3. Search provider credential only when automated external research is activated.
4. Storage credential only when storage capability is activated.
5. Queue credential only when asynchronous execution is activated.
6. Duitku credentials only when billing is activated.

---

## 10. MASTER RULE FOR FUTURE TASKS

Before any implementation task adds an external integration, the task must answer:

```text
1. What capability requires it?
2. Is that capability MVP or future?
3. What exact provider/product is required?
4. What scopes/permissions are required?
5. Does the provider require review/verification?
6. What credentials are required?
7. Where are credentials stored?
8. What is the connector contract?
9. What is the fallback/manual path?
10. What happens if the provider is unavailable?
11. How is the integration tested without production credentials?
12. Does this dependency block the MVP or not?
```

If these answers are not known, **do not implement the provider-specific integration yet**.

---

## 11. SOURCE-OF-TRUTH REFERENCES

Primary sources audited for this inventory:

- `docs/specifications/affiliate-os-mvp-scope-boundary-v1-0.md`
- `docs/specifications/17-affiliate-platform-connector-abstraction-layer-v1-0.md`
- `.env.example`
- existing Module 15 identity architecture
- existing Module 05 persistence/migration architecture
- existing deployment configuration

This inventory is an architectural dependency map, not a claim that every listed provider is already connected or production-ready.
