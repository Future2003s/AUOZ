"use client";
import { envConfig } from "@/config";

interface StructuredDataProps {
  type: "Organization" | "Product" | "Article" | "BreadcrumbList" | "FAQPage";
  data: Record<string, any>;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const baseUrl = envConfig.NEXT_PUBLIC_URL || "https://lala-lycheee.com";

  const getSchema = () => {
    switch (type) {
      case "Organization":
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "LALA-LYCHEEE",
          url: baseUrl,
          logo: `${baseUrl}/images/logo.png`,
          description: "CÔNG TY TNHH LALA-LYCHEEE - Chuyên sản xuất và phân phối các sản phẩm từ vải thiều và mật ong chất lượng cao",
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "Customer Service",
            availableLanguage: ["Vietnamese", "English", "Japanese"],
          },
          sameAs: [
            // Add your social media links here
            // "https://www.facebook.com/lala-lycheee",
            // "https://www.instagram.com/lala-lycheee",
          ],
          ...data,
        };

      case "Product":
        return {
          "@context": "https://schema.org",
          "@type": "Product",
          ...data,
        };

      case "Article":
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          ...data,
        };

      case "BreadcrumbList":
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: data.items || [],
        };

      case "FAQPage":
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: data.mainEntity || [],
        };

      default:
        return data;
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(getSchema()) }}
    />
  );
}

