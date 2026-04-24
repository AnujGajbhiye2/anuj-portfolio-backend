import "./instrument";
import express, { type Request, type Response } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { requestContext } from "./middleware/requestContext";
import { errorHandler } from "./middleware/errorHandler";
import { healthRouter } from "./modules/health/health.router";
import { contactRouter } from "./modules/contact/contact.router";
import { blogRouter } from "./modules/blog/blog.router";
import { analyticsRouter } from "./modules/analytics/analytics.router";
import { authRouter } from "./modules/auth/auth.router";
import * as Sentry from "@sentry/node";

// ─── Rate limiters ─────────────────────────────────────────────────────────
// Returns JSON instead of the default plain-text response so clients always
// get a consistent error shape. requestId is not available here (middleware
// hasn't run yet), so we omit it rather than send undefined.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests — please try again later" },
});

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests — please try again later" },
});

export function createApp(): express.Application {
  const app = express();

  // Trust the first proxy hop so req.ip reflects the real client IP.
  // Required for rate limiting to work correctly behind Render / Railway / nginx.
  app.set("trust proxy", 1);

  // ─── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());

  // CORS: allow only the configured frontend origin, not *
  // credentials: true is required for cookies to be sent cross-origin
  app.use(
    cors({
      origin:
        env.CORS_ORIGIN.length === 1 ? env.CORS_ORIGIN[0] : env.CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "x-admin-secret"],
    }),
  );

  // ─── Body + cookie parsing ─────────────────────────────────────────────────
  app.use(express.json({ limit: "512kb" }));
  app.use(cookieParser());

  // ─── Request context ───────────────────────────────────────────────────────
  app.use(requestContext);

  // ─── Routes ────────────────────────────────────────────────────────────────
  app.use("/api/auth", authRouter);
  app.use("/api/health", healthRouter);
  app.use("/api/contact", contactLimiter, contactRouter);
  app.use("/api/blogs", blogRouter);
  app.use("/api/analytics", analyticsLimiter, analyticsRouter);
  // ─── 404 catch-all ─────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not found", requestId: _req.id });
  });


  // ─── Error handler (must be last) ──────────────────────────────────────────
  Sentry.setupExpressErrorHandler(app);
  app.use(errorHandler);

  return app;
}
