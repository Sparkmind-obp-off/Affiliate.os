# DOC 23 — UX/UI ARCHITECTURE v1.0

**Document:** Affiliate OS UX/UI Architecture  
**Module:** 23  
**Status:** Architecture Reference  
**Purpose:** Mendefinisikan struktur pengalaman pengguna, information architecture, navigation, screen architecture, component system, interaction patterns, responsive behavior, accessibility, state management, dan UI boundary untuk Affiliate OS.

---

# 261 — UX/UI PURPOSE

UX/UI Architecture menjadi kontrak antara:

```text
USER
 ↓
UX FLOW
 ↓
INFORMATION ARCHITECTURE
 ↓
SCREEN
 ↓
COMPONENT
 ↓
API / APPLICATION STATE
```

UI tidak boleh menjadi sumber business truth.

```text
UI
 ↓
API
 ↓
DOMAIN
 ↓
DATA
```

Bukan:

```text
UI
 ↓
DIRECT DATABASE
```

---

# 262 — UX/UI PRINCIPLES

Affiliate OS menggunakan prinsip:

```text
1. CLARITY
2. ACTIONABILITY
3. CONSISTENCY
4. TRACEABILITY
5. SAFETY
6. RESPONSIVENESS
7. ACCESSIBILITY
8. PROGRESSIVE DISCLOSURE
```

UI harus membantu user menjawab:

```text
WHAT IS HAPPENING?
WHY IS IT HAPPENING?
WHAT SHOULD I DO?
WHAT WILL HAPPEN IF I DO IT?
WHAT HAPPENED AFTER I DID IT?
```

---

# 263 — PRIMARY USER MODEL

Primary user roles:

```text
OWNER
ADMIN
OPERATOR
ANALYST
VIEWER
```

UX capability mengikuti:

```text
ROLE
 ↓
PERMISSION
 ↓
UI VISIBILITY
 ↓
ACTION AVAILABILITY
```

UI hiding bukan security.

Contoh:

```text
BUTTON HIDDEN
    ≠
ACTION SECURE
```

Authorization tetap dilakukan backend melalui Module 16.

---

# 264 — INFORMATION ARCHITECTURE

Primary navigation:

```text
AFFILIATE OS
│
├── Dashboard
│
├── Discover
│   ├── Demand
│   └── Opportunities
│
├── Creators
│   └── Creator Fit
│
├── Content
│   ├── Ideas
│   ├── Production
│   └── Published
│
├── Performance
│   ├── Overview
│   ├── Content
│   ├── Creator
│   └── Product
│
├── Revenue
│   ├── Conversions
│   ├── Attribution
│   ├── Commission
│   └── Reconciliation
│
├── Experiments
│
├── Recommendations
│
├── Automation
│   ├── Workflows
│   ├── Tasks
│   └── Runs
│
├── Integrations
│   ├── Platform Accounts
│   ├── Connectors
│   └── Webhooks
│
└── Settings
    ├── Workspace
    ├── Members
    ├── Roles
    ├── Policies
    └── Security
```

---

# 265 — GLOBAL APPLICATION SHELL

Canonical shell:

```text
┌─────────────────────────────────────────────┐
│ TOP BAR                                     │
│ Logo | Workspace | Search | Notifications  │
├──────────────┬──────────────────────────────┤
│              │                              │
│ SIDEBAR      │ MAIN CONTENT                 │
│              │                              │
│ Navigation   │ Page Header                  │
│              │ Filters / Actions            │
│              │ Content                      │
│              │                              │
│              │                              │
├──────────────┴──────────────────────────────┤
│ OPTIONAL STATUS / SYSTEM INFORMATION        │
└─────────────────────────────────────────────┘
```

Desktop menjadi primary workspace.

Mobile menjadi responsive operational interface.

---

# 266 — WORKSPACE CONTEXT

Workspace selector harus selalu menunjukkan:

```text
ORGANIZATION
    ↓
WORKSPACE
```

Contoh:

```text
Gilang Digital
└── Affiliate Workspace
```

Perubahan workspace harus:

```text
CLEAR
EXPLICIT
AUDITABLE
```

