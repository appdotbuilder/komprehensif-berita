import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type NewsArticle } from '../schema';
import { desc, count } from 'drizzle-orm';

export const getLatestNews = async (limit: number = 10): Promise<{ articles: NewsArticle[], total: number }> => {
  try {
    // Get the latest news articles ordered by created_at desc
    const articles = await db.select()
      .from(newsArticlesTable)
      .orderBy(desc(newsArticlesTable.created_at))
      .limit(limit)
      .execute();

    // Get total count of all articles
    const totalResult = await db.select({ count: count() })
      .from(newsArticlesTable)
      .execute();

    const total = totalResult[0]?.count || 0;

    return {
      articles,
      total: Number(total) // Ensure total is a number
    };
  } catch (error) {
    console.error('Get latest news failed:', error);
    throw error;
  }
};