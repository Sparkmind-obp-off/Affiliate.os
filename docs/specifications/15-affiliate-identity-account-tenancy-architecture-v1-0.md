# 15 — AFFILIATE IDENTITY, ACCOUNT & TENANCY ARCHITECTURE v1.0

**Product:** Affiliate OS  
**Module:** 15  
**Version:** v1.0  
**Status:** Product Architecture

---

# 1. PURPOSE

Affiliate Identity, Account & Tenancy Architecture adalah:

> **identity and access backbone yang mengatur user, organization, workspace, connected account, platform identity, ownership, permission, role, dan data isolation dalam Affiliate OS.**

Modul ini menjawab:

```text
WHO ARE YOU?
        ↓
WHO DO YOU BELONG TO?
        ↓
WHICH WORKSPACE?
        ↓
WHICH PLATFORM ACCOUNT?
        ↓
WHICH SHOP / CREATOR ACCOUNT?
        ↓
WHAT CAN YOU ACCESS?
        ↓
WHAT CAN YOU EXECUTE?
```

---

# 2. CORE POSITIONING

Bukan hanya:

```text
LOGIN SYSTEM
```

Bukan hanya:

```text
AUTHENTICATION
```

Bukan hanya:

```text
USER MANAGEMENT
```

Tetapi:

```text
IDENTITY
+
ACCOUNT
+
TENANCY
+
OWNERSHIP
+
PERMISSION
+
CONNECTION
```

---

# 3. CORE MODEL

```text
USER
 ↓
ORGANIZATION
 ↓
WORKSPACE
 ↓
AFFILIATE OS ACCOUNT
 ↓
CONNECTED PLATFORM
 ↓
PLATFORM ACCOUNT
 ↓
SHOP / CREATOR / BUSINESS ENTITY
```

---

# 4. IMPORTANT PRINCIPLE

Jangan menyamakan:

```text
User
```

dengan:

```text
TikTok Account
```

dan jangan menyamakan:

```text
TikTok Account
```

dengan:

```text
TikTok Shop Account
```

Karena satu user dapat menghubungkan beberapa identity dan account.

---

# 5. USER

Canonical entity:

```text
User
```

Fields:

```text
id
email
name
avatar
status
created_at
updated_at
last_login_at
```

---

# 6. USER STATUS

```text
ACTIVE
INVITED
SUSPENDED
DEACTIVATED
DELETED
```

---

# 7. ORGANIZATION

Organization adalah boundary bisnis/ownership terbesar.

Contoh:

```text
Organization
└── GilangDigital
```

atau:

```text
Organization
└── Affiliate Agency
```

---

# 8. ORGANIZATION OBJECT

```text
Organization
```

Fields:

```text
id
name
slug
owner_id
status
plan
created_at
updated_at
```

---

# 9. WORKSPACE

Workspace adalah environment operasional di dalam organization.

Contoh:

```text
Organization
│
├── Workspace: Main Affiliate
├── Workspace: Client A
└── Workspace: Client B
```

---

# 10. WHY WORKSPACE

Workspace memungkinkan:

```text
1 Organization
+
Multiple Operational Environments
```

tanpa mencampur:

```text
Data
Content
Accounts
Experiments
Analytics
```

---

# 11. WORKSPACE OBJECT

```text
Workspace
```

Fields:

```text
id
organization_id
name
slug
status
timezone
currency
created_at
updated_at
```

---

# 12. WORKSPACE STATUS

```text
ACTIVE
SUSPENDED
ARCHIVED
DELETED
```

---

# 13. TENANT MODEL

Logical hierarchy:

```text
Tenant
   ↓
Organization
   ↓
Workspace
   ↓
Resources
```

Untuk MVP:

> Organization dapat menjadi primary tenant boundary.

---

# 14. MULTI-TENANCY

Data harus memiliki:

```text
organization_id
workspace_id
```

jika resource tersebut bersifat tenant-scoped.

Contoh:

```text
Product
Opportunity
Creator
Content
Experiment
Workflow
Execution
```

---

# 15. DATA ISOLATION

Rule:

```text
Workspace A
      ≠
Workspace B
```