Jangan mengubah workspace secara silent.

---

# 267 — GLOBAL SEARCH

Global search dapat mencari:

```text
CREATOR
CONTENT
PRODUCT
CAMPAIGN
OPPORTUNITY
WORKFLOW
TASK
CONVERSION
ORDER
```

Search result harus menampilkan:

```text
TYPE
NAME
STATUS
RELEVANCE
UPDATED_AT
```

Search tidak boleh melewati tenant boundary.

---

# 268 — DASHBOARD ARCHITECTURE

Dashboard bukan sekadar kumpulan chart.

Primary structure:

```text
┌──────────────────────────────────────┐
│ BUSINESS SUMMARY                    │
├──────────────────────────────────────┤
│ REVENUE │ ORDERS │ COMMISSION │ CVR │
├──────────────────────────────────────┤
│ PERFORMANCE TREND                   │
├──────────────────────────────────────┤
│ TOP OPPORTUNITIES                   │
├──────────────────────────────────────┤
│ TOP CONTENT / CREATOR               │
├──────────────────────────────────────┤
│ ACTIVE EXPERIMENTS                  │
├──────────────────────────────────────┤
│ RECOMMENDATIONS                     │
└──────────────────────────────────────┘
```

Dashboard wajib membedakan:

```text
CONFIRMED
ESTIMATED
PENDING
UNKNOWN
```

Business truth berasal dari Module 19, bukan hasil kalkulasi UI.

---

# 269 — DISCOVERY UX

Discovery flow:

```text
DEMAND
 ↓
OPPORTUNITY
 ↓
OPPORTUNITY DETAIL
 ↓
CREATOR FIT
 ↓
CONTENT ACTION
```

Opportunity card minimal:

```text
Opportunity
Demand Score
Opportunity Score
Confidence
Trend
Competition
Recommended Action
```

CTA:

```text
Explore
Analyze
Create Content
Save
Dismiss
```

---

# 270 — CREATOR FIT UX

Creator profile:

```text
CREATOR
├── Profile
├── Audience
├── Performance
├── Product Fit
├── Content Fit
└── Recommendations
```

Creator fit score tidak boleh ditampilkan sebagai angka tanpa explanation.

Contoh:

```text
FIT SCORE: 87

Why?
✓ Audience match
✓ Content category match
✓ Historical conversion
△ Moderate competition
```

AI recommendation harus dapat ditelusuri ke supporting factors.

---

# 271 — CONTENT WORKSPACE

Content workspace:

```text
IDEA
 ↓
BRIEF
 ↓
DRAFT
 ↓
REVIEW
 ↓
READY
 ↓
PUBLISH
 ↓
PERFORMANCE
```

UI harus menunjukkan:

```text
CURRENT STATE
NEXT ACTION
BLOCKER
OWNER
LAST UPDATED
```

---

# 272 — CONTENT EDITOR

Content editor minimum:

```text
┌─────────────────────────────────────────┐
│ CONTENT TITLE                           │
├─────────────────────────────────────────┤
│ HOOK                                    │
│                                         │
│ SCRIPT                                  │
│                                         │
│ CTA                                     │
├─────────────────────────────────────────┤
│ PRODUCT / OFFER                         │
│ CREATOR                                 │
│ PLATFORM                                │
├─────────────────────────────────────────┤
│ AI ASSIST                               │
│ [Generate] [Improve] [Variations]       │
├─────────────────────────────────────────┤
│ SAVE DRAFT        REVIEW        PUBLISH  │
└─────────────────────────────────────────┘
```

AI actions tidak boleh langsung publish tanpa policy/permission.

---

# 273 — PERFORMANCE UX

Performance hierarchy:

```text
Overview
 ↓
Content
 ↓
Creator
 ↓
Product
 ↓
Individual Asset
```

Metrics harus menunjukkan:

```text
VALUE
DEFINITION
TIME RANGE
SOURCE
STATUS
```

Contoh:

```text
CTR
4.8%
Eligible clicks / eligible impressions
Last 7 days
Canonical Events
VALIDATED
```

Jangan hanya:

```text
CTR 4.8%
```

