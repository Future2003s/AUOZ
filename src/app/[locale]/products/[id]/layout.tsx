import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { envConfig } from "@/config";
import { headers } from "next/headers";

const baseUrl = envConfig.NEXT_PUBLIC_URL || "https://lala-lycheee.com";

async function getProduct(id: string): Promise<{
  name: string;
  description?: string;
  price: number;
  images?: Array<{ url: string; isMain?: boolean }>;
} | null> {
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const proto = headersList.get("x-forwarded-proto") ?? "http";
    const url = `${proto}://${host}/api/products/public/${id}`;

    const res = await fetch(url, {
      next: { revalidate: 300 }, // Cache 5 phút cho metadata
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data?.data || null;
  } catch (error) {
    console.error("Error fetching product for metadata:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale?: string }>;
}): Promise<Metadata> {
  const { id, locale = "vi" } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Sản phẩm không tìm thấy",
    };
  }

  const mainImage =
    product.images?.find((img) => img.isMain)?.url ||
    product.images?.[0]?.url ||
    "/images/logo.png";

  const imageUrl = mainImage.startsWith("http")
    ? mainImage
    : `${envConfig.NEXT_PUBLIC_BACKEND_URL || ""}${mainImage}`;

  const title = `${product.name} | LALA-LYCHEEE`;
  const description =
    product.description?.substring(0, 160) ||
    `Mua ${product.name} chất lượng cao tại LALA-LYCHEEE. Giá: ${new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(product.price)}`;

  const url = `${baseUrl}/${locale}/products/${id}`;

  return {
    title,
    description,
    keywords: [product.name, "LALA-LYCHEEE", "sản phẩm tự nhiên"],
    openGraph: {
      type: "website",
      title,
      description,
      url,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
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

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