dan:

```text
Organization A
      ≠
Organization B
```

Tidak boleh terjadi cross-tenant access tanpa explicit authorization.

---

# 16. MEMBERSHIP

User tidak langsung dianggap memiliki akses ke organization.

Gunakan:

```text
OrganizationMembership
```

Fields:

```text
id
organization_id
user_id
role_id
status
joined_at
```

---

# 17. WORKSPACE MEMBERSHIP

Gunakan:

```text
WorkspaceMembership
```

Fields:

```text
id
workspace_id
user_id
role_id
status
```

---

# 18. ROLE

Role menentukan:

```text
WHAT CAN THIS USER DO?
```

Contoh:

```text
OWNER
ADMIN
MANAGER
OPERATOR
ANALYST
EDITOR
VIEWER
```

---

# 19. PERMISSION

Permission menentukan action secara granular.

Contoh:

```text
workspace.read
workspace.update

product.read
product.write

content.read
content.create
content.publish

analytics.read

workflow.run
workflow.cancel

connection.read
connection.manage
```

---

# 20. RBAC

Architecture:

```text
USER
 ↓
MEMBERSHIP
 ↓
ROLE
 ↓
PERMISSION
```

Contoh:

```text
Operator
 ↓
content.create
content.edit
workflow.run
```

tetapi:

```text
content.publish
```

dapat membutuhkan permission tambahan/approval policy.

---

# 21. ABAC

Future layer dapat menggunakan:

```text
Attribute-Based Access Control
```

Contoh:

```text
User
+
Workspace
+
Account
+
Action
+
Risk
```

sebagai dasar authorization.

---

# 22. AUTHENTICATION VS AUTHORIZATION

Harus dipisahkan.

### Authentication

```text
WHO ARE YOU?
```

### Authorization

```text
WHAT ARE YOU ALLOWED TO DO?
```

---

# 23. AUTHENTICATION PROVIDERS

MVP dapat mendukung:

```text
Email
Password
OAuth
Magic Link
```

Future:

```text
Google
Apple
Microsoft
Enterprise SSO
```

---

# 24. SESSION

Canonical:

```text
Session
```

Fields:

```text
id
user_id
device
ip_hash
user_agent
created_at
expires_at
revoked_at
```

Session harus dapat:

```text
REVOKE
```

---

# 25. SECURITY PRINCIPLE

Authentication credential tidak boleh disimpan secara plaintext.

Password harus menggunakan:

```text
Strong Password Hashing
```

dan secret/token eksternal disimpan server-side.

TikTok sendiri menegaskan bahwa client secret dan refresh token harus tetap berada di server-side; akses API juga bergantung pada scope yang disetujui dan authorization user.

---

# 26. CONNECTED ACCOUNT

Canonical entity:

```text
ConnectedAccount
```

Ini merepresentasikan:

> akun external yang telah dihubungkan ke Affiliate OS.

---

# 27. CONNECTED ACCOUNT OBJECT

```text
ConnectedAccount
```

Fields:

```text
id
workspace_id
platform
account_type
external_account_id
display_name
status
connection_id
created_at
updated_at
```

---

# 28. ACCOUNT TYPES

Minimal:

```text
PERSONAL
CREATOR
SELLER
SHOP
BUSINESS
PARTNER
```

---

# 29. PLATFORM

Canonical:

```text
Platform
```

Contoh:

```text
TikTok
TikTok Shop
Future:
Instagram
YouTube
Shopee
Tokopedia
```

---

# 30. PLATFORM IDENTITY

Satu user dapat memiliki:

```text
User
 ├── TikTok Identity A
 ├── TikTok Identity B
 └── TikTok Identity C
```

tetapi setiap identity harus memiliki external identity reference yang jelas.

---

# 31. IDENTITY MAPPING

```text
Internal User
      ↕
External Identity
```

Contoh:

```text
user_123
   ↕
tiktok_user_987
```

---

# 32. ACCOUNT MAPPING

```text
Affiliate OS Account
        ↕
External Platform Account
```

Harus menyimpan:

```text
provider
external_id
account_type
market
status
```