---

# 274 — REVENUE UX

Revenue interface:

```text
Revenue
├── Gross Revenue
├── Net Revenue
├── Attributed Revenue
├── Commission
└── Confirmed Net Attributed Revenue
```

Status visual:

```text
ESTIMATED
VALIDATED
CONFIRMED
SETTLED
FINAL
```

User harus dapat membuka:

```text
Metric
 ↓
Calculation
 ↓
Attribution
 ↓
Conversion
 ↓
Source
```

Traceability menjadi first-class UX.

---

# 275 — EXPERIMENT UX

Experiment flow:

```text
HYPOTHESIS
 ↓
BASELINE
 ↓
VARIANT
 ↓
EXECUTION
 ↓
MEASUREMENT
 ↓
RESULT
 ↓
DECISION
```

Experiment card:

```text
Experiment Name
Hypothesis
Metric
Baseline
Variant
Status
Confidence
Decision
```

Status:

```text
DRAFT
RUNNING
PAUSED
COMPLETED
CANCELLED
```

---

# 276 — RECOMMENDATION UX

Recommendation card:

```text
┌──────────────────────────────────┐
│ RECOMMENDATION                   │
├──────────────────────────────────┤
│ Action                           │
│ Why                              │
│ Expected Impact                 │
│ Confidence                      │
│ Evidence                        │
│ Risk                            │
├──────────────────────────────────┤
│ REVIEW     ACCEPT     DISMISS    │
└──────────────────────────────────┘
```

Recommendation harus membedakan:

```text
RECOMMENDATION
```

dari:

```text
EXECUTION
```

Flow:

```text
RECOMMENDATION
 ↓
REVIEW
 ↓
APPROVAL IF REQUIRED
 ↓
EXECUTION
```

---

# 277 — AUTOMATION UX

Automation hierarchy:

```text
Workflows
 ↓
Workflow Detail
 ↓
Runs
 ↓
Tasks
 ↓
Task Detail
```

Workflow visual:

```text
TRIGGER
  ↓
CHECK
  ↓
ACTION
  ↓
WAIT
  ↓
ACTION
  ↓
VALIDATE
  ↓
COMPLETE
```

User harus dapat:

```text
RUN
PAUSE
RESUME
CANCEL
RETRY
VIEW LOG
```

Action sensitif harus menampilkan confirmation dan risk context.

---

# 278 — INTEGRATION UX

Integration page:

```text
Integrations
│
├── TikTok
├── TikTok Shop
├── AI Providers
├── Storage
└── Notifications
```

Connection card:

```text
Provider
Account
Status
Scopes
Last Sync
Last Error
Actions
```

Connection states:

```text
NOT_CONNECTED
CONNECTING
CONNECTED
AUTH_REQUIRED
EXPIRED
REVOKED
SUSPENDED
ERROR
DISCONNECTED
```

UI tidak boleh menyembunyikan connection failure.

---

# 279 — SYSTEM STATUS UX

Global system status:

```text
HEALTHY
DEGRADED
PARTIAL_OUTAGE
OUTAGE
MAINTENANCE
```

Contoh:

```text
TikTok Connector
● Healthy

Analytics Sync
△ Delayed

Revenue Reconciliation
! Action Required
```

System health berbeda dari business performance.

---

# 280 — TASK / RUN DETAIL UX

Task detail:

```text
Task
├── Status
├── Trigger
├── Input
├── Execution
├── Attempts
├── Connector
├── Output
├── Error
└── Audit
```

Timeline:

```text
10:01 CREATED
10:01 QUEUED
10:02 RUNNING
10:02 CONNECTOR CALL
10:02 RETRY
10:03 SUCCEEDED
```

User harus dapat mengetahui **mengapa task gagal**, bukan hanya:

```text
FAILED
```

---

# 281 — FORM ARCHITECTURE

Form harus memiliki:

```text
LABEL
INPUT
HELP TEXT
VALIDATION
ERROR
SUCCESS STATE
```

Validation:

```text
CLIENT VALIDATION
        +
SERVER VALIDATION
```

Client validation meningkatkan UX.

