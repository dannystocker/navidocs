/**
 * Set user as system admin
 * Usage: node scripts/set-admin.js <email>
 */

import { getDb } from '../config/db.js';

const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Email is required');
  console.log('Usage: node scripts/set-admin.js <email>');
  process.exit(1);
}

try {
  const db = getDb();

  // Check if user exists
  const user = db.prepare('SELECT id, email, name, is_system_admin FROM users WHERE email = ?').get(email);

  if (!user) {
    console.error(`❌ User not found: ${email}`);
    process.exit(1);
  }

  if (user.is_system_admin) {
    console.log(`✅ User ${email} is already a system admin`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   ID: ${user.id}`);
    process.exit(0);
  }

  // Update user to system admin
  db.prepare('UPDATE users SET is_system_admin = 1 WHERE email = ?').run(email);

  console.log(`✅ Successfully granted system admin permissions to ${email}`);
  console.log(`   Name: ${user.name || 'N/A'}`);
  console.log(`   ID: ${user.id}`);

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
