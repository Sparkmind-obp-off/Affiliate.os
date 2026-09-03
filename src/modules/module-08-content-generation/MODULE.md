# module-08-content-generation

**Title:** Content Generation Foundation  
**Task:** TASK 12  
**Status:** FOUNDATION_IMPLEMENTED

## Ownership

This module owns generation specifications, deterministic generation policy and lifecycle,
provider abstraction, generated artifact provenance, fingerprints, tenant-scoped persistence,
and authenticated generation APIs.

It consumes Content Opportunities and creator profiles only through the public contracts of
Modules 07 and 06. It reuses Module 15 identity/tenancy and Module 16 authorization.

## Boundary

The module does not discover demand, score opportunities, calculate creator fit, publish or
schedule social content, call a specific AI vendor, or perform analytics/attribution. The existing
`module-08-distribution` stub remains a distinct deferred distribution boundary; this Task 12
module must not publish approved artifacts.

## Provider behavior

No provider is configured by default. Requesting generation without an injected secure runtime
adapter fails explicitly and never fabricates output. Provider results are structurally validated
before the record can become `GENERATED`.