Server validation tetap authority.

---

# 282 — CONFIRMATION PATTERN

Destructive action:

```text
DELETE
DISCONNECT
CANCEL
PUBLISH
REVOKE
RESET
```

wajib menggunakan explicit confirmation bila risk membutuhkan.

Confirmation harus menjelaskan:

```text
ACTION
CONSEQUENCE
SCOPE
REVERSIBILITY
```

Contoh:

```text
Disconnect TikTok Account?

This will stop future synchronization and automation
for this account.

[Cancel] [Disconnect]
```

---

# 283 — LOADING STATE

Setiap async operation harus memiliki:

```text
LOADING
SKELETON
PROGRESS
SUCCESS
ERROR
EMPTY
```

Jangan menggunakan infinite spinner tanpa informasi.

Untuk long-running workflow:

```text
QUEUED
 ↓
RUNNING
 ↓
PROGRESS
 ↓
COMPLETED
```

---

# 284 — EMPTY STATE

Empty state harus menjawab:

```text
WHAT IS EMPTY?
WHY?
WHAT CAN I DO?
```

Contoh:

```text
No creators matched yet.

Run Creator Fit analysis to find creators
that match this opportunity.

[Run Analysis]
```

Bukan:

```text
No Data
```

---

# 285 — ERROR UX

Error harus actionable.

Bad:

```text
Something went wrong.
```

Better:

```text
TikTok authorization expired.

Reconnect the account to resume synchronization.

[Reconnect]
```

Error classification:

```text
USER ACTION
SYSTEM ERROR
EXTERNAL PROVIDER
PERMISSION
RATE LIMIT
VALIDATION
UNKNOWN
```

---

# 286 — DESIGN SYSTEM

Design system minimal:

```text
FOUNDATION
├── Typography
├── Spacing
├── Color
├── Radius
├── Shadow
└── Motion

COMPONENTS
├── Button
├── Input
├── Select
├── Checkbox
├── Radio
├── Switch
├── Badge
├── Card
├── Table
├── Modal
├── Drawer
├── Tabs
├── Tooltip
├── Toast
├── Alert
├── Dropdown
├── Pagination
└── Command Menu
```

Components harus reusable.

---

# 287 — DESIGN TOKENS

Canonical tokens:

```text
color.*
spacing.*
radius.*
font.*
shadow.*
motion.*
z-index.*
breakpoint.*
```

UI implementation tidak boleh menyebarkan arbitrary values tanpa alasan.

Contoh:

```text
spacing.1
spacing.2
spacing.3
spacing.4
spacing.6
spacing.8
```

---

# 288 — TYPOGRAPHY

Typography hierarchy:

```text
DISPLAY
H1
H2
H3
BODY
BODY-SMALL
LABEL
CAPTION
```

Business dashboard memprioritaskan:

```text
SCANABILITY
NUMERIC CLARITY
HIERARCHY
```

Angka penting harus mudah dibandingkan.

---

# 289 — COLOR SEMANTICS

Color tidak boleh menjadi satu-satunya penanda status. WCAG 2.2 secara eksplisit mensyaratkan agar informasi tidak disampaikan hanya melalui warna.

Semantic status:

```text
SUCCESS
WARNING
ERROR
INFO
NEUTRAL
```

Setiap status harus memiliki kombinasi:

```text
COLOR
+
ICON / LABEL
+
TEXT
```

Contoh:

```text
✓ Connected
△ Delayed
! Action Required
```

---

# 290 — ACCESSIBILITY BASELINE

Target:

```text
WCAG 2.2 AA
```

Baseline mencakup:

```text
KEYBOARD ACCESS
VISIBLE FOCUS
SEMANTIC STRUCTURE
ACCESSIBLE LABELS
COLOR CONTRAST
TEXT ALTERNATIVES
FORM ERROR IDENTIFICATION
STATUS MESSAGES
RESPONSIVE ACCESS
```

WCAG 2.2 mencakup prinsip perceivable, operable, understandable, dan robust, termasuk keyboard accessibility, visible focus, target size, consistent navigation, accessible authentication, serta name/role/value untuk UI components.

