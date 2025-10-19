#!/usr/bin/env node
/**
 * Run database migration
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'db/navidocs.db');
const MIGRATION_FILE = process.argv[2];

if (!MIGRATION_FILE) {
  console.error('Usage: node run-migration.js <migration-file.sql>');
  process.exit(1);
}

const migrationPath = path.join(__dirname, 'migrations', MIGRATION_FILE);

if (!fs.existsSync(migrationPath)) {
  console.error(`Migration file not found: ${migrationPath}`);
  process.exit(1);
}

console.log(`Running migration: ${MIGRATION_FILE}`);
console.log(`Database: ${DB_PATH}`);

const db = new Database(DB_PATH);
const sql = fs.readFileSync(migrationPath, 'utf-8');

try {
  // Execute all statements as one transaction
  console.log(`Executing migration SQL...`);
  db.exec(sql);
  console.log('✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error(error);
  process.exit(1);
} finally {
  db.close();
}
