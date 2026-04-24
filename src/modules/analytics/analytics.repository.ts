import { prisma } from "../../db/client";
import type { PageViewInput } from "./analytics.schema";

interface RecordPageViewArgs extends PageViewInput {
  user_agent: string | null;
  ip_hash: string | null;
  request_id: string;
}

export async function recordPageView(data: RecordPageViewArgs): Promise<void> {
  await prisma.pageView.create({
    data: {
      path: data.path,
      title: data.title ?? null,
      referrer: data.referrer ?? null,
      userAgent: data.user_agent,
      ipHash: data.ip_hash,
      requestId: data.request_id,
    },
  });
}

export interface PageViewSummary {
  totalViews: number;
  viewsLast7Days: number;
  topPages: { path: string; count: number }[];
}

export interface PageViewDetail {
  id: number;
  path: string;
  title: string | null;
  createdAt: Date;
}

export async function getPageViewSummary(): Promise<PageViewSummary> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalViews, viewsLast7Days, topPagesRaw] = await Promise.all([
    prisma.pageView.count(),
    prisma.pageView.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.pageView.groupBy({
      by: ["path"],
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 5,
    }),
  ]);

  return {
    totalViews,
    viewsLast7Days,
    topPages: topPagesRaw.map((r) => ({ path: r.path, count: r._count.path })),
  };
}

export async function getRecentPageViews(
  limit = 20,
): Promise<PageViewDetail[]> {
  return prisma.pageView.findMany({
    select: { id: true, path: true, title: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
