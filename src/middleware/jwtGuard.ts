import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface JwtPayload {
  role: 'admin';
}

// Reads the 'token' httpOnly cookie, verifies the JWT signature.
// Attaches req.isAdmin = true on success; returns 401 on failure.
// Used on all browser-facing admin routes (dashboard, admin blog endpoints, etc.)
export function jwtGuard(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined;

  if (!token) {
    res.status(401).json({ error: 'Authentication required', requestId: req.id });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (payload.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden', requestId: req.id });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token', requestId: req.id });
  }
}
