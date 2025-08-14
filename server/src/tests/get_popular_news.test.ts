import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsArticlesTable } from '../db/schema';
import { type CreateNewsArticleInput } from '../schema';
import { getPopularNews } from '../handlers/get_popular_news';

// Test article data with different view counts
const testArticle1: CreateNewsArticleInput = {
  title: 'Most Popular Article',
  content: 'Content of the most popular article with highest views',
  excerpt: 'Excerpt of the most popular article',
  category: 'Politik',
  image_url: 'https://example.com/image1.jpg',
  author: 'John Doe',
  is_featured: true
};

const testArticle2: CreateNewsArticleInput = {
  title: 'Second Popular Article',
  content: 'Content of the second most popular article',
  excerpt: 'Excerpt of the second popular article',
  category: 'Teknologi',
  image_url: null,
  author: 'Jane Smith',
  is_featured: false
};

const testArticle3: CreateNewsArticleInput = {
  title: 'Least Popular Article',
  content: 'Content of the least popular article',
  excerpt: 'Excerpt of the least popular article',
  category: 'Olahraga',
  image_url: 'https://example.com/image3.jpg',
  author: 'Bob Wilson',
  is_featured: false
};

describe('getPopularNews', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty result when no articles exist', async () => {
    const result = await getPopularNews(10);
    
    expect(result.articles).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should return articles ordered by view count descending', async () => {
    // Insert articles with different view counts
    const article1 = await db.insert(newsArticlesTable)
      .values({ ...testArticle1, view_count: 1000 })
      .returning()
      .execute();
    
    const article2 = await db.insert(newsArticlesTable)
      .values({ ...testArticle2, view_count: 500 })
      .returning()
      .execute();
    
    const article3 = await db.insert(newsArticlesTable)
      .values({ ...testArticle3, view_count: 100 })
      .returning()
      .execute();

    const result = await getPopularNews(10);

    expect(result.articles).toHaveLength(3);
    expect(result.total).toBe(3);
    
    // Verify articles are ordered by view count descending
    expect(result.articles[0].id).toBe(article1[0].id);
    expect(result.articles[0].title).toBe('Most Popular Article');
    expect(result.articles[0].view_count).toBe(1000);
    
    expect(result.articles[1].id).toBe(article2[0].id);
    expect(result.articles[1].title).toBe('Second Popular Article');
    expect(result.articles[1].view_count).toBe(500);
    
    expect(result.articles[2].id).toBe(article3[0].id);
    expect(result.articles[2].title).toBe('Least Popular Article');
    expect(result.articles[2].view_count).toBe(100);
  });

  it('should respect the limit parameter', async () => {
    // Insert multiple articles
    await db.insert(newsArticlesTable)
      .values([
        { ...testArticle1, view_count: 1000 },
        { ...testArticle2, view_count: 800 },
        { ...testArticle3, view_count: 600 }
      ])
      .execute();

    const result = await getPopularNews(2);

    expect(result.articles).toHaveLength(2);
    expect(result.total).toBe(3); // Total should still be 3
    
    // Should return the 2 most popular articles
    expect(result.articles[0].view_count).toBe(1000);
    expect(result.articles[1].view_count).toBe(800);
  });

  it('should use default limit when no limit specified', async () => {
    // Create 15 articles to test default limit of 10
    const articles = [];
    for (let i = 0; i < 15; i++) {
      articles.push({
        ...testArticle1,
        title: `Article ${i}`,
        view_count: 1000 - i * 10 // Decreasing view counts
      });
    }
    
    await db.insert(newsArticlesTable)
      .values(articles)
      .execute();

    const result = await getPopularNews(); // No limit specified

    expect(result.articles).toHaveLength(10); // Should use default limit of 10
    expect(result.total).toBe(15);
    
    // Verify ordering - first article should have highest view count
    expect(result.articles[0].view_count).toBe(1000);
    expect(result.articles[9].view_count).toBe(910);
  });

  it('should handle articles with same view counts consistently', async () => {
    // Insert articles with same view count
    await db.insert(newsArticlesTable)
      .values([
        { ...testArticle1, view_count: 500 },
        { ...testArticle2, view_count: 500 },
        { ...testArticle3, view_count: 500 }
      ])
      .execute();

    const result = await getPopularNews(10);

    expect(result.articles).toHaveLength(3);
    expect(result.total).toBe(3);
    
    // All articles should have the same view count
    result.articles.forEach(article => {
      expect(article.view_count).toBe(500);
    });
  });

  it('should return all article fields correctly', async () => {
    await db.insert(newsArticlesTable)
      .values({ ...testArticle1, view_count: 1000 })
      .returning()
      .execute();

    const result = await getPopularNews(10);

    expect(result.articles).toHaveLength(1);
    const article = result.articles[0];
    
    // Verify all fields are present and correct
    expect(article.title).toBe('Most Popular Article');
    expect(article.content).toBe('Content of the most popular article with highest views');
    expect(article.excerpt).toBe('Excerpt of the most popular article');
    expect(article.category).toBe('Politik');
    expect(article.image_url).toBe('https://example.com/image1.jpg');
    expect(article.author).toBe('John Doe');
    expect(article.is_featured).toBe(true);
    expect(article.view_count).toBe(1000);
    expect(article.id).toBeDefined();
    expect(article.created_at).toBeInstanceOf(Date);
    expect(article.updated_at).toBeInstanceOf(Date);
  });
});