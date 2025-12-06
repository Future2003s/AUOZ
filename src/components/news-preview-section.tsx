"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ImageSkeleton, CardSkeleton } from "@/components/ui/skeleton-loaders";

interface NewsArticle {
  _id: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  slug: string;
  publishedAt?: string;
  views?: number;
}

// Separate component for image with loading state
const NewsArticleImage = ({ src, alt }: { src: string; alt: string }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <>
      {imageLoading && !imageError && (
        <div className="absolute inset-0 z-10">
          <ImageSkeleton className="w-full h-full" />
        </div>
      )}
      {!imageError && (
        <Image
          src={src}
          alt={alt}
          fill
          className={`object-cover group-hover:scale-110 transition-transform duration-500 ${
            imageLoading ? "opacity-0" : "opacity-100"
          }`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
        />
      )}
      {imageError && (
        <div className="w-full h-full bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center">
          <span className="text-4xl">📰</span>
        </div>
      )}
    </>
  );
};

export const NewsPreviewSection: React.FC = () => {
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/news?locale=${locale}&limit=4`, {
          cache: "no-store",
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setArticles(result.data.slice(0, 4));
          }
        }
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [locale]);

  if (loading) {
    return (
      <section className="py-24 bg-gradient-to-b from-white to-stone-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="h-8 bg-stone-200 rounded w-64 mx-auto mb-4 animate-pulse" />
            <div className="h-4 bg-stone-200 rounded w-96 mx-auto animate-pulse" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <ImageSkeleton aspectRatio="aspect-video" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-stone-200 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-stone-200 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) return null;

  return (
    <section className="py-24 bg-gradient-to-b from-white to-stone-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-rose-100/20 rounded-full blur-3xl -ml-32 -mt-32 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 max-w-3xl mx-auto"
        >
          <span className="text-rose-600 font-bold tracking-widest uppercase text-xs mb-3 block">
            Tin Tức & Cập Nhật
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Câu Chuyện Từ Vĩnh Lập
          </h2>
          <div className="w-20 h-1 bg-rose-600 mx-auto rounded-full mb-6" />
          <p className="text-lg text-slate-600 leading-relaxed">
            Khám phá những câu chuyện, tin tức và cập nhật mới nhất về vải thiều Vĩnh Lập
            và hành trình của LALA-LYCHEEE
          </p>
        </motion.div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {articles.map((article, index) => (
            <motion.div
              key={article._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link
                href={`/${locale}/news/${article.slug}`}
                className="group block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-stone-100 h-full"
              >
                {/* Image */}
                <div className="relative aspect-video overflow-hidden bg-stone-100">
                  {article.coverImage ? (
                    <NewsArticleImage src={article.coverImage} alt={article.title} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center">
                      <span className="text-4xl">📰</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-rose-600 transition-colors text-lg">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {article.publishedAt && (
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>
                          {new Date(article.publishedAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    )}
                    {article.views && (
                      <div className="flex items-center gap-1">
                        <Eye size={12} />
                        <span>{article.views}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Link
            href={`/${locale}/news`}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <span>Xem Tất Cả Tin Tức</span>
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

