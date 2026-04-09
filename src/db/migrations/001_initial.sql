-- Blog posts: markdown content, tags as JSON array, draft/published toggle
CREATE TABLE IF NOT EXISTS blog_posts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  summary         TEXT,
  content         TEXT NOT NULL,
  tags            TEXT NOT NULL DEFAULT '[]',   -- JSON array e.g. '["react","typescript"]'
  cover_image_url TEXT,
  reading_time    INTEGER NOT NULL DEFAULT 1,   -- minutes, calculated on write
  published       INTEGER NOT NULL DEFAULT 0,   -- 0 = draft, 1 = published
  published_at    TEXT,                          -- ISO 8601, set when published=1
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Page view events (privacy-safe: IP is SHA-256 hashed, never stored raw)
CREATE TABLE IF NOT EXISTS page_views (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  path       TEXT NOT NULL,
  title      TEXT,
  referrer   TEXT,
  user_agent TEXT,
  ip_hash    TEXT,       -- SHA-256(ip), not the raw IP
  request_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
