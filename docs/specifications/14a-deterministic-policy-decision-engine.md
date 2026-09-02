# 14A. DETERMINISTIC POLICY DECISION ENGINE

Tujuan:

> Setiap policy request dengan **context yang sama** harus menghasilkan **decision yang sama**, tanpa bergantung pada AI, urutan request, UI, atau interpretasi manusia.

Core principle:

```text
SAME INPUT
+
SAME POLICY VERSION
+
SAME SYSTEM STATE
=
SAME DECISION
```

---

# 14B. POLICY DECISION OUTPUT

Policy Engine hanya mengeluarkan decision canonical:

```text
ALLOW
DENY
REQUIRE_APPROVAL
REQUIRE_REAUTH
REQUIRE_RECONNECT
REQUIRE_REVIEW
RATE_LIMITED
SUSPENDED
```

Tidak boleh menghasilkan:

```text
MAYBE
PROBABLY
LIKELY
AI_RECOMMENDATION
```

untuk authorization decision.

---

# 14C. DECISION OBJECT

```text
PolicyDecision
```

Fields:

```text
decision_id
decision
reason_codes[]
policy_ids[]
policy_versions[]
risk_level
required_permissions[]
required_scopes[]
approval_required
reauth_required
reconnect_required
retry_after
evaluated_at
policy_context_hash
```

---

# 14D. DECISION PRECEDENCE

Policy Engine menggunakan urutan tetap:

```text
1. SYSTEM EMERGENCY
2. TENANT SUSPENSION
3. ACCOUNT SUSPENSION
4. AUTHENTICATION
5. TENANT ISOLATION
6. RESOURCE OWNERSHIP
7. EXTERNAL CONNECTION
8. EXTERNAL SCOPE
9. INTERNAL PERMISSION
10. CONTENT / DATA POLICY
11. RISK POLICY
12. APPROVAL POLICY
13. RATE LIMIT
14. ALLOW
```

Decision tidak boleh melompati level sebelumnya.

---

# 14E. HARD DENY

Hard deny selalu menang.

```text
IF
system_status = EMERGENCY_STOP

THEN
DENY
```

```text
IF
account_status = SUSPENDED

THEN
DENY
```

```text
IF
tenant_access = FALSE

THEN
DENY
```

```text
IF
required_scope = MISSING

THEN
DENY
```

Tidak boleh diubah menjadi `ALLOW` oleh policy dengan priority lebih rendah.

---

# 14F. CONTROLLED BLOCK

Tidak semua kegagalan adalah DENY permanen.

Mapping:

```text
NOT_AUTHENTICATED
→ REQUIRE_REAUTH

CONNECTION_EXPIRED
→ REQUIRE_RECONNECT

APPROVAL_MISSING
→ REQUIRE_APPROVAL

CONTENT_REVIEW_REQUIRED
→ REQUIRE_REVIEW

RATE_LIMIT_EXCEEDED
→ RATE_LIMITED

PERMISSION_MISSING
→ DENY
```

---

# 14G. POLICY EVALUATION ORDER

Engine harus mengevaluasi secara deterministic:

```text
REQUEST
 ↓
1. Validate Request
 ↓
2. Resolve Identity
 ↓
3. Resolve Tenant
 ↓
4. Resolve Workspace
 ↓
5. Resolve Account
 ↓
6. Check Account State
 ↓
7. Check Connection
 ↓
8. Check External Scope
 ↓
9. Check Internal Permission
 ↓
10. Check Resource Policy
 ↓
11. Check Content/Data Policy
 ↓
12. Calculate Risk
 ↓
13. Check Approval
 ↓
14. Check Rate Limit
 ↓
15. FINAL DECISION
```

---

# 14H. FIRST-FAIL RULE

Untuk hard security failures:

```text
FIRST HARD FAILURE
=
FINAL DENY
```

Contoh:

```text
Permission = MISSING
Scope = MISSING
Risk = HIGH
```

Result:

```text
DENY
```

bukan:

```text
REQUIRE_APPROVAL
```

karena approval tidak dapat memberikan permission yang tidak dimiliki.

---

# 14I. APPROVAL CANNOT OVERRIDE SECURITY

Approval hanya dapat memenuhi:

```text
APPROVAL_REQUIREMENT
```

Approval tidak dapat memberikan:

```text
Missing Permission
Missing External Scope
Invalid Tenant
Revoked Connection
Suspended Account
System Emergency Stop
```

---

# 14J. RISK DOES NOT CREATE PERMISSION

Risk engine:

```text
Risk
```

