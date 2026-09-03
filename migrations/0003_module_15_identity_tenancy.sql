-- TASK 06: Identity, Account & Tenancy foundation.
CREATE TABLE module_15.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE module_15.identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(40) NOT NULL CHECK (provider IN ('clerk')),
  provider_subject VARCHAR(255) NOT NULL,
  account_id UUID NOT NULL REFERENCES module_15.accounts(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_subject)
);
CREATE UNIQUE INDEX uq_module_15_identities_account_provider ON module_15.identities(account_id, provider);
CREATE TABLE module_15.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL,
  slug VARCHAR(128) NOT NULL UNIQUE,
  owner_account_id UUID NOT NULL REFERENCES module_15.accounts(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE module_15.workspace_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES module_15.workspaces(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES module_15.accounts(id) ON DELETE RESTRICT,
  role VARCHAR(20) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, account_id)
);
CREATE INDEX idx_module_15_memberships_account ON module_15.workspace_memberships(account_id, status);
CREATE INDEX idx_module_15_memberships_workspace ON module_15.workspace_memberships(workspace_id, status);
ALTER TABLE module_05.opportunities
  ADD CONSTRAINT fk_module_05_opportunities_workspace
  FOREIGN KEY (workspace_id) REFERENCES module_15.workspaces(id) ON DELETE RESTRICT NOT VALID;
