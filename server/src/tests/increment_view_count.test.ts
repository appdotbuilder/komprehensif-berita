import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type IncrementViewCountInput, type NewsCategory } from '../schema';
import { incrementViewCount } from '../handlers/increment_view_count';
import { eq } from 'drizzle-orm';

// Test input with valid article ID
const testInput: IncrementViewCountInput = {
  id: 1
};

// Helper function to create a test article
const createTestArticle = async (id: number, initialViewCount: number = 0) => {
  const article = await db.insert(newsArticlesTable)
    .values({
      id,
      title: `Test Article ${id}`,
      content: 'Test content for the article',
      excerpt: 'Test excerpt',
      category: 'Teknologi' as NewsCategory,
      image_url: null,
      author: 'Test Author',
      is_featured: false,
      view_count: initialViewCount
    })
    .returning()
    .execute();
  
  return article[0];
};

describe('incrementViewCount', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should increment view count for existing article', async () => {
    // Create test article with initial view count of 5
    await createTestArticle(1, 5);

    // Increment view count
    const result = await incrementViewCount(testInput);

    // Should return true indicating success
    expect(result).toBe(true);

    // Verify view count was incremented in database
    const articles = await db.select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, 1))
      .execute();

    expect(articles).toHaveLength(1);
    expect(articles[0].view_count).toBe(6); // Should be incremented from 5 to 6
  });

  it('should increment view count from zero', async () => {
    // Create test article with view count of 0
    await createTestArticle(1, 0);

    // Increment view count
    const result = await incrementViewCount(testInput);

    // Should return true
    expect(result).toBe(true);

    // Verify view count was incremented
    const articles = await db.select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, 1))
      .execute();

    expect(articles[0].view_count).toBe(1); // Should be incremented from 0 to 1
  });

  it('should update updated_at timestamp', async () => {
    // Create test article
    const originalArticle = await createTestArticle(1, 10);
    const originalUpdatedAt = originalArticle.updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Increment view count
    await incrementViewCount(testInput);

    // Verify updated_at was changed
    const updatedArticles = await db.select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, 1))
      .execute();

    expect(updatedArticles[0].updated_at).not.toEqual(originalUpdatedAt);
    expect(updatedArticles[0].updated_at > originalUpdatedAt).toBe(true);
  });

  it('should return false for non-existent article', async () => {
    // Try to increment view count for non-existent article
    const nonExistentInput: IncrementViewCountInput = { id: 999 };
    const result = await incrementViewCount(nonExistentInput);

    // Should return false indicating no article was found
    expect(result).toBe(false);

    // Verify no records exist in database
    const articles = await db.select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, 999))
      .execute();

    expect(articles).toHaveLength(0);
  });

  it('should handle multiple increments correctly', async () => {
    // Create test article with initial view count
    await createTestArticle(1, 100);

    // Perform multiple increments
    const result1 = await incrementViewCount(testInput);
    const result2 = await incrementViewCount(testInput);
    const result3 = await incrementViewCount(testInput);

    // All should return true
    expect(result1).toBe(true);
    expect(result2).toBe(true);
    expect(result3).toBe(true);

    // Verify final view count
    const articles = await db.select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, 1))
      .execute();

    expect(articles[0].view_count).toBe(103); // Should be 100 + 3 increments
  });

  it('should handle large view counts', async () => {
    // Create test article with large initial view count
    const largeViewCount = 999999;
    await createTestArticle(1, largeViewCount);

    // Increment view count
    const result = await incrementViewCount(testInput);

    expect(result).toBe(true);

    // Verify large view count was incremented correctly
    const articles = await db.select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, 1))
      .execute();

    expect(articles[0].view_count).toBe(largeViewCount + 1);
  });

  it('should preserve other article fields', async () => {
    // Create test article with specific data
    const originalData = {
      title: 'Original Title',
      content: 'Original content',
      category: 'Politik' as NewsCategory,
      author: 'Original Author',
      is_featured: true
    };

    await db.insert(newsArticlesTable)
      .values({
        id: 1,
        ...originalData,
        excerpt: 'Original excerpt',
        image_url: 'http://example.com/image.jpg',
        view_count: 50
      })
      .execute();

    // Increment view count
    await incrementViewCount(testInput);

    // Verify other fields remain unchanged
    const articles = await db.select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, 1))
      .execute();

    const article = articles[0];
    expect(article.title).toBe(originalData.title);
    expect(article.content).toBe(originalData.content);
    expect(article.category).toBe(originalData.category);
    expect(article.author).toBe(originalData.author);
    expect(article.is_featured).toBe(originalData.is_featured);
    expect(article.view_count).toBe(51); // Only view_count should change
  });
});