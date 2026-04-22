import { notFound } from "next/navigation";
import { isValidLocale } from "@/i18n/config";
import PremiumGalleryClient from "./components/PremiumGalleryClient";

export default async function PastoralPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locale || !isValidLocale(locale)) {
    notFound();
  }

  // Cast to 'vi' | 'en' since PremiumGalleryClient expects that
  const defaultLang = (locale === 'en' ? 'en' : 'vi') as 'vi' | 'en';

  return (
    <main>
      <PremiumGalleryClient defaultLang={defaultLang} />
    </main>
  );
}
