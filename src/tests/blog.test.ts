// Blog routes hit the DB through blog.repository.ts.
// We mock the entire repository module so tests never touch a real database.
// vi.mock is hoisted to the top of the file by Vitest — it intercepts the
// repository import wherever it's used (handler, router), not just in this file.
import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createApp } from "../app";
import { adminCookie } from "./helpers/auth";
import { makeBlogPost, makeBlogPostSummary } from "./helpers/factories";
import * as blogRepo from "../modules/blog/blog.repository";

vi.mock("../modules/blog/blog.repository", () => ({
  listPublished: vi.fn(),
  listAllPosts: vi.fn(),
  findBySlug: vi.fn(),
  findById: vi.fn(),
  createPost: vi.fn(),
  updatePost: vi.fn(),
  removePost: vi.fn(),
}));

const app = createApp();

describe("Blog routes", () => {
  // Clear call counts before each test so assertions don't bleed between tests.
  // vi.clearAllMocks keeps mock implementations; only wipes .mock.calls etc.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Public: list published ────────────────────────────────────────────────

  describe("GET /api/blogs", () => {
    it("returns 200 with published posts", async () => {
      vi.mocked(blogRepo.listPublished).mockResolvedValueOnce([
        makeBlogPostSummary(),
      ]);

      const res = await request(app).get("/api/blogs");

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });

    it("returns empty array when no published posts exist", async () => {
      vi.mocked(blogRepo.listPublished).mockResolvedValueOnce([]);

      const res = await request(app).get("/api/blogs");

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });
  });

  // ─── Public: get by slug ───────────────────────────────────────────────────

  describe("GET /api/blogs/:slug", () => {
    it("returns 200 with the post when found", async () => {
      vi.mocked(blogRepo.findBySlug).mockResolvedValueOnce(makeBlogPost());

      const res = await request(app).get("/api/blogs/test-post");

      expect(res.status).toBe(200);
      expect(res.body.post.slug).toBe("test-post");
    });

    it("returns 404 when slug does not exist", async () => {
      vi.mocked(blogRepo.findBySlug).mockResolvedValueOnce(null);

      const res = await request(app).get("/api/blogs/nonexistent-slug");

      expect(res.status).toBe(404);
    });
  });

  // ─── Admin: list all (including unpublished) ───────────────────────────────
  // IMPORTANT: /admin/all is registered before /:slug in the router so Express
  // won't match the word "admin" as a slug value.

  describe("GET /api/blogs/admin/all", () => {
    it("returns 401 without a JWT cookie", async () => {
      const res = await request(app).get("/api/blogs/admin/all");
      expect(res.status).toBe(401);
    });

    it("returns 200 with all posts (published + draft) when authed", async () => {
      const posts = [
        makeBlogPostSummary({ published: true }),
        makeBlogPostSummary({ id: 2, slug: "draft-post", published: false }),
      ];
      vi.mocked(blogRepo.listAllPosts).mockResolvedValueOnce(posts);

      const res = await request(app)
        .get("/api/blogs/admin/all")
        .set("Cookie", adminCookie());

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(2);
    });
  });

  // ─── Admin: get full post by id ────────────────────────────────────────────

  describe("GET /api/blogs/admin/:id", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).get("/api/blogs/admin/1");
      expect(res.status).toBe(401);
    });

    it("returns 200 with the full post when authed and found", async () => {
      vi.mocked(blogRepo.findById).mockResolvedValueOnce(makeBlogPost());

      const res = await request(app)
        .get("/api/blogs/admin/1")
        .set("Cookie", adminCookie());

      expect(res.status).toBe(200);
      expect(res.body.post.id).toBe(1);
      // Full post includes content, unlike the public list endpoint
      expect(res.body.post.content).toBeDefined();
    });

    it("returns 404 when the id does not exist", async () => {
      vi.mocked(blogRepo.findById).mockResolvedValueOnce(null);

      const res = await request(app)
        .get("/api/blogs/admin/99")
        .set("Cookie", adminCookie());

      expect(res.status).toBe(404);
    });

    it("returns 400 when id is not a number", async () => {
      // Number('abc') = NaN, Number.isInteger(NaN) = false → handler returns 400
      const res = await request(app)
        .get("/api/blogs/admin/abc")
        .set("Cookie", adminCookie());

      expect(res.status).toBe(400);
    });
  });

  // ─── Admin write: create ───────────────────────────────────────────────────

  describe("POST /api/blogs", () => {
    const validBody = {
      slug: "new-post",
      title: "New Post",
      content: "Some content here",
    };

    it("returns 401 without auth", async () => {
      const res = await request(app).post("/api/blogs").send(validBody);
      expect(res.status).toBe(401);
    });

    it("returns 201 with the created post on valid body", async () => {
      vi.mocked(blogRepo.createPost).mockResolvedValueOnce(
        makeBlogPost({ slug: "new-post", title: "New Post" }),
      );

      const res = await request(app)
        .post("/api/blogs")
        .set("Cookie", adminCookie())
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.post.slug).toBe("new-post");
    });

    it("returns 400 when title is missing", async () => {
      const res = await request(app)
        .post("/api/blogs")
        .set("Cookie", adminCookie())
        .send({ slug: "no-title", content: "content" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    it("returns 400 when slug has invalid format (uppercase/spaces)", async () => {
      const res = await request(app)
        .post("/api/blogs")
        .set("Cookie", adminCookie())
        .send({ slug: "INVALID SLUG", title: "Title", content: "content" });

      expect(res.status).toBe(400);
    });
  });

  // ─── Admin write: update ───────────────────────────────────────────────────

  describe("PATCH /api/blogs/:id", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app)
        .patch("/api/blogs/1")
        .send({ title: "New" });
      expect(res.status).toBe(401);
    });

    it("returns 200 with updated post", async () => {
      vi.mocked(blogRepo.updatePost).mockResolvedValueOnce(
        makeBlogPost({ title: "Updated Title" }),
      );

      const res = await request(app)
        .patch("/api/blogs/1")
        .set("Cookie", adminCookie())
        .send({ title: "Updated Title" });

      expect(res.status).toBe(200);
      expect(res.body.post.title).toBe("Updated Title");
    });

    it("returns 404 when post does not exist", async () => {
      vi.mocked(blogRepo.updatePost).mockResolvedValueOnce(null);

      const res = await request(app)
        .patch("/api/blogs/99")
        .set("Cookie", adminCookie())
        .send({ title: "Title" });

      expect(res.status).toBe(404);
    });

    it("returns 400 when body is empty (updateBlogSchema requires at least one field)", async () => {
      // updateBlogSchema = createBlogSchema.omit({slug}).partial().refine(obj => keys > 0)
      // Empty {} passes partial() but fails the refine check → 400
      const res = await request(app)
        .patch("/api/blogs/1")
        .set("Cookie", adminCookie())
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ─── Admin write: delete ───────────────────────────────────────────────────

  describe("DELETE /api/blogs/:id", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).delete("/api/blogs/1");
      expect(res.status).toBe(401);
    });

    it("returns 204 when successfully deleted", async () => {
      vi.mocked(blogRepo.removePost).mockResolvedValueOnce(true);

      const res = await request(app)
        .delete("/api/blogs/1")
        .set("Cookie", adminCookie());

      expect(res.status).toBe(204);
    });

    it("returns 404 when post does not exist", async () => {
      vi.mocked(blogRepo.removePost).mockResolvedValueOnce(false);

      const res = await request(app)
        .delete("/api/blogs/99")
        .set("Cookie", adminCookie());

      expect(res.status).toBe(404);
    });

    it("returns 400 when id is not a number", async () => {
      const res = await request(app)
        .delete("/api/blogs/abc")
        .set("Cookie", adminCookie());

      expect(res.status).toBe(400);
    });
  });
});
