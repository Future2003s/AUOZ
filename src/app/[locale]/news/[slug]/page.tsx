import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale } from "@/i18n/config";
import { NewsArticle } from "@/types/news";
import ArticleDetailClient from "../ArticleDetailClient";
import { envConfig } from "@/config";

const baseUrl = envConfig.NEXT_PUBLIC_URL || "https://lala-lycheee.com";

async function fetchArticle(locale: string, slug: string): Promise<NewsArticle | null> {
  const h = await headers();
  const host = h.get("host");
  if (!host) {
    console.error("[News API] No host header found");
    return null;
  }
  const proto = h.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}/api/news/${slug}?locale=${locale}`;
  try {
    const res = await fetch(url, { 
      next: { revalidate: 600 } // Cache 10 phút cho article detail
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        console.warn(`[News API] Article not found: ${slug}`);
      } else {
        console.error(`[News API] Failed to fetch article "${slug}": ${res.status} ${res.statusText}`);
      }
      return null;
    }
    
    const payload = await res.json();
    
    // Xử lý nhiều format response khác nhau
    // Format 1: { success: true, data: NewsArticle, hash?: string }
    // Format 2: { data: NewsArticle }
    // Format 3: NewsArticle trực tiếp
    let apiArticle: NewsArticle | null = null;
    
    if (payload?.data && typeof payload.data === 'object' && payload.data.slug) {
      apiArticle = payload.data as NewsArticle;
    } else if (payload && typeof payload === 'object' && payload.slug) {
      // Nếu payload chính là article object
      apiArticle = payload as NewsArticle;
    }
    
    // Log hash nếu có (để debug)
    if (payload?.hash) {
      console.log(`[News API] Response hash for "${slug}":`, payload.hash);
    }
    
    // Validate article có đủ thông tin cần thiết
    if (apiArticle && apiArticle.slug && apiArticle.title) {
      // Chỉ trả về published articles cho public route
      if (apiArticle.status !== "published") {
        console.warn(`[News API] Article "${slug}" is not published (status: ${apiArticle.status})`);
        return null;
      }
      console.log(`[News API] Successfully fetched article: ${slug}`);
      return apiArticle;
    }
    
    console.warn(`[News API] Invalid article data format for slug "${slug}":`, payload);
    return null;
  } catch (error) {
    console.error(`[News API] Error fetching article "${slug}":`, error);
    return null;
  }
}

async function fetchRelatedArticles(
  locale: string,
  category?: string,
  excludeId?: string
): Promise<NewsArticle[]> {
  const h = await headers();
  const host = h.get("host");
  let articles: NewsArticle[] = [];
  
  if (!host) {
    console.error("[News API] No host header found for related articles");
    return [];
  }
  
  const proto = h.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}/api/news?locale=${locale}`;
  try {
    const res = await fetch(url, { 
      next: { revalidate: 600 } // Cache 10 phút cho article detail
    });
    if (res.ok) {
      const payload = await res.json();
      
      // Xử lý nhiều format response
      if (Array.isArray(payload?.data)) {
        articles = payload.data;
      } else if (Array.isArray(payload)) {
        articles = payload;
      }
      
      // Log hash nếu có
      if (payload?.hash) {
        console.log("[News API] Related articles hash:", payload.hash);
      }
    } else {
      console.warn(`[News API] Failed to fetch related articles: ${res.status}`);
    }
  } catch (error) {
    console.error("[News API] Error fetching related articles:", error);
  }
  
  return articles
    .filter((a) => a._id !== excludeId && (!category || a.category === category))
    .slice(0, 3);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!locale || !isValidLocale(locale)) {
    return {};
  }

  const article = await fetchArticle(locale, slug);

  if (!article) {
    return {
      title: "Bài viết không tìm thấy",
    };
  }

  const imageUrl = article.coverImage || "/images/logo.png";
  const title = `${article.title} | LALA-LYCHEEE`;
  const description = article.excerpt || article.title;
  const url = `${baseUrl}/${locale}/news/${slug}`;
  const publishedTime = article.publishedAt
    ? new Date(article.publishedAt).toISOString()
    : undefined;

  return {
    title,
    description,
    keywords: [article.category || "tin tức", "LALA-LYCHEEE"],
    authors: article.authorName ? [{ name: article.authorName }] : undefined,
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      publishedTime,
      authors: article.authorName ? [article.authorName] : undefined,
      section: article.category,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!locale || !isValidLocale(locale)) {
    notFound();
  }

  const article = await fetchArticle(locale, slug);
  if (!article) {
    console.warn(`[News Page] Article not found for slug: ${slug}, locale: ${locale}`);
    notFound();
  }

  // Log để debug
  console.log(`[News Page] Article found:`, {
    slug: article.slug,
    title: article.title,
    hasContentBlocks: !!article.contentBlocks && article.contentBlocks.length > 0,
    hasContent: !!article.content,
    contentBlocksLength: article.contentBlocks?.length || 0,
  });

  const relatedArticles = await fetchRelatedArticles(
    locale,
    article.category,
    article._id
  );

  return (
    <ArticleDetailClient
      article={article}
      relatedArticles={relatedArticles}
      locale={locale}
    />
  );
}

