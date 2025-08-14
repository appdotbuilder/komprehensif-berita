import { z } from 'zod';

// News category enum
export const newsCategorySchema = z.enum(['Olahraga', 'Politik', 'Teknologi', 'Hiburan']);
export type NewsCategory = z.infer<typeof newsCategorySchema>;

// News article schema
export const newsArticleSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  excerpt: z.string(),
  category: newsCategorySchema,
  image_url: z.string().nullable(),
  author: z.string(),
  is_featured: z.boolean(),
  view_count: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type NewsArticle = z.infer<typeof newsArticleSchema>;

// Input schema for creating news articles
export const createNewsArticleInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  category: newsCategorySchema,
  image_url: z.string().nullable(),
  author: z.string().min(1, "Author is required"),
  is_featured: z.boolean().default(false)
});

export type CreateNewsArticleInput = z.infer<typeof createNewsArticleInputSchema>;

// Input schema for updating news articles
export const updateNewsArticleInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().min(1).optional(),
  category: newsCategorySchema.optional(),
  image_url: z.string().nullable().optional(),
  author: z.string().min(1).optional(),
  is_featured: z.boolean().optional()
});

export type UpdateNewsArticleInput = z.infer<typeof updateNewsArticleInputSchema>;

// Schema for getting news articles with filters
export const getNewsArticlesInputSchema = z.object({
  category: newsCategorySchema.optional(),
  featured: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(10),
  offset: z.number().int().nonnegative().default(0),
  search: z.string().optional()
});

export type GetNewsArticlesInput = z.infer<typeof getNewsArticlesInputSchema>;

// Schema for getting single news article
export const getNewsArticleInputSchema = z.object({
  id: z.number()
});

export type GetNewsArticleInput = z.infer<typeof getNewsArticleInputSchema>;

// Schema for deleting news article
export const deleteNewsArticleInputSchema = z.object({
  id: z.number()
});

export type DeleteNewsArticleInput = z.infer<typeof deleteNewsArticleInputSchema>;

// Schema for incrementing view count
export const incrementViewCountInputSchema = z.object({
  id: z.number()
});

export type IncrementViewCountInput = z.infer<typeof incrementViewCountInputSchema>;

// Schema for popular news response
export const popularNewsResponseSchema = z.object({
  articles: z.array(newsArticleSchema),
  total: z.number()
});

export type PopularNewsResponse = z.infer<typeof popularNewsResponseSchema>;

// Schema for latest news response
export const latestNewsResponseSchema = z.object({
  articles: z.array(newsArticleSchema),
  total: z.number()
});

export type LatestNewsResponse = z.infer<typeof latestNewsResponseSchema>;