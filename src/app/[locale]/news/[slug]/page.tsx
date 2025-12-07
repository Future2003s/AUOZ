import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale } from "@/i18n/config";
import { NewsArticle } from "@/types/news";
import ArticleDetailClient from "../ArticleDetailClient";
import { MOCK_ARTICLES } from "../mockArticles";
import { envConfig } from "@/config";

const baseUrl = envConfig.NEXT_PUBLIC_URL || "https://lala-lycheee.com";

async function fetchArticle(locale: string, slug: string): Promise<NewsArticle | null> {
  const h = await headers();
  const host = h.get("host");
  if (!host) {
    // Fallback to mock data
    return MOCK_ARTICLES.find(a => a.slug === slug) ?? null;
  }
  const proto = h.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}/api/news/${slug}?locale=${locale}`;
  try {
    const res = await fetch(url, { 
      next: { revalidate: 600 } // Cache 10 phút cho article detail
    });
    if (!res.ok) {
      // Fallback to mock data
      return MOCK_ARTICLES.find(a => a.slug === slug) ?? null;
    }
    const payload = await res.json();
    const apiArticle = payload?.data;
    if (apiArticle) return apiArticle;
    return MOCK_ARTICLES.find(a => a.slug === slug) ?? null;
  } catch (error) {
    console.error("Error fetching article, using mock data:", error);
    return MOCK_ARTICLES.find(a => a.slug === slug) ?? null;
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
  
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? "http";
    const url = `${proto}://${host}/api/news?locale=${locale}`;
    try {
      const res = await fetch(url, { 
      next: { revalidate: 600 } // Cache 10 phút cho article detail
    });
      if (res.ok) {
        const payload = await res.json();
        articles = payload?.data ?? [];
      }
    } catch (error) {
      console.error("Error fetching related articles:", error);
    }
  }
  
  // If no articles from API, use mock data
  if (articles.length === 0) {
    articles = MOCK_ARTICLES;
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
    notFound();
  }

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

