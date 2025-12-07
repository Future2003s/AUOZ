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

  // TODO: Add dynamic routes from API
  // - Products: /products/[id]
  // - News articles: /news/[slug]
  // - Activities: /activities/[id]
  // These should be fetched from your backend API

  return routes;
}

