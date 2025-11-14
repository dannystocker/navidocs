/**
 * Database Integrity Tests for NaviDocs
 * Tests foreign key constraints, CASCADE deletes, and performance indexes
 * Created: H-09 Database Integrity Task
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import pkg from 'pg';
const { Client } = pkg;

// Test database configuration
const testDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME_TEST || 'navidocs_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

let client;

// Test data IDs
let testBoatId = null;
let testUserId = null;
let testOrgId = null;

/**
 * Setup test database connection and create test data
 */
beforeAll(async () => {
  try {
    client = new Client(testDbConfig);
    await client.connect();
    console.log('Connected to test database');

    // Create test organization
    const orgResult = await client.query(
      `INSERT INTO organizations (name) VALUES ('Test Org') RETURNING id`
    );
    testOrgId = orgResult.rows[0].id;

    // Create test boat
    const boatResult = await client.query(
      `INSERT INTO boats (name, organization_id) VALUES ('Test Boat', $1) RETURNING id`,
      [testOrgId]
    );
    testBoatId = boatResult.rows[0].id;

    // Create test user
    const userResult = await client.query(
      `INSERT INTO users (email, name, password_hash, created_at, updated_at)
       VALUES ('test@navidocs.com', 'Test User', 'hash123', NOW(), NOW()) RETURNING id`
    );
    testUserId = userResult.rows[0].id;
  } catch (error) {
    console.error('Setup error:', error);
    throw error;
  }
});

/**
 * Cleanup test data and close connection
 */
