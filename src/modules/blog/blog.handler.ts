import type { Request, Response, NextFunction } from 'express';
import {
  listAllPosts,
  listPublished,
  findBySlug,
  createPost,
  updatePost,
  removePost,
} from './blog.repository';
import type { CreateBlogInput, UpdateBlogInput } from './blog.schema';

export function listAllBlogsHandler(_req: Request, res: Response, next: NextFunction): void {
  try {
    const posts = listAllPosts();
    res.json({ posts, total: posts.length });
  } catch (err) {
    next(err);
  }
}

export function listBlogsHandler(_req: Request, res: Response, next: NextFunction): void {
  try {
    const posts = listPublished();
    res.json({ posts, total: posts.length });
  } catch (err) {
    next(err);
  }
}

export function getBlogHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const post = findBySlug(req.params.slug);
    if (!post) {
      res.status(404).json({ error: 'Post not found', requestId: req.id });
      return;
    }
    res.json({ post });
  } catch (err) {
    next(err);
  }
}

export function createBlogHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const post = createPost(req.body as CreateBlogInput);
    req.log.info({ postId: post.id, slug: post.slug }, 'blog post created');
    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
}

export function updateBlogHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: 'Invalid post id', requestId: req.id });
      return;
    }

    const post = updatePost(id, req.body as UpdateBlogInput);
    if (!post) {
      res.status(404).json({ error: 'Post not found', requestId: req.id });
      return;
    }

    req.log.info({ postId: post.id }, 'blog post updated');
    res.json({ post });
  } catch (err) {
    next(err);
  }
}

export function deleteBlogHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: 'Invalid post id', requestId: req.id });
      return;
    }

    const deleted = removePost(id);
    if (!deleted) {
      res.status(404).json({ error: 'Post not found', requestId: req.id });
      return;
    }

    req.log.info({ postId: id }, 'blog post deleted');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