---

# 291 — KEYBOARD NAVIGATION

Seluruh fungsi utama harus dapat digunakan dengan keyboard.

Minimum:

```text
TAB
SHIFT + TAB
ENTER
SPACE
ESC
ARROW KEYS
```

Focus state harus selalu terlihat.

Modal:

```text
OPEN
 ↓
FOCUS TRAP
 ↓
ACTION
 ↓
ESC / CLOSE
 ↓
RETURN FOCUS
```

---

# 292 — RESPONSIVE ARCHITECTURE

Breakpoints bersifat implementation detail, tetapi UX harus mendukung:

```text
MOBILE
TABLET
DESKTOP
WIDE DESKTOP
```

Desktop:

```text
SIDEBAR + CONTENT
```

Mobile:

```text
TOP BAR
+
CONTENT
+
MOBILE NAV / DRAWER
```

Tidak boleh hanya mengecilkan desktop UI.

---

# 293 — TABLE UX

Data-heavy tables harus memiliki:

```text
COLUMN CONFIGURATION
SORT
FILTER
SEARCH
PAGINATION
ROW ACTION
DETAIL VIEW
EMPTY STATE
LOADING STATE
ERROR STATE
```

Mobile table dapat berubah menjadi:

```text
CARD LIST
```

tanpa kehilangan informasi penting.

---

# 294 — CHART UX

Chart harus selalu memiliki:

```text
TITLE
TIME RANGE
UNIT
LEGEND
SOURCE
STATUS
```

Tooltip harus menyediakan exact value.

Chart tidak boleh menjadi satu-satunya cara membaca metric.

Alternative:

```text
CHART
+
SUMMARY
+
TABLE
```

---

# 295 — NOTIFICATION UX

Notification types:

```text
SUCCESS
WARNING
ERROR
INFO
ACTION_REQUIRED
```

Priority:

```text
LOW
NORMAL
HIGH
CRITICAL
```

Notification harus memiliki:

```text
TITLE
MESSAGE
TIMESTAMP
SOURCE
ACTION
```

---

# 296 — AI UX PRINCIPLE

AI harus terlihat sebagai:

```text
ASSISTANT
```

bukan:

```text
AUTHORITY
```

AI-generated output wajib memiliki indicator:

```text
AI GENERATED
```

Jika recommendation digunakan:

```text
WHY
EVIDENCE
CONFIDENCE
```

harus tersedia bila applicable.

User harus tetap mengetahui apakah output:

```text
AI
RULE
DATA
HUMAN
```

---

# 297 — DATA FRESHNESS UX

Metric/data yang memiliki freshness concern harus menampilkan:

```text
LAST UPDATED
DATA STATUS
SOURCE
```

Contoh:

```text
Revenue
Rp12.4M

Last updated 8 min ago
Source: TikTok Shop
Status: CONFIRMED
```

Jangan membuat user menganggap data realtime jika sebenarnya delayed.

---

# 298 — TRACEABILITY UX

Untuk critical business metrics:

```text
METRIC
 ↓
DEFINITION
 ↓
SOURCE
 ↓
CALCULATION
 ↓
ATTRIBUTION
 ↓
CONVERSION
```

User dapat membuka detail provenance.

Contoh:

```text
Why is this revenue Rp4.2M?

[View Calculation]
[View Attribution]
[View Source Events]
```

---

# 299 — PERMISSION-AWARE UX

UI action state:

```text
AVAILABLE
DISABLED
HIDDEN
LOCKED
PENDING_APPROVAL
```

Jika disabled karena permission:

```text
You don't have permission to perform this action.
```

Namun security decision tetap dilakukan server-side.

---

# 300 — UX STATE MACHINE

Setiap resource penting harus memiliki state model.

Generic:

```text
DRAFT
 ↓
READY
 ↓
RUNNING
 ↓
SUCCEEDED
```

Failure:

```text
RUNNING
 ↓
FAILED
 ↓
RETRY
 ↓
RUNNING
```

Cancellation:

```text
RUNNING
 ↓
CANCELLED
```

State transition tidak boleh dilakukan hanya berdasarkan UI assumption.

