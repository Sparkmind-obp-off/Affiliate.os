# EXECUTION PROMPT — TASK 01
# AFFILIATE OS v1.0
## FOUNDATION, REPOSITORY INITIALIZATION & EXECUTION READINESS

---

## 0. ROLE

You are the **Implementation Agent for Affiliate OS v1.0**.

You must follow the previously provided:

> `MASTER SYSTEM PROMPT — AFFILIATE OS v1.0`

as the highest-level implementation instruction.

You must also treat the locked architecture documents as the source of truth:

```text
DOC 20 — SYSTEM ARCHITECTURE
DOC 21 — DATA MODEL & DATABASE SCHEMA
DOC 22 — API & INTEGRATION CONTRACT
DOC 23 — UX/UI ARCHITECTURE
DOC 24 — IMPLEMENTATION BLUEPRINT
DOC 25 — BILLING & MONETIZATION ARCHITECTURE
DOC 26 — ECOSYSTEM & DIGITAL COMMERCE ARCHITECTURE
```

---

# 1. TASK ID

```text
AFFILIATE-OS-FOUNDATION-001
```

Task name:

> **Repository Foundation, Architecture Inspection & Execution Readiness**

---

# 2. IMPORTANT — DO NOT BUILD THE WHOLE PRODUCT

This is NOT permission to build the entire Affiliate OS.

Do NOT implement all modules.

Do NOT build the complete SaaS.

Do NOT implement all billing functionality.

Do NOT implement the entire affiliate engine.

Do NOT create unnecessary features.

Do NOT consume large amounts of compute by attempting to complete the whole product.

This task exists to prepare the repository and establish a clean foundation for controlled task-by-task implementation.

---

# 3. PRIMARY OBJECTIVE

Your objective is to:

```text
INSPECT
 ↓
VALIDATE
 ↓
INITIALIZE
 ↓
STRUCTURE
 ↓
TEST
 ↓
COMMIT
 ↓
PUSH
```

At the end of this task, the repository must be ready for controlled implementation of the next tasks.

---

# 4. FIRST ACTION — INSPECT BEFORE MODIFYING

Before creating or changing files:

1. Inspect the current repository.
2. Inspect existing files.
3. Inspect existing package configuration.
4. Inspect existing Git configuration.
5. Inspect existing application structure.
6. Detect whether code already exists.
7. Detect whether a database configuration already exists.
8. Detect whether authentication already exists.
9. Detect whether Cloudflare configuration already exists.
10. Detect whether environment variables are already configured.
11. Detect whether the repository is already connected to GitHub.
12. Detect the current branch.
13. Detect the current Git status.
14. Detect whether there are uncommitted changes.

Do not overwrite existing work blindly.

---

# 5. EXISTING WORK PROTECTION

If the repository already contains meaningful code:

```text
DO NOT DELETE IT
DO NOT REWRITE IT
DO NOT RESET IT
DO NOT REPLACE IT
```

unless explicitly required by the architecture.

First understand what exists.

If existing code conflicts with the locked architecture:

```text
IDENTIFY
DOCUMENT
DO NOT SILENTLY DESTROY
```

---

# 6. ARCHITECTURE VALIDATION

After inspection, validate whether the current repository can support:

```text
MODULAR MONOLITH
+
FULL STACK APPLICATION
+
POSTGRESQL
+
AUTHENTICATION
+
TENANCY
+
API LAYER
+
CONNECTOR LAYER
+
EVENT INFRASTRUCTURE
+
BILLING
+
ECOSYSTEM
+
OBSERVABILITY
```

Do not implement all of these yet.

Only verify that the foundation can support them.

---

# 7. TARGET STACK

Unless existing architecture explicitly requires otherwise, use the locked implementation direction.

Preferred initial stack:

```text
Frontend:
React-compatible frontend appropriate to the selected Genspark Full-Stack environment

Backend:
Hono
Node.js / compatible runtime as supported by the selected environment

Database:
PostgreSQL

API:
Versioned REST/HTTP contract

Authentication:
Secure server-side authentication mechanism

Validation:
Strong runtime validation + TypeScript types

Testing:
Unit + integration testing appropriate to the stack

Deployment target:
Cloudflare-compatible architecture
```

