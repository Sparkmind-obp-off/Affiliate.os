# ADDENDUM — MODULE 15
# MVP ACCEPTANCE CRITERIA & IDENTITY BOUNDARY HARDENING

Tambahan ini melengkapi:

**15 — AFFILIATE IDENTITY, ACCOUNT & TENANCY ARCHITECTURE v1.0**

Tujuannya bukan memperbesar scope Module 15, tetapi memastikan identity, tenancy, workspace, role, dan connected account sudah memiliki **contract yang cukup kuat** untuk digunakan Module 16 dan Module 17.

---

# 1. TENANCY INVARIANTS

Hierarchy wajib:

```text
ORGANIZATION
    ↓
WORKSPACE
    ↓
USER
    ↓
ROLE
    ↓
CONNECTED ACCOUNT
```

Invariant:

```text
ACCOUNT
MUST BELONG TO WORKSPACE

WORKSPACE
MUST BELONG TO ORGANIZATION

USER
MUST HAVE VALID MEMBERSHIP

ROLE
MUST BE SCOPED TO TENANT
```

Tidak boleh terdapat:

```text
ACCOUNT → WORKSPACE B
USER → WORKSPACE B
```

melalui request dari:

```text
WORKSPACE A
```

---

# 2. IDENTITY ≠ EXTERNAL ACCOUNT

Internal identity:

```text
Affiliate OS User
```

harus selalu berbeda dari:

```text
TikTok User
TikTok Shop Creator
TikTok Shop Seller
```

External identity hanya menjadi:

```text
Connected Account
```

Contoh:

```text
Affiliate OS User
      ↓
Workspace
      ↓
TikTok Account A
      ↓
TikTok Account B
```

Satu user dapat memiliki beberapa external accounts tanpa membuat beberapa internal identity.

---

# 3. CONNECTED ACCOUNT IDENTITY CONTRACT

Minimal:

```text
ConnectedAccount
```

memiliki:

```text
id
tenant_id
workspace_id
user_id
platform
external_account_id
account_type
connection_status
credential_reference
granted_scopes
created_at
updated_at
last_connected_at
last_verified_at
```

---

# 4. ACCOUNT OWNERSHIP

System harus dapat membedakan:

```text
ACCOUNT OWNER
ACCOUNT MANAGER
ACCOUNT OPERATOR
ACCOUNT VIEWER
```

Tidak semua user yang dapat melihat account otomatis boleh:

```text
CONNECT
DISCONNECT
REAUTH
PUBLISH
DELETE
```

Authorization tersebut tetap diputuskan Module 16.

---

# 5. CONNECTION STATE MACHINE

Canonical state:

```text
NOT_CONNECTED
      ↓
CONNECTING
      ↓
CONNECTED
      ↓
AUTH_REQUIRED
      ↓
EXPIRED
      ↓
RECONNECTING
      ↓
CONNECTED
```

Terminal/security states:

```text
REVOKED
SUSPENDED
ERROR
DISCONNECTED
```

---

# 6. CONNECTION STATE INVARIANT

Jika:

```text
REVOKED
```

maka system tidak boleh memperlakukan account sebagai:

```text
CONNECTED
```

Jika:

```text
EXPIRED
```

maka execution layer harus mengetahui:

```text
AUTH_REQUIRED / RECONNECT
```

Jika:

```text
SUSPENDED
```

maka account tidak boleh digunakan untuk automated execution.

---

# 7. GRANTED SCOPE SNAPSHOT

Module 15 menyimpan:

```text
granted_scopes[]
```

sebagai snapshot authorization.

Tetapi:

> Scope yang tersimpan bukan pengganti live authorization/policy check.

Flow:

```text
Stored Scope
     ↓
Current Connection State
     ↓
Module 16 Policy
     ↓
Module 17 Capability Check
```

Ini penting karena TikTok membedakan scope authorization dan status token/account; misalnya `scope_not_authorized` atau `access_token_invalid` dapat terjadi walaupun account object masih tercatat di system.

---

# 8. ACCOUNT DISCONNECT CONTRACT

Disconnect harus menghasilkan:

```text
ACCOUNT STATUS UPDATE
+
TOKEN INVALIDATION / REVOCATION HANDLING
+
AUDIT EVENT
+
AUTOMATION IMPACT
```

Contoh:

```text
Disconnect TikTok Account A
        ↓
Account = DISCONNECTED
        ↓
Related workflows = PAUSED
        ↓
Future execution = BLOCKED
        ↓
Audit Event
```

