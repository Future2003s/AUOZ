import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/i18n/config";
import { NewsArticle } from "@/types/news";
import NewsClient from "./NewsClient";
import { MOCK_ARTICLES } from "./mockArticles";

export const dynamic = "force-dynamic";

async function fetchNews(locale: string): Promise<NewsArticle[]> {
  const h = await headers();
  const host = h.get("host");
  if (!host) return MOCK_ARTICLES;
  const proto = h.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}/api/news?locale=${locale}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error("Failed to fetch news, using mock data", await res.text());
      return MOCK_ARTICLES;
    }
    const payload = await res.json();
    const apiArticles = payload?.data ?? [];
    
    // Merge mock articles with API articles, prioritizing API data
    // If API has articles, use them. Otherwise, use mock data
    if (apiArticles.length > 0) {
      return apiArticles;
    }
    return MOCK_ARTICLES;
  } catch (error) {
    console.error("Error fetching news, using mock data:", error);
    return MOCK_ARTICLES;
  }
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locale || !isValidLocale(locale)) {
    notFound();
  }

  const articles = await fetchNews(locale);

  return <NewsClient articles={articles} locale={locale} />;
}

