import type { MetadataRoute } from "next";
import { envConfig } from "@/config";

const baseUrl = envConfig.NEXT_PUBLIC_URL || "https://lala-lycheee.com";
const locales = ["vi", "en", "ja"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

  // Static pages
  const staticPages = [
    "",
    "/story",
    "/news",
    "/activities",
    "/contact",
    "/products",
    "/shop",
  ];

  // Generate sitemap entries for each locale and static page
  for (const locale of locales) {
    for (const page of staticPages) {
      routes.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "daily" : "weekly",
        priority: page === "" ? 1 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((loc) => [
              loc,
              `${baseUrl}/${loc}${page}`,
            ])
          ),
        },
      });
    }
  }

  // Dynamic routes: Products
  try {
    const productsRes = await fetch(`${baseUrl}/api/products/public`, { next: { revalidate: 3600 } });
    if (productsRes.ok) {
      const prodData = await productsRes.json();
      const products = prodData?.data?.products || [];
      for (const locale of locales) {
        for (const product of products) {
          if (product._id) {
            routes.push({
              url: `${baseUrl}/${locale}/products/${product._id}`,
              lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
              changeFrequency: "weekly",
              priority: 0.9,
              alternates: {
                languages: Object.fromEntries(
                  locales.map((loc) => [loc, `${baseUrl}/${loc}/products/${product._id}`])
                ),
              },
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch products for sitemap:", err);
  }

  // Dynamic routes: News Articles
  try {
    // We only need one locale's slugs since they share the same ID/Slug format across translations for generation
    const newsRes = await fetch(`${baseUrl}/api/news?locale=vi`, { next: { revalidate: 3600 } });
    if (newsRes.ok) {
      const newsData = await newsRes.json();
      const articles = Array.isArray(newsData?.data) ? newsData.data : (Array.isArray(newsData) ? newsData : []);
      for (const locale of locales) {
        for (const article of articles) {
          if (article.slug) {
            routes.push({
              url: `${baseUrl}/${locale}/news/${article.slug}`,
              lastModified: article.updatedAt ? new Date(article.updatedAt) : new Date(),
              changeFrequency: "weekly",
              priority: 0.8,
              alternates: {
                languages: Object.fromEntries(
                  locales.map((loc) => [loc, `${baseUrl}/${loc}/news/${article.slug}`])
                ),
              },
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch news for sitemap:", err);
  }

  return routes;
}

