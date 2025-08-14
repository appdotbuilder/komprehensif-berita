import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Calendar, User, ArrowLeft, Search } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { NewsArticle } from '../../../server/src/schema';

interface SearchResultsProps {
  query: string;
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

export function SearchResults({ query, onNavigateToArticle }: SearchResultsProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const searchArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Search in articles using the search parameter
      const results = await trpc.getNewsArticles.query({
        search: query,
        limit: 50,
        offset: 0
      });
      
      setArticles(results.articles);
    } catch (error) {
      console.error('Failed to search articles:', error);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    searchArticles();
  }, [searchArticles]);

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

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  };

  const ArticleCard = ({ article }: { article: NewsArticle }) => (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow group"
      onClick={() => onNavigateToArticle(article.id)}
    >
      <div className="md:flex">
        {article.image_url && (
          <div className="md:w-48 h-48 md:h-auto relative overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-t-none">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {article.is_featured && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  ⭐
                </Badge>
              </div>
            )}
          </div>
        )}
        
        <CardContent className="p-4 flex-1">
          <div className="flex items-start justify-between mb-2">
            <Badge className={`${categoryColors[article.category]} text-xs`}>
              <span className="mr-1">{categoryEmojis[article.category]}</span>
              {article.category}
            </Badge>
          </div>
          
          <h3 
            className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors"
            dangerouslySetInnerHTML={{ __html: highlightSearchTerm(article.title, query) }}
          />
          
          <p 
            className="text-gray-600 text-sm mb-3 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: highlightSearchTerm(article.excerpt, query) }}
          />
          
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
      </div>
    </Card>
  );

  const SkeletonCard = () => (
    <Card>
      <div className="md:flex">
        <div className="md:w-48 h-48 md:h-auto bg-gray-200 rounded-t-lg md:rounded-l-lg md:rounded-t-none">
          <Skeleton className="w-full h-full" />
        </div>
        <CardContent className="p-4 flex-1">
          <Skeleton className="h-5 w-20 mb-2" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3 mb-3" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </CardContent>
      </div>
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
          <div className="text-4xl">🔍</div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Hasil Pencarian
            </h1>
            <div className="flex items-center space-x-2 mt-2">
              <Search className="w-4 h-4 text-gray-500" />
              <span className="text-lg text-gray-600">
                "{query}"
              </span>
            </div>
          </div>
        </div>

        {!isLoading && (
          <Badge variant="outline" className="text-sm">
            {articles.length} hasil ditemukan
          </Badge>
        )}
      </div>

      {/* Search Results */}
      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-8xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            Tidak Ada Hasil
          </h2>
          <p className="text-gray-500 mb-2">
            Tidak ditemukan artikel yang sesuai dengan pencarian "{query}"
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Coba gunakan kata kunci yang berbeda atau periksa ejaan Anda
          </p>
          <Button onClick={goBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-6 mb-8">
            {articles.map((article: NewsArticle) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Results Summary */}
          <div className="text-center text-sm text-gray-500 border-t pt-6">
            <p>
              Menampilkan {articles.length} hasil untuk "{query}"
            </p>
          </div>
        </>
      )}
    </div>
  );
}