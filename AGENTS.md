# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # tsx watch --env-file=.env src/index.ts — pino-pretty colored logs
npm run build      # tsc → dist/
npm run start      # node --env-file=.env dist/index.js
npm run typecheck  # tsc --noEmit (no emit, just type checking)
npm run lint       # eslint src/
```

Copy `.env.example` → `.env` and fill in `ADMIN_SECRET` (min 8 chars) before running.

## Architecture

Standalone Express + TypeScript backend. CommonJS output (`"module": "commonjs"`). No ORM — raw SQL via `better-sqlite3`.

### Request lifecycle

Every request goes through: `helmet` → `cors` → `express.json` → `requestContext` (attaches `req.id` UUID + `req.log` child Pino logger) → rate limiter (contact/analytics only) → router → `errorHandler`.

### Module structure

Each feature lives in `src/modules/<name>/` with four files:
- `*.schema.ts` — Zod input validation
- `*.repository.ts` — raw SQL functions, typed with interfaces from `src/types/db.ts`
- `*.handler.ts` — Express request handlers, calls repository, forwards errors via `next(err)`
- `*.router.ts` — mounts handlers, applies `validate()` and `adminGuard` middleware

### Database

SQLite file at `DATABASE_PATH` (default `./portfolio.db`). WAL mode + foreign keys enabled. Migration runner in `src/db/migrate.ts` reads numbered `.sql` files from `src/db/migrations/`, tracks applied migrations in `_migrations` table, runs automatically on startup.

Tags on blog posts are stored as a JSON string (`'["react","ts"]'`) in SQLite and parsed to `string[]` in the repository layer.

### Auth

Admin routes (`POST/PATCH/DELETE /api/blogs`) require the `x-admin-secret` header to match `ADMIN_SECRET` env var. Check `src/middleware/adminGuard.ts`.

### Rate limiting

- `/api/contact` — 10 req / 15 min
- `/api/analytics/page-view` — 60 req / min

`trust proxy` is set to `1` so `req.ip` is the real client IP behind a reverse proxy.

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | Public | `{ status, uptime, timestamp, version }` |
| POST | `/api/contact` | Public | Save contact form submission |
| GET | `/api/blogs` | Public | List published posts (no content field) |
| GET | `/api/blogs/:slug` | Public | Full post by slug; 404 if unpublished |
| POST | `/api/blogs` | Admin | Create post |
| PATCH | `/api/blogs/:id` | Admin | Partial update |
| DELETE | `/api/blogs/:id` | Admin | Hard delete → 204 |
| POST | `/api/analytics/page-view` | Public | Record page view → 202 (fire-and-forget) |