---

# 9. EXTERNAL DEAUTHORIZATION

Jika platform memberi event bahwa user mencabut authorization:

```text
External Deauthorization
        ↓
Connected Account
        ↓
REVOKED
        ↓
Stop Related Access
        ↓
Audit
        ↓
Notify
```

TikTok, misalnya, menyediakan event `authorization.removed` untuk deauthorization.

Module 15 harus menjadi **source of truth untuk local connection state** setelah event tersebut diproses oleh Module 17.

---

# 10. SESSION BOUNDARY

Internal session harus membawa:

```text
user_id
tenant_id
workspace_id
session_id
role_context
```

Tetapi:

```text
session
≠
external platform token
```

External token tidak boleh digunakan sebagai internal application session.

---

# 11. TOKEN REFERENCE

Module 15 hanya menyimpan:

```text
credential_reference
```

bukan raw token di entity biasa.

Architecture:

```text
ConnectedAccount
      ↓
credential_reference
      ↓
Secret Manager
      ↓
Access Token
```

---

# 12. ACCOUNT SWITCHING

Jika user berpindah:

```text
TikTok Account A
```

ke:

```text
TikTok Account B
```

system harus mengganti context:

```text
active_account_id
```

dan seluruh request berikutnya harus menggunakan account context baru.

Tidak boleh terjadi:

```text
UI = Account B
Backend = Account A
```

---

# 13. TENANT CONTEXT VALIDATION

Setiap request sensitive harus memiliki:

```text
tenant_id
workspace_id
user_id
```

Backend harus resolve context dari authenticated session/server-side state.

Jangan mempercayai:

```text
tenant_id
```

yang hanya dikirim dari frontend.

---

# 14. CROSS-TENANT TEST

Test wajib:

```text
User A
→ Tenant A
→ Request Account B
→ Tenant B
```

Expected:

```text
DENY
```

tanpa membocorkan detail resource Tenant B.

---

# 15. ROLE BOUNDARY

MVP roles:

```text
OWNER
ADMIN
OPERATOR
ANALYST
VIEWER
```

Baseline:

```text
OWNER
→ Full tenant administration

ADMIN
→ Workspace/account administration

OPERATOR
→ Operational execution

ANALYST
→ Read analytics/intelligence

VIEWER
→ Read-only
```

Exact action authorization tetap menjadi responsibility Module 16.

---

# 16. ROLE ≠ FINAL AUTHORIZATION

Module 15 menjawab:

```text
WHO IS THIS USER?
```

Module 16 menjawab:

```text
IS THIS ACTION ALLOWED?
```

Jangan memindahkan policy engine ke Module 15.

---

# 17. ACCOUNT CONTEXT CONTRACT

Module 15 harus menyediakan canonical context:

```text
IdentityContext
```

Minimal:

```text
user_id
tenant_id
workspace_id
role
account_id
platform
account_type
connection_status
granted_scopes
```

Context ini digunakan oleh:

```text
Module 16
Module 17
Module 13
```

---

# 18. ACCOUNT STATE EVENT

Setiap perubahan penting menghasilkan event:

```text
account.connected
account.reconnected
account.expired
account.revoked
account.suspended
account.disconnected
account.scope_changed
```

Event dikirim ke Module 14.

---

# 19. MULTI-ACCOUNT INVARIANT

Satu workspace dapat memiliki:

```text
TikTok Account A
TikTok Account B
TikTok Shop Account C
```

dan setiap account harus tetap memiliki:

```text
independent connection state
independent credentials
independent scopes
independent audit context
```

---

# 20. ACCOUNT ISOLATION

Jika:

```text
TikTok Account A
```

bermasalah:

```text
EXPIRED
```

maka:

```text
TikTok Account B
```

tidak boleh ikut menjadi:

```text
EXPIRED
```

kecuali ada tenant/workspace-wide policy yang memang mengharuskannya.

---

# 21. MODULE 15 → MODULE 16 CONTRACT

Module 15 menyediakan:

```text
Identity
Tenant
Workspace
Role
Account
Connection
Scope
```

Module 16 melakukan:

```text
Permission
Policy
Risk
Approval
Governance
```

Boundary:

```text
15 = WHO + WHICH ACCOUNT

16 = WHETHER ALLOWED
```

---

# 22. MODULE 15 → MODULE 17 CONTRACT

Module 17 menerima:

