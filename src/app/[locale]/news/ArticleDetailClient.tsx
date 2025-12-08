"use client";
import React, { useState, useEffect } from "react";
import { Home, ChevronRight, User, Share2, Bookmark, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ArticleCard } from "./components/ArticleCard";
import { TableOfContents } from "./components/TableOfContents";
import { ContentRenderer } from "./components/ContentRenderer";
import { NewsArticle } from "@/types/news";
import { StructuredData } from "@/components/StructuredData";
import { envConfig } from "@/config";
import { toast } from "sonner";

interface ArticleDetailClientProps {
  article: NewsArticle;
  relatedArticles: NewsArticle[];
  locale: string;
}

export default function ArticleDetailClient({ 
  article, 
  relatedArticles,
  locale 
}: ArticleDetailClientProps) {
  const categoryName = article.category || "Tin tức";
  const baseUrl = envConfig.NEXT_PUBLIC_URL || "https://lala-lycheee.com";
  const articleUrl = `${baseUrl}/${locale}/news/${article.slug}`;
  
  // State để track xem article đã được lưu chưa
  const [isSaved, setIsSaved] = useState(false);
  
  // Kiểm tra xem article đã được lưu chưa khi component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedArticles = JSON.parse(
        localStorage.getItem("savedArticles") || "[]"
      );
      const articleId = article._id || article.id || article.slug;
      // Kiểm tra cả format cũ (array of IDs) và format mới (array of objects)
      const isArticleSaved = Array.isArray(savedArticles) && savedArticles.some(
        (item: any) => {
          if (typeof item === "string") {
            // Format cũ: array of IDs
            return item === articleId;
          } else if (typeof item === "object" && item.id) {
            // Format mới: array of objects
            return item.id === articleId;
          }
          return false;
        }
      );
      setIsSaved(isArticleSaved);
    }
  }, [article]);
  
  // Function để chia sẻ bài viết
  const handleShare = async () => {
    const shareData = {
      title: article.title,
      text: article.excerpt || article.title,
      url: articleUrl,
    };
    
    try {
      // Sử dụng Web Share API nếu có (mobile)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success("Đã chia sẻ bài viết!");
      } else {
        // Fallback: Copy link vào clipboard
        await navigator.clipboard.writeText(articleUrl);
        toast.success("Đã sao chép link bài viết!");
      }
    } catch (error: any) {
      // User cancelled share hoặc có lỗi
      if (error.name !== "AbortError") {
        // Fallback: Copy link vào clipboard
        try {
          await navigator.clipboard.writeText(articleUrl);
          toast.success("Đã sao chép link bài viết!");
        } catch (clipboardError) {
          toast.error("Không thể chia sẻ bài viết");
        }
      }
    }
  };
  
  // Function để lưu/bỏ lưu bài viết
  const handleBookmark = () => {
    if (typeof window === "undefined") return;
    
    const savedArticles = JSON.parse(
      localStorage.getItem("savedArticles") || "[]"
    );
    const articleId = article._id || article.id || article.slug;
    
    // Normalize savedArticles: convert old format (array of IDs) to new format (array of objects)
    const normalizedArticles = savedArticles.map((item: any) => {
      if (typeof item === "string") {
        // Old format: convert to new format
        return {
          id: item,
          title: "",
          slug: "",
          savedAt: new Date().toISOString(),
        };
      }
      return item;
    });
    
    if (isSaved) {
      // Bỏ lưu: Remove article from saved list
      const updated = normalizedArticles.filter(
        (item: any) => item.id !== articleId
      );
      localStorage.setItem("savedArticles", JSON.stringify(updated));
      setIsSaved(false);
      toast.success("Đã bỏ lưu bài viết");
    } else {
      // Lưu: Add article với đầy đủ thông tin
      const articleData = {
        id: articleId,
        _id: article._id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        coverImage: article.coverImage,
        category: article.category,
        authorName: article.authorName,
        publishedAt: article.publishedAt,
        locale: article.locale,
        savedAt: new Date().toISOString(), // Thời gian lưu
      };
      
      // Kiểm tra xem đã tồn tại chưa (tránh duplicate)
      const exists = normalizedArticles.some(
        (item: any) => item.id === articleId
      );
      
      if (!exists) {
        normalizedArticles.push(articleData);
        localStorage.setItem("savedArticles", JSON.stringify(normalizedArticles));
        setIsSaved(true);
        toast.success("Đã lưu bài viết");
      } else {
        toast.info("Bài viết đã được lưu trước đó");
      }
    }
  };
  
  const articleStructuredData = {
    headline: article.title,
    description: article.excerpt || article.title,
    image: article.coverImage || `${baseUrl}/images/logo.png`,
    datePublished: article.publishedAt
      ? new Date(article.publishedAt).toISOString()
      : new Date().toISOString(),
    dateModified: article.publishedAt
      ? new Date(article.publishedAt).toISOString()
      : new Date().toISOString(),
    author: {
      "@type": "Person",
      name: article.authorName || "LALA-LYCHEEE",
    },
    publisher: {
      "@type": "Organization",
      name: "LALA-LYCHEEE",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/images/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/${locale}/news/${article.slug}`,
    },
  };

  return (
    <div className="animate-fade-in pb-12 bg-white min-h-screen">
      <StructuredData type="Article" data={articleStructuredData} />
      {/* Back Button & Breadcrumb */}
      <div className="container mx-auto px-4 pt-24 pb-4">
        <Link 
          href={`/${locale}/news`}
          className="inline-flex items-center mb-4 text-red-600 hover:text-red-700 font-semibold transition-colors group"
        >
          <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại danh sách tin tức</span>
        </Link>
        <div className="flex items-center text-gray-500 hover:text-rose-600 text-sm">
          <Link href={`/${locale}`} className="flex items-center hover:text-red-600">
            <Home size={14} className="mr-1"/> Trang chủ
          </Link>
          <ChevronRight size={14} className="mx-1"/> 
          <Link href={`/${locale}/news`} className="hover:text-red-600">Tin tức</Link>
          <ChevronRight size={14} className="mx-1"/> 
          <span className="text-gray-900">{categoryName}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Actions (Desktop only) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-32 flex flex-col space-y-4 items-center">
            <button 
              onClick={handleShare}
              className="p-3 rounded-full bg-gray-100 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors" 
              title="Chia sẻ"
            >
              <Share2 size={20}/>
            </button>
            <button 
              onClick={handleBookmark}
              className={`p-3 rounded-full transition-colors ${
                isSaved 
                  ? "bg-red-600 text-white hover:bg-red-700" 
                  : "bg-gray-100 text-gray-500 hover:text-red-600 hover:bg-red-50"
              }`}
              title={isSaved ? "Đã lưu" : "Lưu bài viết"}
            >
              {isSaved ? <Check size={20}/> : <Bookmark size={20}/>}
            </button>
          </div>
        </div>

        {/* Main Content - Center */}
        <div className="lg:col-span-7">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {article.title}
          </h1>
          
          <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-500 to-red-600 flex items-center justify-center text-white shadow-md">
                <User size={24}/>
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">
                  {article.authorName || "LALA-LYCHEEE"}
                </p>
                <p className="text-sm text-gray-500">
                  {article.publishedAt 
                    ? new Date(article.publishedAt).toLocaleDateString("vi-VN")
                    : ""} 
                  {article.readTime && ` • ${article.readTime}`}
                </p>
              </div>
            </div>
          </div>

          {article.excerpt && (
            <p className="font-bold text-xl text-gray-800 mb-8 leading-relaxed opacity-90">
              {article.excerpt}
            </p>
          )}

          {article.coverImage && (
            <div className="mb-10 rounded-2xl overflow-hidden shadow-lg">
              <div className="relative w-full h-[400px] sm:h-[500px]">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}

          <ContentRenderer 
            blocks={article.contentBlocks} 
            content={article.content}
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 rounded-full text-sm cursor-pointer transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Back Button & Read More Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link 
              href={`/${locale}/news`}
              className="inline-flex items-center text-red-600 hover:text-red-700 font-medium mb-8 group transition-colors"
            >
              <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              Quay lại danh sách tin tức
            </Link>

            {/* More Articles Section */}
            {relatedArticles.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="w-1 h-8 bg-red-600 mr-3 rounded-full"></span>
                  Đọc thêm bài viết khác
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedArticles.slice(0, 4).map((news) => (
                    <ArticleCard 
                      key={news._id || news.id || news.slug} 
                      article={news} 
                      locale={locale}
                      compact={false} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Right (TOC & Related) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Table Of Contents Component */}
          <TableOfContents blocks={article.contentBlocks} />

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                <span className="w-1 h-6 bg-red-600 mr-2 rounded-full"></span>
                Bài viết liên quan
              </h3>
              <div className="space-y-5">
                {relatedArticles.slice(0, 3).map((news) => (
                  <ArticleCard 
                    key={news._id || news.id || news.slug} 
                    article={news} 
                    locale={locale}
                    compact={true} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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
