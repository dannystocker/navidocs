#!/usr/bin/env node
/**
 * Database Migration Runner
 *
 * Usage: node scripts/run-migration.js <migration-file.sql>
 * Example: node scripts/run-migration.js migrations/005_auth_system.sql
 */

import { readFileSync } from 'fs';
import { getDb } from '../config/db.js';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node scripts/run-migration.js <migration-file.sql>');
  process.exit(1);
}

const migrationPath = resolve(join(__dirname, '..', migrationFile));

console.log(`\n📦 Running migration: ${migrationFile}\n`);

try {
  const sql = readFileSync(migrationPath, 'utf-8');
  const db = getDb();

  // Execute entire SQL file as one block (better-sqlite3 handles multiple statements)
  db.exec(sql);

  console.log(`✅ Migration completed successfully!\n`);

  // Show new tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('📊 Current database tables:');
  tables.forEach(t => console.log(`   - ${t.name}`));
  console.log();

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error(error);
  process.exit(1);
}
