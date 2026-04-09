import { getDb } from '../../db/client';
import type { ContactInput } from './contact.schema';
import type { ContactSubmissionRow } from '../../types/db';

export function insertContact(data: ContactInput): ContactSubmissionRow {
  const db = getDb();

  const result = db
    .prepare(
      `INSERT INTO contact_submissions (name, email, message)
       VALUES (@name, @email, @message)
       RETURNING *`,
    )
    .get(data) as ContactSubmissionRow;

  return result;
}

export function listContacts(limit = 50, offset = 0): ContactSubmissionRow[] {
  return getDb()
    .prepare(
      `SELECT * FROM contact_submissions
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(limit, offset) as ContactSubmissionRow[];
}

export function countContacts(): number {
  const row = getDb()
    .prepare(`SELECT COUNT(*) as count FROM contact_submissions`)
    .get() as { count: number };
  return row.count;
}
