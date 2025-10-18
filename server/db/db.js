/**
 * Database connection module
 * Provides SQLite connection with better-sqlite3
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_PATH || join(__dirname, 'navidocs.db');

let db = null;

/**
 * Get database connection (singleton)
 * @returns {Database.Database} SQLite database instance
 */
export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);

    // Enable foreign keys and WAL mode for better concurrency
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');

    console.log('Database connected:', DB_PATH);
  }

  return db;
}

/**
 * Close database connection
 */
export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export default { getDb, closeDb };
