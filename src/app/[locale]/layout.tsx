import { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale, defaultLocale, locales } from "@/i18n/config";
import { I18nProvider } from "@/i18n/I18nProvider";
import RouteLoader from "@/components/route-loader";
import { envConfig } from "@/config";
import { QueryProvider } from "@/providers/query-provider";
import { SocketProvider } from "@/providers/SocketProvider";

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

  // load messages server-side để hydrate provider
  // Chiến lược: API (MongoDB) làm chính, JSON local làm fallback
  // getMergedTranslations sẽ merge: API override JSON, revalidate 60s
  let messages = {};
  try {
    const { getMergedTranslations } = await import("@/i18n/request");
    // useApi=true: fetch từ backend /i18n/:locale với cache 60s
    // Nếu API lỗi → tự động fallback về JSON local
    const useApi = process.env.NEXT_PUBLIC_USE_BACKEND_TRANSLATIONS !== "false";
    messages = await getMergedTranslations(locale, useApi);
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
      <QueryProvider>
        <SocketProvider>
          {/* Loader khi điều hướng giữa các route (trừ trang chủ) */}
          <RouteLoader>{children}</RouteLoader>
        </SocketProvider>
      </QueryProvider>
    </I18nProvider>
  );
}

