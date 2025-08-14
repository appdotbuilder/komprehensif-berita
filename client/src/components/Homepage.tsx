import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Calendar, User } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { NewsArticle, NewsCategory } from '../../../server/src/schema';

interface HomepageProps {
  onNavigateToArticle: (articleId: number) => void;
  onNavigateToCategory: (category: NewsCategory) => void;
}

const categoryColors = {
  'Olahraga': 'bg-green-100 text-green-800 border-green-200',
  'Politik': 'bg-red-100 text-red-800 border-red-200',
  'Teknologi': 'bg-blue-100 text-blue-800 border-blue-200',
  'Hiburan': 'bg-purple-100 text-purple-800 border-purple-200',
};

const categoryEmojis = {
  'Olahraga': '⚽',
  'Politik': '🏛️',
  'Teknologi': '💻',
  'Hiburan': '🎬',
};

export function Homepage({ onNavigateToArticle, onNavigateToCategory }: HomepageProps) {
  const [featuredNews, setFeaturedNews] = useState<NewsArticle[]>([]);
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([]);
  const [popularNews, setPopularNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const [featured, latest, popular] = await Promise.all([
        trpc.getFeaturedNews.query({ limit: 3 }),
        trpc.getLatestNews.query({ limit: 8 }),
        trpc.getPopularNews.query({ limit: 6 })
      ]);

      setFeaturedNews(featured.articles);
      setLatestNews(latest.articles);
      setPopularNews(popular.articles);
    } catch (error) {
      console.error('Failed to load homepage content:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const ArticleCard = ({ article, featured = false }: { article: NewsArticle; featured?: boolean }) => (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-shadow ${featured ? 'h-full' : ''}`}
      onClick={() => onNavigateToArticle(article.id)}
    >
      {article.image_url && (
        <div className={`relative ${featured ? 'h-64' : 'h-48'} overflow-hidden rounded-t-lg`}>
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-4 left-4">
            <Badge 
              className={`${categoryColors[article.category]} font-medium`}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onNavigateToCategory(article.category);
              }}
            >
              <span className="mr-1">{categoryEmojis[article.category]}</span>
              {article.category}
            </Badge>
          </div>
        </div>
      )}
      
      <CardContent className="p-4">
        <h3 className={`font-bold text-gray-900 mb-2 line-clamp-2 ${featured ? 'text-xl' : 'text-lg'}`}>
          {article.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {article.excerpt}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>{article.view_count}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(article.created_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SkeletonCard = ({ featured = false }: { featured?: boolean }) => (
    <Card className={featured ? 'h-full' : ''}>
      <div className={`${featured ? 'h-64' : 'h-48'} bg-gray-200 rounded-t-lg`}>
        <Skeleton className="w-full h-full rounded-t-lg" />
      </div>
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-3" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Featured News Skeleton */}
        <div className="mb-12">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} featured />
            ))}
          </div>
        </div>

        {/* Latest & Popular News Skeleton */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🌟 Selamat Datang di BeritaKu
        </h1>
        <p className="text-xl text-gray-600">
          Portal berita terpercaya untuk informasi terkini dari berbagai kategori
        </p>
      </div>

      {/* Featured News */}
      {featuredNews.length > 0 && (
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">⭐</span>
            Berita Pilihan
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredNews.map((article: NewsArticle) => (
              <ArticleCard key={article.id} article={article} featured />
            ))}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Latest News */}
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">🔥</span>
            Berita Terbaru
          </h2>
          {latestNews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">📰 Belum ada berita terbaru</p>
              <p className="text-sm mt-2">Silakan kembali lagi nanti</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {latestNews.map((article: NewsArticle) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>

        {/* Popular News Sidebar */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📈</span>
            Populer
          </h2>
          {popularNews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>📊 Belum ada berita populer</p>
            </div>
          ) : (
            <div className="space-y-6">
              {popularNews.map((article: NewsArticle) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Navigation */}
      <section className="mt-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          🗂️ Jelajahi Kategori
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          {Object.entries(categoryEmojis).map(([category, emoji]) => (
            <Card 
              key={category}
              className="cursor-pointer hover:shadow-lg transition-shadow hover:bg-blue-50"
              onClick={() => onNavigateToCategory(category as NewsCategory)}
            >
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-3">{emoji}</div>
                <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}