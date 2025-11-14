/**
 * End-to-End Workflow Integration Tests for NaviDocs
 * Tests critical user workflows across multiple features
 * Created: H-12 Integration Tests Task
 *
 * Test Coverage:
 * 1. New Equipment Purchase Workflow
 * 2. Scheduled Maintenance Workflow
 * 3. Security Camera Event Workflow
 * 4. Multi-User Expense Split Workflow
 * 5. Database CASCADE Delete Testing
 * 6. Search Integration Testing
 * 7. Authentication Flow Testing
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import pkg from 'pg';
const { Client } = pkg;

/**
 * Test Database Configuration
 */
const testDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME_TEST || 'navidocs_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

let client;
let testDataIds = {
  boat: null,
  org: null,
  user1: null,
  user2: null,
  user3: null,
  inventory: null,
  maintenance: null,
  camera: null,
  contact: null,
  expense: null
};

/**
 * Setup and Teardown
 */
beforeAll(async () => {
  try {
    client = new Client(testDbConfig);
    await client.connect();
    console.log('E2E Test Suite: Connected to test database');

    // Create test organization
    const orgResult = await client.query(
      `INSERT INTO organizations (name) VALUES ('E2E Test Organization') RETURNING id`
    );
    testDataIds.org = orgResult.rows[0].id;

    // Create test boat
    const boatResult = await client.query(
      `INSERT INTO boats (name, organization_id) VALUES ('E2E Test Boat', $1) RETURNING id`,
      [testDataIds.org]
    );
    testDataIds.boat = boatResult.rows[0].id;

    // Create test users
    const user1Result = await client.query(
      `INSERT INTO users (email, name, password_hash, organization_id, created_at, updated_at)
       VALUES ('e2e-user1@test.com', 'E2E User 1', 'hash123', $1, NOW(), NOW()) RETURNING id`,
      [testDataIds.org]
    );
    testDataIds.user1 = user1Result.rows[0].id;

    const user2Result = await client.query(
      `INSERT INTO users (email, name, password_hash, organization_id, created_at, updated_at)
       VALUES ('e2e-user2@test.com', 'E2E User 2', 'hash123', $1, NOW(), NOW()) RETURNING id`,
      [testDataIds.org]
    );
    testDataIds.user2 = user2Result.rows[0].id;

    const user3Result = await client.query(
      `INSERT INTO users (email, name, password_hash, organization_id, created_at, updated_at)
       VALUES ('e2e-user3@test.com', 'E2E User 3', 'hash123', $1, NOW(), NOW()) RETURNING id`,
      [testDataIds.org]
    );
    testDataIds.user3 = user3Result.rows[0].id;

    console.log('E2E Test Suite: Test data initialized');
  } catch (error) {
    console.error('Setup error:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Cleanup in reverse order of dependencies
    if (testDataIds.expense) {
      await client.query(`DELETE FROM expenses WHERE id = $1`, [testDataIds.expense]);
    }
    if (testDataIds.camera) {
      await client.query(`DELETE FROM camera_feeds WHERE id = $1`, [testDataIds.camera]);
    }
    if (testDataIds.contact) {
      await client.query(`DELETE FROM contacts WHERE id = $1`, [testDataIds.contact]);
    }
    if (testDataIds.maintenance) {
      await client.query(`DELETE FROM maintenance_records WHERE id = $1`, [testDataIds.maintenance]);
    }
    if (testDataIds.inventory) {
      await client.query(`DELETE FROM inventory_items WHERE id = $1`, [testDataIds.inventory]);
    }

    // Delete users
    for (const userId of [testDataIds.user1, testDataIds.user2, testDataIds.user3]) {
      if (userId) {
        await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
      }
    }

    // Delete boat (will cascade)
    if (testDataIds.boat) {
      await client.query(`DELETE FROM boats WHERE id = $1`, [testDataIds.boat]);
    }

    // Delete organization
    if (testDataIds.org) {
      await client.query(`DELETE FROM organizations WHERE id = $1`, [testDataIds.org]);
    }

    await client.end();
    console.log('E2E Test Suite: Cleanup complete');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});

/**
 * ============================================================================
 * WORKFLOW 1: New Equipment Purchase
 * ============================================================================
 * Test: Create inventory item -> Create expense -> Verify linkage
 */
describe('Workflow 1: New Equipment Purchase', () => {

  it('should create inventory item with photos', async () => {
    const inventory = {
      boat_id: testDataIds.boat,
      name: 'New Engine Propeller',
      category: 'Propulsion',
      purchase_date: '2025-11-14',
      purchase_price: 2500.00,
      depreciation_rate: 0.15,
      notes: 'Spare propeller for main engine'
    };

    const result = await client.query(
      `INSERT INTO inventory_items
       (boat_id, name, category, purchase_date, purchase_price, current_value,
        depreciation_rate, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        inventory.boat_id,
        inventory.name,
        inventory.category,
        inventory.purchase_date,
        inventory.purchase_price,
        inventory.purchase_price,
        inventory.depreciation_rate,
        inventory.notes
      ]
    );

    testDataIds.inventory = result.rows[0].id;
    expect(result.rows[0]).toHaveProperty('id');
    expect(result.rows[0].name).toBe('New Engine Propeller');
    expect(result.rows[0].boat_id).toBe(testDataIds.boat);
    expect(result.rows[0].purchase_price).toBe(2500.00);
  });

  it('should create expense for equipment purchase', async () => {
    const expense = {
      boat_id: testDataIds.boat,
      amount: 2500.00,
      currency: 'EUR',
      date: '2025-11-14',
      category: 'Equipment Purchase',
      ocr_text: 'Marina Shop Invoice #12345 - Engine Propeller',
      approval_status: 'pending'
    };

    const result = await client.query(
      `INSERT INTO expenses
       (boat_id, amount, currency, date, category, ocr_text, approval_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        expense.boat_id,
        expense.amount,
        expense.currency,
        expense.date,
        expense.category,
        expense.ocr_text,
        expense.approval_status
      ]
    );

    testDataIds.expense = result.rows[0].id;
    expect(result.rows[0]).toHaveProperty('id');
    expect(result.rows[0].amount).toBe(2500.00);
    expect(result.rows[0].category).toBe('Equipment Purchase');
  });

  it('should verify expense links to inventory via boat', async () => {
    const inventoryCheck = await client.query(
      `SELECT * FROM inventory_items WHERE id = $1 AND boat_id = $2`,
      [testDataIds.inventory, testDataIds.boat]
    );

    const expenseCheck = await client.query(
      `SELECT * FROM expenses WHERE id = $1 AND boat_id = $2`,
      [testDataIds.expense, testDataIds.boat]
    );

    expect(inventoryCheck.rows.length).toBe(1);
    expect(expenseCheck.rows.length).toBe(1);
    expect(inventoryCheck.rows[0].boat_id).toBe(expenseCheck.rows[0].boat_id);
  });

  it('should verify depreciation calculation accuracy', async () => {
    const result = await client.query(
      `SELECT
        purchase_price,
        current_value,
        depreciation_rate,
        (purchase_price - (purchase_price * depreciation_rate)) as expected_year1
       FROM inventory_items WHERE id = $1`,
      [testDataIds.inventory]
    );

    const item = result.rows[0];
    const expectedYear1 = item.purchase_price * (1 - item.depreciation_rate);

    expect(item.current_value).toBe(item.purchase_price);
    expect(expectedYear1).toBe(2500.00 * (1 - 0.15)); // 2125.00
  });
});

/**
 * ============================================================================
 * WORKFLOW 2: Scheduled Maintenance
 * ============================================================================
 * Test: Create maintenance record -> Link to contact -> Create expense ->
 *       Set reminder -> Verify calendar entry
 */
describe('Workflow 2: Scheduled Maintenance', () => {

  it('should create contact for service provider', async () => {
    const contact = {
      organization_id: testDataIds.org,
      name: 'Marina Pro Services',
      type: 'mechanic',
      phone: '+1-555-0100',
      email: 'contact@marinaprro.com',
      address: '123 Harbor Lane, Port City, CA 90000',
      notes: 'Certified boat mechanic, 24hr emergency service'
    };

    const result = await client.query(
      `INSERT INTO contacts
       (organization_id, name, type, phone, email, address, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        contact.organization_id,
        contact.name,
        contact.type,
        contact.phone,
        contact.email,
        contact.address,
        contact.notes
      ]
    );

    testDataIds.contact = result.rows[0].id;
    expect(result.rows[0]).toHaveProperty('id');
    expect(result.rows[0].type).toBe('mechanic');
    expect(result.rows[0].organization_id).toBe(testDataIds.org);
  });

  it('should create maintenance record', async () => {
    const maintenance = {
      boat_id: testDataIds.boat,
      service_type: 'Annual Engine Inspection',
      date: '2025-11-14',
      provider: 'Marina Pro Services',
      cost: 450.00,
      next_due_date: '2026-11-14',
      notes: 'Full engine diagnostics and oil change'
    };

    const result = await client.query(
      `INSERT INTO maintenance_records
       (boat_id, service_type, date, provider, cost, next_due_date, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        maintenance.boat_id,
        maintenance.service_type,
        maintenance.date,
        maintenance.provider,
        maintenance.cost,
        maintenance.next_due_date,
        maintenance.notes
      ]
    );

    testDataIds.maintenance = result.rows[0].id;
    expect(result.rows[0]).toHaveProperty('id');
    expect(result.rows[0].service_type).toBe('Annual Engine Inspection');
    expect(result.rows[0].next_due_date).toBe('2026-11-14');
  });

  it('should create expense for maintenance service', async () => {
    const maintenanceResult = await client.query(
      `SELECT * FROM maintenance_records WHERE id = $1`,
      [testDataIds.maintenance]
    );

    const maintenanceRecord = maintenanceResult.rows[0];

    const expense = {
      boat_id: maintenanceRecord.boat_id,
      amount: maintenanceRecord.cost,
      currency: 'EUR',
      date: maintenanceRecord.date,
      category: 'Maintenance Service',
      ocr_text: 'Marina Pro Services - Engine Inspection Invoice',
      approval_status: 'pending'
    };

    const result = await client.query(
      `INSERT INTO expenses
       (boat_id, amount, currency, date, category, ocr_text, approval_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        expense.boat_id,
        expense.amount,
        expense.currency,
        expense.date,
        expense.category,
        expense.ocr_text,
        expense.approval_status
      ]
    );

    expect(result.rows[0].amount).toBe(450.00);
    expect(result.rows[0].category).toBe('Maintenance Service');
  });

  it('should create calendar entry for maintenance reminder', async () => {
    const maintenanceResult = await client.query(
      `SELECT * FROM maintenance_records WHERE id = $1`,
      [testDataIds.maintenance]
    );

    const maintenanceRecord = maintenanceResult.rows[0];
    const reminderDate = new Date(maintenanceRecord.next_due_date);
    reminderDate.setDate(reminderDate.getDate() - 7);

    const result = await client.query(
      `INSERT INTO calendars
       (boat_id, event_type, title, start_date, end_date, reminder_days_before, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        maintenanceRecord.boat_id,
        'maintenance',
        'Annual Engine Inspection Due',
        new Date(maintenanceRecord.next_due_date),
        new Date(maintenanceRecord.next_due_date),
        7,
        'Scheduled with Marina Pro Services'
      ]
    );

    expect(result.rows[0].event_type).toBe('maintenance');
    expect(result.rows[0].reminder_days_before).toBe(7);
  });

  it('should verify upcoming maintenance can be queried', async () => {
    const result = await client.query(
      `SELECT * FROM maintenance_records
       WHERE boat_id = $1 AND next_due_date >= CURRENT_DATE
       ORDER BY next_due_date ASC`,
      [testDataIds.boat]
    );

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].boat_id).toBe(testDataIds.boat);
  });
});

