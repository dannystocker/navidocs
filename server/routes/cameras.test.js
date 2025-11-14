/**
 * Cameras Route Tests - Testing camera integration with Home Assistant
 * Core logic validation tests
 */

import assert from 'node:assert';
import Database from 'better-sqlite3';
import { randomBytes } from 'crypto';

// Test database setup
let testDb;

// Test database initialization
function setupTestDb() {
  // Use in-memory database for tests
  testDb = new Database(':memory:');
  testDb.pragma('foreign_keys = ON');

  // Create test tables
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS boats (
      id INTEGER PRIMARY KEY,
      organization_id INTEGER,
      name TEXT
    );
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
    CREATE TABLE IF NOT EXISTS user_organizations (
      user_id TEXT,
      organization_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS camera_feeds (
      id INTEGER PRIMARY KEY,
      boat_id INTEGER,
      camera_name TEXT,
      rtsp_url TEXT,
      last_snapshot_url TEXT,
      webhook_token TEXT UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (boat_id) REFERENCES boats(id)
    );
  `);
}

// Cleanup
function teardownTests() {
  try {
    if (testDb) {
      testDb.close();
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Helper: Insert test data
function insertTestBoat(boatId = 1, orgId = 1) {
  testDb.prepare('INSERT OR IGNORE INTO organizations(id, name) VALUES(?, ?)').run(orgId, 'Test Org');
  testDb.prepare('INSERT OR IGNORE INTO user_organizations(user_id, organization_id) VALUES(?, ?)').run('test-user-id', orgId);
  testDb.prepare('INSERT OR IGNORE INTO boats(id, organization_id, name) VALUES(?, ?, ?)').run(boatId, orgId, 'Test Boat');
}

// Utility functions
function generateWebhookToken() {
  return randomBytes(32).toString('hex');
}

function validateRtspUrl(url) {
  if (!url) return false;
  const rtspRegex = /^rtsp:\/\/([^@]+@)?([a-zA-Z0-9.-]+|\[[\da-fA-F:]+\])(:\d+)?\/[^\s]*$/i;
  const httpRegex = /^https?:\/\/([^@]+@)?([a-zA-Z0-9.-]+|\[[\da-fA-F:]+\])(:\d+)?\/[^\s]*$/i;
  return rtspRegex.test(url) || httpRegex.test(url);
}

// Test tracker
const tests = [];
let passedCount = 0;
let failedCount = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

// Test Suite Definitions
test('should validate RTSP URL formats correctly', () => {
  const validUrls = [
    'rtsp://192.168.1.100:554/stream',
    'rtsp://user:pass@192.168.1.100/stream',
    'http://192.168.1.100:8080/snapshot',
    'https://example.com/camera/stream'
  ];

  const invalidUrls = [
    'ftp://192.168.1.100/stream',
    'not-a-url',
    'http://',
    ''
  ];

  for (const url of validUrls) {
    assert.strictEqual(validateRtspUrl(url), true, `URL should be valid: ${url}`);
  }

  for (const url of invalidUrls) {
    assert.strictEqual(validateRtspUrl(url), false, `URL should be invalid: ${url}`);
  }
});

test('should register a new camera feed', () => {
  insertTestBoat(1, 1);

  const result = testDb.prepare(`
    INSERT INTO camera_feeds (boat_id, camera_name, rtsp_url, webhook_token, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(1, 'Starboard Camera', 'rtsp://user:pass@192.168.1.100/stream', 'test-token-1');

  const camera = testDb.prepare('SELECT * FROM camera_feeds WHERE id = ?').get(result.lastInsertRowid);
  assert.ok(camera, 'Camera should be created');
  assert.strictEqual(camera.camera_name, 'Starboard Camera');
  assert.strictEqual(camera.boat_id, 1);
  assert.ok(camera.webhook_token, 'Webhook token should exist');
});

test('should generate unique webhook tokens', () => {
  const token1 = generateWebhookToken();
  const token2 = generateWebhookToken();
  assert.notStrictEqual(token1, token2, 'Tokens should be unique');
  assert.strictEqual(token1.length, 64, 'Token should be 64 chars (32 bytes hex)');
  assert.strictEqual(token2.length, 64, 'Token should be 64 chars (32 bytes hex)');
});

test('should handle Home Assistant webhook events', () => {
  insertTestBoat(3, 1);

  const cameraResult = testDb.prepare(`
    INSERT INTO camera_feeds (boat_id, camera_name, rtsp_url, webhook_token, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(3, 'Test Camera', 'rtsp://192.168.1.100/stream', 'test-webhook-token');

  const initialCamera = testDb.prepare('SELECT last_snapshot_url FROM camera_feeds WHERE id = ?').get(cameraResult.lastInsertRowid);
  assert.strictEqual(initialCamera.last_snapshot_url, null, 'Initial snapshot URL should be null');

  // Update with webhook
  const snapshotUrl = 'https://example.com/snapshot.jpg';
  testDb.prepare(`
    UPDATE camera_feeds
    SET last_snapshot_url = ?, updated_at = datetime('now')
    WHERE webhook_token = ?
  `).run(snapshotUrl, 'test-webhook-token');

  const updatedCamera = testDb.prepare('SELECT last_snapshot_url FROM camera_feeds WHERE id = ?').get(cameraResult.lastInsertRowid);
  assert.strictEqual(updatedCamera.last_snapshot_url, snapshotUrl, 'Snapshot URL should be updated');
});

test('should update last snapshot URL from webhook payload', () => {
  insertTestBoat(4, 1);

  const cameraResult = testDb.prepare(`
    INSERT INTO camera_feeds (boat_id, camera_name, rtsp_url, webhook_token, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(4, 'Snapshot Test', 'rtsp://192.168.1.100/stream', 'snapshot-token-xyz');

  // Simulate multiple webhook updates
  const snapshotUrls = [
    'https://example.com/snapshot1.jpg',
    'https://example.com/snapshot2.jpg',
    'https://example.com/snapshot3.jpg'
  ];

  for (const url of snapshotUrls) {
    testDb.prepare(`
      UPDATE camera_feeds
      SET last_snapshot_url = ?, updated_at = datetime('now')
      WHERE webhook_token = ?
    `).run(url, 'snapshot-token-xyz');
  }

  const finalCamera = testDb.prepare('SELECT last_snapshot_url FROM camera_feeds WHERE id = ?').get(cameraResult.lastInsertRowid);
  assert.strictEqual(finalCamera.last_snapshot_url, snapshotUrls[snapshotUrls.length - 1], 'Should have latest snapshot URL');
});

test('should list all cameras for a boat', () => {
  insertTestBoat(5, 1);

  // Create multiple cameras
  for (let i = 0; i < 3; i++) {
    testDb.prepare(`
      INSERT INTO camera_feeds (boat_id, camera_name, rtsp_url, webhook_token, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(5, `Camera ${i + 1}`, `rtsp://192.168.1.${100 + i}/stream`, `token-${i}`);
  }

  // Retrieve cameras
  const boatCameras = testDb.prepare('SELECT id, camera_name FROM camera_feeds WHERE boat_id = ? ORDER BY id').all(5);
  assert.strictEqual(boatCameras.length, 3, 'Should have 3 cameras');
  assert.strictEqual(boatCameras[0].camera_name, 'Camera 1');
});

test('should update camera settings', () => {
  insertTestBoat(6, 1);

  const cameraResult = testDb.prepare(`
    INSERT INTO camera_feeds (boat_id, camera_name, rtsp_url, webhook_token, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(6, 'Original Name', 'rtsp://192.168.1.100/stream', 'update-token');

  const cameraId = cameraResult.lastInsertRowid;

  // Update camera
  testDb.prepare(`
    UPDATE camera_feeds
    SET camera_name = ?, rtsp_url = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run('Updated Name', 'rtsp://192.168.1.200/newstream', cameraId);

  const updated = testDb.prepare('SELECT camera_name, rtsp_url FROM camera_feeds WHERE id = ?').get(cameraId);
  assert.strictEqual(updated.camera_name, 'Updated Name');
  assert.strictEqual(updated.rtsp_url, 'rtsp://192.168.1.200/newstream');
});

test('should delete a camera', () => {
  insertTestBoat(7, 1);

  const cameraResult = testDb.prepare(`
    INSERT INTO camera_feeds (boat_id, camera_name, rtsp_url, webhook_token, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(7, 'To Delete', 'rtsp://192.168.1.100/stream', 'delete-token');

  const cameraId = cameraResult.lastInsertRowid;

  // Verify camera exists
  let camera = testDb.prepare('SELECT id FROM camera_feeds WHERE id = ?').get(cameraId);
  assert.ok(camera, 'Camera should exist');

  // Delete camera
  testDb.prepare('DELETE FROM camera_feeds WHERE id = ?').run(cameraId);

  // Verify deletion
  camera = testDb.prepare('SELECT id FROM camera_feeds WHERE id = ?').get(cameraId);
  assert.strictEqual(camera, undefined, 'Camera should be deleted');
});

test('should verify boat access for operations', () => {
  // Setup two boats, one accessible, one not
  testDb.prepare('INSERT OR IGNORE INTO organizations(id, name) VALUES(?, ?)').run(10, 'Org 10');
  testDb.prepare('INSERT OR IGNORE INTO organizations(id, name) VALUES(?, ?)').run(11, 'Org 11');
  testDb.prepare('INSERT OR IGNORE INTO user_organizations(user_id, organization_id) VALUES(?, ?)').run('test-user-id', 10);
  testDb.prepare('INSERT OR IGNORE INTO boats(id, organization_id, name) VALUES(?, ?, ?)').run(10, 10, 'My Boat');
  testDb.prepare('INSERT OR IGNORE INTO boats(id, organization_id, name) VALUES(?, ?, ?)').run(11, 11, 'Other Boat');

  // Verify user can access boat 10 but not boat 11
  const boat10 = testDb.prepare(`
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = ?
    AND EXISTS (
      SELECT 1 FROM boats b
      WHERE b.id = ? AND b.organization_id = uo.organization_id
    )
  `).get('test-user-id', 10);

  const boat11 = testDb.prepare(`
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = ?
    AND EXISTS (
      SELECT 1 FROM boats b
      WHERE b.id = ? AND b.organization_id = uo.organization_id
    )
  `).get('test-user-id', 11);

  assert.ok(boat10, 'User should have access to boat 10');
  assert.strictEqual(boat11, undefined, 'User should not have access to boat 11');
});

test('should reject invalid RTSP URLs', () => {
  const invalidUrls = [
    'not-a-url',
    'ftp://192.168.1.100/stream',
    'http://',
    'rtsp://',
    ''
  ];

  for (const url of invalidUrls) {
    assert.strictEqual(validateRtspUrl(url), false, `URL should be invalid: ${url}`);
  }
});

test('should prevent duplicate webhook tokens', () => {
  insertTestBoat(8, 1);

  const token = 'unique-test-token-' + Date.now();

  // Create first camera with token
  testDb.prepare(`
    INSERT INTO camera_feeds (boat_id, camera_name, rtsp_url, webhook_token, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(8, 'Camera 1', 'rtsp://192.168.1.100/stream', token);

  // Try to create second camera with same token (should fail due to UNIQUE constraint)
  try {
    testDb.prepare(`
      INSERT INTO camera_feeds (boat_id, camera_name, rtsp_url, webhook_token, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(8, 'Camera 2', 'rtsp://192.168.1.101/stream', token);

    assert.fail('Should have thrown unique constraint error');
  } catch (error) {
    assert.ok(error.message.includes('UNIQUE'), 'Should fail due to unique constraint');
  }
});

// Run all tests
(async () => {
  setupTestDb();

  console.log('\n========================================');
  console.log('Camera Routes Test Suite');
  console.log('========================================\n');

  for (const testCase of tests) {
    try {
      testCase.fn();
      passedCount++;
      console.log(`✓ PASS: ${testCase.name}`);
    } catch (error) {
      failedCount++;
      console.log(`✗ FAIL: ${testCase.name}`);
      console.log(`  Error: ${error.message}`);
    }
  }

  teardownTests();

  // Summary
  console.log('\n========================================');
  console.log(`Results: ${passedCount} passed, ${failedCount} failed`);
  console.log(`Total: ${tests.length} tests`);
  console.log('========================================\n');

  process.exit(failedCount > 0 ? 1 : 0);
})();