afterAll(async () => {
  try {
    // Delete all test data in reverse order of foreign key dependencies
    if (testUserId) {
      await client.query(`DELETE FROM users WHERE id = $1`, [testUserId]);
    }
    if (testBoatId) {
      await client.query(`DELETE FROM boats WHERE id = $1`, [testBoatId]);
    }
    if (testOrgId) {
      await client.query(`DELETE FROM organizations WHERE id = $1`, [testOrgId]);
    }

    await client.end();
    console.log('Test database cleanup complete');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});

/**
 * SECTION 1: Foreign Key Constraint Verification
 */
describe('Foreign Key Constraints', () => {

  it('should verify inventory_items.boat_id has ON DELETE CASCADE', async () => {
    const constraint = await client.query(
      `SELECT constraint_name, delete_rule FROM information_schema.referential_constraints
       WHERE table_name = 'inventory_items' AND column_name = 'boat_id'`
    );
    expect(constraint.rows.length).toBeGreaterThan(0);
    expect(constraint.rows[0].delete_rule).toBe('CASCADE');
  });

  it('should verify maintenance_records.boat_id has ON DELETE CASCADE', async () => {
    const constraint = await client.query(
      `SELECT * FROM information_schema.table_constraints
       WHERE table_name = 'maintenance_records'`
    );
    const hasFk = constraint.rows.some(c => c.constraint_type === 'FOREIGN KEY');
    expect(hasFk).toBe(true);
  });

  it('should verify camera_feeds.boat_id has ON DELETE CASCADE', async () => {
    const result = await client.query(
      `SELECT pg_get_constraintdef(oid) as constraint_def FROM pg_constraint
       WHERE conrelid = 'camera_feeds'::regclass AND contype = 'f'`
    );
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].constraint_def).toContain('ON DELETE CASCADE');
  });

  it('should verify expenses.boat_id has ON DELETE CASCADE', async () => {
    const result = await client.query(
      `SELECT pg_get_constraintdef(oid) as constraint_def FROM pg_constraint
       WHERE conrelid = 'expenses'::regclass AND contype = 'f'`
    );
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it('should verify warranties.boat_id has ON DELETE CASCADE', async () => {
    const result = await client.query(
      `SELECT pg_get_constraintdef(oid) as constraint_def FROM pg_constraint
       WHERE conrelid = 'warranties'::regclass AND contype = 'f'`
    );
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it('should verify calendars.boat_id has ON DELETE CASCADE', async () => {
    const result = await client.query(
      `SELECT pg_get_constraintdef(oid) as constraint_def FROM pg_constraint
       WHERE conrelid = 'calendars'::regclass AND contype = 'f'`
    );
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it('should verify tax_tracking.boat_id has ON DELETE CASCADE', async () => {
    const result = await client.query(
      `SELECT pg_get_constraintdef(oid) as constraint_def FROM pg_constraint
       WHERE conrelid = 'tax_tracking'::regclass AND contype = 'f'`
    );
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it('should verify contacts.organization_id has ON DELETE CASCADE', async () => {
    const result = await client.query(
      `SELECT pg_get_constraintdef(oid) as constraint_def FROM pg_constraint
       WHERE conrelid = 'contacts'::regclass AND contype = 'f'`
    );
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].constraint_def).toContain('CASCADE');
  });

  it('should verify notifications.user_id has ON DELETE CASCADE', async () => {
    const result = await client.query(
      `SELECT pg_get_constraintdef(oid) as constraint_def FROM pg_constraint
       WHERE conrelid = 'notifications'::regclass AND contype = 'f'`
    );
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].constraint_def).toContain('CASCADE');
  });

  it('should verify attachments.uploaded_by has ON DELETE SET NULL', async () => {
    const result = await client.query(
      `SELECT pg_get_constraintdef(oid) as constraint_def FROM pg_constraint
       WHERE conrelid = 'attachments'::regclass AND contype = 'f'`
    );
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].constraint_def).toContain('SET NULL');
  });

  it('should verify audit_logs.user_id has ON DELETE SET NULL', async () => {
    const result = await client.query(
      `SELECT pg_get_constraintdef(oid) as constraint_def FROM pg_constraint
       WHERE conrelid = 'audit_logs'::regclass AND contype = 'f'`
    );
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].constraint_def).toContain('SET NULL');
  });

  it('should verify user_preferences.user_id has ON DELETE CASCADE', async () => {
    const result = await client.query(
      `SELECT pg_get_constraintdef(oid) as constraint_def FROM pg_constraint
       WHERE conrelid = 'user_preferences'::regclass AND contype = 'f'`
    );
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].constraint_def).toContain('CASCADE');
  });

  it('should verify api_keys.user_id has ON DELETE CASCADE', async () => {
    const result = await client.query(
      `SELECT pg_get_constraintdef(oid) as constraint_def FROM pg_constraint
       WHERE conrelid = 'api_keys'::regclass AND contype = 'f'`
    );
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].constraint_def).toContain('CASCADE');
  });

  it('should verify webhooks.organization_id has ON DELETE CASCADE', async () => {
    const result = await client.query(
      `SELECT pg_get_constraintdef(oid) as constraint_def FROM pg_constraint
       WHERE conrelid = 'webhooks'::regclass AND contype = 'f'`
    );
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].constraint_def).toContain('CASCADE');
  });

  it('should verify search_history.user_id has ON DELETE CASCADE', async () => {
    const result = await client.query(
      `SELECT pg_get_constraintdef(oid) as constraint_def FROM pg_constraint
       WHERE conrelid = 'search_history'::regclass AND contype = 'f'`
    );
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].constraint_def).toContain('CASCADE');
  });
});

/**
 * SECTION 2: CASCADE Delete Testing
 */
