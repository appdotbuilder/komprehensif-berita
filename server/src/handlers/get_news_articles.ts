import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type GetNewsArticlesInput, type NewsArticle } from '../schema';
import { eq, ilike, or, and, desc, count, type SQL } from 'drizzle-orm';

export const getNewsArticles = async (input: GetNewsArticlesInput): Promise<{ articles: NewsArticle[], total: number }> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Filter by category if provided
    if (input.category) {
      conditions.push(eq(newsArticlesTable.category, input.category));
    }

    // Filter by featured status if provided
    if (input.featured !== undefined) {
      conditions.push(eq(newsArticlesTable.is_featured, input.featured));
    }

    // Add search condition if provided (search in title, content, and excerpt)
    if (input.search && input.search.trim()) {
      const searchTerm = `%${input.search.trim()}%`;
      conditions.push(
        or(
          ilike(newsArticlesTable.title, searchTerm),
          ilike(newsArticlesTable.content, searchTerm),
          ilike(newsArticlesTable.excerpt, searchTerm)
        )!
      );
    }

    // Build and execute articles query
    const articlesQuery = conditions.length > 0
      ? db.select()
          .from(newsArticlesTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(newsArticlesTable.created_at))
          .limit(input.limit)
          .offset(input.offset)
      : db.select()
          .from(newsArticlesTable)
          .orderBy(desc(newsArticlesTable.created_at))
          .limit(input.limit)
          .offset(input.offset);

    const articles = await articlesQuery.execute();

    // Build and execute count query
    const countQuery = conditions.length > 0
      ? db.select({ count: count() })
          .from(newsArticlesTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : db.select({ count: count() })
          .from(newsArticlesTable);

    const totalResult = await countQuery.execute();
    const total = totalResult[0].count;

    return {
      articles,
      total
    };
  } catch (error) {
    console.error('Failed to get news articles:', error);
    throw error;
  }
};