import { Prisma } from "@prisma/client";
import { prisma } from "../../db/client";
import type { CreateBlogInput, UpdateBlogInput } from "./blog.schema";

// Tags come back from Prisma as JsonValue — cast to string[] at the boundary
export type BlogPost = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  tags: string[];
  coverImageUrl: string | null;
  readingTime: number;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeTags(tags: Prisma.JsonValue): string[] {
  return Array.isArray(tags) ? (tags as string[]) : [];
}

const listSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  tags: true,
  coverImageUrl: true,
  readingTime: true,
  published: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listAllPosts(): Promise<Omit<BlogPost, "content">[]> {
  const rows = await prisma.blogPost.findMany({
    select: listSelect,
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({ ...r, tags: normalizeTags(r.tags) }));
}

export async function listPublished(): Promise<Omit<BlogPost, "content">[]> {
  const rows = await prisma.blogPost.findMany({
    where: { published: true },
    select: listSelect,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  return rows.map((r) => ({ ...r, tags: normalizeTags(r.tags) }));
}

export async function findBySlug(slug: string): Promise<BlogPost | null> {
  const row = await prisma.blogPost.findFirst({
    where: { slug, published: true },
  });
  return row ? { ...row, tags: normalizeTags(row.tags) } : null;
}

export async function findById(id: number): Promise<BlogPost | null> {
  const row = await prisma.blogPost.findUnique({
    where: { id },
  });
  return row ? { ...row, tags: normalizeTags(row.tags) } : null;
}

export async function createPost(data: CreateBlogInput): Promise<BlogPost> {
  const row = await prisma.blogPost.create({
    data: {
      slug: data.slug,
      title: data.title,
      summary: data.summary ?? null,
      content: data.content,
      tags: data.tags,
      coverImageUrl: data.cover_image_url ?? null,
      readingTime: data.reading_time,
      published: data.published ?? false,
      publishedAt: data.published ? new Date() : null,
    },
  });
  return { ...row, tags: normalizeTags(row.tags) };
}

export async function updatePost(
  id: number,
  data: UpdateBlogInput,
): Promise<BlogPost | null> {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return null;

  const becomingPublished = data.published === true && !existing.published;

  const row = await prisma.blogPost.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.summary !== undefined && { summary: data.summary }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.cover_image_url !== undefined && {
        coverImageUrl: data.cover_image_url,
      }),
      ...(data.reading_time !== undefined && {
        readingTime: data.reading_time,
      }),
      ...(data.published !== undefined && { published: data.published }),
      ...(becomingPublished && { publishedAt: new Date() }),
    },
  });
  return { ...row, tags: normalizeTags(row.tags) };
}

export async function removePost(id: number): Promise<boolean> {
  try {
    await prisma.blogPost.delete({ where: { id } });
    return true;
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return false;
    }
    throw e;
  }
}