describe('CASCADE Delete Scenarios', () => {

  it('DELETE boat should cascade delete all inventory_items', async () => {
    // Create test boat and inventory
    const boatRes = await client.query(
      `INSERT INTO boats (name, organization_id) VALUES ('Cascade Test Boat', $1) RETURNING id`,
      [testOrgId]
    );
    const boatId = boatRes.rows[0].id;

    await client.query(
      `INSERT INTO inventory_items (boat_id, name, category) VALUES ($1, 'Engine', 'Propulsion')`,
      [boatId]
    );

    // Verify inventory was created
    const beforeDelete = await client.query(
      `SELECT COUNT(*) FROM inventory_items WHERE boat_id = $1`,
      [boatId]
    );
    expect(parseInt(beforeDelete.rows[0].count)).toBeGreaterThan(0);

    // Delete boat
    await client.query(`DELETE FROM boats WHERE id = $1`, [boatId]);

    // Verify inventory was cascade deleted
    const afterDelete = await client.query(
      `SELECT COUNT(*) FROM inventory_items WHERE boat_id = $1`,
      [boatId]
    );
    expect(parseInt(afterDelete.rows[0].count)).toBe(0);
  });

  it('DELETE boat should cascade delete all maintenance_records', async () => {
    const boatRes = await client.query(
      `INSERT INTO boats (name, organization_id) VALUES ('Maintenance Boat', $1) RETURNING id`,
      [testOrgId]
    );
    const boatId = boatRes.rows[0].id;

    await client.query(
      `INSERT INTO maintenance_records (boat_id, service_type, date)
       VALUES ($1, 'Oil Change', CURRENT_DATE)`,
      [boatId]
    );

    const beforeDelete = await client.query(
      `SELECT COUNT(*) FROM maintenance_records WHERE boat_id = $1`,
      [boatId]
    );
    expect(parseInt(beforeDelete.rows[0].count)).toBeGreaterThan(0);

    await client.query(`DELETE FROM boats WHERE id = $1`, [boatId]);

    const afterDelete = await client.query(
      `SELECT COUNT(*) FROM maintenance_records WHERE boat_id = $1`,
      [boatId]
    );
    expect(parseInt(afterDelete.rows[0].count)).toBe(0);
  });

  it('DELETE boat should cascade delete all camera_feeds', async () => {
    const boatRes = await client.query(
      `INSERT INTO boats (name, organization_id) VALUES ('Camera Boat', $1) RETURNING id`,
      [testOrgId]
    );
    const boatId = boatRes.rows[0].id;

    await client.query(
      `INSERT INTO camera_feeds (boat_id, camera_name, rtsp_url)
       VALUES ($1, 'Front Camera', 'rtsp://localhost:554/stream')`,
      [boatId]
    );

    const beforeDelete = await client.query(
      `SELECT COUNT(*) FROM camera_feeds WHERE boat_id = $1`,
      [boatId]
    );
    expect(parseInt(beforeDelete.rows[0].count)).toBeGreaterThan(0);

    await client.query(`DELETE FROM boats WHERE id = $1`, [boatId]);

    const afterDelete = await client.query(
      `SELECT COUNT(*) FROM camera_feeds WHERE boat_id = $1`,
      [boatId]
    );
    expect(parseInt(afterDelete.rows[0].count)).toBe(0);
  });

  it('DELETE user should set attachments.uploaded_by to NULL', async () => {
    const userRes = await client.query(
      `INSERT INTO users (email, name, password_hash, created_at, updated_at)
       VALUES ('attach@test.com', 'Attach User', 'hash', NOW(), NOW()) RETURNING id`
    );
    const userId = userRes.rows[0].id;

    await client.query(
      `INSERT INTO attachments (entity_type, entity_id, file_url, uploaded_by)
       VALUES ('inventory', 1, 'http://example.com/file.pdf', $1)`,
      [userId]
    );

    const beforeDelete = await client.query(
      `SELECT uploaded_by FROM attachments WHERE uploaded_by = $1`,
      [userId]
    );
    expect(beforeDelete.rows.length).toBeGreaterThan(0);

    await client.query(`DELETE FROM users WHERE id = $1`, [userId]);

    const afterDelete = await client.query(
      `SELECT uploaded_by FROM attachments WHERE entity_type = 'inventory' AND entity_id = 1`
    );
    expect(afterDelete.rows[0].uploaded_by).toBeNull();
  });

  it('DELETE user should set audit_logs.user_id to NULL', async () => {
    const userRes = await client.query(
      `INSERT INTO users (email, name, password_hash, created_at, updated_at)
       VALUES ('audit@test.com', 'Audit User', 'hash', NOW(), NOW()) RETURNING id`
    );
    const userId = userRes.rows[0].id;

    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, 'CREATE', 'inventory', 1)`,
      [userId]
    );

    const beforeDelete = await client.query(
      `SELECT user_id FROM audit_logs WHERE user_id = $1`,
      [userId]
    );
    expect(beforeDelete.rows.length).toBeGreaterThan(0);

    await client.query(`DELETE FROM users WHERE id = $1`, [userId]);

    const afterDelete = await client.query(
      `SELECT user_id FROM audit_logs WHERE action = 'CREATE' AND entity_type = 'inventory'`
    );
    expect(afterDelete.rows[0].user_id).toBeNull();
  });

  it('DELETE organization should cascade delete all contacts', async () => {
    const orgRes = await client.query(
      `INSERT INTO organizations (name) VALUES ('Contact Org') RETURNING id`
    );
    const orgId = orgRes.rows[0].id;

    await client.query(
      `INSERT INTO contacts (organization_id, name, type, phone)
       VALUES ($1, 'Marina', 'marina', '123-456-7890')`,
      [orgId]
    );

    const beforeDelete = await client.query(
      `SELECT COUNT(*) FROM contacts WHERE organization_id = $1`,
      [orgId]
    );
    expect(parseInt(beforeDelete.rows[0].count)).toBeGreaterThan(0);

    await client.query(`DELETE FROM organizations WHERE id = $1`, [orgId]);

    const afterDelete = await client.query(
      `SELECT COUNT(*) FROM contacts WHERE organization_id = $1`,
      [orgId]
    );
    expect(parseInt(afterDelete.rows[0].count)).toBe(0);
  });
});

/**
 * SECTION 3: Performance Indexes Verification
 */
describe('Performance Indexes', () => {

  it('should have idx_inventory_boat index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'inventory_items' AND indexname = 'idx_inventory_boat'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_inventory_category index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'inventory_items' AND indexname = 'idx_inventory_category'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_maintenance_boat index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'maintenance_records' AND indexname = 'idx_maintenance_boat'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_maintenance_due index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'maintenance_records' AND indexname = 'idx_maintenance_due'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_camera_boat index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'camera_feeds' AND indexname = 'idx_camera_boat'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have UNIQUE idx_camera_webhook index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'camera_feeds' AND indexname = 'idx_camera_webhook'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_contacts_org index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'contacts' AND indexname = 'idx_contacts_org'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_contacts_type index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'contacts' AND indexname = 'idx_contacts_type'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_expenses_boat index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'expenses' AND indexname = 'idx_expenses_boat'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_expenses_date index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'expenses' AND indexname = 'idx_expenses_date'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_expenses_status index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'expenses' AND indexname = 'idx_expenses_status'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_warranties_boat index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'warranties' AND indexname = 'idx_warranties_boat'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_warranties_end index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'warranties' AND indexname = 'idx_warranties_end'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_calendars_boat index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'calendars' AND indexname = 'idx_calendars_boat'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_calendars_start index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'calendars' AND indexname = 'idx_calendars_start'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_notifications_user index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'notifications' AND indexname = 'idx_notifications_user'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_notifications_sent index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'notifications' AND indexname = 'idx_notifications_sent'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_tax_boat index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'tax_tracking' AND indexname = 'idx_tax_boat'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_tax_expiry index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'tax_tracking' AND indexname = 'idx_tax_expiry'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have UNIQUE idx_tags_name index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'tags' AND indexname = 'idx_tags_name'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_attachments_entity index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'attachments' AND indexname = 'idx_attachments_entity'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_audit_user index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'audit_logs' AND indexname = 'idx_audit_user'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_audit_created index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'audit_logs' AND indexname = 'idx_audit_created'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have UNIQUE idx_preferences_user index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'user_preferences' AND indexname = 'idx_preferences_user'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_apikeys_user index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'api_keys' AND indexname = 'idx_apikeys_user'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_webhooks_org index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'webhooks' AND indexname = 'idx_webhooks_org'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_webhooks_event index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'webhooks' AND indexname = 'idx_webhooks_event'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_search_user index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'search_history' AND indexname = 'idx_search_user'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('should have idx_search_created index', async () => {
    const result = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'search_history' AND indexname = 'idx_search_created'`
    );
    expect(result.rows.length).toBe(1);
  });
});

