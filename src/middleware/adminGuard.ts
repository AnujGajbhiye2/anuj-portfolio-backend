import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

// Lightweight admin guard for blog write routes.
// Checks the x-admin-secret header against the configured ADMIN_SECRET env var.
//
// This is NOT a full auth system — it's a temporary gate until JWT/session auth
// is added in a later phase. Good enough for a personal portfolio where you
// control all write operations yourself.
//
// Usage in a router:
//   router.post('/blogs', adminGuard, validate(createBlogSchema), createBlogHandler);
export function adminGuard(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const secret = req.headers['x-admin-secret'];

  if (!secret || secret !== env.ADMIN_SECRET) {
    req.log.warn({ url: req.url }, 'unauthorised admin access attempt');
    res.status(401).json({
      error: 'Unauthorised',
      requestId: req.id,
    });
    return;
  }

  next();
}
