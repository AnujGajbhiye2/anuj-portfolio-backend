import { z } from 'zod';

export const createBlogSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only'),
  title: z.string().min(1, 'Title is required'),
  summary: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).optional().default([]),
  cover_image_url: z.string().url().optional(),
  reading_time: z.number().int().positive().optional().default(1),
  published: z.boolean().optional().default(false),
});

// All fields optional for partial updates — at least one must be present
export const updateBlogSchema = createBlogSchema
  .omit({ slug: true })         // slug is immutable after creation
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, 'At least one field must be provided');

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
