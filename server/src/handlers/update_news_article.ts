import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type UpdateNewsArticleInput, type NewsArticle } from '../schema';
import { eq } from 'drizzle-orm';

export const updateNewsArticle = async (input: UpdateNewsArticleInput): Promise<NewsArticle | null> => {
  try {
    const { id, ...updateData } = input;

    // Only proceed if there are fields to update
    if (Object.keys(updateData).length === 0) {
      // If no fields to update, just return the current article
      const existingArticles = await db.select()
        .from(newsArticlesTable)
        .where(eq(newsArticlesTable.id, id))
        .execute();
      
      return existingArticles.length > 0 ? existingArticles[0] : null;
    }

    // Update the article with automatic updated_at timestamp
    const result = await db.update(newsArticlesTable)
      .set({
        ...updateData,
        updated_at: new Date() // Always update the timestamp
      })
      .where(eq(newsArticlesTable.id, id))
      .returning()
      .execute();

    // Return the updated article or null if not found
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('News article update failed:', error);
    throw error;
  }
};