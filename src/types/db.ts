// TypeScript interfaces that mirror each database table row exactly.
// Used as return types in repository functions — no guessing what columns exist.

export interface BlogPostRow {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  tags: string;           // JSON array string: '["react","typescript"]'
  cover_image_url: string | null;
  reading_time: number;
  published: number;      // 0 | 1
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactSubmissionRow {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export interface PageViewRow {
  id: number;
  path: string;
  title: string | null;
  referrer: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  request_id: string | null;
  created_at: string;
}
