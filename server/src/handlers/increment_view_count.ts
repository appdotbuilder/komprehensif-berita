import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type IncrementViewCountInput } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const incrementViewCount = async (input: IncrementViewCountInput): Promise<boolean> => {
  try {
    // Increment view_count by 1 for the article with the given id
    const result = await db
      .update(newsArticlesTable)
      .set({
        view_count: sql`${newsArticlesTable.view_count} + 1`,
        updated_at: new Date()
      })
      .where(eq(newsArticlesTable.id, input.id))
      .returning({ id: newsArticlesTable.id })
      .execute();

    // Return true if a record was updated (article found), false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Failed to increment view count:', error);
    throw error;
  }
};