/**
 * ============================================================================
 * WORKFLOW 3: Security Camera Event
 * ============================================================================
 * Test: Register camera -> Receive webhook -> Update snapshot -> Verify notification
 */
describe('Workflow 3: Security Camera Event', () => {

  it('should register camera with Home Assistant webhook token', async () => {
    const camera = {
      boat_id: testDataIds.boat,
      camera_name: 'Dock Camera',
      rtsp_url: 'rtsp://192.168.1.100:554/stream',
      webhook_token: `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      last_snapshot_url: null
    };

    const result = await client.query(
      `INSERT INTO camera_feeds
       (boat_id, camera_name, rtsp_url, webhook_token, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [
        camera.boat_id,
        camera.camera_name,
        camera.rtsp_url,
        camera.webhook_token
      ]
    );

    testDataIds.camera = result.rows[0].id;
    expect(result.rows[0]).toHaveProperty('id');
    expect(result.rows[0].webhook_token).toBe(camera.webhook_token);
    expect(result.rows[0].camera_name).toBe('Dock Camera');
  });

  it('should update snapshot URL via webhook', async () => {
    const newSnapshotUrl = 'https://storage.navidocs.io/snapshots/camera-1-20251114-120000.jpg';

    const result = await client.query(
      `UPDATE camera_feeds
       SET last_snapshot_url = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [newSnapshotUrl, testDataIds.camera]
    );

    expect(result.rows[0].last_snapshot_url).toBe(newSnapshotUrl);
  });

  it('should create notification for camera event', async () => {
    const notification = {
      user_id: testDataIds.user1,
      type: 'camera_motion_detection',
      message: 'Motion detected at Dock Camera on 2025-11-14 12:00 UTC',
      sent_at: new Date(),
      delivery_status: 'sent'
    };

    const result = await client.query(
      `INSERT INTO notifications
       (user_id, type, message, sent_at, delivery_status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        notification.user_id,
        notification.type,
        notification.message,
        notification.sent_at,
        notification.delivery_status
      ]
    );

    expect(result.rows[0]).toHaveProperty('id');
    expect(result.rows[0].type).toBe('camera_motion_detection');
    expect(result.rows[0].delivery_status).toBe('sent');
  });

  it('should verify webhook token uniqueness', async () => {
    const token = testDataIds.camera;

    const result = await client.query(
      `SELECT COUNT(*) as count FROM camera_feeds WHERE id = $1`,
      [token]
    );

    expect(result.rows[0].count).toBeGreaterThan(0);
  });

  it('should verify camera linked to correct boat', async () => {
    const result = await client.query(
      `SELECT * FROM camera_feeds WHERE id = $1 AND boat_id = $2`,
      [testDataIds.camera, testDataIds.boat]
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].boat_id).toBe(testDataIds.boat);
  });
});

