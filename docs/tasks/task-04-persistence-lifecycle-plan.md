# TASK 04 — Minimum Persistence Slice

## Input

`POST /api/v1/affiliate/opportunities` accepts the existing validated `{ "candidate": OpportunityCandidate }` payload. The existing stateless `POST .../evaluate` contract remains unchanged.

Persistent endpoints require an HMAC-signed bearer JWT containing `sub`, `organization_id`, and `workspace_id`; client-supplied tenant headers are not trusted.

## Process

The application layer validates the existing candidate schema, invokes the unchanged deterministic Module 05 evaluator, and passes the validated input, evaluation, and authorized workspace context to the repository port.

## Persistence

PostgreSQL is the only persistence target. One module-owned record stores: generated UUID, workspace ID, candidate reference, product name, lifecycle status (`EVALUATED` only), validated input JSONB, complete evaluation JSONB, score, score band, decision, rule ID, reason codes, priority, confidence, execution feasibility, selected angle, model-version metadata, evaluated/created/updated timestamps. `(workspace_id, candidate_ref)` is unique and duplicate creation is rejected.

## Output

Successful creation returns HTTP `201` with the canonical envelope and `{ opportunity: StoredOpportunity }`. Persistence does not recalculate or mutate the business result.

## Retrieval

- `GET /api/v1/affiliate/opportunities/:candidateRef` returns the workspace-owned record.
- `GET /api/v1/affiliate/opportunities?limit=N` returns workspace-owned records newest first (default 20, maximum 100).

## Lifecycle

The minimum explicit state is `EVALUATED`. No speculative update/delete/state machine is introduced.

## Authorization

Stored data is workspace-scoped per DOC 21/22. Persistent routes verify an HS256 bearer JWT using `AUTH_SECRET`; the signed `workspace_id` establishes ownership. Stateless evaluate/rank/model routes remain public as in Task 03.

## Failure modes

- Invalid input/query/token: canonical `422 VALIDATION_ERROR` or `401 AUTH_REQUIRED`.
- Duplicate candidate reference in one workspace: `409 CONFLICT`.
- Missing record: `404 RESOURCE_NOT_FOUND`.
- Missing persistence/auth configuration: `501 NOT_IMPLEMENTED`.
- Database failure or malformed stored JSON: sanitized `500 INTERNAL_ERROR`.
- No SQL, credentials, connection strings, stack traces, or internal paths cross the HTTP boundary.

## Environment limitation

Migration execution and live PostgreSQL end-to-end verification require a real `DATABASE_URL`. They must not be claimed when that configuration is unavailable.
