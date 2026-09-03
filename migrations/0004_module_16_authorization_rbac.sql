-- TASK 07: Authorization, RBAC, and tenant access-control foundation.
-- Module 15 continues to own membership identity; Module 16 constrains the
-- supported role vocabulary and records the deterministic permission catalog.

ALTER TABLE module_15.workspace_memberships
  DROP CONSTRAINT workspace_memberships_role_check;

ALTER TABLE module_15.workspace_memberships
  ADD CONSTRAINT workspace_memberships_role_check
  CHECK (role IN ('owner', 'admin', 'member'));

CREATE TABLE module_16.permissions (
  key VARCHAR(80) PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_module_16_permissions_key
    CHECK (key ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$')
);

INSERT INTO module_16.permissions (key, description) VALUES
  ('workspace.read', 'Read the active workspace context'),
  ('workspace.manage', 'Manage owner-controlled workspace settings'),
  ('member.read', 'Read workspace membership information'),
  ('member.manage', 'Manage non-owner workspace memberships'),
  ('opportunity.read', 'Read workspace-owned opportunities'),
  ('opportunity.create', 'Create workspace-owned opportunities');

CREATE INDEX idx_module_15_memberships_workspace_role_status
  ON module_15.workspace_memberships(workspace_id, role, status);
