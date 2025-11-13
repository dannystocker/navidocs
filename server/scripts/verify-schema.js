import Database from 'better-sqlite3';

const db = new Database('./db/navidocs.db');

console.log('\n=== Database Schema Verification ===\n');

// Get all tables
console.log('📊 All Tables:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables.forEach((t, i) => console.log(`  ${i + 1}. ${t.name}`));

// Check critical auth tables exist
console.log('\n✓ Critical Auth Tables:');
const criticalTables = ['users', 'refresh_tokens', 'entity_permissions', 'audit_log', 'system_settings', 'organizations', 'user_organizations'];
criticalTables.forEach(table => {
  const exists = tables.some(t => t.name === table);
  console.log(`  ${exists ? '✓' : '✗'} ${table}`);
});

// Check users table has auth columns
console.log('\n📋 Users Table Columns:');
const userCols = db.prepare("PRAGMA table_info(users)").all();
const authCols = ['email_verified', 'status', 'failed_login_attempts', 'locked_until', 'verification_token', 'is_system_admin'];
authCols.forEach(col => {
  const exists = userCols.some(c => c.name === col);
  console.log(`  ${exists ? '✓' : '✗'} ${col}`);
});

// Check system_settings defaults
console.log('\n⚙️  System Settings:');
const settings = db.prepare("SELECT category, COUNT(*) as count FROM system_settings GROUP BY category").all();
settings.forEach(s => console.log(`  ${s.category}: ${s.count} settings`));

// Check indexes
console.log('\n📇 Database Indexes:');
const indexes = db.prepare("SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY tbl_name").all();
indexes.forEach(idx => console.log(`  ${idx.tbl_name}.${idx.name}`));

// Count records
console.log('\n📈 Record Counts:');
const countUsers = db.prepare("SELECT COUNT(*) as count FROM users").get();
const countAudit = db.prepare("SELECT COUNT(*) as count FROM audit_log").get();
const countTokens = db.prepare("SELECT COUNT(*) as count FROM refresh_tokens").get();
console.log(`  Users: ${countUsers.count}`);
console.log(`  Audit Log: ${countAudit.count}`);
console.log(`  Refresh Tokens: ${countTokens.count}`);

console.log('\n=== Schema Verification Complete ===\n');

db.close();
