import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../app';
import { adminCookie } from './helpers/auth';
import * as analyticsRepo from '../modules/analytics/analytics.repository';

// recordPageView must return a Promise — the handler calls .catch() on it.
// If it returned undefined, calling .catch() on undefined would throw.
vi.mock('../modules/analytics/analytics.repository', () => ({
  recordPageView: vi.fn().mockResolvedValue(undefined),
  getPageViewSummary: vi.fn(),
  getRecentPageViews: vi.fn(),
}));

const app = createApp();

describe('Analytics routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // vi.clearAllMocks() wipes call counts but keeps mock implementations.
    // However, to be explicit and safe, re-set the recordPageView default here.
    vi.mocked(analyticsRepo.recordPageView).mockResolvedValue(undefined);
  });

  // ─── Public: record page view (fire-and-forget) ────────────────────────────

  describe('POST /api/analytics/page-view', () => {
    it('returns 202 immediately on valid payload', async () => {
      const res = await request(app)
        .post('/api/analytics/page-view')
        .send({ path: '/about', title: 'About', referrer: 'https://google.com' });

      expect(res.status).toBe(202);
    });

    it('returns 202 with minimal payload (path only, optional fields omitted)', async () => {
      const res = await request(app)
        .post('/api/analytics/page-view')
        .send({ path: '/home' });

      expect(res.status).toBe(202);
    });

    it('returns 400 when path is missing', async () => {
      // validate(pageViewSchema) runs before the handler, so missing path
      // never reaches the fire-and-forget logic
      const res = await request(app)
        .post('/api/analytics/page-view')
        .send({ title: 'No path here' });

      expect(res.status).toBe(400);
    });
  });

  // ─── Admin: summary ────────────────────────────────────────────────────────

  describe('GET /api/analytics/summary', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/analytics/summary');
      expect(res.status).toBe(401);
    });

    it('returns 200 with summary data when authed', async () => {
      vi.mocked(analyticsRepo.getPageViewSummary).mockResolvedValueOnce({
        totalViews: 500,
        viewsLast7Days: 80,
        topPages: [
          { path: '/home', count: 200 },
          { path: '/about', count: 100 },
        ],
      });

      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Cookie', adminCookie());

      expect(res.status).toBe(200);
      expect(res.body.totalViews).toBe(500);
      expect(res.body.viewsLast7Days).toBe(80);
      expect(res.body.topPages).toHaveLength(2);
    });
  });

  // ─── Admin: recent views ───────────────────────────────────────────────────

  describe('GET /api/analytics/recent', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/analytics/recent');
      expect(res.status).toBe(401);
    });

    it('returns 200 with recent views when authed', async () => {
      vi.mocked(analyticsRepo.getRecentPageViews).mockResolvedValueOnce([
        { id: 1, path: '/home', title: 'Home', createdAt: new Date('2024-01-01') },
      ]);

      const res = await request(app)
        .get('/api/analytics/recent')
        .set('Cookie', adminCookie());

      expect(res.status).toBe(200);
      expect(res.body.views).toHaveLength(1);
      expect(res.body.views[0].path).toBe('/home');
    });

    it('passes the limit query param to the repository', async () => {
      vi.mocked(analyticsRepo.getRecentPageViews).mockResolvedValueOnce([]);

      await request(app)
        .get('/api/analytics/recent?limit=5')
        .set('Cookie', adminCookie());

      expect(analyticsRepo.getRecentPageViews).toHaveBeenCalledWith(5);
    });

    it('caps limit at 100', async () => {
      vi.mocked(analyticsRepo.getRecentPageViews).mockResolvedValueOnce([]);

      await request(app)
        .get('/api/analytics/recent?limit=500')
        .set('Cookie', adminCookie());

      // handler does Math.min(Number(limit) || 20, 100)
      expect(analyticsRepo.getRecentPageViews).toHaveBeenCalledWith(100);
    });
  });
});
