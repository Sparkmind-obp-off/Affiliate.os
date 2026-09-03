-- TASK 10: Creator Fit & Matching foundation.
-- Controlled creator inputs only; provider connectors, recommendation, and fit persistence remain deferred.

CREATE SCHEMA module_06;
COMMENT ON SCHEMA module_06 IS 'Module 06 — Creator Fit & Personalization Engine (owner)';

CREATE TABLE module_06.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES module_15.workspaces(id) ON DELETE CASCADE,
  creator_ref VARCHAR(128) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok','instagram','youtube','other')),
  platform_ref VARCHAR(200),
  primary_niche TEXT NOT NULL CHECK (primary_niche IN ('beauty','fashion','technology','home','food','fitness','education','parenting','lifestyle','gaming','automotive','travel','finance','other')),
  secondary_niches JSONB NOT NULL,
  product_categories JSONB NOT NULL,
  audience_segments JSONB NOT NULL,
  audience_interests JSONB NOT NULL,
  content_formats JSONB NOT NULL,
  capabilities JSONB NOT NULL,
  affiliate_capability TEXT NOT NULL CHECK (affiliate_capability IN ('none','learning','experienced')),
  availability TEXT NOT NULL CHECK (availability IN ('unavailable','limited','available')),
  budget_mode TEXT NOT NULL CHECK (budget_mode IN ('zero','low','medium','high')),
  sample_access BOOLEAN NOT NULL,
  evidence_source TEXT NOT NULL CHECK (evidence_source IN ('creator_declared','workspace_research','verified_record')),
  evidence_confidence TEXT NOT NULL CHECK (evidence_confidence IN ('low','medium','high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, creator_ref),
  CHECK (jsonb_typeof(secondary_niches) = 'array'),
  CHECK (jsonb_typeof(product_categories) = 'array'),
  CHECK (jsonb_typeof(audience_segments) = 'array'),
  CHECK (jsonb_typeof(audience_interests) = 'array'),
  CHECK (jsonb_typeof(content_formats) = 'array'),
  CHECK (jsonb_typeof(capabilities) = 'array')
);

CREATE INDEX idx_module_06_creators_workspace_created
  ON module_06.creator_profiles (workspace_id, created_at DESC);
CREATE INDEX idx_module_06_creators_workspace_niche
  ON module_06.creator_profiles (workspace_id, primary_niche);

INSERT INTO module_16.permissions (key, description) VALUES
  ('creator.read', 'Read workspace-owned creator profiles and evaluate deterministic fit'),
  ('creator.create', 'Create workspace-owned creator profiles');
