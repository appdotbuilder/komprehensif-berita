import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type CreateNewsArticleInput } from '../schema';
import { getFeaturedNews } from '../handlers/get_featured_news';

// Test data for news articles
const testArticle1: CreateNewsArticleInput = {
  title: 'Featured Tech News',
  content: 'This is a featured technology news article with detailed content.',
  excerpt: 'A featured tech news excerpt',
  category: 'Teknologi',
  image_url: 'https://example.com/tech.jpg',
  author: 'Tech Reporter',
  is_featured: true
};

const testArticle2: CreateNewsArticleInput = {
  title: 'Featured Sports News',
  content: 'This is a featured sports news article with comprehensive coverage.',
  excerpt: 'A featured sports news excerpt',
  category: 'Olahraga',
  image_url: null,
  author: 'Sports Writer',
  is_featured: true
};

const testArticle3: CreateNewsArticleInput = {
  title: 'Regular News Article',
  content: 'This is a regular news article that is not featured.',
  excerpt: 'A regular news excerpt',
  category: 'Politik',
  image_url: 'https://example.com/politics.jpg',
  author: 'News Reporter',
  is_featured: false
};

describe('getFeaturedNews', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return featured news articles', async () => {
    // Insert test articles
    await db.insert(newsArticlesTable)
      .values([
        {
          ...testArticle1,
          view_count: 100
        },
        {
          ...testArticle2,
          view_count: 50
        },
        {
          ...testArticle3,
          view_count: 25
        }
      ])
      .execute();

    const result = await getFeaturedNews();

    // Should return only featured articles
    expect(result.articles).toHaveLength(2);
    expect(result.total).toBe(2);

    // Check that only featured articles are returned
    result.articles.forEach(article => {
      expect(article.is_featured).toBe(true);
    });

    // Verify specific article content
    const techArticle = result.articles.find(a => a.title === 'Featured Tech News');
    expect(techArticle).toBeDefined();
    expect(techArticle?.category).toBe('Teknologi');
    expect(techArticle?.author).toBe('Tech Reporter');
    expect(techArticle?.view_count).toBe(100);
    expect(techArticle?.created_at).toBeInstanceOf(Date);
    expect(techArticle?.updated_at).toBeInstanceOf(Date);
  });

  it('should respect limit parameter', async () => {
    // Insert multiple featured articles
    const featuredArticles = Array.from({ length: 8 }, (_, i) => ({
      title: `Featured Article ${i + 1}`,
      content: `Content for featured article ${i + 1}`,
      excerpt: `Excerpt ${i + 1}`,
      category: 'Teknologi' as const,
      image_url: null,
      author: `Author ${i + 1}`,
      is_featured: true,
      view_count: i * 10
    }));

    await db.insert(newsArticlesTable)
      .values(featuredArticles)
      .execute();

    // Test with custom limit
    const result = await getFeaturedNews(3);

    expect(result.articles).toHaveLength(3);
    expect(result.total).toBe(8); // Total count should still be 8

    // Verify articles are ordered by creation date (newest first)
    for (let i = 0; i < result.articles.length - 1; i++) {
      expect(result.articles[i].created_at >= result.articles[i + 1].created_at).toBe(true);
    }
  });

  it('should return empty results when no featured articles exist', async () => {
    // Insert only non-featured articles
    await db.insert(newsArticlesTable)
      .values([
        {
          ...testArticle3,
          view_count: 100
        }
      ])
      .execute();

    const result = await getFeaturedNews();

    expect(result.articles).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should use default limit when no limit provided', async () => {
    // Insert 10 featured articles
    const featuredArticles = Array.from({ length: 10 }, (_, i) => ({
      title: `Featured Article ${i + 1}`,
      content: `Content for featured article ${i + 1}`,
      excerpt: `Excerpt ${i + 1}`,
      category: 'Hiburan' as const,
      image_url: `https://example.com/image${i + 1}.jpg`,
      author: `Author ${i + 1}`,
      is_featured: true,
      view_count: i * 5
    }));

    await db.insert(newsArticlesTable)
      .values(featuredArticles)
      .execute();

    const result = await getFeaturedNews();

    // Default limit should be 5
    expect(result.articles).toHaveLength(5);
    expect(result.total).toBe(10);
  });

  it('should return articles ordered by creation date descending', async () => {
    // Insert articles with slight delay to ensure different timestamps
    const article1 = await db.insert(newsArticlesTable)
      .values({
        ...testArticle1,
        view_count: 10
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const article2 = await db.insert(newsArticlesTable)
      .values({
        ...testArticle2,
        view_count: 20
      })
      .returning()
      .execute();

    const result = await getFeaturedNews();

    expect(result.articles).toHaveLength(2);
    
    // Newest article should come first
    expect(result.articles[0].created_at >= result.articles[1].created_at).toBe(true);
  });

  it('should handle mixed featured and non-featured articles correctly', async () => {
    // Insert mix of featured and non-featured articles
    const mixedArticles = [
      { ...testArticle1, view_count: 100 }, // featured
      { ...testArticle3, view_count: 75 }, // not featured
      { ...testArticle2, view_count: 50 }, // featured
      { 
        title: 'Another Regular Article',
        content: 'Another non-featured article',
        excerpt: 'Another excerpt',
        category: 'Politik' as const,
        image_url: null,
        author: 'Another Author',
        is_featured: false,
        view_count: 200
      } // not featured
    ];

    await db.insert(newsArticlesTable)
      .values(mixedArticles)
      .execute();

    const result = await getFeaturedNews();

    expect(result.articles).toHaveLength(2);
    expect(result.total).toBe(2);

    // Verify only featured articles are returned
    result.articles.forEach(article => {
      expect(article.is_featured).toBe(true);
      expect(['Featured Tech News', 'Featured Sports News']).toContain(article.title);
    });
  });
});