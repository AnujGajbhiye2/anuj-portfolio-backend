import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// Attaches a unique request ID and a child logger to every incoming request.
//
// Why a child logger?
// pino.child({ requestId }) creates a new logger that includes the requestId
// field in EVERY log line emitted via req.log — so you can grep a single
// requestId in production logs to trace the full lifecycle of one request.
export function requestContext(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  req.id = randomUUID();
  req.log = logger.child({ requestId: req.id });

  // Log the incoming request at debug level (visible in dev, not in prod)
  req.log.debug({ method: req.method, url: req.url }, '→ incoming');

  // Log the outgoing response once it finishes
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    req.log[level](
      { method: req.method, url: req.url, statusCode: res.statusCode, ms },
      `← ${res.statusCode}`,
    );
  });

  next();
}
