# CI pipeline definition

`github-actions-ci.yml` is the canonical CI pipeline for Affiliate OS
(DOC 24 §346):

```text
INSTALL → TYPECHECK → LINT → UNIT TEST → ARCHITECTURE TEST
        → CONTRACT TEST → BUILD → SECURITY CHECK
```

## Why it lives here instead of `.github/workflows/`

The GitHub App used by the implementation agent does not hold the `workflows`
permission, so a push that creates or updates `.github/workflows/*` is rejected
by GitHub:

```text
refusing to allow a GitHub App to create or update workflow
`.github/workflows/ci.yml` without `workflows` permission
```

The pipeline definition is therefore version-controlled here rather than being
dropped. **CI is not active on GitHub until a human installs it.**

## Activating it

From a clone with normal user credentials:

```bash
mkdir -p .github/workflows
cp docs/ci/github-actions-ci.yml .github/workflows/ci.yml
git add .github/workflows/ci.yml
git commit -m "chore(ci): activate verification pipeline"
git push
```

Alternatively, grant the `workflows` permission to the GitHub App and the agent
can move the file back itself.

## Running the same checks locally

The pipeline runs nothing that is unavailable locally:

```bash
npm run verify   # typecheck + lint + test + build
```
