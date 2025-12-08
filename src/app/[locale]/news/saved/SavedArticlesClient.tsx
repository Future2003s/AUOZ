"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Trash2, ArrowLeft, FileText, LogIn } from "lucide-react";
import Link from "next/link";
import { ArticleCard } from "../components/ArticleCard";
import { NewsArticle } from "@/types/news";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface SavedArticleData {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  category?: string;
  authorName?: string;
  publishedAt?: string;
  locale?: string;
  savedAt: string;
}

interface SavedArticlesClientProps {
  locale: string;
}

export default function SavedArticlesClient({ locale }: SavedArticlesClientProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [savedArticles, setSavedArticles] = useState<SavedArticleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    if (typeof window !== "undefined") {
      loadSavedArticles();
    }
  }, [isAuthenticated, authLoading, user]);

  const loadSavedArticles = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("savedArticles") || "[]"
      );
      
      // Normalize data: convert old format (array of IDs) to new format
      const normalized = saved.map((item: any) => {
        if (typeof item === "string") {
          return {
            id: item,
            title: "",
            slug: "",
            savedAt: new Date().toISOString(),
          };
        }
        return item;
      });

      // Filter chỉ lấy articles có đầy đủ thông tin (format mới)
      const validArticles = normalized.filter(
        (item: SavedArticleData) => item.title && item.slug
      );

      // Sắp xếp theo thời gian lưu (mới nhất trước)
      validArticles.sort((a: SavedArticleData, b: SavedArticleData) => {
        const dateA = new Date(a.savedAt).getTime();
        const dateB = new Date(b.savedAt).getTime();
        return dateB - dateA;
      });

      setSavedArticles(validArticles);
    } catch (error) {
      console.error("Error loading saved articles:", error);
      toast.error("Không thể tải danh sách bài viết đã lưu");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (articleId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này khỏi danh sách đã lưu?")) {
      return;
    }

    try {
      const saved = JSON.parse(
        localStorage.getItem("savedArticles") || "[]"
      );

      const updated = saved.filter((item: any) => {
        if (typeof item === "string") {
          return item !== articleId;
        }
        return item.id !== articleId;
      });

      localStorage.setItem("savedArticles", JSON.stringify(updated));
      loadSavedArticles();
      toast.success("Đã xóa bài viết khỏi danh sách đã lưu");
    } catch (error) {
      console.error("Error removing saved article:", error);
      toast.error("Không thể xóa bài viết");
    }
  };

  const handleClearAll = () => {
    if (!confirm("Bạn có chắc chắn muốn xóa tất cả bài viết đã lưu?")) {
      return;
    }

    try {
      localStorage.setItem("savedArticles", JSON.stringify([]));
      setSavedArticles([]);
      toast.success("Đã xóa tất cả bài viết đã lưu");
    } catch (error) {
      console.error("Error clearing saved articles:", error);
      toast.error("Không thể xóa tất cả bài viết");
    }
  };

  // Convert SavedArticleData to NewsArticle format for ArticleCard
  const convertToNewsArticle = (saved: SavedArticleData): NewsArticle => {
    return {
      _id: saved._id || saved.id,
      id: saved.id,
      title: saved.title,
      slug: saved.slug,
      excerpt: saved.excerpt || "",
      content: "",
      contentBlocks: [],
      coverImage: saved.coverImage,
      category: saved.category,
      authorName: saved.authorName,
      locale: saved.locale || locale,
      status: "published",
      isFeatured: false,
      publishedAt: saved.publishedAt,
    };
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen mt-25 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  // Hiển thị message yêu cầu đăng nhập nếu chưa authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen mt-25 bg-white">
        <div className="container mx-auto px-4 py-8">
          <Link
            href={`/${locale}/news`}
            className="inline-flex items-center mb-4 text-red-600 hover:text-red-700 font-semibold transition-colors group"
          >
            <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            <span>Quay lại danh sách tin tức</span>
          </Link>

          <div className="text-center py-20 bg-gray-50 rounded-xl">
            <LogIn className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Vui lòng đăng nhập
            </h2>
            <p className="text-gray-500 mb-6">
              Bạn cần đăng nhập để xem và quản lý các bài viết đã lưu
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href={`/${locale}/login`}
                className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogIn className="mr-2" size={18} />
                Đăng nhập
              </Link>
              <Link
                href={`/${locale}/news`}
                className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Quay lại tin tức
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-25 bg-white font-sans text-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${locale}/news`}
            className="inline-flex items-center mb-4 text-red-600 hover:text-red-700 font-semibold transition-colors group"
          >
            <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            <span>Quay lại danh sách tin tức</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center">
                <Bookmark className="mr-3 text-red-600" size={32} />
                Bài viết đã lưu
              </h1>
              <p className="text-gray-600">
                {savedArticles.length > 0
                  ? `Bạn đã lưu ${savedArticles.length} bài viết`
                  : "Chưa có bài viết nào được lưu"}
              </p>
            </div>
            
            {savedArticles.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Xóa tất cả
              </button>
            )}
          </div>
        </div>

        {/* Articles List */}
        {savedArticles.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl">
            <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Chưa có bài viết nào được lưu
            </h2>
            <p className="text-gray-500 mb-6">
              Khi bạn lưu bài viết, chúng sẽ xuất hiện ở đây
            </p>
            <Link
              href={`/${locale}/news`}
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Khám phá tin tức
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedArticles.map((saved) => {
              const article = convertToNewsArticle(saved);
              return (
                <div key={saved.id} className="relative group">
                  <ArticleCard article={article} locale={locale} />
                  <button
                    onClick={() => handleRemove(saved.id)}
                    className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Xóa khỏi danh sách đã lưu"
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                  <div className="absolute top-4 left-4 px-2 py-1 bg-red-600 text-white text-xs font-medium rounded">
                    Đã lưu
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

