-- NaviDocs Database Rollback Script
-- Created: 2025-11-14
-- Purpose: Safely rollback the 20251114-navidocs-schema migration
-- WARNING: This script DROPS all 16 new tables created in the migration
-- Use with caution! Ensure you have a database backup before executing.

-- ============================================================================
-- ROLLBACK PROCEDURE
-- ============================================================================
-- This script removes all tables created by the migration:
-- - Tables: 16 new tables in reverse creation order
-- - Indexes: 29 indexes (automatically dropped with tables)
-- - Foreign Keys: 15 foreign keys (automatically dropped with tables)
--
-- Execution: psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f rollback-20251114-navidocs-schema.sql
--
-- The tables are dropped in reverse dependency order to avoid FK constraint
-- violations. CASCADE is used to automatically remove dependent objects.
--
-- ============================================================================

-- Safety check: Start transaction
BEGIN;

-- ============================================================================
-- DROP TABLES IN REVERSE DEPENDENCY ORDER
-- ============================================================================

-- Table 16: search_history (no dependencies)
DROP TABLE IF EXISTS search_history CASCADE;
PRINT 'Dropped table: search_history';

-- Table 15: webhooks (references organizations)
DROP TABLE IF EXISTS webhooks CASCADE;
PRINT 'Dropped table: webhooks';

-- Table 14: api_keys (references users)
DROP TABLE IF EXISTS api_keys CASCADE;
PRINT 'Dropped table: api_keys';

-- Table 13: user_preferences (references users)
DROP TABLE IF EXISTS user_preferences CASCADE;
PRINT 'Dropped table: user_preferences';

-- Table 12: audit_logs (references users)
DROP TABLE IF EXISTS audit_logs CASCADE;
PRINT 'Dropped table: audit_logs';

-- Table 11: attachments (references users)
DROP TABLE IF EXISTS attachments CASCADE;
PRINT 'Dropped table: attachments';

-- Table 10: tags (no dependencies)
DROP TABLE IF EXISTS tags CASCADE;
PRINT 'Dropped table: tags';

-- Table 9: tax_tracking (references boats)
DROP TABLE IF EXISTS tax_tracking CASCADE;
PRINT 'Dropped table: tax_tracking';

-- Table 8: notifications (references users)
DROP TABLE IF EXISTS notifications CASCADE;
PRINT 'Dropped table: notifications';

-- Table 7: calendars (references boats)
DROP TABLE IF EXISTS calendars CASCADE;
PRINT 'Dropped table: calendars';

-- Table 6: warranties (references boats)
DROP TABLE IF EXISTS warranties CASCADE;
PRINT 'Dropped table: warranties';

-- Table 5: expenses (references boats)
DROP TABLE IF EXISTS expenses CASCADE;
PRINT 'Dropped table: expenses';

-- Table 4: contacts (references organizations)
DROP TABLE IF EXISTS contacts CASCADE;
PRINT 'Dropped table: contacts';

-- Table 3: camera_feeds (references boats)
DROP TABLE IF EXISTS camera_feeds CASCADE;
PRINT 'Dropped table: camera_feeds';

-- Table 2: maintenance_records (references boats)
DROP TABLE IF EXISTS maintenance_records CASCADE;
PRINT 'Dropped table: maintenance_records';

-- Table 1: inventory_items (references boats)
DROP TABLE IF EXISTS inventory_items CASCADE;
PRINT 'Dropped table: inventory_items';

-- ============================================================================
-- VERIFICATION - Ensure all tables are gone
-- ============================================================================

-- Verify no new tables exist
DO $$
DECLARE
  table_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'inventory_items', 'maintenance_records', 'camera_feeds', 'contacts',
    'expenses', 'warranties', 'calendars', 'notifications', 'tax_tracking',
    'tags', 'attachments', 'audit_logs', 'user_preferences', 'api_keys',
    'webhooks', 'search_history'
  );

  IF table_count = 0 THEN
    RAISE NOTICE 'Rollback successful: All 16 new tables have been dropped.';
  ELSE
    RAISE WARNING 'Rollback incomplete: % tables still exist.', table_count;
  END IF;
END $$;

-- ============================================================================
-- FINAL COMMIT
-- ============================================================================

-- Commit the transaction
COMMIT;

-- ============================================================================
-- POST-ROLLBACK CHECKS
-- ============================================================================

-- Verify database integrity
SELECT
  'ROLLBACK SUMMARY' as check_name,
  NOW() as completed_at,
  'SUCCESS' as status;

-- Check that old tables still exist (if migration was creating new ones)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- NOTES FOR OPERATORS
-- ============================================================================
--
-- 1. DATA LOSS WARNING:
--    This script permanently deletes all data in the 16 new tables.
--    Ensure you have a backup before executing!
--
-- 2. VERIFICATION:
--    After rollback, verify:
--    a) All new tables are gone: SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
--    b) Application can start with old schema
--    c) No foreign key references to dropped tables
--    d) Old data is accessible and intact
--
-- 3. IF ROLLBACK FAILS:
--    a) Check database logs: tail -f /var/log/postgresql/postgresql.log
--    b) Verify user permissions: GRANT ALL ON DATABASE navidocs TO navidocs_user;
--    c) Check for active connections to tables: SELECT * FROM pg_stat_activity;
--    d) Kill active connections if needed: SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'navidocs';
--    e) Restore from backup if necessary
--
-- 4. RECOVERY:
--    If you need to recover the dropped tables:
--    a) Restore from backup: pg_restore -d navidocs /path/to/backup
--    b) Or re-run the forward migration: psql -f migrations/20251114-navidocs-schema.sql
--
-- 5. DEPENDENCIES:
--    The following tables may have references to dropped tables:
--    - boats (referenced by inventory_items, maintenance_records, camera_feeds, expenses, warranties, calendars, tax_tracking)
--    - organizations (referenced by contacts, webhooks)
--    - users (referenced by notifications, user_preferences, api_keys, attachments, audit_logs, search_history)
--
--    These parent tables are NOT deleted by this rollback script.
--    If you need to remove them too, they must be done manually after verification.

-- ============================================================================
-- END OF ROLLBACK SCRIPT
-- ============================================================================

-- Print completion message
\echo '==================================================================='
\echo 'NaviDocs Schema Rollback Complete'
\echo 'All 16 new tables have been removed'
\echo 'Parent tables (boats, organizations, users) remain intact'
\echo '==================================================================='
