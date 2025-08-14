import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type GetNewsArticleInput, type NewsArticle } from '../schema';
import { eq } from 'drizzle-orm';

export const getNewsArticle = async (input: GetNewsArticleInput): Promise<NewsArticle | null> => {
  try {
    // Query for the specific news article by ID
    const results = await db.select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, input.id))
      .execute();

    // Return null if article not found
    if (results.length === 0) {
      return null;
    }

    // Return the first (and only) result
    const article = results[0];
    return {
      ...article,
      // Note: view_count is already an integer in the database,
      // so no conversion needed unlike numeric columns
      view_count: article.view_count
    };
  } catch (error) {
    console.error('Failed to get news article:', error);
    throw error;
  }
};