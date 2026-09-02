-- ==============================================================
-- 0001 — EXTENSIONS & MODULE SCHEMAS
-- ==============================================================
-- Source of truth: DOC 21 §179.1 (EXTENSION) and §179.2 (SCHEMA).
--
-- SCOPE BOUNDARY (AFFILIATE-OS-FOUNDATION-001):
-- This migration creates ONLY the extension and the module-owned schemas.
-- It intentionally creates NO tables. The full table DDL (§180 onwards) is
-- applied by the dedicated data-model task, in dependency order, so that
-- seeds are never executed against a partially built schema
-- (see "202.1 — SEED EXECUTION PREREQUISITES").
-- ==============================================================

-- UUID generation via gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Module-owned logical schemas (strict data ownership, DOC 21 §2).
CREATE SCHEMA IF NOT EXISTS module_14;  -- Data & Event Infrastructure
CREATE SCHEMA IF NOT EXISTS module_15;  -- Identity, Account & Tenancy
CREATE SCHEMA IF NOT EXISTS module_16;  -- Security, Policy & Governance
CREATE SCHEMA IF NOT EXISTS module_17;  -- Platform & Connector Abstraction
CREATE SCHEMA IF NOT EXISTS module_19;  -- Attribution & Measurement

COMMENT ON SCHEMA module_14 IS 'Module 14 — Data & Event Infrastructure (owner)';
COMMENT ON SCHEMA module_15 IS 'Module 15 — Identity, Account & Tenancy (owner)';
COMMENT ON SCHEMA module_16 IS 'Module 16 — Security, Policy & Governance (owner)';
COMMENT ON SCHEMA module_17 IS 'Module 17 — Platform & Connector Abstraction (owner)';
COMMENT ON SCHEMA module_19 IS 'Module 19 — Attribution & Measurement (owner)';
