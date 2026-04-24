import type { Request, Response, NextFunction } from "express";
import { isProd } from "../config/env";

// Global Express error handler — must be registered LAST in the middleware chain.
// Any call to next(err) or any thrown error in async route handlers lands here.
//
// Rules:
//  - Always logs the error with req.log.error (includes requestId automatically)
//  - Never leaks stack traces or internal messages to the client in production
//  - Always returns JSON (never an HTML error page)
//  - Always includes requestId so the client can report it for debugging
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // Express requires a 4-argument signature to recognise this as an error handler.
  // _next is intentionally unused — prefix signals this to ESLint.
  _next: NextFunction,
): void {
  const message =
    err instanceof Error ? err.message : "An unexpected error occurred";
  const stack = err instanceof Error ? err.stack : undefined;

  // Log full details server-side (stack trace always visible in logs)
  req.log.error({ err, stack }, message);

  // Send sanitised response to client
  res.status(500).json({
    error: isProd ? "Internal server error" : message,
    requestId: req.id,
  });
}
