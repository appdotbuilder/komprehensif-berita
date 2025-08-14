import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type GetNewsArticlesInput, type NewsCategory } from '../schema';
import { getNewsArticles } from '../handlers/get_news_articles';

// Test data setup
const testArticles = [
  {
    title: 'Breaking Technology News',
    content: 'Latest developments in artificial intelligence and machine learning',
    excerpt: 'AI technology advances rapidly',
    category: 'Teknologi' as NewsCategory,
    image_url: 'https://example.com/tech.jpg',
    author: 'Tech Reporter',
    is_featured: true
  },
  {
    title: 'Sports Championship Final',
    content: 'The final match was intense with great performances from both teams',
    excerpt: 'Championship reaches exciting conclusion',
    category: 'Olahraga' as NewsCategory,
    image_url: null,
    author: 'Sports Writer',
    is_featured: false
  },
  {
    title: 'Political Development',
    content: 'Important policy changes announced by government officials',
    excerpt: 'New policies take effect',
    category: 'Politik' as NewsCategory,
    image_url: 'https://example.com/politics.jpg',
    author: 'Political Correspondent',
    is_featured: true
  },
  {
    title: 'Entertainment Industry Updates',
    content: 'Celebrity news and upcoming movie releases dominate headlines',
    excerpt: 'Hollywood buzzing with activity',
    category: 'Hiburan' as NewsCategory,
    image_url: null,
    author: 'Entertainment Reporter',
    is_featured: false
  }
];

