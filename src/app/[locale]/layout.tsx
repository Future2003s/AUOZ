import { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale, defaultLocale, locales } from "@/i18n/config";
import { I18nProvider } from "@/i18n/I18nProvider";
import RouteLoader from "@/components/route-loader";
import { envConfig } from "@/config";

const baseUrl = envConfig.NEXT_PUBLIC_URL || "https://lala-lycheee.com";

const localeMap: Record<string, string> = {
  vi: "vi_VN",
  en: "en_US",
  ja: "ja_JP",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locale || !isValidLocale(locale)) {
    return {};
  }

  const localeCode = localeMap[locale] || "vi_VN";
  const currentUrl = `${baseUrl}/${locale}`;

  // Generate alternate languages
  const alternates: Record<string, string> = {};
  for (const loc of locales) {
    alternates[loc] = `${baseUrl}/${loc}`;
  }

  return {
    alternates: {
      canonical: currentUrl,
      languages: alternates,
    },
    openGraph: {
      locale: localeCode,
      alternateLocale: locales.filter((l) => l !== locale),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  if (!locale || !isValidLocale(locale)) {
    notFound();
  }

  // load messages server-side to hydrate provider
  // Try to merge static JSON with BackEnd translations
  let messages = {};
  try {
    const { getMergedTranslations } = await import("@/i18n/request");
    // Use BackEnd translations if enabled (can be controlled via env var)
    const useBackend = process.env.NEXT_PUBLIC_USE_BACKEND_TRANSLATIONS === "true";
    messages = await getMergedTranslations(locale, useBackend);
  } catch (error) {
    console.error(`Failed to load locale ${locale}:`, error);
    // Fallback to static JSON only
    try {
      messages = (await import(`@/i18n/locales/${locale}.json`)).default;
    } catch {
      messages = (await import(`@/i18n/locales/${defaultLocale}.json`)).default;
    }
  }

  return (
    <I18nProvider
      key={locale}
      initialLocale={locale}
      initialMessages={messages}
    >
      {/* Loader khi điều hướng giữa các route (trừ trang chủ) */}
      <RouteLoader>{children}</RouteLoader>
    </I18nProvider>
  );
}
