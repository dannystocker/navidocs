/**
 * List all system admins
 */

import { getDb } from '../config/db.js';

try {
  const db = getDb();

  const admins = db.prepare(`
    SELECT id, email, name, created_at, last_login_at
    FROM users
    WHERE is_system_admin = 1
    ORDER BY created_at DESC
  `).all();

  if (admins.length === 0) {
    console.log('No system admins found');
    process.exit(0);
  }

  console.log(`\n📋 System Admins (${admins.length}):\n`);

  admins.forEach((admin, idx) => {
    console.log(`${idx + 1}. ${admin.email}`);
    console.log(`   Name: ${admin.name || 'N/A'}`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Created: ${new Date(admin.created_at).toLocaleString()}`);
    console.log(`   Last Login: ${admin.last_login_at ? new Date(admin.last_login_at).toLocaleString() : 'Never'}`);
    console.log('');
  });

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
