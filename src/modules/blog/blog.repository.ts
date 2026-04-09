import { getDb } from '../../db/client';
import type { BlogPostRow } from '../../types/db';
import type { CreateBlogInput, UpdateBlogInput } from './blog.schema';

// Shape returned to API consumers — tags as string[], not raw JSON string
export interface BlogPost extends Omit<BlogPostRow, 'tags'> {
  tags: string[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function parseTags(row: BlogPostRow): BlogPost {
  return { ...row, tags: JSON.parse(row.tags) as string[] };
}

// ─── Public reads ──────────────────────────────────────────────────────────

// Admin — all posts including drafts, newest first
export function listAllPosts(): Omit<BlogPost, 'content'>[] {
  const rows = getDb()
    .prepare(
      `SELECT id, slug, title, summary, tags, cover_image_url,
              reading_time, published, published_at, created_at, updated_at
       FROM blog_posts
       ORDER BY created_at DESC`,
    )
    .all() as Omit<BlogPostRow, 'content'>[];

  return rows.map((r) => ({ ...r, tags: JSON.parse(r.tags) as string[] }));
}

export function listPublished(): Omit<BlogPost, 'content'>[] {
  const rows = getDb()
    .prepare(
      `SELECT id, slug, title, summary, tags, cover_image_url,
              reading_time, published, published_at, created_at, updated_at
       FROM blog_posts
       WHERE published = 1
       ORDER BY published_at DESC, created_at DESC`,
    )
    .all() as Omit<BlogPostRow, 'content'>[];

  return rows.map((r) => ({ ...r, tags: JSON.parse(r.tags) as string[] }));
}

export function findBySlug(slug: string): BlogPost | null {
  const row = getDb()
    .prepare(`SELECT * FROM blog_posts WHERE slug = ? AND published = 1`)
    .get(slug) as BlogPostRow | undefined;

  return row ? parseTags(row) : null;
}

// ─── Admin writes ──────────────────────────────────────────────────────────

export function createPost(data: CreateBlogInput): BlogPost {
  const publishedAt = data.published ? new Date().toISOString() : null;

  const row = getDb()
    .prepare(
      `INSERT INTO blog_posts
         (slug, title, summary, content, tags, cover_image_url, reading_time, published, published_at)
       VALUES
         (@slug, @title, @summary, @content, @tags, @cover_image_url, @reading_time, @published, @published_at)
       RETURNING *`,
    )
    .get({
      slug: data.slug,
      title: data.title,
      summary: data.summary ?? null,
      content: data.content,
      tags: JSON.stringify(data.tags),
      cover_image_url: data.cover_image_url ?? null,
      reading_time: data.reading_time,
      published: data.published ? 1 : 0,
      published_at: publishedAt,
    }) as BlogPostRow;

  return parseTags(row);
}

export function updatePost(id: number, data: UpdateBlogInput): BlogPost | null {
  const existing = getDb()
    .prepare(`SELECT * FROM blog_posts WHERE id = ?`)
    .get(id) as BlogPostRow | undefined;

  if (!existing) return null;

  // Merge incoming fields with existing values
  const published =
    data.published !== undefined ? (data.published ? 1 : 0) : existing.published;

  // Set published_at only when transitioning from draft → published
  const publishedAt =
    data.published === true && !existing.published_at
      ? new Date().toISOString()
      : existing.published_at;

  const row = getDb()
    .prepare(
      `UPDATE blog_posts SET
         title           = @title,
         summary         = @summary,
         content         = @content,
         tags            = @tags,
         cover_image_url = @cover_image_url,
         reading_time    = @reading_time,
         published       = @published,
         published_at    = @published_at,
         updated_at      = datetime('now')
       WHERE id = @id
       RETURNING *`,
    )
    .get({
      id,
      title: data.title ?? existing.title,
      summary: data.summary ?? existing.summary,
      content: data.content ?? existing.content,
      tags: data.tags !== undefined ? JSON.stringify(data.tags) : existing.tags,
      cover_image_url: data.cover_image_url ?? existing.cover_image_url,
      reading_time: data.reading_time ?? existing.reading_time,
      published,
      published_at: publishedAt,
    }) as BlogPostRow;

  return parseTags(row);
}

export function removePost(id: number): boolean {
  const result = getDb()
    .prepare(`DELETE FROM blog_posts WHERE id = ?`)
    .run(id);

  return result.changes > 0;
}
