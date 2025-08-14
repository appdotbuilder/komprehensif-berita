import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit3, Trash2, Eye, Calendar, User, Star, Upload } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { NewsArticle, CreateNewsArticleInput, UpdateNewsArticleInput, NewsCategory } from '../../../server/src/schema';

const categoryOptions = [
  { value: 'Olahraga' as NewsCategory, label: 'Olahraga', emoji: '⚽' },
  { value: 'Politik' as NewsCategory, label: 'Politik', emoji: '🏛️' },
  { value: 'Teknologi' as NewsCategory, label: 'Teknologi', emoji: '💻' },
  { value: 'Hiburan' as NewsCategory, label: 'Hiburan', emoji: '🎬' },
];

const categoryColors = {
  'Olahraga': 'bg-green-100 text-green-800 border-green-200',
  'Politik': 'bg-red-100 text-red-800 border-red-200',
  'Teknologi': 'bg-blue-100 text-blue-800 border-blue-200',
  'Hiburan': 'bg-purple-100 text-purple-800 border-purple-200',
};

interface ArticleFormData extends Omit<CreateNewsArticleInput, 'category'> {
  category: NewsCategory | '';
}

export function AdminPanel() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>('list');

  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    image_url: null,
    author: '',
    is_featured: false
  });

  const loadArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getNewsArticles.query({
        limit: 100,
        offset: 0
      });
      setArticles(result.articles);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      image_url: null,
      author: '',
      is_featured: false
    });
    setEditingArticle(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) return;

    try {
      setIsSubmitting(true);
      const createData: CreateNewsArticleInput = {
        ...formData,
        category: formData.category as NewsCategory,
        image_url: formData.image_url || null
      };
      
      const newArticle = await trpc.createNewsArticle.mutate(createData);
      setArticles((prev: NewsArticle[]) => [newArticle, ...prev]);
      resetForm();
      setActiveTab('list');
    } catch (error) {
      console.error('Failed to create article:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle || !formData.category) return;

    try {
      setIsSubmitting(true);
      const updateData: UpdateNewsArticleInput = {
        id: editingArticle.id,
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        category: formData.category as NewsCategory,
        image_url: formData.image_url || null,
        author: formData.author,
        is_featured: formData.is_featured
      };
      
      const updatedArticle = await trpc.updateNewsArticle.mutate(updateData);
      if (updatedArticle) {
        setArticles((prev: NewsArticle[]) => 
          prev.map((article: NewsArticle) => 
            article.id === updatedArticle.id ? updatedArticle : article
          )
        );
      }
      resetForm();
      setActiveTab('list');
    } catch (error) {
      console.error('Failed to update article:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      category: article.category,
      image_url: article.image_url,
      author: article.author,
      is_featured: article.is_featured
    });
    setActiveTab('edit');
  };

  const handleDelete = async (articleId: number) => {
    try {
      await trpc.deleteNewsArticle.mutate({ id: articleId });
      setArticles((prev: NewsArticle[]) => 
        prev.filter((article: NewsArticle) => article.id !== articleId)
      );
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const ArticleForm = ({ onSubmit, submitText }: { onSubmit: (e: React.FormEvent) => void; submitText: string }) => (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Judul Artikel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: ArticleFormData) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Masukkan judul artikel"
              required
            />
          </div>

          <div>
            <Label htmlFor="author">Penulis *</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: ArticleFormData) => ({ ...prev, author: e.target.value }))
              }
              placeholder="Nama penulis"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Kategori *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value: NewsCategory) => 
                setFormData((prev: ArticleFormData) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="mr-2">{option.emoji}</span>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="image_url">URL Gambar</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: ArticleFormData) => ({ 
                  ...prev, 
                  image_url: e.target.value || null 
                }))
              }
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Opsional: URL gambar untuk artikel
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              checked={formData.is_featured}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev: ArticleFormData) => ({ ...prev, is_featured: checked }))
              }
            />
            <Label htmlFor="featured" className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>Artikel Pilihan</span>
            </Label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="excerpt">Ringkasan *</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: ArticleFormData) => ({ ...prev, excerpt: e.target.value }))
              }
              placeholder="Ringkasan singkat artikel"
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="content">Konten Artikel *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: ArticleFormData) => ({ ...prev, content: e.target.value }))
              }
              placeholder="Tulis konten artikel lengkap di sini"
              rows={12}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? 'Menyimpan...' : submitText}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            resetForm();
            setActiveTab('list');
          }}
        >
          Batal
        </Button>
      </div>
    </form>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
          <span className="mr-3">⚙️</span>
          Panel Admin
        </h1>
        <p className="text-xl text-gray-600">
          Kelola artikel berita dengan mudah
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="list" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Daftar Artikel ({articles.length})</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Buat Artikel</span>
          </TabsTrigger>
          <TabsTrigger value="edit" className="flex items-center space-x-2" disabled={!editingArticle}>
            <Edit3 className="w-4 h-4" />
            <span>Edit Artikel</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }, (_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <div className="flex space-x-4">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-8xl mb-4">📝</div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">
                  Belum Ada Artikel
                </h3>
                <p className="text-gray-500 mb-6">
                  Mulai membuat artikel pertama Anda
                </p>
                <Button 
                  onClick={() => setActiveTab('create')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Artikel Baru
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {articles.map((article: NewsArticle) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge className={`${categoryColors[article.category]} text-xs`}>
                            {article.category}
                          </Badge>
                          {article.is_featured && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {article.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {article.excerpt}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{article.author}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{article.view_count} views</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(article.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(article)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Artikel</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus artikel "{article.title}"? 
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(article.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Buat Artikel Baru</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ArticleForm 
                onSubmit={handleCreateSubmit}
                submitText="Publikasikan Artikel"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          {editingArticle && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Edit3 className="w-5 h-5" />
                  <span>Edit Artikel: {editingArticle.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ArticleForm 
                  onSubmit={handleEditSubmit}
                  submitText="Simpan Perubahan"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}