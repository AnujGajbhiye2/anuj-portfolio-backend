import { getDb } from '../../db/client';
import type { PageViewInput } from './analytics.schema';
import type { PageViewRow } from '../../types/db';

interface RecordPageViewArgs extends PageViewInput {
  user_agent: string | null;
  ip_hash: string | null;
  request_id: string;
}

export function recordPageView(data: RecordPageViewArgs): void {
  getDb()
    .prepare(
      `INSERT INTO page_views (path, title, referrer, user_agent, ip_hash, request_id)
       VALUES (@path, @title, @referrer, @user_agent, @ip_hash, @request_id)`,
    )
    .run({
      path: data.path,
      title: data.title ?? null,
      referrer: data.referrer ?? null,
      user_agent: data.user_agent,
      ip_hash: data.ip_hash,
      request_id: data.request_id,
    });
}

export interface PageViewSummary {
  totalViews: number;
  viewsLast7Days: number;
  topPages: { path: string; count: number }[];
}

export function getPageViewSummary(): PageViewSummary {
  const db = getDb();

  const { total } = db
    .prepare(`SELECT COUNT(*) as total FROM page_views`)
    .get() as { total: number };

  const { recent } = db
    .prepare(
      `SELECT COUNT(*) as recent FROM page_views
       WHERE created_at >= datetime('now', '-7 days')`,
    )
    .get() as { recent: number };

  const topPages = db
    .prepare(
      `SELECT path, COUNT(*) as count FROM page_views
       GROUP BY path
       ORDER BY count DESC
       LIMIT 5`,
    )
    .all() as { path: string; count: number }[];

  return { totalViews: total, viewsLast7Days: recent, topPages };
}

export function getRecentPageViews(limit = 20): Pick<PageViewRow, 'id' | 'path' | 'title' | 'created_at'>[] {
  return getDb()
    .prepare(
      `SELECT id, path, title, created_at FROM page_views
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .all(limit) as Pick<PageViewRow, 'id' | 'path' | 'title' | 'created_at'>[];
}
