// Import the repository's custom BlogPost type, not Prisma's.
// Prisma's BlogPost.tags is Json; the repository normalises it to string[].
// Our mocks return repository types, so we must match that shape.
import type { BlogPost } from "../../modules/blog/blog.repository";
import type { ContactSubmission } from "@prisma/client";

export function makeBlogPost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: 1,
    slug: "test-post",
    title: "Test Post",
    summary: null,
    content: "Some content here",
    tags: [],
    coverImageUrl: null,
    readingTime: 1,
    published: true,
    publishedAt: new Date("2024-01-01"),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

// List routes omit `content` — match that return type exactly.
export function makeBlogPostSummary(
  overrides: Partial<Omit<BlogPost, "content">> = {},
): Omit<BlogPost, "content"> {
  const { content: _omit, ...base } = makeBlogPost(); // eslint-disable-line @typescript-eslint/no-unused-vars
  return { ...base, ...overrides };
}

export function makeContact(
  overrides: Partial<ContactSubmission> = {},
): ContactSubmission {
  return {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    message: "This is a test message",
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}
