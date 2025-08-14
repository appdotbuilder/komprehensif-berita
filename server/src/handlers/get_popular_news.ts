import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type NewsArticle } from '../schema';
import { desc } from 'drizzle-orm';

export const getPopularNews = async (limit: number = 10): Promise<{ articles: NewsArticle[], total: number }> => {
  try {
    // Get total count of all articles
    const totalResult = await db.select({ count: newsArticlesTable.id })
      .from(newsArticlesTable)
      .execute();
    
    const total = totalResult.length;

    // Get popular articles ordered by view_count descending
    const results = await db.select()
      .from(newsArticlesTable)
      .orderBy(desc(newsArticlesTable.view_count))
      .limit(limit)
      .execute();

    return {
      articles: results,
      total
    };
  } catch (error) {
    console.error('Failed to fetch popular news:', error);
    throw error;
  }
};