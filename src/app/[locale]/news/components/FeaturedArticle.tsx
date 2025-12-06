"use client";
import React from "react";
import { Clock, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface FeaturedArticleProps {
  article: {
    _id: string;
    title: string;
    excerpt?: string;
    coverImage?: string;
    category?: string;
    authorName?: string;
    publishedAt?: string;
    slug: string;
  };
  locale: string;
}

export const FeaturedArticle: React.FC<FeaturedArticleProps> = ({ 
  article, 
  locale 
}) => {
  const categoryName = article.category || "Tin tức";
  
  return (
    <Link 
      href={`/${locale}/news/${article.slug}`}
      className="relative h-[400px] sm:h-[500px] rounded-2xl overflow-hidden cursor-pointer group block"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 z-10"></div>
      {article.coverImage ? (
        <Image
          src={article.coverImage}
          alt={article.title}
          className="object-cover transform group-hover:scale-105 transition-transform duration-700"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
          <span className="text-8xl">📰</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 p-6 sm:p-8 z-20 max-w-3xl text-white">
        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider mb-3 inline-block">
          {categoryName}
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 group-hover:text-red-200 transition-colors">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="text-gray-200 text-base sm:text-lg mb-4 line-clamp-2 md:line-clamp-none">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center text-sm text-gray-300 space-x-4">
          {article.authorName && (
            <span className="flex items-center font-medium">
              <User size={16} className="mr-2"/> 
              {article.authorName}
            </span>
          )}
          {article.publishedAt && (
            <span className="flex items-center">
              <Clock size={16} className="mr-2"/> 
              {new Date(article.publishedAt).toLocaleDateString("vi-VN")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
