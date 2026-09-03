# module-15-identity

**Title:** Identity, Account & Tenancy Architecture
**Architecture reference:** DOC 15 + ADDENDUM
**Status:** FOUNDATION_IMPLEMENTED — Task 06

## Boundary rules

- Other modules may import **only** from `@modules/module-15-identity` (the `index.ts` public contract).
- This module owns its own tables/schema. No other module may read or write them directly.
- Cross-module communication happens through the public contract, an application
  service, an API call, or an event — never through internal file access.

## Implemented structure

```text
module-15-identity/
├── domain/           # entities, value objects, domain services
├── application/      # use cases, application services
├── infrastructure/   # repositories, adapters
└── index.ts          # public contract
```

## Scope

Clerk authenticates the external subject. Affiliate OS transactionally resolves or provisions the internal account, workspace, and owner membership. Provider details remain isolated behind the authenticator port. Every tenant-owned operation requires an explicit workspace id.

Full RBAC/policy, invitations, team administration, and workspace management UI are intentionally out of scope.