---

# 33. ONE USER — MULTIPLE ACCOUNTS

Contoh:

```text
User A
│
├── TikTok Creator A
├── TikTok Creator B
├── TikTok Shop Seller A
└── TikTok Shop Seller B
```

System harus dapat membedakan semuanya.

---

# 34. ONE WORKSPACE — MULTIPLE ACCOUNTS

```text
Workspace A
│
├── TikTok Creator A
├── TikTok Creator B
└── TikTok Shop Seller A
```

---

# 35. ACCOUNT OWNERSHIP

Connected account harus memiliki:

```text
owner_type
owner_id
```

Contoh:

```text
owner_type = workspace
owner_id = ws_123
```

atau future:

```text
owner_type = organization
owner_id = org_123
```

---

# 36. CONNECTION

Connection berbeda dari account.

```text
ACCOUNT
```

adalah identity external.

```text
CONNECTION
```

adalah authorization channel yang memungkinkan system mengaksesnya.

---

# 37. CONNECTION OBJECT

```text
Connection
```

Fields:

```text
id
provider
connection_type
status
scopes
created_at
expires_at
last_refreshed_at
revoked_at
```

---

# 38. CONNECTION STATES

```text
PENDING
CONNECTED
AUTH_REQUIRED
EXPIRED
REVOKED
ERROR
DISCONNECTED
```

---

# 39. OAUTH FLOW

General:

```text
User
 ↓
Connect Platform
 ↓
Authorization
 ↓
Consent
 ↓
Callback
 ↓
Authorization Code
 ↓
Server Token Exchange
 ↓
Access Token
+
Refresh Token
 ↓
Connected Account
```

TikTok Login Kit menggunakan OAuth 2.0 dan authorization code flow; user dapat memberikan atau menolak scope yang diminta, sehingga system harus menyimpan scope aktual yang diberikan, bukan hanya scope yang diminta.

---

# 40. STATE PARAMETER

OAuth flow harus menggunakan:

```text
state
```

yang:

```text
random
unguessable
single-use
validated
```

untuk mencegah CSRF.

TikTok juga mendokumentasikan penggunaan `state` sebagai perlindungan terhadap CSRF dalam Login Kit dan TikTok Shop authorization.

---

# 41. SCOPE REGISTRY

System memiliki:

```text
Scope Registry
```

Contoh:

```text
provider
scope
description
risk
required_for
approval_status
```

---

# 42. GRANTED SCOPES

Jangan hanya menyimpan:

```text
requested_scopes
```

tetapi:

```text
granted_scopes
```

karena user dapat hanya menyetujui sebagian scope.

TikTok secara eksplisit menyatakan user dapat memberikan subset dari scope yang diminta.

---

# 43. PERMISSION MATRIX

Contoh:

| Action | Required Permission | Risk |
|---|---|---|
| Read Analytics | READ | LOW |
| Create Draft | WRITE | LOW |
| Schedule | WRITE | MEDIUM |
| Publish | PUBLISH | HIGH |
| Delete | DELETE | HIGH |
| Financial Action | FINANCIAL | CRITICAL |

---

# 44. DOUBLE AUTHORIZATION

External action harus melewati:

```text
Affiliate OS Permission
        +
External Platform Authorization
```

Contoh:

```text
User punya role Operator
```

tidak otomatis berarti:

```text
TikTok API publish permission
```

tersedia.

---

# 45. TIKTOK ACCOUNT MODEL

Untuk TikTok:

```text
Workspace
   ↓
Connected Account
   ↓
TikTok User
   ↓
Granted Scopes
   ↓
Connection
```

---

# 46. TIKTOK SHOP ACCOUNT MODEL

TikTok Shop harus dibedakan berdasarkan authorization/entity type.

```text
Seller
Creator
Partner
```

TikTok Shop saat ini mendokumentasikan tipe authorization berbeda untuk seller, creator, dan partner, dengan token/entity boundary yang berbeda.

---

# 47. SELLER BOUNDARY

```text
Seller
 ↓
Shop
 ↓
Products
Orders
Inventory
```

---

