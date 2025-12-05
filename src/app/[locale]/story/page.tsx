import { notFound } from "next/navigation";
import { isValidLocale } from "@/i18n/config";
import StoryClient from "./StoryClient";

export default async function LocaleStoryPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  if (!locale || !isValidLocale(locale)) {
    notFound();
  }

  return <StoryClient />;
}