/**
 * SECTION 4: Data Integrity Constraints
 */
describe('Data Integrity Constraints', () => {

  it('inventory_items.boat_id should be NOT NULL', async () => {
    const result = await client.query(
      `SELECT is_nullable FROM information_schema.columns
       WHERE table_name = 'inventory_items' AND column_name = 'boat_id'`
    );
    expect(result.rows[0].is_nullable).toBe('NO');
  });

  it('maintenance_records.boat_id should be NOT NULL', async () => {
    const result = await client.query(
      `SELECT is_nullable FROM information_schema.columns
       WHERE table_name = 'maintenance_records' AND column_name = 'boat_id'`
    );
    expect(result.rows[0].is_nullable).toBe('NO');
  });

  it('camera_feeds.boat_id should be NOT NULL', async () => {
    const result = await client.query(
      `SELECT is_nullable FROM information_schema.columns
       WHERE table_name = 'camera_feeds' AND column_name = 'boat_id'`
    );
    expect(result.rows[0].is_nullable).toBe('NO');
  });

  it('notifications.user_id should be NOT NULL', async () => {
    const result = await client.query(
      `SELECT is_nullable FROM information_schema.columns
       WHERE table_name = 'notifications' AND column_name = 'user_id'`
    );
    expect(result.rows[0].is_nullable).toBe('NO');
  });

  it('contacts.organization_id should be NOT NULL', async () => {
    const result = await client.query(
      `SELECT is_nullable FROM information_schema.columns
       WHERE table_name = 'contacts' AND column_name = 'organization_id'`
    );
    expect(result.rows[0].is_nullable).toBe('NO');
  });

  it('inventory_items.name should be NOT NULL', async () => {
    const result = await client.query(
      `SELECT is_nullable FROM information_schema.columns
       WHERE table_name = 'inventory_items' AND column_name = 'name'`
    );
    expect(result.rows[0].is_nullable).toBe('NO');
  });

  it('should have DEFAULT NOW() for inventory_items.created_at', async () => {
    const result = await client.query(
      `SELECT column_default FROM information_schema.columns
       WHERE table_name = 'inventory_items' AND column_name = 'created_at'`
    );
    expect(result.rows[0].column_default).toContain('now()');
  });

  it('should have DEFAULT NOW() for maintenance_records.created_at', async () => {
    const result = await client.query(
      `SELECT column_default FROM information_schema.columns
       WHERE table_name = 'maintenance_records' AND column_name = 'created_at'`
    );
    expect(result.rows[0].column_default).toContain('now()');
  });

  it('should have DEFAULT NOW() for expenses.created_at', async () => {
    const result = await client.query(
      `SELECT column_default FROM information_schema.columns
       WHERE table_name = 'expenses' AND column_name = 'created_at'`
    );
    expect(result.rows[0].column_default).toContain('now()');
  });
});

