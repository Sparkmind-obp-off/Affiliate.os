-- TASK 12: provider-independent Content Generation foundation.
-- Approved artifacts remain unpublished; distribution is owned by a future module.

CREATE SCHEMA module_08;
COMMENT ON SCHEMA module_08 IS 'Module 08 — Content Generation (owner)';

-- Tenant-preserving creator reference for Module 08 foreign-key enforcement.
CREATE UNIQUE INDEX idx_module_06_creator_profiles_workspace_id
  ON module_06.creator_profiles (workspace_id, id);

CREATE TABLE module_08.content_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES module_15.workspaces(id) ON DELETE CASCADE,
  content_opportunity_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  generation_spec JSONB NOT NULL CHECK (jsonb_typeof(generation_spec) = 'object'),
  content_type TEXT NOT NULL CHECK (content_type IN (
    'SCRIPT','CAPTION','HOOK','PRODUCT_REVIEW','EDUCATIONAL_POST','TUTORIAL',
    'COMPARISON','STORY','FAQ','LISTICLE'
  )),
  format TEXT NOT NULL CHECK (format IN (
    'talking_head','faceless','pov','voice_over','screen_recording','tutorial',
    'review','storytelling','demo','comparison','live'
  )),
  language TEXT NOT NULL CHECK (language IN ('id','en')),
  title VARCHAR(200) NOT NULL CHECK (length(btrim(title)) > 0),
  hook VARCHAR(500) NOT NULL CHECK (length(btrim(hook)) > 0),
  body TEXT,
  call_to_action VARCHAR(500) NOT NULL CHECK (length(btrim(call_to_action)) > 0),
  status TEXT NOT NULL CHECK (status IN (
    'DRAFT','REQUESTED','GENERATED','REVIEW_REQUIRED','APPROVED','REJECTED','ARCHIVED'
  )),
  provider VARCHAR(100),
  provider_model VARCHAR(150),
  policy_version VARCHAR(80) NOT NULL,
  input_fingerprint CHAR(64) NOT NULL CHECK (input_fingerprint ~ '^[a-f0-9]{64}$'),
  output_fingerprint CHAR(64) CHECK (output_fingerprint ~ '^[a-f0-9]{64}$'),
  generation_metadata JSONB CHECK (generation_metadata IS NULL OR jsonb_typeof(generation_metadata) = 'object'),
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_module_08_workspace_content_opportunity
    FOREIGN KEY (workspace_id, content_opportunity_id)
    REFERENCES module_07.content_opportunities(workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_module_08_workspace_creator
    FOREIGN KEY (workspace_id, creator_id)
    REFERENCES module_06.creator_profiles(workspace_id, id) ON DELETE RESTRICT,
  CONSTRAINT uq_module_08_workspace_input UNIQUE (workspace_id, input_fingerprint),
  CONSTRAINT ck_module_08_generated_artifact CHECK (
    status NOT IN ('GENERATED','REVIEW_REQUIRED','APPROVED') OR
    (body IS NOT NULL AND length(btrim(body)) > 0 AND provider IS NOT NULL AND
     provider_model IS NOT NULL AND output_fingerprint IS NOT NULL AND generated_at IS NOT NULL)
  )
);

CREATE INDEX idx_module_08_generation_workspace_created
  ON module_08.content_generations (workspace_id, created_at DESC);
CREATE INDEX idx_module_08_generation_workspace_status
  ON module_08.content_generations (workspace_id, status, created_at DESC);
CREATE INDEX idx_module_08_generation_workspace_content
  ON module_08.content_generations (workspace_id, content_opportunity_id);
CREATE INDEX idx_module_08_generation_workspace_creator
  ON module_08.content_generations (workspace_id, creator_id);

INSERT INTO module_16.permissions (key, description) VALUES
  ('content_generation.read', 'Read workspace-owned content generations'),
  ('content_generation.create', 'Create and request workspace-owned content generations'),
  ('content_generation.update', 'Review workspace-owned content generations');
