import fs from 'fs';
import path from 'path';
import { getDb } from './client';
import { logger } from '../config/logger';

// Migration runner — reads numbered .sql files from ./migrations/, applies them
// in order, and tracks applied files in a _migrations table.
// Idempotent: already-applied migrations are skipped on every run.
export function runMigrations(): void {
  const db = getDb();

  // Ensure the tracking table exists before we query it
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      filename   TEXT UNIQUE NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // numeric order: 001_, 002_, etc.

  const applied = new Set(
    (db.prepare('SELECT filename FROM _migrations').all() as { filename: string }[]).map(
      (r) => r.filename,
    ),
  );

  for (const file of files) {
    if (applied.has(file)) {
      logger.debug({ file }, 'migration already applied — skipping');
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    // Run the migration + record it in a single transaction so they're atomic.
    // If the SQL throws, the _migrations insert never happens — safe to retry.
    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(file);
    })();

    logger.info({ file }, 'migration applied');
  }
}
