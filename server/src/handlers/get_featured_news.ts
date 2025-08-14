import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type NewsArticle } from '../schema';
import { eq, desc, count } from 'drizzle-orm';

export const getFeaturedNews = async (limit: number = 5): Promise<{ articles: NewsArticle[], total: number }> => {
  try {
    // Query for featured articles
    const articlesQuery = db.select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.is_featured, true))
      .orderBy(desc(newsArticlesTable.created_at))
      .limit(limit);

    // Query for total count of featured articles
    const countQuery = db.select({ count: count() })
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.is_featured, true));

    // Execute both queries concurrently
    const [articles, totalResult] = await Promise.all([
      articlesQuery.execute(),
      countQuery.execute()
    ]);

    return {
      articles,
      total: totalResult[0]?.count || 0
    };
  } catch (error) {
    console.error('Failed to fetch featured news:', error);
    throw error;
  }
};