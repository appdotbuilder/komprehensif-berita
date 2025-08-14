import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type UpdateNewsArticleInput, type CreateNewsArticleInput } from '../schema';
import { updateNewsArticle } from '../handlers/update_news_article';
import { eq } from 'drizzle-orm';

// Helper to create a test news article
const createTestArticle = async (overrides: Partial<CreateNewsArticleInput> = {}) => {
  const defaultArticle = {
    title: 'Original Title',
    content: 'Original content for the news article',
    excerpt: 'Original excerpt',
    category: 'Teknologi' as const,
    image_url: 'https://example.com/original.jpg',
    author: 'Original Author',
    is_featured: false
  };

  const article = { ...defaultArticle, ...overrides };

  const result = await db.insert(newsArticlesTable)
    .values({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      category: article.category,
      image_url: article.image_url,
      author: article.author,
      is_featured: article.is_featured
    })
    .returning()
    .execute();

  return result[0];
};

describe('updateNewsArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a news article with all fields', async () => {
    const originalArticle = await createTestArticle();
    
    const updateInput: UpdateNewsArticleInput = {
      id: originalArticle.id,
      title: 'Updated Title',
      content: 'Updated content for the news article',
      excerpt: 'Updated excerpt',
      category: 'Politik',
      image_url: 'https://example.com/updated.jpg',
      author: 'Updated Author',
      is_featured: true
    };

    const result = await updateNewsArticle(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(originalArticle.id);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.content).toEqual('Updated content for the news article');
    expect(result!.excerpt).toEqual('Updated excerpt');
    expect(result!.category).toEqual('Politik');
    expect(result!.image_url).toEqual('https://example.com/updated.jpg');
    expect(result!.author).toEqual('Updated Author');
    expect(result!.is_featured).toEqual(true);
    expect(result!.view_count).toEqual(0); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > originalArticle.updated_at).toBe(true);
  });

  it('should update only specific fields', async () => {
    const originalArticle = await createTestArticle();
    
    const updateInput: UpdateNewsArticleInput = {
      id: originalArticle.id,
      title: 'Partially Updated Title',
      is_featured: true
    };

    const result = await updateNewsArticle(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(originalArticle.id);
    expect(result!.title).toEqual('Partially Updated Title');
    expect(result!.content).toEqual('Original content for the news article'); // Unchanged
    expect(result!.excerpt).toEqual('Original excerpt'); // Unchanged
    expect(result!.category).toEqual('Teknologi'); // Unchanged
    expect(result!.author).toEqual('Original Author'); // Unchanged
    expect(result!.is_featured).toEqual(true); // Updated
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > originalArticle.updated_at).toBe(true);
  });

  it('should update image_url to null', async () => {
    const originalArticle = await createTestArticle();
    
    const updateInput: UpdateNewsArticleInput = {
      id: originalArticle.id,
      image_url: null
    };

    const result = await updateNewsArticle(updateInput);

    expect(result).not.toBeNull();
    expect(result!.image_url).toBeNull();
    expect(result!.updated_at > originalArticle.updated_at).toBe(true);
  });

  it('should update updated_at timestamp even with no field changes', async () => {
    const originalArticle = await createTestArticle();
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateNewsArticleInput = {
      id: originalArticle.id
    };

    const result = await updateNewsArticle(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(originalArticle.id);
    expect(result!.title).toEqual(originalArticle.title); // All fields should remain the same
    expect(result!.content).toEqual(originalArticle.content);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent article', async () => {
    const updateInput: UpdateNewsArticleInput = {
      id: 99999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateNewsArticle(updateInput);

    expect(result).toBeNull();
  });

  it('should save updated article to database', async () => {
    const originalArticle = await createTestArticle();
    
    const updateInput: UpdateNewsArticleInput = {
      id: originalArticle.id,
      title: 'Database Update Test',
      category: 'Hiburan'
    };

    await updateNewsArticle(updateInput);

    // Verify the changes were saved to the database
    const savedArticles = await db.select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, originalArticle.id))
      .execute();

    expect(savedArticles).toHaveLength(1);
    expect(savedArticles[0].title).toEqual('Database Update Test');
    expect(savedArticles[0].category).toEqual('Hiburan');
    expect(savedArticles[0].updated_at).toBeInstanceOf(Date);
    expect(savedArticles[0].updated_at > originalArticle.updated_at).toBe(true);
  });

  it('should handle category updates correctly', async () => {
    const originalArticle = await createTestArticle({ category: 'Olahraga' });
    
    const updateInput: UpdateNewsArticleInput = {
      id: originalArticle.id,
      category: 'Politik'
    };

    const result = await updateNewsArticle(updateInput);

    expect(result).not.toBeNull();
    expect(result!.category).toEqual('Politik');
    expect(result!.updated_at > originalArticle.updated_at).toBe(true);
  });

  it('should handle featured status toggle', async () => {
    const originalArticle = await createTestArticle({ is_featured: false });
    
    const updateInput: UpdateNewsArticleInput = {
      id: originalArticle.id,
      is_featured: true
    };

    const result = await updateNewsArticle(updateInput);

    expect(result).not.toBeNull();
    expect(result!.is_featured).toEqual(true);
    expect(result!.updated_at > originalArticle.updated_at).toBe(true);
  });
});