import { notFound } from "next/navigation";
import { isValidLocale } from "@/i18n/config";
import { ActivitiesList } from "./components/ActivitiesList";

const HeroSection = () => (
  <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16 md:py-24 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5" />
    <div className="relative container mx-auto px-4 max-w-7xl">
      <div className="text-center">
        <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-8">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
          Hoạt động & Sự kiện
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Hoạt động
          <span className="block text-blue-600">Công ty</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
          Khám phá các hoạt động, sự kiện và dự án đang diễn ra tại LALA-LYCHEEE
        </p>
      </div>
    </div>
  </section>
);

export default async function ActivitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locale || !isValidLocale(locale)) {
    notFound();
  }

  return (
    <div className="bg-white min-h-screen">
      <main>
        <HeroSection />
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <ActivitiesList locale={locale} />
          </div>
        </section>
      </main>
    </div>
  );
}

