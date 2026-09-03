-- TASK 09: Demand Discovery foundation.
-- Manual / semi-automated evidence ingestion only; provider connectors remain deferred.

CREATE TABLE module_04.demand_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES module_15.workspaces(id) ON DELETE CASCADE,
  problem TEXT NOT NULL,
  canonical_problem TEXT NOT NULL,
  audience TEXT NOT NULL,
  category TEXT,
  keyword TEXT,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('problem','search','conversation','content','commercial_intent','transaction','creator','trend')),
  signal_value NUMERIC(5,2) NOT NULL CHECK (signal_value >= 0 AND signal_value <= 100),
  source_type TEXT NOT NULL CHECK (source_type IN ('tiktok','tiktok_shop','search','social','marketplace','creator_content','user_input','external_research')),
  source_ref TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('low','medium','high','very_high')),
  evidence TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DISCOVERED' CHECK (status IN ('DISCOVERED','OBSERVING','VALIDATING','CONFIRMED','OPPORTUNITY_READY')),
  demand_score NUMERIC(5,2) NOT NULL CHECK (demand_score >= 0 AND demand_score <= 100),
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, fingerprint)
);

CREATE INDEX idx_module_04_demand_workspace_created
  ON module_04.demand_signals (workspace_id, created_at DESC);
CREATE INDEX idx_module_04_demand_workspace_status
  ON module_04.demand_signals (workspace_id, status, updated_at DESC);
CREATE INDEX idx_module_04_demand_workspace_problem
  ON module_04.demand_signals (workspace_id, canonical_problem);

INSERT INTO module_16.permissions (key, description) VALUES
  ('demand.read', 'Read workspace-owned demand discovery signals'),
  ('demand.create', 'Create workspace-owned demand discovery signals');
