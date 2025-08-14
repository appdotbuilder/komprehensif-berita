import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type CreateNewsArticleInput } from '../schema';
import { getLatestNews } from '../handlers/get_latest_news';

// Helper function to create test news articles
const createTestArticle = async (
  title: string, 
  category: 'Olahraga' | 'Politik' | 'Teknologi' | 'Hiburan' = 'Teknologi',
  createdAt?: Date
): Promise<void> => {
  const baseArticle: Omit<CreateNewsArticleInput, 'title' | 'category'> = {
    content: 'Test content for the article',
    excerpt: 'Test excerpt',
    image_url: 'https://example.com/image.jpg',
    author: 'Test Author',
    is_featured: false
  };

  const values: any = {
    title,
    category,
    ...baseArticle
  };

  // Add custom created_at if provided
  if (createdAt) {
    values.created_at = createdAt;
  }

  await db.insert(newsArticlesTable)
    .values(values)
    .execute();
};

describe('getLatestNews', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty results when no articles exist', async () => {
    const result = await getLatestNews(10);

    expect(result.articles).toEqual([]);
    expect(result.total).toEqual(0);
  });

  it('should return articles ordered by created_at desc', async () => {
    // Create articles with different timestamps
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    await createTestArticle('Oldest Article', 'Teknologi', twoDaysAgo);
    await createTestArticle('Middle Article', 'Politik', yesterday);
    await createTestArticle('Newest Article', 'Olahraga', now);

    const result = await getLatestNews(10);

    expect(result.articles).toHaveLength(3);
    expect(result.total).toEqual(3);

    // Check ordering - newest first
    expect(result.articles[0].title).toEqual('Newest Article');
    expect(result.articles[1].title).toEqual('Middle Article');
    expect(result.articles[2].title).toEqual('Oldest Article');

    // Verify timestamps are properly ordered
    expect(result.articles[0].created_at >= result.articles[1].created_at).toBe(true);
    expect(result.articles[1].created_at >= result.articles[2].created_at).toBe(true);
  });

  it('should respect the limit parameter', async () => {
    // Create 5 articles
    for (let i = 0; i < 5; i++) {
      await createTestArticle(`Article ${i + 1}`, 'Teknologi');
    }

    const result = await getLatestNews(3);

    expect(result.articles).toHaveLength(3);
    expect(result.total).toEqual(5); // Total should still be 5
  });

  it('should use default limit of 10 when no limit specified', async () => {
    // Create 15 articles
    for (let i = 0; i < 15; i++) {
      await createTestArticle(`Article ${i + 1}`, 'Politik');
    }

    const result = await getLatestNews(); // No limit parameter

    expect(result.articles).toHaveLength(10); // Default limit
    expect(result.total).toEqual(15);
  });

  it('should return all articles when limit is greater than total', async () => {
    // Create 3 articles
    await createTestArticle('Article 1', 'Hiburan');
    await createTestArticle('Article 2', 'Olahraga');
    await createTestArticle('Article 3', 'Politik');

    const result = await getLatestNews(100);

    expect(result.articles).toHaveLength(3);
    expect(result.total).toEqual(3);
  });

  it('should return complete article data structure', async () => {
    await createTestArticle('Complete Article', 'Teknologi');

    const result = await getLatestNews(1);

    const article = result.articles[0];
    expect(article.id).toBeDefined();
    expect(article.title).toEqual('Complete Article');
    expect(article.content).toEqual('Test content for the article');
    expect(article.excerpt).toEqual('Test excerpt');
    expect(article.category).toEqual('Teknologi');
    expect(article.image_url).toEqual('https://example.com/image.jpg');
    expect(article.author).toEqual('Test Author');
    expect(article.is_featured).toBe(false);
    expect(article.view_count).toEqual(0);
    expect(article.created_at).toBeInstanceOf(Date);
    expect(article.updated_at).toBeInstanceOf(Date);
  });

  it('should handle articles with different categories', async () => {
    await createTestArticle('Sports Article', 'Olahraga');
    await createTestArticle('Politics Article', 'Politik');
    await createTestArticle('Tech Article', 'Teknologi');
    await createTestArticle('Entertainment Article', 'Hiburan');

    const result = await getLatestNews(10);

    expect(result.articles).toHaveLength(4);
    expect(result.total).toEqual(4);

    // Verify all categories are present
    const categories = result.articles.map(article => article.category);
    expect(categories).toContain('Olahraga');
    expect(categories).toContain('Politik');
    expect(categories).toContain('Teknologi');
    expect(categories).toContain('Hiburan');
  });

  it('should handle articles with null image_url', async () => {
    await db.insert(newsArticlesTable)
      .values({
        title: 'Article Without Image',
        content: 'Test content',
        excerpt: 'Test excerpt',
        category: 'Politik',
        image_url: null, // Explicitly null
        author: 'Test Author',
        is_featured: false
      })
      .execute();

    const result = await getLatestNews(1);

    expect(result.articles).toHaveLength(1);
    expect(result.articles[0].title).toEqual('Article Without Image');
    expect(result.articles[0].image_url).toBeNull();
  });

  it('should handle featured and non-featured articles', async () => {
    // Create featured article
    await db.insert(newsArticlesTable)
      .values({
        title: 'Featured Article',
        content: 'Featured content',
        excerpt: 'Featured excerpt',
        category: 'Teknologi',
        image_url: 'https://example.com/featured.jpg',
        author: 'Featured Author',
        is_featured: true
      })
      .execute();

    await createTestArticle('Regular Article', 'Politik');

    const result = await getLatestNews(10);

    expect(result.articles).toHaveLength(2);
    expect(result.total).toEqual(2);

    // Find the featured article
    const featuredArticle = result.articles.find(article => article.is_featured);
    const regularArticle = result.articles.find(article => !article.is_featured);

    expect(featuredArticle).toBeDefined();
    expect(featuredArticle?.title).toEqual('Featured Article');
    expect(regularArticle).toBeDefined();
    expect(regularArticle?.title).toEqual('Regular Article');
  });
});