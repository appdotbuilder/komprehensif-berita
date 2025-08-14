import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteNewsArticleInput } from '../schema';

export const deleteNewsArticle = async (input: DeleteNewsArticleInput): Promise<boolean> => {
  try {
    // Delete the news article by ID
    const result = await db.delete(newsArticlesTable)
      .where(eq(newsArticlesTable.id, input.id))
      .execute();

    // Check if any rows were affected (deleted)
    // result is a ResultSet with rowCount property
    return (result as any).rowCount > 0;
  } catch (error) {
    console.error('News article deletion failed:', error);
    throw error;
  }
};