---

# 301 — FRONTEND DATA FLOW

Canonical:

```text
USER ACTION
    ↓
UI EVENT
    ↓
CLIENT STATE
    ↓
API REQUEST
    ↓
SERVER VALIDATION
    ↓
DOMAIN ACTION
    ↓
DATABASE / EVENT
    ↓
API RESPONSE
    ↓
SERVER STATE
    ↓
UI STATE
```

Client state bukan source of truth.

---

# 302 — CACHING PRINCIPLE

Cache hanya digunakan untuk data yang aman.

```text
SAFE TO CACHE
├── Static configuration
├── Reference data
├── UI metadata
└── Non-sensitive read models

CARE REQUIRED
├── Revenue
├── Commission
├── Account status
└── Permission
```

Critical authorization state tidak boleh bergantung pada stale client cache.

---

# 303 — PERFORMANCE UX

UI target:

```text
FAST FIRST RENDER
PROGRESSIVE LOADING
SKELETON
LAZY LOADING
PAGINATION
VIRTUALIZATION WHERE NEEDED
```

Heavy analytics tidak boleh memblokir seluruh application shell.

---

# 304 — UI OBSERVABILITY

Frontend telemetry minimal:

```text
PAGE_VIEW
ACTION
API_ERROR
CLIENT_ERROR
PERFORMANCE
WEBHOOK_STATUS
WORKFLOW_STATUS
```

Telemetry harus:

```text
TENANT-AWARE
PRIVACY-AWARE
NON-SENSITIVE
```

Jangan mengirim:

```text
ACCESS_TOKEN
REFRESH_TOKEN
PASSWORD
SECRET
FULL PAYMENT DATA
```

---

# 305 — UX SECURITY PRINCIPLE

UI security:

```text
VISIBLE SECURITY STATE
+
SAFE DEFAULT
+
EXPLICIT ACTION
+
CONFIRMATION
+
NO SECRET EXPOSURE
```

Credential:

```text
••••••••
```

bukan plaintext.

Sensitive values tidak boleh masuk:

```text
URL
SCREENSHOT LOG
CLIENT LOG
ANALYTICS EVENT
```

---

# 306 — UX NON-GOALS

Doc 23 tidak menentukan:

```text
DATABASE
API IMPLEMENTATION
BUSINESS ALGORITHM
CONNECTOR INTERNAL CODE
AI MODEL
DEPLOYMENT INFRASTRUCTURE
```

Hal tersebut tetap berada pada:

```text
DOC 21
DOC 22
DOC 24
```

---

# 307 — MVP UX/UI SCOPE

MVP wajib:

```text
✓ Application Shell
✓ Workspace Context
✓ Dashboard
✓ Discovery
✓ Opportunity
✓ Creator Fit
✓ Content Workspace
✓ Performance
✓ Revenue
✓ Experiments
✓ Recommendations
✓ Automation
✓ Integrations
✓ Settings
✓ Notifications
✓ Loading/Error/Empty States
✓ Permission-aware UI
✓ Responsive UI
✓ Accessibility baseline
✓ Design System
✓ Data Freshness
✓ Traceability
```

Belum wajib:

```text
✗ Fully customizable dashboard builder
✗ Advanced drag-and-drop workflow editor
✗ White-label UI
✗ Multi-language localization system
✗ Native mobile application
✗ Complex theme marketplace
```

---

# 308 — UX ACCEPTANCE CRITERIA