# 48. CREATOR BOUNDARY

```text
Creator
 ↓
Affiliate Data
Content
Promotion
Performance
```

---

# 49. PARTNER BOUNDARY

```text
Partner
 ↓
Partner-level Business Data
```

Jangan mencampur token antar boundary.

TikTok Shop menegaskan bahwa seller access token tidak boleh digunakan untuk creator/partner APIs, dan sebaliknya; endpoint juga memiliki entity tag dan scope masing-masing.

---

# 50. SHOP ENTITY

Jika seller memiliki beberapa shop:

```text
Seller
│
├── Shop A
├── Shop B
└── Shop C
```

maka:

```text
Seller Account
```

tidak sama dengan:

```text
Shop
```

---

# 51. SHOP ACCESS

System harus menyimpan:

```text
shop_id
external_shop_id
seller_account_id
market
status
```

dan jika platform menggunakan encrypted identifier/cipher, simpan reference sesuai aturan connector, bukan mencoba menganggapnya sebagai plain ID. TikTok Shop mendokumentasikan bahwa beberapa entity tag membutuhkan identifier seperti `shop_cipher`.

---

# 52. ACCOUNT LINKING

User dapat:

```text
[ + CONNECT ACCOUNT ]
```

kemudian memilih:

```text
TikTok
TikTok Shop
```

---

# 53. ACCOUNT LINKING FLOW

```text
Select Platform
      ↓
Select Account Type
      ↓
Authorization
      ↓
Receive Callback
      ↓
Resolve Identity
      ↓
Create Connection
      ↓
Validate Scopes
      ↓
Create Connected Account
      ↓
Ready
```

---

# 54. DUPLICATE ACCOUNT DETECTION

Jika account external yang sama sudah terhubung:

```text
DO NOT CREATE DUPLICATE
```

System:

```text
Detect
→
Resolve
→
Reuse / Reconnect
```

---

# 55. ACCOUNT DISCONNECT

User dapat:

```text
[ DISCONNECT ]
```

tetapi disconnect tidak otomatis menghapus historical data.

State:

```text
CONNECTED
↓
DISCONNECTED
```

Historical analytics tetap tersedia sesuai retention policy.

---

# 56. TOKEN REVOCATION

Jika authorization external dicabut:

```text
Connection
↓
REVOKED
```

System:

```text
STOP EXECUTION
+
NOTIFY USER
```

---

# 57. TOKEN REFRESH

Jika token dapat direfresh:

```text
Access Token
      ↓
Expired / Near Expiry
      ↓
Refresh Token
      ↓
New Access Token
```

Refresh failure:

```text
AUTH_REQUIRED
```

---

# 58. NO SECRET EXPOSURE

Jangan tampilkan:

```text
access_token
refresh_token
client_secret
```

di:

```text
UI
Logs
Events
Analytics
Error Messages
```

---

# 59. ACCOUNT HEALTH

Setiap connected account memiliki:

```text
Account Health
```

Contoh:

```text
CONNECTED
Scopes: 5/5
Token: Healthy
API: Healthy
Last Sync: 4 min ago
```

---

# 60. CONNECTION HEALTH

Metrics:

```text
Authorization Health
Token Health
API Health
Webhook Health
Sync Health
Permission Health
```

---

# 61. ACCOUNT STATUS

```text
ACTIVE
PAUSED
AUTH_REQUIRED
ERROR
DISCONNECTED
SUSPENDED
```

---

# 62. ACCOUNT-LEVEL GUARDRAIL

Automation policy dapat dibatasi:

```text
Per Account
Per Workspace
Per Organization
Per Platform
```

Contoh:

```text
TikTok Account A
→ Max 5 automated publishing actions/day
```

---

# 63. RESOURCE OWNERSHIP

Setiap resource penting memiliki:

```text
organization_id
workspace_id
created_by
```

dan jika relevan:

```text
connected_account_id
```

---

# 64. DATA ACCESS QUERY

Setiap query harus secara konseptual dimulai dari:

```text
TENANT SCOPE
```

sebelum:

```text
RESOURCE FILTER
```

Contoh:

