import { headers } from "next/headers";
import { HomePageClient } from "@/components/pages/homepage-client";
import { defaultHomepageSettings } from "@/lib/homepage-default";
import { HomepageSettings } from "@/types/homepage";

// Transform backend format to frontend format
function transformBackendToFrontend(backendData: any): HomepageSettings {
  if (!backendData) return defaultHomepageSettings;
  
  // If already in frontend format (has sections), return as is
  if (backendData.sections) {
    return backendData as HomepageSettings;
  }

  // Transform from backend format
  return {
    typography: {
      fontFamily: backendData.typography?.headingFont || defaultHomepageSettings.typography.fontFamily,
      fontUrl: backendData.typography?.googleFontUrl,
      baseSize: backendData.typography?.baseFontSize || defaultHomepageSettings.typography.baseSize,
      headingScale: {
        h1: (backendData.typography?.headingSizes?.h1 || 48) / (backendData.typography?.baseFontSize || 16),
        h2: (backendData.typography?.headingSizes?.h2 || 36) / (backendData.typography?.baseFontSize || 16),
        h3: (backendData.typography?.headingSizes?.h3 || 24) / (backendData.typography?.baseFontSize || 16),
      },
      lineHeight: defaultHomepageSettings.typography.lineHeight,
    },
    colors: backendData.colors || defaultHomepageSettings.colors,
    sections: {
      hero: {
        enabled: true,
        order: 0,
        data: {
          slides: (backendData.hero?.slides || []).map((slide: any) => ({
            title: slide.title || "",
            subtitle: slide.subtitle || "",
            cta: {
              label: slide.ctaText || "",
              href: slide.ctaLink || "",
            },
            desktopImage: {
              url: slide.imageUrl || "",
              alt: "",
            },
          })),
        },
      },
      marquee: {
        enabled: backendData.marquee?.enabled !== false,
        order: 1,
        data: {
          phrases: backendData.marquee?.items || defaultHomepageSettings.sections.marquee.data.phrases,
          speed: 40,
        },
      },
      about: backendData.about ? {
        enabled: backendData.about.enabled !== false,
        order: 2,
        data: {
          heading: backendData.about.title || "",
          body: backendData.about.content || "",
          media: backendData.about.imageUrl ? {
            url: backendData.about.imageUrl,
            alt: "",
          } : undefined,
          founderName: backendData.about.founderName || "",
          founderTitle: backendData.about.founderTitle || "",
          founderQuote: backendData.about.founderQuote || "",
        },
      } : defaultHomepageSettings.sections.about,
      featuredProducts: backendData.featuredProducts ? {
        enabled: backendData.featuredProducts.enabled !== false,
        order: 3,
        data: {
          productIds: (backendData.featuredProducts.productIds || []).map((id: any) => 
            typeof id === 'string' ? id : id.toString()
          ),
          layout: "grid" as const,
        },
      } : defaultHomepageSettings.sections.featuredProducts,
      socialProof: backendData.socialProof ? {
        enabled: backendData.socialProof.enabled !== false,
        order: 4,
        data: {
          testimonials: backendData.socialProof.testimonials || [],
          logos: [],
        },
      } : defaultHomepageSettings.sections.socialProof,
      collection: backendData.collectionSection ? {
        enabled: backendData.collectionSection.enabled !== false,
        order: 5,
        data: {
          cards: [],
        },
      } : defaultHomepageSettings.sections.collection,
      craft: backendData.craft ? {
        enabled: backendData.craft.enabled !== false,
        order: 6,
        data: {
          steps: [],
        },
      } : defaultHomepageSettings.sections.craft,
      map: backendData.map ? {
        enabled: backendData.map.enabled !== false,
        order: 7,
        data: {
          title: "",
          description: "",
          coordinates: backendData.map.latitude && backendData.map.longitude ? {
            lat: backendData.map.latitude,
            lng: backendData.map.longitude,
          } : undefined,
        },
      } : defaultHomepageSettings.sections.map,
    },
    seo: backendData.seo || defaultHomepageSettings.seo,
    _id: backendData._id,
    version: backendData.version,
    status: backendData.status,
  };
}

async function fetchHomepageSettings(): Promise<HomepageSettings> {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol =
      process.env.VERCEL_ENV || process.env.NODE_ENV === "production"
        ? "https"
        : "http";
    const baseUrl =
      process.env.NEXT_PUBLIC_URL ||
      `${protocol}://${host.replace(/\/$/, "")}`;

    const response = await fetch(`${baseUrl}/api/homepage`, {
      cache: "no-store", // Always fetch fresh data to see latest changes
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🏠 [Homepage] Error response:", errorText);
      throw new Error(`Failed to fetch homepage settings: ${response.status}`);
    }

    const result = await response.json();
    
    const backendData = result?.data || result;
    
    const transformed = transformBackendToFrontend(backendData);
    
    return transformed;
  } catch (error) {
    console.error("🏠 [Homepage] Failed to load homepage settings:", error);
    return defaultHomepageSettings;
  }
}

export default async function HomePage() {
  const settings = await fetchHomepageSettings();
  return <HomePageClient settings={settings} />;
}