```text
AC-23-01
User dapat memahami workspace aktif.

AC-23-02
Navigation utama konsisten.

AC-23-03
UI mengikuti role/permission context.

AC-23-04
UI tidak menjadi authorization authority.

AC-23-05
Dashboard menampilkan business truth dari canonical source.

AC-23-06
Metric memiliki definition/source/status.

AC-23-07
Opportunity dapat ditelusuri ke recommendation/action.

AC-23-08
Creator Fit menampilkan supporting factors.

AC-23-09
Content memiliki lifecycle state.

AC-23-10
Performance dapat difilter berdasarkan time range.

AC-23-11
Revenue dapat ditelusuri ke attribution/conversion.

AC-23-12
Automation memiliki workflow/task/run state.

AC-23-13
Integration menampilkan connection health.

AC-23-14
External failure terlihat oleh user.

AC-23-15
Long-running operation memiliki progress/state.

AC-23-16
Error state memberikan actionable recovery.

AC-23-17
Empty state memberikan next action.

AC-23-18
Destructive action memiliki confirmation sesuai risk.

AC-23-19
AI output dibedakan dari deterministic system output.

AC-23-20
Data freshness ditampilkan bila relevan.

AC-23-21
Critical metric memiliki traceability.

AC-23-22
Keyboard navigation tersedia.

AC-23-23
Focus state terlihat.

AC-23-24
Color bukan satu-satunya status indicator.

AC-23-25
Form memiliki accessible labels dan error states.

AC-23-26
Responsive layout mendukung mobile/tablet/desktop.

AC-23-27
Tables memiliki loading/error/empty state.

AC-23-28
Charts memiliki text/data alternative.

AC-23-29
Sensitive credentials tidak ditampilkan.

AC-23-30
Frontend tidak melakukan direct database access.

AC-23-31
Frontend menggunakan API Contract Doc 22.

AC-23-32
UX boundary konsisten dengan System Architecture Doc 20.

AC-23-33
Data presentation konsisten dengan Data Model Doc 21.

AC-23-34
UX dapat diteruskan ke implementation blueprint Doc 24.
```

---

# 309 — IMPLEMENTATION HANDOFF

Urutan implementasi frontend:

```text
1. DESIGN TOKENS
      ↓
2. COMPONENT LIBRARY
      ↓
3. APPLICATION SHELL
      ↓
4. ROUTING
      ↓
5. AUTH / TENANT CONTEXT
      ↓
6. API CLIENT
      ↓
7. GLOBAL STATE
      ↓
8. PAGE ARCHITECTURE
      ↓
9. RESOURCE COMPONENTS
      ↓
10. FORMS
      ↓
11. TABLES / CHARTS
      ↓
12. ASYNC STATES
      ↓
13. ERROR HANDLING
      ↓
14. ACCESSIBILITY
      ↓
15. RESPONSIVE
      ↓
16. E2E TEST
```

---

# 310 — FINAL UX/UI ARCHITECTURE

```text
                         USER
                           │
                           ▼
                    APPLICATION SHELL
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
          DISCOVERY     CONTENT      PERFORMANCE
              │            │            │
              └────────────┼────────────┘
                           ▼
                      APPLICATION
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         REVENUE       EXPERIMENTS   AUTOMATION
              │            │            │
              └────────────┼────────────┘
                           ▼
                         API v1
                           │
                    DOMAIN / MODULES
                           │
                     DATA / EVENTS
```

UI architecture:

```text
USER
 ↓
UX FLOW
 ↓
SCREEN
 ↓
COMPONENT
 ↓
API
 ↓
DOMAIN
 ↓
DATA
```

---

# 311 — ARCHITECTURE LOCK

```text
INFORMATION ARCHITECTURE   = LOCKED
APPLICATION SHELL          = LOCKED
NAVIGATION                 = LOCKED
ROLE-AWARE UX              = LOCKED
DASHBOARD PRINCIPLE        = LOCKED
CONTENT WORKSPACE          = LOCKED
PERFORMANCE UX             = LOCKED
REVENUE TRACEABILITY       = LOCKED
AUTOMATION UX              = LOCKED
INTEGRATION UX             = LOCKED
DESIGN SYSTEM              = LOCKED
RESPONSIVE PRINCIPLE       = LOCKED
ACCESSIBILITY BASELINE     = WCAG 2.2 AA
AI UX BOUNDARY             = LOCKED
DATA FRESHNESS UX          = LOCKED
TRACEABILITY UX            = LOCKED
ERROR / EMPTY / LOADING    = LOCKED
MVP UX SCOPE               = LOCKED
IMPLEMENTATION HANDOFF     = READY
```

### STATUS

```text
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
```

**DOC 23 — UX/UI ARCHITECTURE v1.0 = COMPLETE & LOCKED.**