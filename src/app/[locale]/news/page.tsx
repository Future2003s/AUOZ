import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale } from "@/i18n/config";
import { NewsArticle } from "@/types/news";
import NewsClient from "./NewsClient";
import { MOCK_ARTICLES } from "./mockArticles";
import { envConfig } from "@/config";

export const dynamic = "force-dynamic";

const baseUrl = envConfig.NEXT_PUBLIC_URL || "https://lala-lycheee.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const url = `${baseUrl}/${locale}/news`;

  return {
    title: "Tin Tức",
    description: "Cập nhật tin tức mới nhất về sản phẩm, hoạt động và câu chuyện từ LALA-LYCHEEE",
    keywords: ["tin tức", "news", "LALA-LYCHEEE", "vải thiều", "mật ong"],
    openGraph: {
      type: "website",
      title: "Tin Tức | LALA-LYCHEEE",
      description: "Cập nhật tin tức mới nhất về sản phẩm, hoạt động và câu chuyện từ LALA-LYCHEEE",
      url,
      images: [
        {
          url: "/images/logo.png",
          width: 1200,
          height: 630,
          alt: "LALA-LYCHEEE News",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Tin Tức | LALA-LYCHEEE",
      description: "Cập nhật tin tức mới nhất về sản phẩm, hoạt động và câu chuyện từ LALA-LYCHEEE",
      images: ["/images/logo.png"],
    },
    alternates: {
      canonical: url,
    },
  };
}

async function fetchNews(locale: string): Promise<NewsArticle[]> {
  const h = await headers();
  const host = h.get("host");
  if (!host) {
    console.warn("No host header, using mock data");
    return MOCK_ARTICLES;
  }
  const proto = h.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}/api/news?locale=${locale}`;
  try {
    const res = await fetch(url, { 
      next: { revalidate: 0 }, // Disable cache for debugging
      cache: 'no-store' // Force fresh data
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Failed to fetch news from API:", res.status, errorText);
      return MOCK_ARTICLES;
    }
    const payload = await res.json();
    console.log("News API response:", {
      success: payload?.success,
      dataLength: payload?.data?.length,
      total: payload?.pagination?.total,
      locale
    });
    
    const apiArticles = Array.isArray(payload?.data) ? payload.data : [];
    
    // If API has articles, use them. Otherwise, use mock data
    if (apiArticles.length > 0) {
      console.log(`Loaded ${apiArticles.length} articles from API`);
      return apiArticles;
    }
    
    console.warn("No articles from API, using mock data");
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