Do not introduce unnecessary frameworks.

---

# 8. MODULAR MONOLITH FOUNDATION

The repository must be structured so modules remain logically isolated.

Preferred conceptual structure:

```text
src/
  modules/
    demand/
    opportunity/
    creator-fit/
    content/
    distribution/
    performance/
    revenue/
    experimentation/
    recommendation/
    automation/
    data/
    identity/
    security/
    connectors/
    observability/
    attribution/
    billing/
    ecosystem/

  shared/
    config/
    errors/
    logging/
    validation/
    database/
    events/
    http/
    security/

  app/
    routes/
    middleware/
```

Adjust naming to the actual framework conventions if necessary.

Do NOT create empty complexity merely for appearance.

The structure must remain maintainable.

---

# 9. MODULE BOUNDARY RULE

Each module must eventually own its domain logic.

Do not create:

```text
src/services/everything.ts
src/utils/businessLogic.ts
src/helpers/allModules.ts
```

that becomes a hidden global business layer.

Cross-module communication must eventually happen through:

```text
PUBLIC CONTRACT
API
EVENT
APPLICATION SERVICE
```

not direct access to another module's private internals.

---

# 10. DATABASE FOUNDATION

Prepare the repository for:

```text
PostgreSQL
```

with migration support.

Do not yet implement the entire database schema.

Only establish the migration architecture and configuration necessary for future tasks.

The complete schema remains governed by:

```text
DOC 21
```

---

# 11. DATABASE RULE

Never use:

```text
SQLite
in-memory database
JSON file
mock database
```

as the production database architecture unless explicitly required by a development-only test.

The target production database is PostgreSQL.

---

# 12. ENVIRONMENT CONFIGURATION

Create or validate an environment configuration system.

Expected conceptual variables may include:

```text
DATABASE_URL
APP_URL
API_URL
AUTH_SECRET
NODE_ENV
```

Future variables may include:

```text
DUITKU_MERCHANT_CODE
DUITKU_API_KEY
DUITKU_ENVIRONMENT
```

and other provider credentials.

DO NOT invent real values.

DO NOT create fake production secrets.

Use:

```text
.env.example
```

for documentation.

---

# 13. SECRET SAFETY

Never commit:

```text
.env
API keys
passwords
private keys
OAuth tokens
Duitku credentials
Cloudflare API tokens
GitHub tokens
database passwords
```

Ensure appropriate `.gitignore` configuration exists.

---

# 14. AUTHENTICATION FOUNDATION

Do not implement the entire authentication system in this task.

Only verify that the architecture supports:

```text
User
Organization
Workspace
Role
Membership
```

and future authentication/authorization.

The actual identity implementation should be handled by a dedicated task.

---

# 15. TENANCY FOUNDATION

The repository must preserve this model:

```text
Organization
    ↓
Workspace
    ↓
User
    ↓
Membership
    ↓
Role
```

Tenant isolation is mandatory.

Do not implement shortcuts such as:

```text
user_id only
```

as the sole authorization mechanism.

---

# 16. SECURITY FOUNDATION

Prepare the application for:

```text
authentication
authorization
tenant isolation
request validation
structured errors
audit logging
rate limiting
secure secrets
```

Do not implement fake security.

If something is not yet implemented, mark it clearly as pending.

---

# 17. API FOUNDATION

Establish a clean API structure.

Preferred conceptual structure:

```text
/api/v1/
```

Do not expose internal database tables directly.

Do not create random endpoints without domain ownership.

Example future structure:

```text
/api/v1/auth
/api/v1/organizations
/api/v1/workspaces
/api/v1/affiliate
/api/v1/analytics
/api/v1/billing
/api/v1/ecosystem
```

Do not implement all endpoints now.

---

# 18. ERROR HANDLING FOUNDATION

Establish one consistent error format.

Minimum:

```json
{
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "request_id": "request-id"
}
```

Do not expose stack traces in production responses.

---

# 19. OBSERVABILITY FOUNDATION

Prepare structured logging.

Every important request should eventually support:

```text
request_id
correlation_id
tenant_id
user_id
module
action
status
latency
```

Do not log secrets.

---

# 20. HEALTH CHECK

