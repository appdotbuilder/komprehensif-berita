import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, User, ArrowLeft } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { NewsArticle, NewsCategory } from '../../../server/src/schema';

interface ArticlePageProps {
  articleId: number;
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

export function ArticlePage({ articleId, onNavigateToCategory }: ArticlePageProps) {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArticle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Increment view count and fetch article simultaneously
      const [articleData] = await Promise.all([
        trpc.getNewsArticle.query({ id: articleId }),
        trpc.incrementViewCount.mutate({ id: articleId })
      ]);
      
      setArticle(articleData);
    } catch (err) {
      console.error('Failed to load article:', err);
      setError('Gagal memuat artikel. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const goBack = () => {
    window.history.back();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-24 mb-6" />
          
          <div className="mb-6">
            <Skeleton className="h-10 w-3/4 mb-4" />
            <div className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          
          <Skeleton className="w-full h-96 mb-6 rounded-lg" />
          
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <div className="text-6xl mb-4">😞</div>
            <h1 className="text-2xl font-bold text-red-800 mb-2">Artikel Tidak Ditemukan</h1>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={goBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button 
          onClick={goBack}
          variant="ghost" 
          className="mb-6 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>

        <article className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Article Header */}
          <div className="p-6 pb-4">
            <div className="mb-4">
              <Badge 
                className={`${categoryColors[article.category]} font-medium cursor-pointer hover:opacity-80`}
                onClick={() => onNavigateToCategory(article.category)}
              >
                <span className="mr-1">{categoryEmojis[article.category]}</span>
                {article.category}
              </Badge>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span className="font-medium">{article.author}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(article.created_at)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{article.view_count} views</span>
              </div>
              {article.is_featured && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  ⭐ Featured
                </Badge>
              )}
            </div>

            <div className="text-lg text-gray-700 font-medium mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              {article.excerpt}
            </div>
          </div>

          {/* Article Image */}
          {article.image_url && (
            <div className="px-6 mb-6">
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-auto max-h-96 object-cover"
                />
              </div>
            </div>
          )}

          {/* Article Content */}
          <div className="px-6 pb-6">
            <div className="prose max-w-none">
              <div 
                className="text-gray-800 leading-relaxed text-lg"
                style={{ whiteSpace: 'pre-line' }}
              >
                {article.content}
              </div>
            </div>
          </div>

          {/* Article Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm text-gray-600">
                Artikel ini telah dibaca <strong>{article.view_count}</strong> kali
              </div>
              <div className="text-sm text-gray-500">
                Terakhir diperbarui: {formatDate(article.updated_at)}
              </div>
            </div>
          </div>
        </article>

        {/* Related Category Call-to-Action */}
        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Tertarik dengan berita {article.category}?
              </h3>
              <p className="text-gray-600 mb-4">
                Jelajahi lebih banyak artikel menarik dari kategori {article.category}
              </p>
              <Button 
                onClick={() => onNavigateToCategory(article.category)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <span className="mr-2">{categoryEmojis[article.category]}</span>
                Lihat Semua Berita {article.category}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}