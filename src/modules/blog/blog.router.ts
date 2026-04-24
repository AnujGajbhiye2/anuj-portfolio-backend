import { Router } from "express";
import { jwtGuard } from "../../middleware/jwtGuard";
import { validate } from "../../middleware/validate";
import { createBlogSchema, updateBlogSchema } from "./blog.schema";
import {
  listBlogsHandler,
  listAllBlogsHandler,
  getBlogHandler,
  createBlogHandler,
  updateBlogHandler,
  deleteBlogHandler,
  getBlogFullHandler,
} from "./blog.handler";

const router = Router();

// ─── Public ────────────────────────────────────────────────────────────────
router.get("/", listBlogsHandler);

// ─── Admin reads ───────────────────────────────────────────────────────────
// IMPORTANT: registered before /:slug so Express doesn't match 'admin' as a slug
router.get("/admin/all", jwtGuard, listAllBlogsHandler);

router.get("/admin/:id", jwtGuard, getBlogFullHandler); // For admin preview/editing — slug lookup is public but id lookup requires auth

// ─── Public slug lookup (after /admin/all) ─────────────────────────────────
router.get("/:slug", getBlogHandler);

// ─── Admin writes (JWT required) ───────────────────────────────────────────
router.post("/", jwtGuard, validate(createBlogSchema), createBlogHandler);
router.patch("/:id", jwtGuard, validate(updateBlogSchema), updateBlogHandler);
router.delete("/:id", jwtGuard, deleteBlogHandler);

export { router as blogRouter };
