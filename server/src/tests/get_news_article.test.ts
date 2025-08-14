import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type GetNewsArticleInput, type CreateNewsArticleInput } from '../schema';
import { getNewsArticle } from '../handlers/get_news_article';
import { eq } from 'drizzle-orm';

// Test input for creating a sample article
const testArticleInput = {
  title: 'Test Article',
  content: 'This is test content for the article',
  excerpt: 'Test excerpt',
  category: 'Teknologi' as const,
  image_url: 'https://example.com/image.jpg',
  author: 'Test Author',
  is_featured: true
};

describe('getNewsArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get an existing news article by ID', async () => {
    // Create a test article first
    const insertResult = await db.insert(newsArticlesTable)
      .values({
        ...testArticleInput
      })
      .returning()
      .execute();

    const createdArticle = insertResult[0];

    // Test getting the article
    const input: GetNewsArticleInput = { id: createdArticle.id };
    const result = await getNewsArticle(input);

    // Verify the article was found and all fields are correct
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdArticle.id);
    expect(result!.title).toEqual('Test Article');
    expect(result!.content).toEqual('This is test content for the article');
    expect(result!.excerpt).toEqual('Test excerpt');
    expect(result!.category).toEqual('Teknologi');
    expect(result!.image_url).toEqual('https://example.com/image.jpg');
    expect(result!.author).toEqual('Test Author');
    expect(result!.is_featured).toEqual(true);
    expect(result!.view_count).toEqual(0); // Default value
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent article ID', async () => {
    const input: GetNewsArticleInput = { id: 999999 };
    const result = await getNewsArticle(input);

    expect(result).toBeNull();
  });

  it('should handle article with null image_url', async () => {
    // Create article without image
    const articleWithoutImage = {
      ...testArticleInput,
      image_url: null
    };

    const insertResult = await db.insert(newsArticlesTable)
      .values(articleWithoutImage)
      .returning()
      .execute();

    const createdArticle = insertResult[0];

    // Test getting the article
    const input: GetNewsArticleInput = { id: createdArticle.id };
    const result = await getNewsArticle(input);

    expect(result).not.toBeNull();
    expect(result!.image_url).toBeNull();
    expect(result!.title).toEqual('Test Article');
    expect(result!.author).toEqual('Test Author');
  });

  it('should handle article with different categories', async () => {
    // Test with different category
    const sportsArticle = {
      ...testArticleInput,
      title: 'Sports News',
      category: 'Olahraga' as const,
      is_featured: false
    };

    const insertResult = await db.insert(newsArticlesTable)
      .values(sportsArticle)
      .returning()
      .execute();

    const createdArticle = insertResult[0];

    // Test getting the article
    const input: GetNewsArticleInput = { id: createdArticle.id };
    const result = await getNewsArticle(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Sports News');
    expect(result!.category).toEqual('Olahraga');
    expect(result!.is_featured).toEqual(false);
  });

  it('should verify article exists in database after retrieval', async () => {
    // Create test article
    const insertResult = await db.insert(newsArticlesTable)
      .values(testArticleInput)
      .returning()
      .execute();

    const createdArticle = insertResult[0];

    // Get article using handler
    const input: GetNewsArticleInput = { id: createdArticle.id };
    const result = await getNewsArticle(input);

    // Verify by direct database query
    const dbResult = await db.select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, createdArticle.id))
      .execute();

    expect(dbResult).toHaveLength(1);
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(dbResult[0].id);
    expect(result!.title).toEqual(dbResult[0].title);
    expect(result!.view_count).toEqual(dbResult[0].view_count);
  });

  it('should handle article with high view count', async () => {
    // Create article with custom view count
    const popularArticle = {
      ...testArticleInput,
      title: 'Popular Article'
    };

    const insertResult = await db.insert(newsArticlesTable)
      .values(popularArticle)
      .returning()
      .execute();

    // Update view count to simulate popular article
    await db.update(newsArticlesTable)
      .set({ view_count: 1500 })
      .where(eq(newsArticlesTable.id, insertResult[0].id))
      .execute();

    // Test getting the article
    const input: GetNewsArticleInput = { id: insertResult[0].id };
    const result = await getNewsArticle(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Popular Article');
    expect(result!.view_count).toEqual(1500);
    expect(typeof result!.view_count).toEqual('number');
  });
});