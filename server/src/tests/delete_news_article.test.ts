import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type DeleteNewsArticleInput } from '../schema';
import { deleteNewsArticle } from '../handlers/delete_news_article';
import { eq } from 'drizzle-orm';

describe('deleteNewsArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing news article', async () => {
    // Create a test news article first
    const insertResult = await db.insert(newsArticlesTable)
      .values({
        title: 'Test Article',
        content: 'Test content for the article',
        excerpt: 'Test excerpt',
        category: 'Teknologi',
        author: 'Test Author',
        is_featured: false
      })
      .returning()
      .execute();

    const articleId = insertResult[0].id;

    // Delete the article
    const deleteInput: DeleteNewsArticleInput = {
      id: articleId
    };

    const result = await deleteNewsArticle(deleteInput);

    // Should return true for successful deletion
    expect(result).toBe(true);

    // Verify the article is actually deleted from database
    const remainingArticles = await db.select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, articleId))
      .execute();

    expect(remainingArticles).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent article', async () => {
    const deleteInput: DeleteNewsArticleInput = {
      id: 99999 // Non-existent ID
    };

    const result = await deleteNewsArticle(deleteInput);

    // Should return false when no article is found to delete
    expect(result).toBe(false);
  });

  it('should not affect other articles when deleting one', async () => {
    // Create multiple test articles
    const insertResult = await db.insert(newsArticlesTable)
      .values([
        {
          title: 'Article 1',
          content: 'Content 1',
          excerpt: 'Excerpt 1',
          category: 'Teknologi',
          author: 'Author 1',
          is_featured: false
        },
        {
          title: 'Article 2',
          content: 'Content 2',
          excerpt: 'Excerpt 2',
          category: 'Politik',
          author: 'Author 2',
          is_featured: true
        }
      ])
      .returning()
      .execute();

    const firstArticleId = insertResult[0].id;

    // Delete only the first article
    const deleteInput: DeleteNewsArticleInput = {
      id: firstArticleId
    };

    const result = await deleteNewsArticle(deleteInput);
    expect(result).toBe(true);

    // Verify only one article remains
    const remainingArticles = await db.select()
      .from(newsArticlesTable)
      .execute();

    expect(remainingArticles).toHaveLength(1);
    expect(remainingArticles[0].title).toEqual('Article 2');
  });

  it('should handle featured articles deletion correctly', async () => {
    // Create a featured article
    const insertResult = await db.insert(newsArticlesTable)
      .values({
        title: 'Featured Article',
        content: 'This is a featured article',
        excerpt: 'Featured excerpt',
        category: 'Hiburan',
        author: 'Featured Author',
        is_featured: true,
        view_count: 100
      })
      .returning()
      .execute();

    const articleId = insertResult[0].id;

    // Delete the featured article
    const deleteInput: DeleteNewsArticleInput = {
      id: articleId
    };

    const result = await deleteNewsArticle(deleteInput);

    // Should successfully delete featured articles
    expect(result).toBe(true);

    // Verify deletion
    const remainingArticles = await db.select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, articleId))
      .execute();

    expect(remainingArticles).toHaveLength(0);
  });

  it('should handle articles with high view counts', async () => {
    // Create an article with high view count
    const insertResult = await db.insert(newsArticlesTable)
      .values({
        title: 'Popular Article',
        content: 'This article has many views',
        excerpt: 'Popular excerpt',
        category: 'Olahraga',
        author: 'Popular Author',
        is_featured: false,
        view_count: 10000
      })
      .returning()
      .execute();

    const articleId = insertResult[0].id;

    // Delete the popular article
    const deleteInput: DeleteNewsArticleInput = {
      id: articleId
    };

    const result = await deleteNewsArticle(deleteInput);

    // Should successfully delete articles regardless of view count
    expect(result).toBe(true);

    // Verify deletion
    const remainingArticles = await db.select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, articleId))
      .execute();

    expect(remainingArticles).toHaveLength(0);
  });
});