```text
organization_id = current_org
AND
workspace_id = current_workspace
AND
content_id = requested_content
```

---

# 65. TENANT ISOLATION

Rule:

> Tidak ada API endpoint yang boleh menerima `resource_id` saja lalu menganggap resource tersebut boleh diakses.

Harus ada:

```text
Identity
+
Tenant
+
Authorization
+
Resource Ownership
```

---

# 66. IDOR PROTECTION

Jika User A mencoba:

```text
GET /content/content_B
```

sementara:

```text
content_B
```

milik tenant lain:

```text
403
```

atau response yang sesuai security policy.

---

# 67. SERVICE-TO-SERVICE IDENTITY

Future internal services juga memiliki:

```text
Service Identity
```

Contoh:

```text
performance-service
automation-service
intelligence-service
```

---

# 68. MACHINE ACTOR

Execution dari Module 13 harus memiliki actor:

```text
actor_type = SYSTEM
```

atau:

```text
actor_type = USER
```

atau:

```text
actor_type = AI
```

---

# 69. ACTOR TRACEABILITY

Contoh:

```text
User
 ↓
Recommendation
 ↓
AI
 ↓
Workflow
 ↓
System
 ↓
TikTok
```

Audit trail harus dapat menunjukkan seluruh chain.

---

# 70. AI IDENTITY

AI tidak boleh dianggap sebagai:

```text
SUPERUSER
```

AI memiliki permission yang diberikan oleh system.

```text
AI
↓
Allowed Tools
↓
Allowed Actions
↓
Policy
```

---

# 71. ROLE HIERARCHY

Contoh:

```text
OWNER
 ↓
ADMIN
 ↓
MANAGER
 ↓
OPERATOR
 ↓
ANALYST
 ↓
VIEWER
```

Tetapi role hierarchy bukan satu-satunya authorization mechanism.

Resource-level restrictions tetap berlaku.

---

# 72. OWNER

Owner dapat:

```text
Manage Organization
Manage Members
Manage Billing
Manage Connections
Manage Workspaces
```

sesuai policy aplikasi.

---

# 73. ADMIN

Admin dapat:

```text
Manage Members
Manage Workspace
Manage Connections
Manage Operational Settings
```

tetapi tidak otomatis memiliki financial authority.

---

# 74. OPERATOR

Operator:

```text
Run Workflow
Create Content
Manage Execution
Review Tasks
```

tetapi:

```text
Publish
Financial
Critical
```

dapat membutuhkan additional permission/approval.

---

# 75. ANALYST

Analyst:

```text
Read Analytics
Read Performance
Read Revenue
Read Experiments
```

tanpa execution permission.

---

# 76. VIEWER

Viewer:

```text
Read-only
```

---

# 77. INVITATION SYSTEM

Organization admin dapat:

```text
Invite User
```

Flow:

```text
Invite
 ↓
Pending
 ↓
Accept
 ↓
Create/Link User
 ↓
Membership Active
```

---

# 78. INVITE SECURITY

Invitation harus memiliki:

```text
token
expires_at
invited_email
organization_id
role
status
```

Token harus:

```text
single-use
expirable
unguessable
```

---

# 79. ACCOUNT SWITCHER

User dengan banyak workspace/account membutuhkan:

```text
Workspace Switcher
```

dan:

```text
Account Switcher
```

Contoh:

```text
Current Workspace:
Main Affiliate

Connected Account:
TikTok Creator A
```

---

# 80. ACTIVE CONTEXT

Setiap request harus memiliki context:

```text
user
organization
workspace
connected_account
```

jika diperlukan.

---

# 81. CONTEXT VALIDATION

System harus memastikan:

```text
Current User
belongs to Organization
```

dan:

```text
Current User
has access to Workspace
```

dan:

```text
Workspace
owns/has access to Connected Account
```

---

# 82. CROSS-WORKSPACE ACCESS

Default:

```text
DENY
```

Cross-workspace access hanya jika policy mengizinkan.

---

# 83. AGENCY MODEL

Future:

```text
Agency Organization
│
├── Client Workspace A
├── Client Workspace B
└── Client Workspace C
```

