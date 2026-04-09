import Database from 'better-sqlite3';
import path from 'path';
import { env } from '../config/env';
import { logger } from '../config/logger';

// Singleton — one connection shared across the entire process.
// better-sqlite3 is synchronous by design; a single connection is safe and fast.
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dbPath = path.resolve(env.DATABASE_PATH);

  _db = new Database(dbPath);

  // WAL mode: allows concurrent readers while a write is in progress.
  // Much faster for read-heavy workloads (blog list, analytics reads).
  _db.pragma('journal_mode = WAL');

  // Enforce foreign key constraints (SQLite disables them by default).
  _db.pragma('foreign_keys = ON');

  logger.info({ path: dbPath }, 'database connected');

  return _db;
}
