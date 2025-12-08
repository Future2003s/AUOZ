"use client";
import React, { useState } from "react";
import { ChevronRight, TrendingUp, Bookmark } from "lucide-react";
import Link from "next/link";
import { ArticleCard } from "./components/ArticleCard";
import { FeaturedArticle } from "./components/FeaturedArticle";
import { NewsArticle } from "@/types/news";
import { useAuth } from "@/hooks/useAuth";

interface NewsClientProps {
  articles: NewsArticle[];
  locale: string;
}

export default function NewsClient({ articles, locale }: NewsClientProps) {
  const { isAuthenticated } = useAuth();
  const [currentCategory, setCurrentCategory] = useState('all');

  // Tự động lấy categories từ articles thực tế
  const categories = React.useMemo(() => {
    const categorySet = new Set<string>();
    articles.forEach(article => {
      if (article.category && article.category.trim()) {
        categorySet.add(article.category.trim());
      }
    });
    
    // Sắp xếp categories và tạo array với "Tất cả" ở đầu
    const categoryArray = Array.from(categorySet).sort();
    return [
      { id: 'all', name: 'Tất cả' },
      ...categoryArray.map(cat => ({
        id: cat.toLowerCase().replace(/\s+/g, '-'),
        name: cat
      }))
    ];
  }, [articles]);

  // Filter logic - so sánh với category name thực tế từ article
  const displayedNews = React.useMemo(() => {
    if (currentCategory === 'all') {
      return articles;
    }
    // Tìm category name từ id
    const selectedCategory = categories.find(c => c.id === currentCategory);
    if (!selectedCategory) return articles;
    
    // So sánh với category name thực tế (case-insensitive và trim)
    return articles.filter(n => {
      const articleCategory = n.category?.trim() || '';
      return articleCategory.toLowerCase() === selectedCategory.name.toLowerCase();
    });
  }, [articles, currentCategory, categories]);

  const featuredNews = displayedNews.length > 0 
    ? (displayedNews.find(n => n.isFeatured) || displayedNews[0])
    : null;
  const otherNews = featuredNews 
    ? displayedNews.filter(n => n._id !== featuredNews._id)
    : displayedNews;

  const handleSetCategory = (id: string) => {
    setCurrentCategory(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen mt-25 bg-white font-sans text-gray-900 selection:bg-red-100 selection:text-red-900">
      <main>
        <div className="container mx-auto px-4 py-8 animate-fade-in">
          
          {/* Category Navigation */}
          <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4">
            {categories.length > 1 && (
              <>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleSetCategory(category.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentCategory === category.id
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </>
            )}
            {isAuthenticated && (
              <Link
                href={`/${locale}/news/saved`}
                className="ml-auto px-4 py-2 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                <Bookmark size={18} />
                Bài viết đã lưu
              </Link>
            )}
          </div>

          {/* Hero Section - Featured Article */}
          {currentCategory === 'all' && featuredNews && articles.length > 0 && (
            <div className="mb-12">
              <FeaturedArticle article={featuredNews} locale={locale} />
            </div>
          )}
          
          {/* Empty State */}
          {articles.length === 0 && (
            <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-xl">
              <p className="text-lg font-medium mb-2">Chưa có bài viết nào</p>
              <p className="text-sm">Vui lòng quay lại sau.</p>
            </div>
          )}

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Content (Latest News) */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                  {currentCategory === 'all' 
                    ? 'Tin tức LALA-LYCHEEE' 
                    : categories.find(c => c.id === currentCategory)?.name || 'Tin tức'}
                </h2>
                <Link 
                  href={`/${locale}/news`}
                  className="text-red-600 text-sm font-medium hover:underline flex items-center"
                >
                  Xem tất cả <ChevronRight size={16}/>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otherNews.map((news) => (
                  <ArticleCard key={news._id} article={news} locale={locale} />
                ))}
              </div>
              
              {otherNews.length === 0 && (
                <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-xl">
                  Không có bài viết nào trong chuyên mục này.
                </div>
              )}

              {/* Pagination Mock */}
              {otherNews.length > 0 && (
                <div className="mt-12 flex justify-center space-x-2">
                  <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                    Trước
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg">1</button>
                  <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">2</button>
                  <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">3</button>
                  <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                    Sau
                  </button>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1 space-y-10">
              
              {/* Trending Widget */}
              <div>
                <h3 className="font-bold text-xl mb-5 flex items-center">
                  <TrendingUp className="mr-2 text-red-600" size={24}/>
                  Tin nổi bật
                </h3>
                <div className="flex flex-col space-y-4">
                  {articles.slice(0, 4).map((news, idx) => (
                    <Link
                      key={news._id}
                      href={`/${locale}/news/${news.slug}`}
                      className="flex items-start group cursor-pointer"
                    >
                      <span className="text-3xl font-black text-gray-200 mr-4 -mt-2 group-hover:text-red-100 transition-colors">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-gray-800 leading-tight group-hover:text-red-600 transition-colors line-clamp-2 mb-1">
                          {news.title}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {news.category || 'Tin tức'} • {typeof news.views === 'number' ? news.views.toLocaleString() : news.views || 0} xem
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Ads Banner Mock */}
              <div className="bg-gray-100 h-64 rounded-xl flex flex-col items-center justify-center text-gray-400 p-4 text-center border border-gray-200">
                <span className="text-xs uppercase tracking-widest mb-2">Quảng cáo</span>
                <span className="font-medium">Không gian dành cho nhà tài trợ</span>
              </div>

              {/* Tags Cloud */}
              <div>
                <h3 className="font-bold text-lg mb-4">Từ khóa hot</h3>
                <div className="flex flex-wrap gap-2">
                  {['Vải thiều Vĩnh Lập', 'Thanh Hà', 'Nông sản sạch', 'Xuất khẩu', 'Bảo quản lạnh', 'Chất lượng cao'].map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-full text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer transition-all"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
