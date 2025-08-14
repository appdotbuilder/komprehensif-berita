import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createNewsArticleInputSchema,
  updateNewsArticleInputSchema,
  getNewsArticlesInputSchema,
  getNewsArticleInputSchema,
  deleteNewsArticleInputSchema,
  incrementViewCountInputSchema,
  newsCategorySchema
} from './schema';

// Import handlers
import { createNewsArticle } from './handlers/create_news_article';
import { getNewsArticles } from './handlers/get_news_articles';
import { getNewsArticle } from './handlers/get_news_article';
import { updateNewsArticle } from './handlers/update_news_article';
import { deleteNewsArticle } from './handlers/delete_news_article';
import { getLatestNews } from './handlers/get_latest_news';
import { getPopularNews } from './handlers/get_popular_news';
import { getFeaturedNews } from './handlers/get_featured_news';
import { incrementViewCount } from './handlers/increment_view_count';
import { getNewsByCategory } from './handlers/get_news_by_category';
import { z } from 'zod';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // News article CRUD operations (Admin panel)
  createNewsArticle: publicProcedure
    .input(createNewsArticleInputSchema)
    .mutation(({ input }) => createNewsArticle(input)),

  updateNewsArticle: publicProcedure
    .input(updateNewsArticleInputSchema)
    .mutation(({ input }) => updateNewsArticle(input)),

  deleteNewsArticle: publicProcedure
    .input(deleteNewsArticleInputSchema)
    .mutation(({ input }) => deleteNewsArticle(input)),

  // News article retrieval operations (Public)
  getNewsArticles: publicProcedure
    .input(getNewsArticlesInputSchema)
    .query(({ input }) => getNewsArticles(input)),

  getNewsArticle: publicProcedure
    .input(getNewsArticleInputSchema)
    .query(({ input }) => getNewsArticle(input)),

  // Homepage content endpoints
  getLatestNews: publicProcedure
    .input(z.object({ limit: z.number().int().positive().max(50).default(10) }).default({ limit: 10 }))
    .query(({ input }) => getLatestNews(input.limit)),

  getPopularNews: publicProcedure
    .input(z.object({ limit: z.number().int().positive().max(50).default(10) }).default({ limit: 10 }))
    .query(({ input }) => getPopularNews(input.limit)),

  getFeaturedNews: publicProcedure
    .input(z.object({ limit: z.number().int().positive().max(20).default(5) }).default({ limit: 5 }))
    .query(({ input }) => getFeaturedNews(input.limit)),

  // Category-based news retrieval
  getNewsByCategory: publicProcedure
    .input(z.object({
      category: newsCategorySchema,
      limit: z.number().int().positive().max(50).default(10),
      offset: z.number().int().nonnegative().default(0)
    }))
    .query(({ input }) => getNewsByCategory(input.category, input.limit, input.offset)),

  // Article interaction
  incrementViewCount: publicProcedure
    .input(incrementViewCountInputSchema)
    .mutation(({ input }) => incrementViewCount(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC News API server listening at port: ${port}`);
}

start();