import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Menu, X, Settings } from 'lucide-react';
import type { NewsCategory } from '../../../server/src/schema';

interface HeaderProps {
  onNavigateToHome: () => void;
  onNavigateToCategory: (category: NewsCategory) => void;
  onNavigateToAdmin: () => void;
  onSearch: (query: string) => void;
  currentView: string;
}

const categories: { value: NewsCategory; label: string; emoji: string }[] = [
  { value: 'Olahraga', label: 'Olahraga', emoji: '⚽' },
  { value: 'Politik', label: 'Politik', emoji: '🏛️' },
  { value: 'Teknologi', label: 'Teknologi', emoji: '💻' },
  { value: 'Hiburan', label: 'Hiburan', emoji: '🎬' },
];

export function Header({ onNavigateToHome, onNavigateToCategory, onNavigateToAdmin, onSearch, currentView }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  const handleCategoryClick = (category: NewsCategory) => {
    onNavigateToCategory(category);
    setIsMobileMenuOpen(false);
  };

  const handleHomeClick = () => {
    onNavigateToHome();
    setIsMobileMenuOpen(false);
  };

  const handleAdminClick = () => {
    onNavigateToAdmin();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleHomeClick}
              className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              📰 BeritaKu
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <button
              onClick={handleHomeClick}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'homepage'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
              }`}
            >
              Beranda
            </button>
            
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => handleCategoryClick(category.value)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'category'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">{category.emoji}</span>
                {category.label}
              </button>
            ))}
          </nav>

          {/* Search and Admin */}
          <div className="hidden md:flex items-center space-x-4">
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Cari berita..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </form>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdminClick}
              className={currentView === 'admin' ? 'bg-blue-100 text-blue-700' : ''}
            >
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={handleHomeClick}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  currentView === 'homepage'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                🏠 Beranda
              </button>
              
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => handleCategoryClick(category.value)}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                >
                  <span className="mr-2">{category.emoji}</span>
                  {category.label}
                </button>
              ))}
              
              <button
                onClick={handleAdminClick}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  currentView === 'admin'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-4 h-4 mr-2 inline" />
                Admin Panel
              </button>
              
              <form onSubmit={handleSearchSubmit} className="px-3 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Cari berita..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}