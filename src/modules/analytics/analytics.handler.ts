import { createHash } from "crypto";
import type { Request, Response, NextFunction } from "express";
import {
  recordPageView,
  getPageViewSummary,
  getRecentPageViews,
} from "./analytics.repository";
import type { PageViewInput } from "./analytics.schema";

export function pageViewHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Respond immediately — client doesn't need to wait for the DB write
  res.status(202).send();

  const body = req.body as PageViewInput;
  const rawIp = req.ip ?? "";
  const ipHash = rawIp
    ? createHash("sha256").update(rawIp).digest("hex")
    : null;

  recordPageView({
    path: body.path,
    title: body.title,
    referrer: body.referrer,
    user_agent: req.headers["user-agent"] ?? null,
    ip_hash: ipHash,
    request_id: req.id,
  }).catch((err) => req.log.error({ err }, "failed to record page view"));
}

export async function analyticsSummaryHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const summary = await getPageViewSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

export async function analyticsRecentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const views = await getRecentPageViews(limit);
    res.json({ views });
  } catch (err) {
    next(err);
  }
}
