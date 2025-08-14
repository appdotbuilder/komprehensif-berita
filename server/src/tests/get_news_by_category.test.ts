import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type CreateNewsArticleInput, type NewsCategory } from '../schema';
import { getNewsByCategory } from '../handlers/get_news_by_category';
import { eq } from 'drizzle-orm';

// Test data for different categories
const techArticle: CreateNewsArticleInput = {
  title: 'AI Revolution in Technology',
  content: 'Artificial Intelligence is transforming the tech industry with groundbreaking innovations.',
  excerpt: 'AI is changing everything in tech.',
  category: 'Teknologi' as NewsCategory,
  image_url: 'https://example.com/ai-image.jpg',
  author: 'Tech Writer',
  is_featured: false
};

const sportsArticle: CreateNewsArticleInput = {
  title: 'Football Championship Final',
  content: 'The championship final was an exciting match with incredible performances.',
  excerpt: 'Championship final was thrilling.',
  category: 'Olahraga' as NewsCategory,
  image_url: 'https://example.com/football.jpg',
  author: 'Sports Reporter',
  is_featured: true
};

const politicsArticle: CreateNewsArticleInput = {
  title: 'Election Results Analysis',
  content: 'Detailed analysis of the recent election results and their implications.',
  excerpt: 'Election results analyzed.',
  category: 'Politik' as NewsCategory,
  image_url: null,
  author: 'Political Analyst',
  is_featured: false
};

const entertainmentArticle: CreateNewsArticleInput = {
  title: 'New Movie Release',
  content: 'A blockbuster movie is set to release next month with star-studded cast.',
  excerpt: 'New blockbuster coming soon.',
  category: 'Hiburan' as NewsCategory,
  image_url: 'https://example.com/movie.jpg',
  author: 'Entertainment Writer',
  is_featured: true
};