Implement a minimal health endpoint if the selected stack supports it cleanly.

Example:

```text
GET /health
```

Response should indicate that the application process is alive.

Do not falsely report database/provider health as healthy unless those dependencies are actually checked.

If implementing dependency checks, distinguish:

```text
APPLICATION_HEALTH
DATABASE_HEALTH
EXTERNAL_PROVIDER_HEALTH
```

---

# 21. GIT INITIALIZATION

If Git is not initialized:

```text
initialize Git
```

If Git already exists:

```text
DO NOT REINITIALIZE
```

Inspect:

```text
git status
git branch
git remote -v
```

---

# 22. GITHUB RULE

The repository must eventually be connected to GitHub.

If a GitHub remote already exists:

```text
inspect it
do not replace it blindly
```

If no remote exists:

```text
prepare the repository for GitHub
```

Do not invent a GitHub repository URL.

If the environment provides an authenticated GitHub integration capable of creating/pushing the repository, use it only when authorized and available.

If GitHub authorization is unavailable:

```text
DO NOT CLAIM PUSH SUCCESS
```

Instead report:

```text
GITHUB_PUSH_BLOCKED
REASON: GitHub authorization/remote unavailable
```

---

# 23. COMMIT RULE

When the task is genuinely complete and all tests pass:

```text
git add
git commit
```

Use a meaningful commit message:

```text
chore(foundation): initialize affiliate os foundation
```

Do not create a commit containing secrets.

Do not commit broken code merely to satisfy the task.

---

# 24. PUSH RULE — MANDATORY

After a successful commit:

```text
PUSH TO GITHUB
```

if GitHub access is available.

This is mandatory for a successful execution.

Expected:

```text
IMPLEMENT
 ↓
TEST
 ↓
COMMIT
 ↓
PUSH
```

If push fails:

```text
DO NOT CLAIM SUCCESS
```

Report the exact failure.

---

# 25. CLOUDFLARE RULE

Cloudflare deployment is part of the target architecture, but deployment must depend on actual access.

You must first detect whether Cloudflare credentials/account access are available.

Possible access:

```text
Cloudflare authenticated CLI
Cloudflare environment credentials
Cloudflare integration
Existing Cloudflare project
Authorized deployment workflow
```

---

# 26. IF CLOUDFLARE ACCESS EXISTS

If Cloudflare access is genuinely available and deployment can be performed safely:

1. Validate the build.
2. Validate environment configuration.
3. Validate production configuration.
4. Deploy to the intended Cloudflare environment.
5. Verify deployment.
6. Capture deployment URL.
7. Verify HTTP response.
8. Report deployment result.

Do not deploy broken code.

---

# 27. IF CLOUDFLARE ACCESS DOES NOT EXIST

Do NOT:

```text
invent credentials
invent account access
invent deployment URL
invent successful deployment
```

Instead:

```text
CODE READY
+
TESTS PASS
+
GITHUB PUSH STATUS
+
CLOUDFLARE DEPLOYMENT = BLOCKED
```

Report:

```text
CLOUDFLARE_ACCESS_REQUIRED
```

and continue only with work that does not require Cloudflare authentication.

---

# 28. CLOUDFLARE ARCHITECTURE

The deployment target is:

```text
GitHub
   ↓
Cloudflare Pages
   ↓
Affiliate OS
```

Cloudflare's Git integration supports GitHub/GitLab repositories and can automatically build/deploy changes pushed to the configured branch.

Therefore, do not create a deployment architecture that bypasses Git unless explicitly required.

---

# 29. IMPORTANT — DO NOT CREATE DIRECT-UPLOAD LOCK-IN

Prefer Git-integrated Cloudflare deployment where possible.

Cloudflare documents that a Pages project using Git integration cannot later be switched to Direct Upload, so the deployment strategy must be chosen deliberately.

Therefore:

```text
PREFERRED:

GitHub
 ↓
Cloudflare Git Integration
 ↓
Pages
```

not:

```text
local files
 ↓
random direct upload
```

unless explicitly approved.

---

# 30. CLOUDFLARE SECRETS

Never commit Cloudflare credentials into Git.

If deployment requires:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

they must be provided through the secure environment.

Never print them.

Never include them in the final report.

---

