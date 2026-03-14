import type { Metadata } from "next";
import { envConfig } from "@/config";
import ProductDetailClient from "./ProductDetailClient";
import type { Product } from "@/apiRequests/products";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

// ──────────────────────────────────────────────────────────
// Server-side product fetch (revalidate every 30s)
// ──────────────────────────────────────────────────────────
async function fetchProduct(id: string): Promise<Product | null> {
  const baseUrl = envConfig.NEXT_PUBLIC_URL || "http://localhost:3001";
  try {
    const res = await fetch(`${baseUrl}/api/products/public/${id}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.data as Product) ?? null;
  } catch {
    return null;
  }
}

function resolveImageUrl(url: string | undefined): string {
  if (!url) return "/images/logo.png";
  if (url.startsWith("http")) return url;
  return `${envConfig.NEXT_PUBLIC_BACKEND_URL || ""}${url}`;
}

function getMainImage(product: Product | null): string {
  if (!product?.images?.length) return "/images/logo.png";
  const imgs = product.images as Array<{ url?: string } | string>;
  const main = imgs.find((img) => typeof img === "object" && (img as any).isMain);
  const first = imgs[0];
  const imgUrl = main
    ? typeof main === "string" ? main : (main as any).url
    : typeof first === "string" ? first : (first as any)?.url;
  return resolveImageUrl(imgUrl);
}

// ──────────────────────────────────────────────────────────
// generateMetadata — runs on the server, no "use client"
// ──────────────────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const product = await fetchProduct(id);
  const siteUrl = envConfig.NEXT_PUBLIC_URL || "https://lala-lycheee.com";
  const canonical = `${siteUrl}/${locale}/products/${id}`;

  if (!product) {
    return {
      title: "Sản phẩm không tồn tại | LALA-LYCHEEE",
      description: "Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa.",
    };
  }

  const title =
    locale === "en"
      ? `${product.name} | LALA-LYCHEEE`
      : `${product.name} | LALA-LYCHEEE`;

  const description =
    (product as any).seo?.metaDescription ||
    product.description?.slice(0, 160) ||
    `Mua ${product.name} chính hãng tại LALA-LYCHEEE. Giao hàng nhanh, đổi trả 30 ngày.`;

  const imageUrl = getMainImage(product);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: "LALA-LYCHEEE",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

// ──────────────────────────────────────────────────────────
// JSON-LD Product Schema
// ──────────────────────────────────────────────────────────
function buildJsonLd(product: Product, locale: string, id: string): object {
  const siteUrl = envConfig.NEXT_PUBLIC_URL || "https://lala-lycheee.com";
  const imageUrl = getMainImage(product);
  const avgRating = (product as any).avgRating ?? (product as any).rating;
  const reviewCount = (product as any).reviewCount ?? (product as any).numReviews ?? 0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: imageUrl,
    url: `${siteUrl}/${locale}/products/${id}`,
    brand: {
      "@type": "Brand",
      name: "LALA-LYCHEEE",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: product.price,
      availability:
        (product as any).quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${siteUrl}/${locale}/products/${id}`,
      seller: { "@type": "Organization", name: "LALA-LYCHEEE" },
    },
    ...(avgRating != null && avgRating > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating,
            reviewCount: Math.max(1, reviewCount),
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

// ──────────────────────────────────────────────────────────
// Page — Server Component
// ──────────────────────────────────────────────────────────
export default async function ProductDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  const product = await fetchProduct(id);
  const jsonLd = product ? buildJsonLd(product, locale, id) : null;

  return (
    <>
      {/* JSON-LD for Google Rich Snippets */}
      {jsonLd && (
        <script
          type="application/ld+json"
          // biome-ignore lint: dangerously setting html
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* Client-side UI — receives pre-fetched product as initialData */}
      <ProductDetailClient
        id={id}
        locale={locale}
        initialData={product}
      />
    </>
  );
}
