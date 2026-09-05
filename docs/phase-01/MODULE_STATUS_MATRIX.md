# Phase 01 — Module Status Matrix

**Repository:** `Sparkmind-obp-off/Affiliate.os`  
**Branch:** `main`  
**Audit date:** 2026-09-05  
**Evidence basis:** repository tree, README, API composition, selected implementation files, migrations, tests, CI, architecture-conflict register, and specification catalog.

## Classification legend

- **KEEP** — implementation/contract is aligned and should remain.
- **REFACTOR** — useful capability exists but boundary/runtime/contract needs correction.
- **AFFILIATE_SPECIFIC** — domain semantics belong to Affiliate OS.
- **MISSING** — required by the target revenue loop but not implemented.
- **BLOCKED** — intended capability exists but verification/activation is blocked by an external prerequisite.
- **DEFERRED** — intentionally outside the current implementation scope.

## Current matrix

| Area / module | Evidence | Status | Phase 1 finding | Phase 2 relevance |
|---|---|---|---|---|
| App / HTTP shell | `src/app/create-app.ts`, `src/index.ts` | KEEP | Clean composition root; middleware and API boundary are separated from business logic. | Supporting |
| Module 04 Demand Discovery | `src/modules/module-04-demand/*`, migration `0006`, tests | KEEP / AFFILIATE_SPECIFIC | Tenant-scoped evidence-first demand foundation exists. | Upstream input |
| Module 05 Opportunity | `src/modules/module-05-opportunity/*`, migrations `0002`,`0005`, tests | KEEP / AFFILIATE_SPECIFIC | Deterministic evaluation, persistence and lifecycle exist; production DB verification is not reproducible from this audit environment. | Core upstream |
| Module 06 Creator Fit | implementation + migration `0007`, tests | KEEP / AFFILIATE_SPECIFIC | Deterministic matching foundation exists. | Content/distribution input |
| Module 07 Content Opportunity | implementation + migration `0008`, tests | KEEP / AFFILIATE_SPECIFIC | Deterministic content-opportunity layer exists. | Content input |
| Module 08 Content Generation | implementation + migration `0009`, tests | KEEP / AFFILIATE_SPECIFIC | Provider-independent generation boundary exists; concrete AI adapter is absent by design. | Create step |
| Module 09 Performance | API root marks analytics pending | MISSING | No completed revenue/performance execution surface is mounted. | P1 |
| Module 10 Distribution | architecture register reserves future distribution boundary | MISSING / DEFERRED | No real publishing/scheduling connector is present in the inspected surface. | P1 |
| Module 11–14 intelligence/automation/data layers | specification catalog + architecture baseline | DEFERRED / PARTIAL | Contracts/specifications exist, but they are not the smallest money-loop implementation. | P2/P3 |
| Module 15 Identity/Tenancy | identity implementation + migration `0003`, tests | KEEP | Clerk/external identity boundary and internal tenancy exist. | Required security foundation |
| Module 16 Security/RBAC | security implementation + migration `0004`, tests | KEEP | Deny-by-default permissions and tenant filtering are implemented. | Required |
| Module 17 Connectors | specification only; API root marks future areas | MISSING / DEFERRED | Concrete platform connector implementation is not the current money-loop foundation. | P1/P2 |
| Revenue / Conversion | specification exists; no completed mounted revenue API identified in API root | MISSING | No end-to-end Order → Conversion → Commission → Revenue execution path exists. | **P0/P1 gap** |
| Attribution | specification exists; no completed execution surface identified | MISSING | No production attribution chain from click to conversion/revenue is implemented. | **P0/P1 gap** |
| Billing | API root marks `/api/v1/billing` pending | DEFERRED | Billing is not required to prove affiliate revenue recognition. | Later |
| Ecosystem commerce | API root marks `/api/v1/ecosystem` pending | DEFERRED | Not required for first reliable money loop. | Later |
| Observability | middleware + CI/tests + specification | KEEP / PARTIAL | Request/correlation logging and error handling exist; business revenue observability is incomplete. | Required hardening |
| PostgreSQL persistence | migrations `0001`–`0009`, `pg` dependency, repositories | KEEP / BLOCKED FOR LIVE RECHECK | PostgreSQL is the locked source of truth; live execution depends on configured environment. | Required |
| Cloudflare runtime | Vite/Pages/Wrangler configuration + app entry | KEEP / REFACTOR CANDIDATE | Runtime remains Cloudflare; PostgreSQL connectivity is an explicit architecture conflict and must stay resolved through a Worker-compatible adapter. | Required |
| Queue / object storage | `.env.example`, architecture conflict register | DEFERRED | Redis-compatible queue and S3-compatible storage are documented but not implemented. | Later |
| AI provider layer | generation port, no concrete provider adapter | KEEP | Provider-agnostic boundary is correct; AI must not become financial source of truth. | P2/P3 |

## Key conclusion

The repository is **not empty and is not a mere specification repository**. It has a real deterministic foundation through content generation, identity, tenancy, authorization, persistence and tests. However, it is **not yet an Affiliate Money Loop implementation**. The dominant Phase 1 finding is therefore a downstream revenue-core gap rather than a reason to rewrite the upstream modules.

The correct strategy is **preserve the existing foundations, resolve runtime/persistence verification gaps, and implement the smallest missing revenue chain around them**.

## Evidence notes

- The README declares Tasks 01–12 and the persistent Module 05 lifecycle as completed, while explicitly listing concrete AI adapters, publishing, analytics, recommendation and attribution as deferred. fileciteturn51file0
- The API root currently mounts Demand, Opportunity, Creator Fit, Content Opportunity, Content Generation and Identity, while explicitly listing analytics, billing and ecosystem routers as pending. fileciteturn34file0
- The repository contains migrations `0001` through `0009`, covering extensions/schemas, opportunity, identity/tenancy, RBAC, workflow, demand, creator fit, content opportunity and content generation. fileciteturn41file0
- The architecture conflict register explicitly records PostgreSQL-vs-Workers, queue/storage, and content-generation/distribution boundary issues; it also records live PostgreSQL verification as an environmental prerequisite. fileciteturn40file0
- CI covers typecheck, lint, unit tests, architecture tests, integration/contract tests, build and secret-file checks. fileciteturn49file0
