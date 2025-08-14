import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type CreateNewsArticleInput, type NewsArticle } from '../schema';

export const createNewsArticle = async (input: CreateNewsArticleInput): Promise<NewsArticle> => {
  try {
    // Insert news article record
    const result = await db.insert(newsArticlesTable)
      .values({
        title: input.title,
        content: input.content,
        excerpt: input.excerpt,
        category: input.category,
        image_url: input.image_url,
        author: input.author,
        is_featured: input.is_featured || false // Apply default if not provided
      })
      .returning()
      .execute();

    // Return the created article
    const article = result[0];
    return {
      ...article,
      view_count: article.view_count || 0 // Ensure view_count is never null
    };
  } catch (error) {
    console.error('News article creation failed:', error);
    throw error;
  }
};