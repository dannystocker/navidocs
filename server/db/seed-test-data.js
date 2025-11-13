/**
 * Seed test data for development
 */
import { getDb } from './db.js';

const db = getDb();

// Create test user
const testUserId = 'test-user-id';
const testOrgId = 'test-org-id';

try {
  // Check if test user exists
  const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(testUserId);

  if (!existingUser) {
    console.log('Creating test user...');
    db.prepare(`
      INSERT INTO users (id, email, name, created_at)
      VALUES (?, ?, ?, ?)
    `).run(testUserId, 'test@navidocs.local', 'Test User', Date.now());
    console.log('✓ Test user created');
  } else {
    console.log('✓ Test user already exists');
  }

  // Check if test organization exists
  const existingOrg = db.prepare('SELECT id FROM organizations WHERE id = ?').get(testOrgId);

  if (!existingOrg) {
    console.log('Creating test organization...');
    db.prepare(`
      INSERT INTO organizations (id, name, created_at)
      VALUES (?, ?, ?)
    `).run(testOrgId, 'Test Organization', Date.now());
    console.log('✓ Test organization created');
  } else {
    console.log('✓ Test organization already exists');
  }

  console.log('\n✅ Test data seeded successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Error seeding test data:', error);
  process.exit(1);
}