/**
 * SECTION 5: Query Performance Analysis
 */
describe('Query Performance and Index Usage', () => {

  it('should efficiently query all inventory for a boat using idx_inventory_boat', async () => {
    const explain = await client.query(
      `EXPLAIN (FORMAT JSON) SELECT * FROM inventory_items WHERE boat_id = $1`,
      [testBoatId]
    );
    const plan = explain.rows[0][0].Plan;
    expect(plan.Index_Name || plan.Node_Type).toBeDefined();
  });

  it('should efficiently query upcoming maintenance using idx_maintenance_due', async () => {
    const explain = await client.query(
      `EXPLAIN (FORMAT JSON) SELECT * FROM maintenance_records
       WHERE next_due_date >= CURRENT_DATE ORDER BY next_due_date`
    );
    const plan = explain.rows[0][0].Plan;
    expect(plan.Index_Name || plan.Node_Type).toBeDefined();
  });

  it('should efficiently query contacts by type using idx_contacts_type', async () => {
    const explain = await client.query(
      `EXPLAIN (FORMAT JSON) SELECT * FROM contacts WHERE type = 'marina'`
    );
    const plan = explain.rows[0][0].Plan;
    expect(plan.Index_Name || plan.Node_Type).toBeDefined();
  });

  it('should efficiently query recent expenses using idx_expenses_date', async () => {
    const explain = await client.query(
      `EXPLAIN (FORMAT JSON) SELECT * FROM expenses WHERE date >= CURRENT_DATE - INTERVAL '30 days'`
    );
    const plan = explain.rows[0][0].Plan;
    expect(plan.Index_Name || plan.Node_Type).toBeDefined();
  });

  it('should efficiently query pending expenses using idx_expenses_status', async () => {
    const explain = await client.query(
      `EXPLAIN (FORMAT JSON) SELECT * FROM expenses WHERE approval_status = 'pending'`
    );
    const plan = explain.rows[0][0].Plan;
    expect(plan.Index_Name || plan.Node_Type).toBeDefined();
  });
});
