import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type CreateNewsArticleInput } from '../schema';
import { createNewsArticle } from '../handlers/create_news_article';
import { eq } from 'drizzle-orm';

// Complete test input with all required fields
const testInput: CreateNewsArticleInput = {
  title: 'Breaking News: Technology Revolution',
  content: 'This is the full content of the news article discussing the latest technological advances...',
  excerpt: 'A brief summary of the technology revolution happening now.',
  category: 'Teknologi',
  image_url: 'https://example.com/news-image.jpg',
  author: 'Jane Reporter',
  is_featured: true
};

// Minimal test input without optional fields
const minimalInput: CreateNewsArticleInput = {
  title: 'Simple News',
  content: 'Basic news content.',
  excerpt: 'Basic excerpt.',
  category: 'Politik',
  image_url: null,
  author: 'John Doe',
  is_featured: false
};

describe('createNewsArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a news article with all fields', async () => {
    const result = await createNewsArticle(testInput);

    // Verify all fields are correctly set
    expect(result.title).toEqual('Breaking News: Technology Revolution');
    expect(result.content).toEqual(testInput.content);
    expect(result.excerpt).toEqual(testInput.excerpt);
    expect(result.category).toEqual('Teknologi');
    expect(result.image_url).toEqual('https://example.com/news-image.jpg');
    expect(result.author).toEqual('Jane Reporter');
    expect(result.is_featured).toEqual(true);
    expect(result.view_count).toEqual(0); // Default value for new articles
    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a minimal news article', async () => {
    const result = await createNewsArticle(minimalInput);

    expect(result.title).toEqual('Simple News');
    expect(result.content).toEqual('Basic news content.');
    expect(result.excerpt).toEqual('Basic excerpt.');
    expect(result.category).toEqual('Politik');
    expect(result.image_url).toBeNull();
    expect(result.author).toEqual('John Doe');
    expect(result.is_featured).toEqual(false);
    expect(result.view_count).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save news article to database', async () => {
    const result = await createNewsArticle(testInput);

    // Query the database to verify the article was saved
    const articles = await db.select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, result.id))
      .execute();

    expect(articles).toHaveLength(1);
    const savedArticle = articles[0];
    expect(savedArticle.title).toEqual('Breaking News: Technology Revolution');
    expect(savedArticle.content).toEqual(testInput.content);
    expect(savedArticle.excerpt).toEqual(testInput.excerpt);
    expect(savedArticle.category).toEqual('Teknologi');
    expect(savedArticle.image_url).toEqual('https://example.com/news-image.jpg');
    expect(savedArticle.author).toEqual('Jane Reporter');
    expect(savedArticle.is_featured).toEqual(true);
    expect(savedArticle.view_count).toEqual(0);
    expect(savedArticle.created_at).toBeInstanceOf(Date);
    expect(savedArticle.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different news categories correctly', async () => {
    const categories = ['Olahraga', 'Politik', 'Teknologi', 'Hiburan'] as const;
    
    for (const category of categories) {
      const categoryInput: CreateNewsArticleInput = {
        ...testInput,
        title: `${category} News`,
        category: category
      };

      const result = await createNewsArticle(categoryInput);
      expect(result.category).toEqual(category);
      expect(result.title).toEqual(`${category} News`);
    }
  });

  it('should set correct default values', async () => {
    // Test with explicit false value to verify default behavior
    const inputWithDefaults: CreateNewsArticleInput = {
      title: 'Test Default Values',
      content: 'Testing default behavior.',
      excerpt: 'Default test excerpt.',
      category: 'Hiburan',
      image_url: null,
      author: 'Test Author',
      is_featured: false // Explicitly set to test default behavior
    };

    const result = await createNewsArticle(inputWithDefaults);

    expect(result.is_featured).toEqual(false);
    expect(result.view_count).toEqual(0); // Should use database default
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null image_url correctly', async () => {
    const result = await createNewsArticle(minimalInput);

    expect(result.image_url).toBeNull();

    // Verify in database
    const articles = await db.select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, result.id))
      .execute();

    expect(articles[0].image_url).toBeNull();
  });

  it('should create multiple articles with different IDs', async () => {
    const article1 = await createNewsArticle({
      ...testInput,
      title: 'First Article'
    });

    const article2 = await createNewsArticle({
      ...testInput,
      title: 'Second Article'
    });

    expect(article1.id).not.toEqual(article2.id);
    expect(article1.title).toEqual('First Article');
    expect(article2.title).toEqual('Second Article');

    // Verify both exist in database
    const allArticles = await db.select()
      .from(newsArticlesTable)
      .execute();

    expect(allArticles).toHaveLength(2);
    expect(allArticles.map(a => a.title)).toContain('First Article');
    expect(allArticles.map(a => a.title)).toContain('Second Article');
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createNewsArticle(testInput);
    const afterCreation = new Date();

    // Timestamps should be within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000);
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000);
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000);

    // For new articles, created_at and updated_at should be very close
    const timeDiff = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Within 1 second
  });
});