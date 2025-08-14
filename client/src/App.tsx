import { useState } from 'react';
import { Header } from '@/components/Header';
import { Homepage } from '@/components/Homepage';
import { CategoryPage } from '@/components/CategoryPage';
import { ArticlePage } from '@/components/ArticlePage';
import { AdminPanel } from '@/components/AdminPanel';
import { SearchResults } from '@/components/SearchResults';
import type { NewsCategory } from '../../server/src/schema';

type View = 'homepage' | 'category' | 'article' | 'admin' | 'search';

interface AppState {
  view: View;
  selectedCategory?: NewsCategory;
  selectedArticleId?: number;
  searchQuery?: string;
}

function App() {
  const [appState, setAppState] = useState<AppState>({ view: 'homepage' });

  const navigateToHome = () => {
    setAppState({ view: 'homepage' });
  };

  const navigateToCategory = (category: NewsCategory) => {
    setAppState({ view: 'category', selectedCategory: category });
  };

  const navigateToArticle = (articleId: number) => {
    setAppState({ view: 'article', selectedArticleId: articleId });
  };

  const navigateToAdmin = () => {
    setAppState({ view: 'admin' });
  };

  const navigateToSearch = (query: string) => {
    setAppState({ view: 'search', searchQuery: query });
  };

  const renderContent = () => {
    switch (appState.view) {
      case 'homepage':
        return (
          <Homepage 
            onNavigateToArticle={navigateToArticle}
            onNavigateToCategory={navigateToCategory}
          />
        );
      case 'category':
        return appState.selectedCategory ? (
          <CategoryPage 
            category={appState.selectedCategory}
            onNavigateToArticle={navigateToArticle}
          />
        ) : null;
      case 'article':
        return appState.selectedArticleId ? (
          <ArticlePage 
            articleId={appState.selectedArticleId}
            onNavigateToCategory={navigateToCategory}
          />
        ) : null;
      case 'admin':
        return <AdminPanel />;
      case 'search':
        return appState.searchQuery ? (
          <SearchResults 
            query={appState.searchQuery}
            onNavigateToArticle={navigateToArticle}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onNavigateToHome={navigateToHome}
        onNavigateToCategory={navigateToCategory}
        onNavigateToAdmin={navigateToAdmin}
        onSearch={navigateToSearch}
        currentView={appState.view}
      />
      <main className="pt-16">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;