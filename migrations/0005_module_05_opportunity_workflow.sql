-- TASK 08: Opportunity workflow and lifecycle foundation.
-- Reconcile the legacy EVALUATED persistence marker into the first business
-- lifecycle state, then enforce the small deterministic status vocabulary.

ALTER TABLE module_05.opportunities
  DROP CONSTRAINT opportunities_status_check;

UPDATE module_05.opportunities
SET status = 'draft', updated_at = NOW()
WHERE status = 'EVALUATED';

ALTER TABLE module_05.opportunities
  ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE module_05.opportunities
  ADD CONSTRAINT opportunities_status_check
  CHECK (status IN ('draft', 'active', 'completed', 'archived'));

CREATE INDEX idx_module_05_opportunities_workspace_status_updated
  ON module_05.opportunities (workspace_id, status, updated_at DESC);

INSERT INTO module_16.permissions (key, description) VALUES
  ('opportunity.update', 'Update lifecycle state of workspace-owned opportunities');