describe('getNewsByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return articles for a specific category', async () => {
    // Create test articles
    await db.insert(newsArticlesTable).values([
      { ...techArticle, view_count: 0 },
      { ...sportsArticle, view_count: 0 },
      { ...politicsArticle, view_count: 0 }
    ]).execute();

    const result = await getNewsByCategory('Teknologi', 10, 0);

    expect(result.articles).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.articles[0].title).toBe('AI Revolution in Technology');
    expect(result.articles[0].category).toBe('Teknologi');
    expect(result.articles[0].author).toBe('Tech Writer');
    expect(result.articles[0].id).toBeDefined();
    expect(result.articles[0].created_at).toBeInstanceOf(Date);
    expect(result.articles[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple articles for same category', async () => {
    // Create multiple tech articles
    await db.insert(newsArticlesTable).values([
      { ...techArticle, title: 'Tech Article 1', view_count: 0 },
      { ...techArticle, title: 'Tech Article 2', view_count: 0 },
      { ...techArticle, title: 'Tech Article 3', view_count: 0 },
      { ...sportsArticle, view_count: 0 }
    ]).execute();

    const result = await getNewsByCategory('Teknologi', 10, 0);

    expect(result.articles).toHaveLength(3);
    expect(result.total).toBe(3);
    
    // All articles should be in Teknologi category
    result.articles.forEach(article => {
      expect(article.category).toBe('Teknologi');
    });
  });

  it('should return empty result for category with no articles', async () => {
    // Create articles but not in the requested category
    await db.insert(newsArticlesTable).values([
      { ...techArticle, view_count: 0 },
      { ...sportsArticle, view_count: 0 }
    ]).execute();

    const result = await getNewsByCategory('Politik', 10, 0);

    expect(result.articles).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should respect limit parameter for pagination', async () => {
    // Create 5 tech articles
    const techArticles = Array.from({ length: 5 }, (_, i) => ({
      ...techArticle,
      title: `Tech Article ${i + 1}`,
      view_count: 0
    }));

    await db.insert(newsArticlesTable).values(techArticles).execute();

    const result = await getNewsByCategory('Teknologi', 3, 0);

    expect(result.articles).toHaveLength(3);
    expect(result.total).toBe(5);
  });

  it('should respect offset parameter for pagination', async () => {
    // Create 5 tech articles
    const techArticles = Array.from({ length: 5 }, (_, i) => ({
      ...techArticle,
      title: `Tech Article ${i + 1}`,
      view_count: 0
    }));

    await db.insert(newsArticlesTable).values(techArticles).execute();

    // Get first page
    const firstPage = await getNewsByCategory('Teknologi', 2, 0);
    expect(firstPage.articles).toHaveLength(2);
    expect(firstPage.total).toBe(5);

    // Get second page
    const secondPage = await getNewsByCategory('Teknologi', 2, 2);
    expect(secondPage.articles).toHaveLength(2);
    expect(secondPage.total).toBe(5);

    // Articles should be different
    const firstPageIds = firstPage.articles.map(a => a.id);
    const secondPageIds = secondPage.articles.map(a => a.id);
    expect(firstPageIds).not.toEqual(secondPageIds);
  });

  it('should handle all supported categories', async () => {
    // Create articles for all categories
    await db.insert(newsArticlesTable).values([
      { ...techArticle, view_count: 0 },
      { ...sportsArticle, view_count: 0 },
      { ...politicsArticle, view_count: 0 },
      { ...entertainmentArticle, view_count: 0 }
    ]).execute();

    // Test each category
    const categories: NewsCategory[] = ['Olahraga', 'Politik', 'Teknologi', 'Hiburan'];
    
    for (const category of categories) {
      const result = await getNewsByCategory(category, 10, 0);
      expect(result.articles).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.articles[0].category).toBe(category);
    }
  });

  it('should preserve all article fields', async () => {
    await db.insert(newsArticlesTable).values([
      { ...entertainmentArticle, view_count: 42 }
    ]).execute();

    const result = await getNewsByCategory('Hiburan', 10, 0);

    expect(result.articles).toHaveLength(1);
    
    const article = result.articles[0];
    expect(article.title).toBe('New Movie Release');
    expect(article.content).toBe('A blockbuster movie is set to release next month with star-studded cast.');
    expect(article.excerpt).toBe('New blockbuster coming soon.');
    expect(article.category).toBe('Hiburan');
    expect(article.image_url).toBe('https://example.com/movie.jpg');
    expect(article.author).toBe('Entertainment Writer');
    expect(article.is_featured).toBe(true);
    expect(article.view_count).toBe(42);
    expect(article.id).toBeDefined();
    expect(article.created_at).toBeInstanceOf(Date);
    expect(article.updated_at).toBeInstanceOf(Date);
  });

  it('should handle articles with null image_url', async () => {
    await db.insert(newsArticlesTable).values([
      { ...politicsArticle, view_count: 0 }
    ]).execute();

    const result = await getNewsByCategory('Politik', 10, 0);

    expect(result.articles).toHaveLength(1);
    expect(result.articles[0].image_url).toBeNull();
    expect(result.articles[0].title).toBe('Election Results Analysis');
  });

  it('should maintain count accuracy with mixed categories', async () => {
    // Create articles with different categories
    await db.insert(newsArticlesTable).values([
      { ...techArticle, title: 'Tech 1', view_count: 0 },
      { ...techArticle, title: 'Tech 2', view_count: 0 },
      { ...sportsArticle, title: 'Sports 1', view_count: 0 },
      { ...sportsArticle, title: 'Sports 2', view_count: 0 },
      { ...sportsArticle, title: 'Sports 3', view_count: 0 },
      { ...politicsArticle, view_count: 0 }
    ]).execute();

    // Check tech category
    const techResult = await getNewsByCategory('Teknologi', 10, 0);
    expect(techResult.articles).toHaveLength(2);
    expect(techResult.total).toBe(2);

    // Check sports category
    const sportsResult = await getNewsByCategory('Olahraga', 10, 0);
    expect(sportsResult.articles).toHaveLength(3);
    expect(sportsResult.total).toBe(3);

    // Check politics category
    const politicsResult = await getNewsByCategory('Politik', 10, 0);
    expect(politicsResult.articles).toHaveLength(1);
    expect(politicsResult.total).toBe(1);
  });
});