import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale } from "@/i18n/config";
import { NewsArticle } from "@/types/news";
import NewsClient from "./NewsClient";
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
    console.error("[News API] No host header found");
    return [];
  }
  const proto = h.get("x-forwarded-proto") ?? "http";
  const frontendUrl = `${proto}://${host}/api/news?locale=${locale}`;
  
  // Log endpoint đang được gọi
  console.log(`[News API] Fetching from: ${frontendUrl}`);
  
  try {
    const res = await fetch(frontendUrl, { 
      next: { revalidate: 600 }, // Cache 10 phút
      cache: 'no-store' // Force fresh data
    });
    
    console.log(`[News API] Response status: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[News API] Failed to fetch news: ${res.status} ${res.statusText}`, errorText);
      return [];
    }
    
    const payload = await res.json();
    console.log("[News API] Full response payload:", JSON.stringify(payload, null, 2));
    console.log("[News API] Response summary:", {
      success: payload?.success,
      dataLength: payload?.data?.length,
      total: payload?.pagination?.total,
      locale,
      hasHash: !!payload?.hash,
      payloadKeys: Object.keys(payload || {}),
    });
    
    // Xử lý nhiều format response
    // Format 1: { success: true, data: NewsArticle[], hash?: string }
    // Format 2: { data: NewsArticle[] }
    // Format 3: NewsArticle[] trực tiếp
    let apiArticles: NewsArticle[] = [];
    
    if (Array.isArray(payload?.data)) {
      apiArticles = payload.data;
      console.log(`[News API] Found ${apiArticles.length} articles in payload.data`);
    } else if (Array.isArray(payload)) {
      apiArticles = payload;
      console.log(`[News API] Found ${apiArticles.length} articles in payload (direct array)`);
    } else {
      console.warn("[News API] No articles found in response. Payload structure:", {
        hasData: !!payload?.data,
        dataType: typeof payload?.data,
        isArray: Array.isArray(payload?.data),
        payloadType: typeof payload,
        isPayloadArray: Array.isArray(payload),
      });
    }
    
    // Filter chỉ lấy published articles (đảm bảo an toàn)
    const publishedArticles = apiArticles.filter(
      article => article.status === "published"
    );
    
    if (publishedArticles.length !== apiArticles.length) {
      console.warn(
        `[News API] Filtered out ${apiArticles.length - publishedArticles.length} non-published articles`
      );
    }
    
    // Log hash nếu có (để debug)
    if (payload?.hash) {
      console.log("[News API] Response hash:", payload.hash);
    }
    
    // Log một vài article đầu tiên để debug
    if (apiArticles.length > 0) {
      console.log("[News API] First article sample:", {
        _id: apiArticles[0]._id,
        title: apiArticles[0].title,
        slug: apiArticles[0].slug,
        category: apiArticles[0].category,
        locale: apiArticles[0].locale,
      });
    }
    
    console.log(`[News API] Final result: ${publishedArticles.length} published articles loaded`);
    return publishedArticles;
  } catch (error) {
    console.error("[News API] Error fetching news:", error);
    if (error instanceof Error) {
      console.error("[News API] Error details:", error.message, error.stack);
    }
    return [];
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

