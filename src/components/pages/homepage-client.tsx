"use client";

import { useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import "@/app/styleSmoothUI.css";
import { CursorEffect } from "@/components/cursor-effect";
import { MapsLocationCompany } from "@/components/location-company-maps";
import { SocialProofSection } from "@/components/social-proof-section";
import {
  InteractiveHeroSlider,
  HeroSlide,
} from "@/components/interactive-hero-slider";
import { FeaturedProductsSection } from "@/components/featured-product-section";
import { AboutSection } from "@/components/about-section";
import { OurCraftSection } from "@/components/our-craft-section";
import { CollectionSection } from "@/components/collection-section";
import { MarqueeBannerSection } from "@/components/marquee-banner-section";
import { VideoSection } from "@/components/video-section";
import { Snowfall } from "@/components/snowfall";
import { ValuePropositionSection } from "@/components/value-proposition-section";
import { CertificationsPartnersSection } from "@/components/certifications-partners-section";
import { NewsPreviewSection } from "@/components/news-preview-section";
import { HomepageSettings } from "@/types/homepage";
import { defaultHomepageSettings } from "@/lib/homepage-default";

interface HomePageClientProps {
  settings?: HomepageSettings;
}

export function HomePageClient({ settings }: HomePageClientProps) {
  const mergedSettings = useMemo(() => {
    return { ...defaultHomepageSettings, ...(settings || {}) };
  }, [settings]);

  useEffect(() => {
    if (mergedSettings.typography.fontUrl) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = mergedSettings.typography.fontUrl;
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [mergedSettings.typography.fontUrl]);

  const heroSlides: HeroSlide[] = useMemo(() => {
    const slides =
      mergedSettings.sections?.hero?.data?.slides
        ?.filter((slide) => slide.desktopImage?.url) // Only include slides with valid image URLs
        ?.map((slide, index) => ({
          id: slide.desktopImage?.url || `slide-${index}`,
          imageUrl: slide.desktopImage?.url || "",
          title: slide.title || "",
          subtitle: slide.subtitle || "",
          ctaText: slide.cta?.label || "",
          ctaLink: slide.cta?.href || "#",
          overlayOpacity: slide.overlayOpacity,
        })) ?? [];
    return slides;
  }, [mergedSettings.sections?.hero?.data?.slides]);

  const marqueeItems =
    mergedSettings.sections.marquee.data?.phrases &&
    mergedSettings.sections.marquee.data?.phrases.length > 0
      ? mergedSettings.sections.marquee.data?.phrases
      : undefined;

  const craftData = mergedSettings.sections.craft.data;

  const themeStyle: CSSProperties = {
    fontFamily: mergedSettings.typography.fontFamily,
    backgroundColor: mergedSettings.colors.background,
    color: mergedSettings.colors.text,
    "--brand-primary": mergedSettings.colors.primary,
    "--brand-secondary": mergedSettings.colors.secondary,
    "--brand-accent": mergedSettings.colors.accent,
    "--brand-muted": mergedSettings.colors.muted,
    fontSize: `${mergedSettings.typography.baseSize}px`,
  } as React.CSSProperties;

  return (
    <div
      className="min-h-screen antialiased transition-colors"
      style={themeStyle}
      suppressHydrationWarning
    >
      <Snowfall />
      <CursorEffect />
      <main suppressHydrationWarning>
        {mergedSettings.sections.hero.enabled && (
          <InteractiveHeroSlider slides={heroSlides} />
        )}
        {mergedSettings.sections.marquee.enabled && (
          <MarqueeBannerSection
            items={marqueeItems}
            backgroundColor={mergedSettings.colors.background}
            textColor={mergedSettings.colors.text}
          />
        )}

        {mergedSettings.sections.about.enabled && (
          <AboutSection
            heading={mergedSettings.sections.about.data?.heading}
            body={mergedSettings.sections.about.data?.body}
            imageUrl={mergedSettings.sections.about.data?.media?.url}
            founderName={mergedSettings.sections.about.data?.founderName}
            founderTitle={mergedSettings.sections.about.data?.founderTitle}
            founderQuote={mergedSettings.sections.about.data?.founderQuote}
          />
        )}

        {/* Value Proposition Section */}
        <ValuePropositionSection />

        {mergedSettings.sections.socialProof.enabled && <SocialProofSection />}

        {/* Certifications & Partners Section */}
        <CertificationsPartnersSection />

        {mergedSettings.sections.featuredProducts.enabled && (
          <FeaturedProductsSection />
        )}

        <VideoSection />

        {/* News Preview Section */}
        <NewsPreviewSection />

        {mergedSettings.sections.collection.enabled && <CollectionSection />}
        {mergedSettings.sections.craft.enabled && (
          <OurCraftSection
            heading={craftData?.heading}
            subheading={craftData?.subheading}
            steps={craftData?.steps}
          />
        )}
        {mergedSettings.sections.map.enabled && <MapsLocationCompany />}
      </main>
    </div>
  );
}
