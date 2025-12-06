import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/i18n/config";
import { NewsArticle } from "@/types/news";
import ArticleDetailClient from "../ArticleDetailClient";
import { MOCK_ARTICLES } from "../mockArticles";

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
    const res = await fetch(url, { cache: "no-store" });
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
      const res = await fetch(url, { cache: "no-store" });
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

