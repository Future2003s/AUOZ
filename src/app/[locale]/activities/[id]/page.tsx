import { notFound } from "next/navigation";
import { isValidLocale } from "@/i18n/config";
import ActivityDetailClient from "./ActivityDetailClient";

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!locale || !isValidLocale(locale)) {
    notFound();
  }

  return <ActivityDetailClient locale={locale} id={id} />;
}

