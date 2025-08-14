import { serial, text, pgTable, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';

// Define news category enum for PostgreSQL
export const newsCategoryEnum = pgEnum('news_category', ['Olahraga', 'Politik', 'Teknologi', 'Hiburan']);

// News articles table
export const newsArticlesTable = pgTable('news_articles', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt').notNull(),
  category: newsCategoryEnum('category').notNull(),
  image_url: text('image_url'), // Nullable by default for optional images
  author: text('author').notNull(),
  is_featured: boolean('is_featured').notNull().default(false),
  view_count: integer('view_count').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type NewsArticle = typeof newsArticlesTable.$inferSelect; // For SELECT operations
export type NewNewsArticle = typeof newsArticlesTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  newsArticles: newsArticlesTable 
};