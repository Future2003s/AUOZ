"use client";
import React from "react";
import { Clock, Eye } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ArticleCardProps {
  article: {
    _id?: string;
    id?: string;
    title: string;
    excerpt?: string;
    coverImage?: string;
    category?: string;
    publishedAt?: string;
    readTime?: string;
    views?: string | number;
    slug: string;
  };
  locale: string;
  compact?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ 
  article, 
  locale, 
  compact = false 
}) => {
  const categoryName = article.category || "Tin tức";
  
  return (
    <Link 
      href={`/${locale}/news/${article.slug}`}
      className={`group cursor-pointer flex ${compact ? 'flex-row gap-4 items-center' : 'flex-col'} bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100`}
    >
      <div className={`relative overflow-hidden ${compact ? 'w-24 h-24 flex-shrink-0 rounded-lg' : 'w-full h-52'}`}>
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            sizes={compact ? "(max-width: 768px) 96px, 96px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
            className="object-cover transform group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
            <span className="text-4xl">📰</span>
          </div>
        )}
        {!compact && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
            {categoryName}
          </span>
        )}
      </div>
      
      <div className={`${compact ? 'py-0' : 'p-5'} flex-1`}>
        <div className="flex items-center text-gray-400 text-xs mb-2 space-x-2">
          {article.publishedAt && (
            <>
              <span className="flex items-center">
                <Clock size={12} className="mr-1"/> 
                {new Date(article.publishedAt).toLocaleDateString("vi-VN")}
              </span>
            </>
          )}
          {!compact && article.readTime && <span>•</span>}
          {!compact && article.readTime && (
            <span className="flex items-center">
              <Eye size={12} className="mr-1"/> 
              {article.readTime || "0"}
            </span>
          )}
        </div>
        <h3 className={`font-bold text-gray-900 leading-tight group-hover:text-red-600 transition-colors ${compact ? 'text-sm line-clamp-2' : 'text-lg mb-2 line-clamp-2'}`}>
          {article.title}
        </h3>
        {!compact && article.excerpt && (
          <p className="text-gray-500 text-sm line-clamp-2">{article.excerpt}</p>
        )}
      </div>
    </Link>
  );
};