tidak boleh mengubah:

```text
DENY
```

menjadi:

```text
ALLOW
```

Risk hanya dapat meningkatkan control:

```text
LOW
→ ALLOW

MEDIUM
→ APPROVAL

HIGH
→ APPROVAL + REVIEW

CRITICAL
→ DENY / EXPLICIT CONTROL
```

sesuai policy.

---

# 14K. EXPLICIT POLICY TABLE

Setiap action harus memiliki canonical policy definition.

Contoh:

| Action | Permission | Scope | Risk | Default |
|---|---|---|---|---|
| `content.read` | `content.read` | read | LOW | ALLOW |
| `content.create` | `content.create` | write | LOW | ALLOW |
| `content.schedule` | `content.schedule` | write | MEDIUM | APPROVAL |
| `content.publish` | `content.publish` | publish | HIGH | APPROVAL |
| `content.delete` | `content.delete` | delete | HIGH | APPROVAL |
| `workflow.run` | `workflow.run` | execution | MEDIUM | ALLOW |
| `account.disconnect` | `connection.manage` | account | HIGH | APPROVAL |
| `ownership.transfer` | `ownership.transfer` | admin | CRITICAL | REAUTH + APPROVAL |

---

# 14L. ACTION REGISTRY

Tidak boleh ada arbitrary action string yang langsung dieksekusi.

Setiap action harus terdaftar:

```text
ActionRegistry
```

Fields:

```text
action_id
category
required_permissions[]
required_scopes[]
default_risk
default_decision
approval_policy
resource_type
executor
```

Jika:

```text
action_id
```

tidak terdaftar:

```text
DENY
```

---

# 14M. UNKNOWN RESOURCE

Jika resource tidak ditemukan:

```text
NOT_FOUND
```

Jika resource ditemukan tetapi bukan milik tenant:

```text
ACCESS_DENIED
```

System tidak boleh membocorkan informasi lintas tenant.

---

# 14N. POLICY CONFLICT

Jika dua policy menghasilkan:

```text
ALLOW
```

dan:

```text
DENY
```

maka:

```text
DENY WINS
```

Jika:

```text
ALLOW
+
REQUIRE_APPROVAL
```

maka:

```text
REQUIRE_APPROVAL
```

Jika:

```text
REQUIRE_APPROVAL
+
DENY
```

maka:

```text
DENY
```

Canonical precedence:

```text
DENY
>
SUSPENDED
>
REQUIRE_REAUTH
>
REQUIRE_RECONNECT
>
REQUIRE_REVIEW
>
REQUIRE_APPROVAL
>
RATE_LIMITED
>
ALLOW
```

---

# 14O. POLICY PRIORITY

Priority hanya digunakan untuk menentukan policy applicability.

Contoh:

```text
Global Policy
Workspace Policy
Account Policy
Action Policy
```

Namun:

```text
ALLOW
```

tidak boleh mengalahkan:

```text
HARD DENY
```

---

# 14P. POLICY INHERITANCE

Inheritance:

```text
Organization
 ↓
Workspace
 ↓
Account
 ↓
Workflow
 ↓
Task
 ↓
Action
```

Default:

```text
CHILD POLICY
```

boleh memperketat policy parent.

Tetapi tidak boleh melemahkan hard security constraint.

Contoh:

```text
Organization:
Publish = APPROVAL
```

Workspace boleh:

```text
Publish = DENY
```

tetapi tidak boleh:

```text
Publish = ALLOW
```

---

# 14Q. DEFAULT DENY FOR UNDEFINED ACTIONS

Jika action tidak memiliki policy:

```text
NO POLICY
→ DENY
```

Jika resource type tidak memiliki authorization mapping:

```text
NO MAPPING
→ DENY
```

Jika external scope tidak diketahui:

```text
UNKNOWN SCOPE
→ DENY
```

---

# 14R. BOOLEAN POLICY MODEL

Untuk security-critical checks, gunakan boolean predicates.

Contoh:

```text
authenticated == true
tenant_member == true
resource_owned == true
account_active == true
connection_active == true
scope_granted == true
permission_granted == true
policy_allowed == true
```

Final:

```text
ALLOW
=
ALL_REQUIRED_PREDICATES == TRUE
```

---

# 14S. EXAMPLE

Request:

```text
User:
operator_123

Action:
content.publish

Workspace:
ws_001

Account:
tiktok_001
```

Evaluation:

```text
authenticated = TRUE
tenant_member = TRUE
resource_owned = TRUE
account_active = TRUE
connection_active = TRUE
scope_granted = TRUE
permission_granted = TRUE
content_policy = PASS
risk = HIGH
approval = REQUIRED
```

