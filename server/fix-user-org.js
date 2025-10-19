import Database from 'better-sqlite3';
const db = new Database('./db/navidocs.db');

// Add test user to test-org-123
const result = db.prepare(`
  INSERT INTO user_organizations (user_id, organization_id, role, joined_at)
  VALUES ('test-user-id', 'test-org-123', 'admin', ?)
`).run(Date.now());

console.log(`Added user to organization: ${result.changes} rows`);

// Verify
const check = db.prepare(`
  SELECT * FROM user_organizations WHERE user_id = 'test-user-id' AND organization_id = 'test-org-123'
`).get();

console.log('Result:', check);

db.close();
