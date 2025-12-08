import type { Metadata } from "next";
import { isValidLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
import SavedArticlesClient from "./SavedArticlesClient";
import { envConfig } from "@/config";

const baseUrl = envConfig.NEXT_PUBLIC_URL || "https://lala-lycheee.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const url = `${baseUrl}/${locale}/news/saved`;

  return {
    title: "Bài viết đã lưu | LALA-LYCHEEE",
    description: "Xem lại các bài viết bạn đã lưu",
    openGraph: {
      type: "website",
      title: "Bài viết đã lưu | LALA-LYCHEEE",
      description: "Xem lại các bài viết bạn đã lưu",
      url,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function SavedArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locale || !isValidLocale(locale)) {
    notFound();
  }

  return <SavedArticlesClient locale={locale} />;
}

