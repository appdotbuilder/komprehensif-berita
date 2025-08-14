import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Calendar, User, ArrowLeft, ArrowRight } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { NewsArticle, NewsCategory } from '../../../server/src/schema';

interface CategoryPageProps {
  category: NewsCategory;
  onNavigateToArticle: (articleId: number) => void;
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

const ITEMS_PER_PAGE = 9;

export function CategoryPage({ category, onNavigateToArticle }: CategoryPageProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalArticles, setTotalArticles] = useState(0);

  const loadArticles = useCallback(async (page = 0) => {
    try {
      setIsLoading(true);
      const offset = page * ITEMS_PER_PAGE;
      
      const result = await trpc.getNewsByCategory.query({
        category,
        limit: ITEMS_PER_PAGE,
        offset
      });
      
      setArticles(result.articles);
      setHasMore(result.articles.length === ITEMS_PER_PAGE);
      
      // Get total count for display purposes
      if (page === 0) {
        setTotalArticles(result.total);
      }
    } catch (error) {
      console.error('Failed to load category articles:', error);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    setCurrentPage(0);
    loadArticles(0);
  }, [loadArticles]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadArticles(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    window.history.back();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const ArticleCard = ({ article }: { article: NewsArticle }) => (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow group"
      onClick={() => onNavigateToArticle(article.id)}
    >
      {article.image_url && (
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {article.is_featured && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                ⭐
              </Badge>
            </div>
          )}
        </div>
      )}
      
      <CardContent className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
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

  const SkeletonCard = () => (
    <Card>
      <div className="h-48 bg-gray-200 rounded-t-lg">
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button 
          onClick={goBack}
          variant="ghost" 
          className="mb-4 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>

        <div className="flex items-center space-x-4 mb-4">
          <div className="text-6xl">{categoryEmojis[category]}</div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Berita {category}
            </h1>
            <Badge className={`${categoryColors[category]} mt-2`}>
              {totalArticles} artikel tersedia
            </Badge>
          </div>
        </div>

        <p className="text-xl text-gray-600">
          Kumpulan berita terkini dan terpercaya kategori {category}
        </p>
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: ITEMS_PER_PAGE }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-8xl mb-4">{categoryEmojis[category]}</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            Belum Ada Berita {category}
          </h2>
          <p className="text-gray-500 mb-6">
            Belum ada artikel yang tersedia untuk kategori ini.
          </p>
          <Button onClick={goBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {articles.map((article: NewsArticle) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sebelumnya
            </Button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Halaman {currentPage + 1}
              </span>
              {totalArticles > 0 && (
                <span className="text-sm text-gray-500">
                  dari {Math.ceil(totalArticles / ITEMS_PER_PAGE)}
                </span>
              )}
            </div>

            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasMore}
              variant="outline"
            >
              Selanjutnya
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Articles Count Info */}
          <div className="text-center mt-6 text-sm text-gray-500">
            {articles.length > 0 && (
              <p>
                Menampilkan {currentPage * ITEMS_PER_PAGE + 1} - {currentPage * ITEMS_PER_PAGE + articles.length} dari {totalArticles} artikel
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}