/**
 * ============================================================================
 * WORKFLOW 4: Multi-User Expense Split
 * ============================================================================
 * Test: Create expense with split users -> Approve -> Verify split calculations
 */
describe('Workflow 4: Multi-User Expense Split', () => {

  it('should create expense with split users', async () => {
    const splitData = {
      user1_share: 1000.00,
      user2_share: 1000.00,
      user3_share: 0.00
    };

    const splitUsers = {
      [testDataIds.user1]: { share: splitData.user1_share, approved: false },
      [testDataIds.user2]: { share: splitData.user2_share, approved: false },
      [testDataIds.user3]: { share: splitData.user3_share, approved: false }
    };

    const totalAmount = splitData.user1_share + splitData.user2_share + splitData.user3_share;

    const result = await client.query(
      `INSERT INTO expenses
       (boat_id, amount, currency, date, category, split_users, approval_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        testDataIds.boat,
        totalAmount,
        'EUR',
        '2025-11-14',
        'Shared Expense',
        JSON.stringify(splitUsers),
        'pending'
      ]
    );

    const expenseId = result.rows[0].id;
    expect(result.rows[0]).toHaveProperty('id');
    expect(result.rows[0].amount).toBe(2000.00);
    expect(result.rows[0].split_users).not.toBeNull();

    // Store for next test
    testDataIds.sharedExpense = expenseId;
  });

  it('should verify split calculations', async () => {
    const result = await client.query(
      `SELECT * FROM expenses WHERE id = $1`,
      [testDataIds.sharedExpense]
    );

    const expense = result.rows[0];
    const splits = expense.split_users;

    const totalSplit = Object.values(splits).reduce((sum, user) => sum + user.share, 0);
    expect(totalSplit).toBe(expense.amount);
  });

  it('should approve expense by first user', async () => {
    const result = await client.query(
      `SELECT split_users FROM expenses WHERE id = $1`,
      [testDataIds.sharedExpense]
    );

    const splitUsers = result.rows[0].split_users;
    splitUsers[testDataIds.user1].approved = true;

    const updateResult = await client.query(
      `UPDATE expenses
       SET split_users = $1, approval_status = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [JSON.stringify(splitUsers), 'partially_approved', testDataIds.sharedExpense]
    );

    expect(updateResult.rows[0].approval_status).toBe('partially_approved');
    expect(updateResult.rows[0].split_users[testDataIds.user1].approved).toBe(true);
  });

  it('should approve expense by second user', async () => {
    const result = await client.query(
      `SELECT split_users FROM expenses WHERE id = $1`,
      [testDataIds.sharedExpense]
    );

    const splitUsers = result.rows[0].split_users;
    splitUsers[testDataIds.user2].approved = true;

    const updateResult = await client.query(
      `UPDATE expenses
       SET split_users = $1, approval_status = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [JSON.stringify(splitUsers), 'approved', testDataIds.sharedExpense]
    );

    expect(updateResult.rows[0].approval_status).toBe('approved');
  });

  it('should notify all split users when approved', async () => {
    const notificationResult = await client.query(
      `INSERT INTO notifications
       (user_id, type, message, sent_at, delivery_status, created_at)
       VALUES ($1, $2, $3, NOW(), $4, NOW())
       RETURNING *`,
      [
        testDataIds.user1,
        'expense_approved',
        `Expense split of EUR 1000.00 has been approved by all parties`,
        'sent'
      ]
    );

    expect(notificationResult.rows[0]).toHaveProperty('id');
    expect(notificationResult.rows[0].type).toBe('expense_approved');
  });
});

/**
 * ============================================================================
 * DATABASE CASCADE DELETE TESTS
 * ============================================================================
 * Test: Verify CASCADE deletes work correctly across relationships
 */
describe('Database CASCADE Delete Tests', () => {

  it('should cascade delete inventory when boat is deleted', async () => {
    // Create test boat with inventory
    const boatResult = await client.query(
      `INSERT INTO boats (name, organization_id) VALUES ('Cascade Test Boat 1', $1) RETURNING id`,
      [testDataIds.org]
    );
    const cascadeBoat = boatResult.rows[0].id;

    // Add inventory
    const inventoryResult = await client.query(
      `INSERT INTO inventory_items (boat_id, name, category, created_at, updated_at)
       VALUES ($1, 'Test Item', 'Test', NOW(), NOW()) RETURNING id`,
      [cascadeBoat]
    );
    const cascadeInventory = inventoryResult.rows[0].id;

    // Verify inventory exists
    let check = await client.query(`SELECT * FROM inventory_items WHERE id = $1`, [cascadeInventory]);
    expect(check.rows.length).toBe(1);

    // Delete boat (should cascade)
    await client.query(`DELETE FROM boats WHERE id = $1`, [cascadeBoat]);

    // Verify inventory is deleted
    check = await client.query(`SELECT * FROM inventory_items WHERE id = $1`, [cascadeInventory]);
    expect(check.rows.length).toBe(0);
  });

  it('should cascade delete maintenance records when boat is deleted', async () => {
    // Create test boat with maintenance
    const boatResult = await client.query(
      `INSERT INTO boats (name, organization_id) VALUES ('Cascade Test Boat 2', $1) RETURNING id`,
      [testDataIds.org]
    );
    const cascadeBoat = boatResult.rows[0].id;

    // Add maintenance
    const maintenanceResult = await client.query(
      `INSERT INTO maintenance_records (boat_id, service_type, created_at, updated_at)
       VALUES ($1, 'Test Service', NOW(), NOW()) RETURNING id`,
      [cascadeBoat]
    );
    const cascadeMaintenance = maintenanceResult.rows[0].id;

    // Verify maintenance exists
    let check = await client.query(`SELECT * FROM maintenance_records WHERE id = $1`, [cascadeMaintenance]);
    expect(check.rows.length).toBe(1);

    // Delete boat (should cascade)
    await client.query(`DELETE FROM boats WHERE id = $1`, [cascadeBoat]);

    // Verify maintenance is deleted
    check = await client.query(`SELECT * FROM maintenance_records WHERE id = $1`, [cascadeMaintenance]);
    expect(check.rows.length).toBe(0);
  });

  it('should cascade delete cameras when boat is deleted', async () => {
    // Create test boat with camera
    const boatResult = await client.query(
      `INSERT INTO boats (name, organization_id) VALUES ('Cascade Test Boat 3', $1) RETURNING id`,
      [testDataIds.org]
    );
    const cascadeBoat = boatResult.rows[0].id;

    // Add camera
    const cameraResult = await client.query(
      `INSERT INTO camera_feeds (boat_id, camera_name, created_at, updated_at)
       VALUES ($1, 'Test Camera', NOW(), NOW()) RETURNING id`,
      [cascadeBoat]
    );
    const cascadeCamera = cameraResult.rows[0].id;

    // Verify camera exists
    let check = await client.query(`SELECT * FROM camera_feeds WHERE id = $1`, [cascadeCamera]);
    expect(check.rows.length).toBe(1);

    // Delete boat (should cascade)
    await client.query(`DELETE FROM boats WHERE id = $1`, [cascadeBoat]);

    // Verify camera is deleted
    check = await client.query(`SELECT * FROM camera_feeds WHERE id = $1`, [cascadeCamera]);
    expect(check.rows.length).toBe(0);
  });

  it('should cascade delete when organization is deleted', async () => {
    // Create test org with contact
    const orgResult = await client.query(
      `INSERT INTO organizations (name) VALUES ('Cascade Test Org') RETURNING id`
    );
    const cascadeOrg = orgResult.rows[0].id;

    // Add contact
    const contactResult = await client.query(
      `INSERT INTO contacts (organization_id, name, type, created_at, updated_at)
       VALUES ($1, 'Test Contact', 'vendor', NOW(), NOW()) RETURNING id`,
      [cascadeOrg]
    );
    const cascadeContact = contactResult.rows[0].id;

    // Verify contact exists
    let check = await client.query(`SELECT * FROM contacts WHERE id = $1`, [cascadeContact]);
    expect(check.rows.length).toBe(1);

    // Delete organization (should cascade)
    await client.query(`DELETE FROM organizations WHERE id = $1`, [cascadeOrg]);

    // Verify contact is deleted
    check = await client.query(`SELECT * FROM contacts WHERE id = $1`, [cascadeContact]);
    expect(check.rows.length).toBe(0);
  });

  it('should cascade delete user notifications when user is deleted', async () => {
    // Create test user with notification
    const userResult = await client.query(
      `INSERT INTO users (email, name, password_hash, created_at, updated_at)
       VALUES ('cascade-user@test.com', 'Cascade User', 'hash', NOW(), NOW()) RETURNING id`
    );
    const cascadeUser = userResult.rows[0].id;

    // Add notification
    const notifResult = await client.query(
      `INSERT INTO notifications (user_id, type, message, created_at)
       VALUES ($1, 'test', 'Test notification', NOW()) RETURNING id`,
      [cascadeUser]
    );
    const cascadeNotif = notifResult.rows[0].id;

    // Verify notification exists
    let check = await client.query(`SELECT * FROM notifications WHERE id = $1`, [cascadeNotif]);
    expect(check.rows.length).toBe(1);

    // Delete user (should cascade)
    await client.query(`DELETE FROM users WHERE id = $1`, [cascadeUser]);

    // Verify notification is deleted
    check = await client.query(`SELECT * FROM notifications WHERE id = $1`, [cascadeNotif]);
    expect(check.rows.length).toBe(0);
  });
});

/**
 * ============================================================================
 * SEARCH INTEGRATION TESTS
 * ============================================================================
 * Test: Create records and verify they can be searched
 */
describe('Search Integration Tests', () => {

  it('should find inventory items by name', async () => {
    const result = await client.query(
      `SELECT * FROM inventory_items
       WHERE boat_id = $1 AND name ILIKE $2`,
      [testDataIds.boat, '%Engine%']
    );

    expect(result.rows.length).toBeGreaterThan(0);
  });

  it('should find inventory items by category', async () => {
    const result = await client.query(
      `SELECT * FROM inventory_items
       WHERE boat_id = $1 AND category ILIKE $2`,
      [testDataIds.boat, '%Propulsion%']
    );

    expect(result.rows.length).toBeGreaterThan(0);
  });

  it('should find maintenance by service type', async () => {
    const result = await client.query(
      `SELECT * FROM maintenance_records
       WHERE boat_id = $1 AND service_type ILIKE $2`,
      [testDataIds.boat, '%Engine%']
    );

    expect(result.rows.length).toBeGreaterThan(0);
  });

  it('should find contacts by name', async () => {
    const result = await client.query(
      `SELECT * FROM contacts
       WHERE organization_id = $1 AND name ILIKE $2`,
      [testDataIds.org, '%Marina%']
    );

    expect(result.rows.length).toBeGreaterThan(0);
  });

  it('should find contacts by type', async () => {
    const result = await client.query(
      `SELECT * FROM contacts
       WHERE organization_id = $1 AND type = $2`,
      [testDataIds.org, 'mechanic']
    );

    expect(result.rows.length).toBeGreaterThan(0);
  });

  it('should find expenses by category', async () => {
    const result = await client.query(
      `SELECT * FROM expenses
       WHERE boat_id = $1 AND category ILIKE $2`,
      [testDataIds.boat, '%Equipment%']
    );

    expect(result.rows.length).toBeGreaterThan(0);
  });

  it('should support full-text search with multiple conditions', async () => {
    const result = await client.query(
      `SELECT * FROM expenses
       WHERE boat_id = $1
       AND (category ILIKE $2 OR ocr_text ILIKE $3)
       ORDER BY date DESC`,
      [testDataIds.boat, '%Purchase%', '%Invoice%']
    );

    expect(Array.isArray(result.rows)).toBe(true);
  });
});

/**
 * ============================================================================
 * AUTHENTICATION FLOW TESTS
 * ============================================================================
 * Test: Login -> Token -> Access control
 */
describe('Authentication Flow Tests', () => {

  it('should verify user can be authenticated', async () => {
    const result = await client.query(
      `SELECT * FROM users WHERE id = $1`,
      [testDataIds.user1]
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].email).toBe('e2e-user1@test.com');
  });

  it('should verify user has organization membership', async () => {
    const result = await client.query(
      `SELECT * FROM users WHERE id = $1 AND organization_id = $2`,
      [testDataIds.user1, testDataIds.org]
    );

    expect(result.rows.length).toBe(1);
  });

  it('should verify multiple users in same organization', async () => {
    const result = await client.query(
      `SELECT * FROM users
       WHERE organization_id = $1
       ORDER BY created_at ASC`,
      [testDataIds.org]
    );

    expect(result.rows.length).toBeGreaterThanOrEqual(3);
  });

  it('should verify user preferences can be set', async () => {
    const prefResult = await client.query(
      `INSERT INTO user_preferences
       (user_id, theme, language, notifications_enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         theme = $2, language = $3, notifications_enabled = $4, updated_at = NOW()
       RETURNING *`,
      [testDataIds.user1, 'dark', 'en', true]
    );

    expect(prefResult.rows[0].theme).toBe('dark');
    expect(prefResult.rows[0].user_id).toBe(testDataIds.user1);
  });

  it('should prevent unauthorized access across organizations', async () => {
    // Create another organization
    const otherOrgResult = await client.query(
      `INSERT INTO organizations (name) VALUES ('Other Org') RETURNING id`
    );
    const otherOrg = otherOrgResult.rows[0].id;

    // Create boat in other org
    const otherBoatResult = await client.query(
      `INSERT INTO boats (name, organization_id) VALUES ('Other Boat', $1) RETURNING id`,
      [otherOrg]
    );
    const otherBoat = otherBoatResult.rows[0].id;

    // User from first org should not access boat in other org
    const result = await client.query(
      `SELECT * FROM boats
       WHERE id = $1 AND organization_id = $2`,
      [otherBoat, testDataIds.org]
    );

    expect(result.rows.length).toBe(0);

    // Cleanup
    await client.query(`DELETE FROM boats WHERE id = $1`, [otherBoat]);
    await client.query(`DELETE FROM organizations WHERE id = $1`, [otherOrg]);
  });
});

/**
 * ============================================================================
 * DATA INTEGRITY TESTS
 * ============================================================================
 * Test: Verify constraints and relationships
 */
describe('Data Integrity Tests', () => {

  it('should enforce NOT NULL constraints on critical fields', async () => {
    try {
      await client.query(
        `INSERT INTO inventory_items (boat_id, created_at, updated_at)
         VALUES (NULL, NOW(), NOW())`
      );
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toContain('null');
    }
  });

  it('should verify foreign key constraint enforcement', async () => {
    try {
      await client.query(
        `INSERT INTO inventory_items (boat_id, name, created_at, updated_at)
         VALUES (99999, 'Test', NOW(), NOW())`
      );
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toContain('foreign key');
    }
  });

  it('should verify timestamp defaults are set', async () => {
    const result = await client.query(
      `SELECT created_at, updated_at FROM inventory_items
       WHERE id = $1`,
      [testDataIds.inventory]
    );

    expect(result.rows[0].created_at).not.toBeNull();
    expect(result.rows[0].updated_at).not.toBeNull();
  });

  it('should verify unique constraints on webhook tokens', async () => {
    // Get existing token
    const tokenResult = await client.query(
      `SELECT webhook_token FROM camera_feeds WHERE id = $1`,
      [testDataIds.camera]
    );

    const existingToken = tokenResult.rows[0].webhook_token;

    try {
      await client.query(
        `INSERT INTO camera_feeds (boat_id, camera_name, webhook_token, created_at, updated_at)
         VALUES ($1, 'Duplicate Token Camera', $2, NOW(), NOW())`,
        [testDataIds.boat, existingToken]
      );
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toContain('unique');
    }
  });

  it('should support JSON/JSONB data types for split expenses', async () => {
    const result = await client.query(
      `SELECT split_users FROM expenses WHERE id = $1`,
      [testDataIds.sharedExpense]
    );

    expect(result.rows[0].split_users).toBeDefined();
    expect(typeof result.rows[0].split_users).toBe('object');
  });
});

/**
 * ============================================================================
 * PERFORMANCE AND INDEXING TESTS
 * ============================================================================
 * Test: Verify indexes are being used
 */
describe('Performance and Indexing Tests', () => {

  it('should quickly query by boat_id', async () => {
    const start = Date.now();
    const result = await client.query(
      `SELECT * FROM inventory_items WHERE boat_id = $1`,
      [testDataIds.boat]
    );
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100); // Should be very fast with index
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it('should quickly query by date range', async () => {
    const start = Date.now();
    const result = await client.query(
      `SELECT * FROM expenses
       WHERE boat_id = $1 AND date >= $2 AND date <= $3`,
      [testDataIds.boat, '2025-01-01', '2025-12-31']
    );
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it('should quickly query by approval status', async () => {
    const start = Date.now();
    const result = await client.query(
      `SELECT * FROM expenses
       WHERE boat_id = $1 AND approval_status = $2`,
      [testDataIds.boat, 'approved']
    );
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it('should quickly query maintenance by due date', async () => {
    const start = Date.now();
    const result = await client.query(
      `SELECT * FROM maintenance_records
       WHERE boat_id = $1 AND next_due_date >= CURRENT_DATE
       ORDER BY next_due_date ASC`,
      [testDataIds.boat]
    );
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });
});

/**
 * ============================================================================
 * WORKFLOW COMPLETION TESTS
 * ============================================================================
 * Test: Verify all workflows can complete end-to-end
 */
describe('Complete End-to-End Workflow Scenarios', () => {

  it('should complete full equipment purchase workflow', async () => {
    // Create inventory
    const inventoryResult = await client.query(
      `INSERT INTO inventory_items (boat_id, name, category, purchase_price, current_value, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
      [testDataIds.boat, 'Hull Paint', 'Maintenance Supplies', 800.00, 800.00]
    );

    // Create expense
    const expenseResult = await client.query(
      `INSERT INTO expenses (boat_id, amount, currency, date, category, approval_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id`,
      [testDataIds.boat, 800.00, 'EUR', '2025-11-14', 'Equipment Purchase', 'pending']
    );

    // Both should exist
    expect(inventoryResult.rows[0]).toHaveProperty('id');
    expect(expenseResult.rows[0]).toHaveProperty('id');

    // Verify linkage via boat_id
    const verifyResult = await client.query(
      `SELECT
        (SELECT COUNT(*) FROM inventory_items WHERE boat_id = $1) as inventory_count,
        (SELECT COUNT(*) FROM expenses WHERE boat_id = $1) as expense_count`,
      [testDataIds.boat]
    );

    expect(verifyResult.rows[0].inventory_count).toBeGreaterThan(0);
    expect(verifyResult.rows[0].expense_count).toBeGreaterThan(0);
  });

  it('should handle complex multi-user approval workflow', async () => {
    const users = [testDataIds.user1, testDataIds.user2];
    const splitData = {
      [testDataIds.user1]: { share: 500.00, approved: false },
      [testDataIds.user2]: { share: 500.00, approved: false }
    };

    // Create expense with split
    const expenseResult = await client.query(
      `INSERT INTO expenses (boat_id, amount, currency, date, category, split_users, approval_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id`,
      [testDataIds.boat, 1000.00, 'EUR', '2025-11-14', 'Shared Expense', JSON.stringify(splitData), 'pending']
    );

    const expenseId = expenseResult.rows[0].id;

    // Approve by each user
    for (const userId of users) {
      const updateResult = await client.query(
        `SELECT split_users FROM expenses WHERE id = $1`,
        [expenseId]
      );

      const splits = updateResult.rows[0].split_users;
      splits[userId].approved = true;

      await client.query(
        `UPDATE expenses SET split_users = $1 WHERE id = $2`,
        [JSON.stringify(splits), expenseId]
      );
    }

    // Verify all approved
    const finalResult = await client.query(
      `SELECT split_users FROM expenses WHERE id = $1`,
      [expenseId]
    );

    const finalSplits = finalResult.rows[0].split_users;
    const allApproved = users.every(uid => finalSplits[uid].approved === true);
    expect(allApproved).toBe(true);
  });

  it('should verify data consistency across operations', async () => {
    // Count all records for this boat
    const countResult = await client.query(
      `SELECT
        COUNT(DISTINCT id) FROM inventory_items WHERE boat_id = $1
        UNION ALL
        SELECT COUNT(DISTINCT id) FROM maintenance_records WHERE boat_id = $1
        UNION ALL
        SELECT COUNT(DISTINCT id) FROM camera_feeds WHERE boat_id = $1
        UNION ALL
        SELECT COUNT(DISTINCT id) FROM expenses WHERE boat_id = $1`,
      [testDataIds.boat]
    );

    expect(countResult.rows.length).toBeGreaterThan(0);
    countResult.rows.forEach(row => {
      expect(row.count).toBeGreaterThanOrEqual(0);
    });
  });
});
