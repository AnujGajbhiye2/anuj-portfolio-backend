import type { Request, Response, NextFunction } from "express";
import {
  listAllPosts,
  listPublished,
  findBySlug,
  createPost,
  updatePost,
  removePost,
  findById,
} from "./blog.repository";
import type { CreateBlogInput, UpdateBlogInput } from "./blog.schema";

export async function listAllBlogsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const posts = await listAllPosts();
    res.json({ posts, total: posts.length });
  } catch (err) {
    next(err);
  }
}

export async function listBlogsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const posts = await listPublished();
    res.json({ posts, total: posts.length });
  } catch (err) {
    next(err);
  }
}

export async function getBlogHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const post = await findBySlug(req.params.slug);
    if (!post) {
      res.status(404).json({ error: "Post not found", requestId: req.id });
      return;
    }
    res.json({ post });
  } catch (err) {
    next(err);
  }
}

export async function getBlogFullHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid post id", requestId: req.id });
      return;
    }
    const post = await findById(id);
    if (!post) {
      res.status(404).json({ error: "Post not found", requestId: req.id });
      return;
    }
    res.json({ post });
  } catch (err) {
    next(err);
  }
}

export async function createBlogHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const post = await createPost(req.body as CreateBlogInput);
    req.log.info({ postId: post.id, slug: post.slug }, "blog post created");
    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
}

export async function updateBlogHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid post id", requestId: req.id });
      return;
    }

    const post = await updatePost(id, req.body as UpdateBlogInput);
    if (!post) {
      res.status(404).json({ error: "Post not found", requestId: req.id });
      return;
    }

    req.log.info({ postId: post.id }, "blog post updated");
    res.json({ post });
  } catch (err) {
    next(err);
  }
}

export async function deleteBlogHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid post id", requestId: req.id });
      return;
    }

    const deleted = await removePost(id);
    if (!deleted) {
      res.status(404).json({ error: "Post not found", requestId: req.id });
      return;
    }

    req.log.info({ postId: id }, "blog post deleted");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
