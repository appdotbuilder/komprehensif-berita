import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type NewsCategory, type NewsArticle } from '../schema';
import { eq, count } from 'drizzle-orm';

export const getNewsByCategory = async (
  category: NewsCategory, 
  limit: number = 10, 
  offset: number = 0
): Promise<{ articles: NewsArticle[], total: number }> => {
  try {
    // Get articles filtered by category with pagination
    const articles = await db.select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.category, category))
      .limit(limit)
      .offset(offset)
      .execute();

    // Get total count of articles in this category
    const totalResult = await db.select({ count: count() })
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.category, category))
      .execute();

    const total = totalResult[0]?.count || 0;

    return {
      articles,
      total
    };
  } catch (error) {
    console.error('Failed to get news by category:', error);
    throw error;
  }
};