Setiap client:

```text
Data
Accounts
Content
Analytics
Execution
```

terisolasi.

---

# 84. WHITE-LABEL FUTURE

Architecture dapat mendukung:

```text
Organization
→
Custom Branding
→
Custom Domain
→
Custom Roles
```

tanpa mengubah core identity system.

---

# 85. AUDIT

Identity system harus mencatat:

```text
login
logout
invite
accept_invite
role_changed
permission_changed
account_connected
account_disconnected
scope_changed
token_refreshed
authorization_revoked
```

---

# 86. SECURITY EVENTS

Contoh:

```text
auth.failed
auth.success
session.revoked
permission.denied
connection.expired
connection.revoked
suspicious.access
```

Event tersebut masuk ke Module 14.

---

# 87. IDENTITY → DATA

Module 14 harus dapat menggunakan:

```text
organization_id
workspace_id
account_id
actor_id
```

untuk data lineage dan isolation.

---

# 88. IDENTITY → EXECUTION

Module 13 harus menerima:

```text
actor
workspace
connected_account
permission
approval_policy
```

sebelum execution.

---

# 89. IDENTITY → INTELLIGENCE

Module 12 harus mengetahui:

```text
Which workspace?
Which account?
Which market?
Which creator?
Which product?
```

sehingga recommendation tidak salah konteks.

---

# 90. CANONICAL IDENTITY GRAPH

```text
                    USER
                     │
                     ▼
                MEMBERSHIP
                     │
                     ▼
                ORGANIZATION
                     │
                     ▼
                 WORKSPACE
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       CONTENT    PRODUCT    EXPERIMENT
          │
          ▼
   CONNECTED ACCOUNT
          │
      ┌───┴────┐
      ▼        ▼
    TIKTOK   TIKTOK SHOP
      │        │
      ▼        ▼
   CREATOR   SELLER/SHOP
```

---

# 91. SYSTEM ARCHITECTURE

```text
                 USER
                  │
                  ▼
           AUTHENTICATION
                  │
                  ▼
          IDENTITY SERVICE
                  │
                  ▼
         TENANT CONTEXT
                  │
       ┌──────────┴──────────┐
       ▼                     ▼
 ORGANIZATION             WORKSPACE
       │                     │
       └──────────┬──────────┘
                  ▼
             RBAC / ABAC
                  │
                  ▼
          ACCOUNT MANAGER
                  │
                  ▼
        CONNECTION MANAGER
                  │
          ┌───────┴────────┐
          ▼                ▼
       TikTok          TikTok Shop
          │                │
          └───────┬────────┘
                  ▼
             DATA LAYER
                  │
                  ▼
            EVENT SYSTEM
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
  INTELLIGENCE EXECUTION PERFORMANCE
```

---

# 92. CORE DATA MODEL

```text
User
Organization
OrganizationMembership
Workspace
WorkspaceMembership
Role
Permission
RolePermission
Session
Invitation
Platform
ExternalIdentity
ConnectedAccount
Connection
GrantedScope
AccountPermission
AccountHealth
AuditLog
SecurityEvent
```

---

# 93. CORE SERVICES

```text
Authentication Service
Identity Service
Organization Service
Workspace Service
Membership Service
RBAC Service
Authorization Service
Session Service
Invitation Service
Account Service
Connection Service
OAuth Service
Scope Service
Account Health Service
Audit Service
Security Service
```

---

# 94. MVP SCOPE

### BUILD NOW

```text
✓ User authentication
✓ User profile
✓ Organization
✓ Workspace
✓ Membership
✓ Basic RBAC
✓ Permission model
✓ Session management
✓ Invitation
✓ Connected Account
✓ Connection object
✓ OAuth abstraction
✓ Scope registry
✓ Granted scopes
✓ Account linking
✓ Account disconnect
✓ Token status
✓ Account health
✓ Tenant isolation
✓ Resource ownership
✓ Audit trail
✓ Security events
✓ TikTok identity connector
✓ TikTok Shop identity connector
✓ Module 14 integration
✓ Module 13 integration
```

---

# 95. MVP ROLES

