-- Rollback Migration: Multi-Tenancy Authentication System
-- Date: 2025-10-21

-- Drop new tables in reverse order
DROP INDEX IF EXISTS idx_audit_resource;
DROP INDEX IF EXISTS idx_audit_status;
DROP INDEX IF EXISTS idx_audit_created;
DROP INDEX IF EXISTS idx_audit_event;
DROP INDEX IF EXISTS idx_audit_user;
DROP TABLE IF EXISTS audit_log;

DROP INDEX IF EXISTS idx_reset_tokens_used;
DROP INDEX IF EXISTS idx_reset_tokens_expires;
DROP INDEX IF EXISTS idx_reset_tokens_user;
DROP TABLE IF EXISTS password_reset_tokens;

DROP INDEX IF EXISTS idx_refresh_tokens_revoked;
DROP INDEX IF EXISTS idx_refresh_tokens_expires;
DROP INDEX IF EXISTS idx_refresh_tokens_user;
DROP TABLE IF EXISTS refresh_tokens;

DROP INDEX IF EXISTS idx_entity_perms_expires;
DROP INDEX IF EXISTS idx_entity_perms_entity;
DROP INDEX IF EXISTS idx_entity_perms_user;
DROP TABLE IF EXISTS entity_permissions;

-- Note: Cannot easily drop ALTER TABLE columns in SQLite
-- Would require recreating table without those columns
-- For now, leaving the new columns (they won't break existing functionality)
-- If strict rollback is needed, would require table recreation with data migration