```text
ConnectedAccount
+
ConnectionState
+
CredentialReference
+
GrantedScopes
+
Platform
+
AccountType
```

Module 17 kemudian melakukan:

```text
Capability Mapping
+
Provider Adapter
+
External API Execution
```

---

# 23. MVP ACCEPTANCE CRITERIA

Module 15 MVP dianggap PASS apabila:

```text
AC-15-01
Organization dapat memiliki satu atau lebih workspace.

AC-15-02
Workspace selalu memiliki organization parent yang valid.

AC-15-03
User hanya dapat menjadi member pada workspace yang valid.

AC-15-04
Connected account selalu terikat ke workspace tertentu.

AC-15-05
Connected account tidak dapat digunakan lintas tenant.

AC-15-06
Internal user identity terpisah dari external platform identity.

AC-15-07
Satu user dapat memiliki multiple connected accounts.

AC-15-08
Setiap connected account memiliki independent connection state.

AC-15-09
Expired connection tidak dianggap CONNECTED.

AC-15-10
Revoked connection tidak dapat digunakan untuk execution.

AC-15-11
Suspended account tidak dapat digunakan untuk automated execution.

AC-15-12
Granted scopes tersimpan dan dapat dibaca oleh authorization layer.

AC-15-13
Credential raw tidak disimpan di regular account entity.

AC-15-14
Credential access menggunakan secure reference.

AC-15-15
Account switching mengubah backend execution context secara benar.

AC-15-16
Frontend tidak dapat menentukan tenant authorization hanya dengan mengirim tenant_id.

AC-15-17
Cross-tenant access selalu ditolak.

AC-15-18
Role assignment tersimpan dan dapat divalidasi.

AC-15-19
Role tidak menjadi pengganti policy engine Module 16.

AC-15-20
Account state changes menghasilkan event untuk Module 14.

AC-15-21
Deauthorization external platform dapat mengubah local connection state.

AC-15-22
Module 16 dapat memperoleh IdentityContext yang canonical.

AC-15-23
Module 17 dapat memperoleh ConnectedAccountContext yang canonical.

AC-15-24
Setiap connected account memiliki audit-relevant identity reference.

AC-15-25
Account A yang error tidak otomatis memengaruhi Account B.

AC-15-26
Deleted/disconnected account tidak dapat digunakan oleh workflow baru.

AC-15-27
Historical account reference tetap dapat digunakan untuk audit/history sesuai retention policy.

AC-15-28
Identity/tenant/account context dapat ditelusuri menggunakan correlation_id.

AC-15-29
MVP dapat menjalankan multi-account dalam satu workspace tanpa mencampur credential atau scope.

AC-15-30
Semua sensitive account operations memiliki server-side authorization boundary melalui Module 16.
```

---

# 24. DEFINITION OF DONE

Module 15 MVP dianggap **LOCKED** apabila:

```text
USER
 ↓
ORGANIZATION
 ↓
WORKSPACE
 ↓
ROLE
 ↓
CONNECTED ACCOUNT
 ↓
CONNECTION STATE
 ↓
GRANTED SCOPE
```

dapat direpresentasikan secara konsisten.

Dan:

```text
Module 16
```

dapat mengambil:

```text
IdentityContext
```

sedangkan:

```text
Module 17
```

dapat mengambil:

```text
ConnectedAccountContext
```

tanpa membuat duplicate identity/account system.

---

# 25. SCOPE LOCK

Tambahan ini **tidak mengubah positioning Module 15**.

Module 15 tetap:

```text
IDENTITY
+
ACCOUNT
+
TENANCY
```

Bukan:

```text
SECURITY POLICY ENGINE
```

Bukan:

```text
CONNECTOR ENGINE
```

Bukan:

```text
OBSERVABILITY ENGINE
```

Bukan:

```text
WORKFLOW ENGINE
```

---

# 26. FINAL MODULE CONTRACT

```text
MODULE 15
WHO?
WHERE?
WHICH ACCOUNT?

        ↓

MODULE 16
MAY THIS ACTION HAPPEN?

        ↓

MODULE 17
HOW DOES THE EXTERNAL PLATFORM EXECUTE IT?

        ↓

MODULE 14
WHAT HAPPENED?

        ↓

MODULE 18
IS THE SYSTEM HEALTHY, RELIABLE,
OBSERVABLE, AND OPERABLE?
```

**MODULE 15 — HARDENED MVP ACCEPTANCE CONTRACT**