import { z } from 'zod';

export const pageViewSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  title: z.string().optional(),
  referrer: z.string().optional(),
});

export type PageViewInput = z.infer<typeof pageViewSchema>;
