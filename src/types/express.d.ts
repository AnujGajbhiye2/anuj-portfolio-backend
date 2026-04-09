import type { Logger } from 'pino';

// Augments the Express Request type so every handler has typed access to:
//   req.id  — unique UUID for this request (set by requestContext middleware)
//   req.log — child Pino logger pre-bound with { requestId } (set by requestContext middleware)
//
// This means you can write `req.log.info('something')` in any handler and
// the log entry will automatically include the request ID for full traceability.
declare global {
  namespace Express {
    interface Request {
      id: string;
      log: Logger;
    }
  }
}