Final:

```text
REQUIRE_APPROVAL
```

---

# 14T. SECOND EXAMPLE — MISSING SCOPE

```text
authenticated = TRUE
tenant_member = TRUE
resource_owned = TRUE
account_active = TRUE
connection_active = TRUE
scope_granted = FALSE
permission_granted = TRUE
```

Final:

```text
DENY
```

Reason:

```text
EXTERNAL_SCOPE_MISSING
```

Approval tidak dapat mengubah hasil tersebut.

---

# 14U. THIRD EXAMPLE — SUSPENDED ACCOUNT

```text
authenticated = TRUE
tenant_member = TRUE
account_active = FALSE
connection_active = TRUE
permission_granted = TRUE
```

Final:

```text
DENY
```

Reason:

```text
ACCOUNT_SUSPENDED
```

---

# 14V. FOURTH EXAMPLE — EXPIRED CONNECTION

```text
account_active = TRUE
connection_active = FALSE
connection_status = EXPIRED
```

Final:

```text
REQUIRE_RECONNECT
```

Bukan:

```text
DENY
```

karena problem dapat dipulihkan melalui reauthorization.

---

# 14W. FIFTH EXAMPLE — RATE LIMIT

Semua authorization valid:

```text
permission = TRUE
scope = TRUE
policy = TRUE
risk = ACCEPTED
```

tetapi:

```text
rate_limit = EXCEEDED
```

Final:

```text
RATE_LIMITED
```

dengan:

```text
retry_after
```

---

# 14X. POLICY DECISION REASON CODES

Gunakan machine-readable codes.

Contoh:

```text
AUTH_REQUIRED
TENANT_ACCESS_DENIED
RESOURCE_ACCESS_DENIED
PERMISSION_MISSING
SCOPE_MISSING
ACCOUNT_SUSPENDED
CONNECTION_EXPIRED
CONNECTION_REVOKED
CONTENT_POLICY_FAILED
APPROVAL_REQUIRED
REAUTH_REQUIRED
RATE_LIMITED
EMERGENCY_STOP
ACTION_NOT_REGISTERED
POLICY_NOT_FOUND
```

UI kemudian menerjemahkannya menjadi human-readable message.

---

# 14Y. NO FREE-FORM SECURITY DECISION

AI/LLM boleh memberikan:

```text
RECOMMENDATION
```

tetapi tidak boleh menjadi sumber final:

```text
ALLOW / DENY
```

untuk security-critical authorization.

Architecture:

```text
AI
 ↓
Recommendation
 ↓
Deterministic Policy Engine
 ↓
Final Decision
```

---

# 14Z. POLICY INPUT NORMALIZATION

Sebelum evaluasi:

```text
Normalize
```

meliputi:

```text
action
user_id
tenant_id
workspace_id
account_id
resource_id
scope
role
status
timestamp
```

Canonical representation harus sama untuk request yang semantik-nya sama.

---

# 14AA. TIME-BASED POLICY

Jika policy bergantung pada waktu:

```text
current_time
timezone
policy_version
```

harus menjadi bagian dari policy context.

Contoh:

```text
Publishing allowed:
09:00–22:00
```

Decision di luar window:

```text
DENY
```

atau:

```text
REQUIRE_APPROVAL
```

sesuai policy.

---

# 14AB. DETERMINISTIC RETRY

Retry bukan policy bypass.

Jika:

```text
DENY
```

maka:

```text
RETRY
```

tidak boleh mengubah decision menjadi:

```text
ALLOW
```

Retry hanya boleh digunakan untuk:

```text
TRANSIENT SYSTEM ERROR
RATE LIMIT
TEMPORARY CONNECTOR FAILURE
```

---

# 14AC. IDEMPOTENT POLICY EVALUATION

Policy evaluation harus aman dipanggil berkali-kali.

```text
Evaluate(Request X)
→ DENY

Evaluate(Request X)
→ DENY

Evaluate(Request X)
→ DENY
```

Tidak boleh menghasilkan state berbeda hanya karena evaluation dipanggil ulang.

---

# 14AD. DECISION HASH

Setiap decision dapat menghasilkan:

```text
policy_context_hash
```

yang berasal dari canonicalized:

```text
policy_version
+
action
+
identity_context
+
resource_context
+
account_context
+
risk_inputs
```

Tujuannya:

```text
TRACE
DEBUG
REPRODUCE
AUDIT
```

---

