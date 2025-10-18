/**
 * Database initialization script
 * Creates SQLite database from schema.sql
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_PATH || join(__dirname, 'navidocs.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

export function initDatabase() {
  console.log('Initializing database:', DB_PATH);

  const db = new Database(DB_PATH);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Read and execute schema
  const schema = readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);

  console.log('Database initialized successfully');

  return db;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
  console.log('Done!');
  process.exit(0);
}