describe('getNewsArticles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test articles
  const createTestArticles = async () => {
    await db.insert(newsArticlesTable)
      .values(testArticles)
      .execute();
  };

  it('should return all articles with default pagination', async () => {
    await createTestArticles();

    const input: GetNewsArticlesInput = {
      limit: 10,
      offset: 0
    };

    const result = await getNewsArticles(input);

    expect(result.articles).toHaveLength(4);
    expect(result.total).toEqual(4);
    
    // Verify articles are ordered by created_at desc (newest first)
    const timestamps = result.articles.map(article => article.created_at.getTime());
    for (let i = 0; i < timestamps.length - 1; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
    }
  });

  it('should filter articles by category', async () => {
    await createTestArticles();

    const input: GetNewsArticlesInput = {
      category: 'Teknologi',
      limit: 10,
      offset: 0
    };

    const result = await getNewsArticles(input);

    expect(result.articles).toHaveLength(1);
    expect(result.total).toEqual(1);
    expect(result.articles[0].title).toEqual('Breaking Technology News');
    expect(result.articles[0].category).toEqual('Teknologi');
  });

  it('should filter articles by featured status', async () => {
    await createTestArticles();

    const input: GetNewsArticlesInput = {
      featured: true,
      limit: 10,
      offset: 0
    };

    const result = await getNewsArticles(input);

    expect(result.articles).toHaveLength(2);
    expect(result.total).toEqual(2);
    expect(result.articles.every(article => article.is_featured)).toBe(true);
  });

  it('should filter articles by non-featured status', async () => {
    await createTestArticles();

    const input: GetNewsArticlesInput = {
      featured: false,
      limit: 10,
      offset: 0
    };

    const result = await getNewsArticles(input);

    expect(result.articles).toHaveLength(2);
    expect(result.total).toEqual(2);
    expect(result.articles.every(article => !article.is_featured)).toBe(true);
  });

  it('should search articles by title', async () => {
    await createTestArticles();

    const input: GetNewsArticlesInput = {
      search: 'Technology',
      limit: 10,
      offset: 0
    };

    const result = await getNewsArticles(input);

    expect(result.articles).toHaveLength(1);
    expect(result.total).toEqual(1);
    expect(result.articles[0].title).toEqual('Breaking Technology News');
  });

  it('should search articles by content', async () => {
    await createTestArticles();

    const input: GetNewsArticlesInput = {
      search: 'artificial intelligence',
      limit: 10,
      offset: 0
    };

    const result = await getNewsArticles(input);

    expect(result.articles).toHaveLength(1);
    expect(result.total).toEqual(1);
    expect(result.articles[0].content).toContain('artificial intelligence');
  });

  it('should search articles by excerpt', async () => {
    await createTestArticles();

    const input: GetNewsArticlesInput = {
      search: 'Championship reaches',
      limit: 10,
      offset: 0
    };

    const result = await getNewsArticles(input);

    expect(result.articles).toHaveLength(1);
    expect(result.total).toEqual(1);
    expect(result.articles[0].excerpt).toContain('Championship reaches');
  });

  it('should search case-insensitively', async () => {
    await createTestArticles();

    const input: GetNewsArticlesInput = {
      search: 'TECHNOLOGY',
      limit: 10,
      offset: 0
    };

    const result = await getNewsArticles(input);

    expect(result.articles).toHaveLength(1);
    expect(result.total).toEqual(1);
    expect(result.articles[0].title).toEqual('Breaking Technology News');
  });

  it('should combine filters correctly', async () => {
    await createTestArticles();

    const input: GetNewsArticlesInput = {
      category: 'Politik',
      featured: true,
      limit: 10,
      offset: 0
    };

    const result = await getNewsArticles(input);

    expect(result.articles).toHaveLength(1);
    expect(result.total).toEqual(1);
    expect(result.articles[0].category).toEqual('Politik');
    expect(result.articles[0].is_featured).toBe(true);
  });

  it('should handle pagination correctly', async () => {
    await createTestArticles();

    // First page
    const firstPage: GetNewsArticlesInput = {
      limit: 2,
      offset: 0
    };

    const firstResult = await getNewsArticles(firstPage);

    expect(firstResult.articles).toHaveLength(2);
    expect(firstResult.total).toEqual(4);

    // Second page
    const secondPage: GetNewsArticlesInput = {
      limit: 2,
      offset: 2
    };

    const secondResult = await getNewsArticles(secondPage);

    expect(secondResult.articles).toHaveLength(2);
    expect(secondResult.total).toEqual(4);

    // Verify different articles on different pages
    const firstPageIds = firstResult.articles.map(a => a.id);
    const secondPageIds = secondResult.articles.map(a => a.id);
    
    expect(firstPageIds).not.toEqual(secondPageIds);
  });

  it('should return empty results for no matches', async () => {
    await createTestArticles();

    const input: GetNewsArticlesInput = {
      search: 'nonexistent topic',
      limit: 10,
      offset: 0
    };

    const result = await getNewsArticles(input);

    expect(result.articles).toHaveLength(0);
    expect(result.total).toEqual(0);
  });

  it('should handle empty database', async () => {
    const input: GetNewsArticlesInput = {
      limit: 10,
      offset: 0
    };

    const result = await getNewsArticles(input);

    expect(result.articles).toHaveLength(0);
    expect(result.total).toEqual(0);
  });

  it('should ignore empty search strings', async () => {
    await createTestArticles();

    const input: GetNewsArticlesInput = {
      search: '   ', // Only whitespace
      limit: 10,
      offset: 0
    };

    const result = await getNewsArticles(input);

    expect(result.articles).toHaveLength(4);
    expect(result.total).toEqual(4);
  });

  it('should return correct article structure', async () => {
    await createTestArticles();

    const input: GetNewsArticlesInput = {
      limit: 1,
      offset: 0
    };

    const result = await getNewsArticles(input);

    expect(result.articles).toHaveLength(1);
    const article = result.articles[0];

    // Verify all required fields are present
    expect(article.id).toBeDefined();
    expect(typeof article.title).toBe('string');
    expect(typeof article.content).toBe('string');
    expect(typeof article.excerpt).toBe('string');
    expect(typeof article.category).toBe('string');
    expect(typeof article.author).toBe('string');
    expect(typeof article.is_featured).toBe('boolean');
    expect(typeof article.view_count).toBe('number');
    expect(article.created_at).toBeInstanceOf(Date);
    expect(article.updated_at).toBeInstanceOf(Date);
    
    // image_url can be null or string
    expect(article.image_url === null || typeof article.image_url === 'string').toBe(true);
  });
});