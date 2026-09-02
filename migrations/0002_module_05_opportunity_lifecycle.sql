-- TASK 04: minimum persistent lifecycle for Module 05.
-- PostgreSQL only; one immutable deterministic evaluation per workspace/reference.

CREATE TABLE module_05.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    candidate_ref VARCHAR(128) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'EVALUATED'
        CHECK (status IN ('EVALUATED')),
    evaluation_input JSONB NOT NULL,
    evaluation JSONB NOT NULL,
    score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    score_band VARCHAR(30) NOT NULL,
    decision VARCHAR(30) NOT NULL,
    rule_id VARCHAR(100) NOT NULL,
    reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    priority NUMERIC(5,2) NOT NULL CHECK (priority >= 0 AND priority <= 100),
    confidence VARCHAR(20) NOT NULL,
    execution_feasibility NUMERIC(4,2) NOT NULL CHECK (execution_feasibility >= 0 AND execution_feasibility <= 1),
    selected_angle JSONB,
    model_versions JSONB NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (workspace_id, candidate_ref)
);

CREATE INDEX idx_module_05_opportunities_workspace_created
    ON module_05.opportunities (workspace_id, created_at DESC);