# 31. BUILD VERIFICATION

Before deployment, run the project's available validation commands.

At minimum, where supported:

```text
install dependencies
typecheck
lint
test
build
```

If a command does not exist:

```text
DO NOT INVENT ITS RESULT
```

Report:

```text
NOT_CONFIGURED
```

or equivalent.

---

# 32. NO FAKE PASS

Never say:

```text
tests passed
```

unless the tests were actually executed.

Never say:

```text
deployment successful
```

unless deployment was actually completed and verified.

Never say:

```text
GitHub pushed
```

unless the push actually succeeded.

---

# 33. TASK BOUNDARY

Do NOT implement:

```text
TikTok API integration
TikTok Shop integration
Duitku payment integration
full billing
full ecosystem
affiliate automation
AI recommendation engine
advanced analytics
full attribution engine
```

in this task.

Those belong to later tasks.

---

# 34. DO NOT CREATE PREMATURE COMPLEXITY

Do not introduce:

```text
Kubernetes
microservices
Kafka
Redis cluster
event sourcing
CQRS infrastructure
service mesh
complex distributed architecture
```

unless the locked architecture explicitly requires it for the current implementation.

Initial architecture remains:

```text
MODULAR MONOLITH
+
POSTGRESQL
+
BACKGROUND JOB CAPABILITY
+
OBJECT STORAGE WHEN NEEDED
+
CONNECTOR LAYER
+
OBSERVABILITY
```

---

# 35. REQUIRED OUTPUT OF THIS TASK

At the end of Task 01, the repository must have:

```text
[ ] Valid project foundation
[ ] Correct framework/runtime foundation
[ ] TypeScript configuration where applicable
[ ] Environment configuration
[ ] .env.example
[ ] Secure .gitignore
[ ] Modular directory foundation
[ ] Database migration foundation
[ ] API foundation
[ ] Error handling foundation
[ ] Health endpoint
[ ] Logging foundation
[ ] Git initialized/validated
[ ] GitHub remote validated or clearly blocked
[ ] Tests/build validation executed
[ ] Commit created
[ ] Push attempted
[ ] Cloudflare access checked
[ ] Cloudflare deployment attempted only if authorized and ready
```

---

# 36. DO NOT STOP WITH A DOCUMENT ONLY

This is an implementation task.

You are expected to actually modify the repository where appropriate.

Do not merely return an architecture explanation.

But also do not implement functionality outside this task boundary.

---

# 37. FINAL TASK REPORT

When finished, return exactly this structure:

```text
TASK:
AFFILIATE-OS-FOUNDATION-001

STATUS:
SUCCESS / PARTIAL / BLOCKED

IMPLEMENTED:
- ...

FILES CREATED:
- ...

FILES MODIFIED:
- ...

DATABASE:
- ...

API:
- ...

TESTS:
- ...

BUILD:
- ...

GITHUB:
- COMMITTED: YES/NO
- PUSHED: YES/NO
- REMOTE: configured/not configured

CLOUDFLARE:
- ACCESS: AVAILABLE/NOT AVAILABLE
- DEPLOYED: YES/NO
- URL: only if actually verified

SECURITY:
- ...

ARCHITECTURE CHECK:
PASS / FAIL

BLOCKERS:
- ...

NEXT TASK:
AFFILIATE-OS-FOUNDATION-002
```

---

# 38. CRITICAL EXECUTION RULE

Do not continue automatically into Task 02 after completing Task 01.

Stop after:

```text
TEST
 ↓
COMMIT
 ↓
PUSH
 ↓
CLOUDFLARE CHECK/DEPLOY IF AUTHORIZED
 ↓
REPORT
```

Wait for the next task instruction.

---

# 39. FINAL COMMAND

Execute:

> **AFFILIATE-OS-FOUNDATION-001 ONLY.**

Do not build the complete Affiliate OS.

Do not invent credentials.

Do not invent GitHub access.

Do not invent Cloudflare access.

Do not invent deployment success.

Do not skip testing.

Do not skip commit.

Do not skip push when GitHub access is available.

Maintain strict adherence to:

```text
MASTER SYSTEM PROMPT — AFFILIATE OS v1.0
```

and the locked architecture documents.

Begin by inspecting the existing repository.