Minimal:

```text
OWNER
ADMIN
OPERATOR
ANALYST
VIEWER
```

Tidak perlu membuat puluhan role di MVP.

---

# 96. MVP TENANCY

```text
Organization
   ↓
Workspace
   ↓
Resources
```

Dengan:

```text
organization_id
workspace_id
```

sebagai primary isolation boundary.

---

# 97. MVP ACCOUNT CONNECTORS

```text
1. TikTok
2. TikTok Shop
```

TikTok Login Kit menggunakan OAuth 2.0 untuk autentikasi dan authorization, sedangkan TikTok Shop memiliki authorization flow berbeda untuk seller, creator, dan partner. Karena itu connector layer harus mempertahankan provider-specific authorization strategy di balik interface yang sama.

---

# 98. NOT MVP

```text
✗ Enterprise SSO
✗ SCIM
✗ Advanced ABAC
✗ Complex organization hierarchy
✗ Cross-tenant federation
✗ Multi-region identity replication
✗ Zero-trust service mesh
✗ Advanced delegated administration
✗ Full white-label identity
```

---

# 99. FUTURE

```text
Enterprise SSO
SCIM
Advanced ABAC
Fine-Grained Resource Authorization
Delegated Administration
Organization Hierarchies
Cross-Organization Collaboration
Identity Federation
Passkeys
Device Trust
Risk-Based Authentication
Advanced Security Analytics
```

---

# 100. THE REAL MOAT

Moat Module 15 bukan:

```text
LOGIN
```

tetapi:

```text
IDENTITY
+
ACCOUNT GRAPH
+
TENANT CONTEXT
+
PERMISSION
+
PLATFORM AUTHORIZATION
+
EXECUTION CONTEXT
```

Semakin banyak account yang terhubung:

```text
MORE ACCOUNTS
      ↓
MORE IDENTITY DATA
      ↓
MORE ACCOUNT CONTEXT
      ↓
BETTER PERSONALIZATION
      ↓
BETTER EXECUTION
```

---

# 101. CORE SECURITY PRINCIPLE

Affiliate OS harus selalu berpikir:

```text
WHO?
+
WHICH TENANT?
+
WHICH WORKSPACE?
+
WHICH ACCOUNT?
+
WHICH PERMISSION?
+
WHICH EXTERNAL SCOPE?
+
WHICH ACTION?
```

sebelum memberikan akses.

---

# 102. FINAL DEFINITION

> **Affiliate Identity, Account & Tenancy Architecture adalah identity and access backbone yang menghubungkan user dengan organization, workspace, connected platform account, external identity, authorization scope, permission, dan execution context, sekaligus memastikan ownership, tenant isolation, auditability, dan secure account connection di seluruh Affiliate OS.**

---

# 103. SCOPE LOCK

**15 — AFFILIATE IDENTITY, ACCOUNT & TENANCY ARCHITECTURE v1.0 — APPROVED**

Core:

```text
AUTHENTICATE
→
IDENTIFY
→
RESOLVE TENANT
→
RESOLVE WORKSPACE
→
RESOLVE ACCOUNT
→
AUTHORIZE
→
EXECUTE
→
AUDIT
```

---

# 104. NEXT MODULE

```text
16 — AFFILIATE SECURITY, POLICY & GOVERNANCE ENGINE v1.0
```

Fokus Module 16:

```text
Security Architecture
Policy Engine
Permission Enforcement
Risk Engine
Approval Policy
Content Policy
Platform Policy
Data Privacy
Secret Management
Encryption
Audit
Fraud Prevention
Abuse Prevention
AI Safety
Execution Guardrails
Compliance
Incident Response
```

Karena sekarang:

```text
12 = BRAIN 🧠
13 = HANDS ⚙️
14 = NERVOUS SYSTEM + DATA 🧬
15 = IDENTITY + ACCOUNT 🔐
```

maka **16 = SECURITY + GOVERNANCE 🛡️**.

Ini yang akan menjadi lapisan yang memastikan seluruh otak, tangan, data, dan account Affiliate OS **tidak bisa bergerak di luar batas yang diizinkan**.