# 14AE. POLICY RE-EVALUATION

Decision tidak boleh dianggap permanen.

Untuk long-running workflow:

```text
APPROVED
 ↓
WAIT
 ↓
STATE CHANGED
 ↓
RE-EVALUATE
 ↓
EXECUTE
```

Jika policy/context berubah:

```text
OLD APPROVAL
≠
AUTOMATICALLY VALID
```

---

# 14AF. PRE-EXECUTION FINAL CHECK

Module 13 harus melakukan:

```text
FINAL POLICY CHECK
```

tepat sebelum sensitive external execution.

Flow:

```text
Workflow
 ↓
Task Ready
 ↓
Policy Evaluation
 ↓
Approval
 ↓
State Validation
 ↓
FINAL POLICY CHECK
 ↓
Connector
```

---

# 14AG. POST-EXECUTION POLICY CHECK

Setelah execution:

```text
Result
 ↓
Validate Side Effect
 ↓
Audit
 ↓
Security Event
```

Jika side effect tidak sesuai expected policy:

```text
FLAG
+
PAUSE RELATED AUTOMATION
```

---

# 14AH. POLICY TEST SUITE

Setiap policy harus memiliki test cases:

```text
ALLOW CASE
DENY CASE
MISSING PERMISSION
MISSING SCOPE
SUSPENDED ACCOUNT
EXPIRED CONNECTION
APPROVAL CASE
RATE LIMIT CASE
TENANT ISOLATION CASE
EMERGENCY CASE
```

---

# 14AI. POLICY REGRESSION TEST

Setiap perubahan policy:

```text
NEW POLICY
 ↓
REGRESSION TEST
 ↓
COMPARE OLD/NEW DECISIONS
 ↓
REVIEW
 ↓
DEPLOY
```

Perubahan tidak boleh diam-diam mengubah critical decisions.

---

# 14AJ. POLICY OBSERVABILITY

Dashboard minimum:

```text
Total Decisions
Allow Rate
Deny Rate
Approval Rate
Reconnect Rate
Reauth Rate
Rate-Limited Rate
Top Deny Reasons
Top Policy Conflicts
Policy Version Usage
```

---

# 14AK. DETERMINISTIC POLICY ACCEPTANCE CRITERIA

MVP dianggap PASS jika:

```text
AC-P01
Request dengan context identik menghasilkan decision identik.

AC-P02
Unknown action selalu DENY.

AC-P03
Missing permission selalu DENY.

AC-P04
Missing external scope selalu DENY.

AC-P05
Cross-tenant resource access selalu DENY.

AC-P06
Suspended account tidak dapat execute.

AC-P07
Revoked connection tidak dapat execute.

AC-P08
Approval tidak dapat override security hard-deny.

AC-P09
Policy conflict menggunakan deterministic precedence.

AC-P10
Policy version tercatat pada setiap sensitive decision.

AC-P11
Decision memiliki machine-readable reason code.

AC-P12
AI tidak dapat langsung menghasilkan final security authorization.

AC-P13
Retry tidak dapat bypass DENY.

AC-P14
Long-running workflow melakukan policy re-check sebelum sensitive execution.

AC-P15
Policy changes memiliki regression test.

AC-P16
Decision dapat direproduksi dari policy context yang tersimpan.

AC-P17
Final execution dari Module 13 tidak dapat bypass Policy Engine.

AC-P18
Emergency kill switch selalu memiliki precedence tertinggi.
```

---

# 14AL. FINAL DETERMINISTIC RULE

Core rule Module 16:

```text
IF
ALL REQUIRED SECURITY CONDITIONS
=
TRUE

AND

NO HARD DENY
EXISTS

AND

ALL REQUIRED EXTERNAL SCOPES
=
GRANTED

AND

ALL REQUIRED PERMISSIONS
=
GRANTED

AND

ALL REQUIRED APPROVALS
=
VALID

THEN
ALLOW

ELSE
CONTROLLED DECISION
```

Dengan hierarchy:

```text
HARD DENY
    >
SECURITY CONTROL
    >
REAUTH / RECONNECT
    >
REVIEW
    >
APPROVAL
    >
RATE LIMIT
    >
ALLOW
```

---

# 14AM. GOVERNANCE PRINCIPLE

**Policy Engine harus menjadi deterministic control plane, bukan AI judgment layer.**

```text
AI
→ suggests

Human
→ approves where required

Policy Engine
→ decides

Execution Engine
→ executes

Audit System
→ records
```

Ini menjadi boundary arsitektur yang sangat penting untuk Affiliate OS.