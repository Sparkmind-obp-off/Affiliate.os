-- TASK 11: Content Strategy & Content Opportunity foundation.
-- Deterministic evaluation only; generation, publishing, analytics, and providers remain deferred.

CREATE SCHEMA module_07;
COMMENT ON SCHEMA module_07 IS 'Module 07 — Content Strategy and Content Opportunity (owner)';

-- Enables a tenant-preserving composite foreign key without changing Module 05 semantics.
CREATE UNIQUE INDEX idx_module_05_opportunities_workspace_id
  ON module_05.opportunities (workspace_id, id);

CREATE TABLE module_07.content_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES module_15.workspaces(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL,
  title VARCHAR(200) NOT NULL CHECK (length(btrim(title)) > 0),
  primary_angle TEXT NOT NULL CHECK (primary_angle IN (
    'PROBLEM_SOLUTION','HOW_TO','DEMONSTRATION','COMPARISON','REVIEW','TUTORIAL',
    'EDUCATIONAL','STORYTELLING','BEFORE_AFTER','FAQ','MYTH_BUSTING','LISTICLE'
  )),
  secondary_angles JSONB NOT NULL,
  target_audience JSONB NOT NULL,
  content_formats JSONB NOT NULL,
  creator_requirements JSONB NOT NULL,
  execution_constraints JSONB NOT NULL,
  evidence JSONB NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('low','medium','high')),
  status TEXT NOT NULL CHECK (status IN ('draft','ready','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_module_07_workspace_opportunity
    FOREIGN KEY (workspace_id, opportunity_id)
    REFERENCES module_05.opportunities(workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT uq_module_07_workspace_opportunity_title UNIQUE (workspace_id, opportunity_id, title),
  CHECK (jsonb_typeof(secondary_angles) = 'array'),
  CHECK (jsonb_typeof(target_audience) = 'object'),
  CHECK (jsonb_typeof(content_formats) = 'array' AND jsonb_array_length(content_formats) > 0),
  CHECK (jsonb_typeof(creator_requirements) = 'object'),
  CHECK (jsonb_typeof(execution_constraints) = 'object'),
  CHECK (jsonb_typeof(evidence) = 'array' AND jsonb_array_length(evidence) > 0)
);

CREATE INDEX idx_module_07_content_workspace_created
  ON module_07.content_opportunities (workspace_id, created_at DESC);
CREATE INDEX idx_module_07_content_workspace_status
  ON module_07.content_opportunities (workspace_id, status, created_at DESC);
CREATE INDEX idx_module_07_content_workspace_opportunity
  ON module_07.content_opportunities (workspace_id, opportunity_id);

INSERT INTO module_16.permissions (key, description) VALUES
  ('content_opportunity.read', 'Read and evaluate workspace-owned content opportunities'),
  ('content_opportunity.create', 'Create workspace-owned evidence-backed content opportunities');
