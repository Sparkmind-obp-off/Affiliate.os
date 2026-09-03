# module-16-security

**Title:** Security, Policy & Governance Engine
**Architecture reference:** DOC 16 + 14A
**Status:** FOUNDATION_IMPLEMENTED — Task 07 authorization/RBAC boundary

## Boundary rules

- Other modules may import **only** from `@modules/module-16-security` (the `index.ts` public contract).
- This module owns its own tables/schema. No other module may read or write them directly.
- Cross-module communication happens through the public contract, an application
  service, an API call, or an event — never through internal file access.

## Implemented Task 07 boundary

- Deterministic, deny-by-default `authorize` decision service.
- Minimal `owner` / `admin` / `member` role policy.
- Atomic permissions for current workspace, membership, and opportunity capabilities.
- Account, workspace, membership, role, permission, ownership, and resource-tenant checks.
- Reusable `requirePermission` application boundary; route handlers do not interpret roles.

The application policy is authoritative. Migration `0004` stores the permission catalog for
integrity/discoverability and expands Module 15's membership-role constraint without changing
existing owner memberships. No client-supplied role or permission is trusted.
