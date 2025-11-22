import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/i18n/config";
import { NewsArticle } from "@/types/news";

async function fetchArticle(locale: string, slug: string): Promise<NewsArticle | null> {
  const h = await headers();
  const host = h.get("host");
  if (!host) return null;
  const proto = h.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}/api/news/${slug}?locale=${locale}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return null;
  }
  const payload = await res.json();
  return payload?.data ?? null;
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!locale || !isValidLocale(locale)) {
    notFound();
  }

  const article = await fetchArticle(locale, slug);
  if (!article) {
    notFound();
  }

  const categoryColorClasses = (color?: string) => {
    const colors = {
      blue: "bg-blue-50 text-blue-700",
      green: "bg-green-50 text-green-700",
      emerald: "bg-emerald-50 text-emerald-700",
      purple: "bg-purple-50 text-purple-700",
    };
    if (!color) return colors.blue;
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="bg-white min-h-screen">
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .scroll-animate { transition: all 0.3s ease; opacity: 0; }
      `}</style>

      <main>
        <section className="py-12 md:py-16 bg-slate-50 border-b">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="scroll-animate animate-in">
              <nav className="mb-8">
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Link href={`/${locale}`} className="hover:text-blue-600 transition-colors">
                    Trang chủ
                  </Link>
                  <span>›</span>
                  <Link href={`/${locale}/news`} className="hover:text-blue-600 transition-colors">
                    Tin tức
                  </Link>
                  <span>›</span>
                  <span className="text-slate-900">{article.title}</span>
                </div>
              </nav>

              <div className="flex items-center space-x-4 mb-6">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColorClasses(
                    article.category
                  )}`}
                >
                  {article.category || "Tin tức"}
                </span>
                {article.readTime && (
                  <span className="text-slate-500 text-sm">{article.readTime}</span>
                )}
                {article.publishedAt && (
                  <span className="text-slate-500 text-sm">
                    {new Date(article.publishedAt).toLocaleDateString("vi-VN")}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                {article.title}
              </h1>

              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {(article.authorName || "NN")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    {article.authorName || "LALA-LYCHEEE"}
                  </div>
                  <div className="text-sm text-slate-600">
                    {article.authorRole || "Ban Truyền thông"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-6 max-w-4xl">
            {article.coverImage && (
              <div className="mb-10 rounded-3xl overflow-hidden shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-80 object-cover"
                  loading="lazy"
                />
              </div>
            )}

            <article
              className="prose prose-lg md:prose-xl max-w-none article-content"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </section>

        <section className="py-12 bg-slate-50 border-t">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-2">Chia sẻ bài viết</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Lan tỏa những thông tin hữu ích đến cộng đồng.
                </p>
                <div className="flex items-center gap-3">
                  {["Facebook", "LinkedIn", "Twitter"].map((platform) => (
                    <button
                      key={platform}
                      className="px-4 py-2 text-sm font-semibold rounded-full border border-slate-200 hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-2">Liên hệ truyền thông</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Đội ngũ truyền thông sẵn sàng hỗ trợ bạn 24/7.
                </p>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>Email: media@lalalychee.com</p>
                  <p>Hotline: (+84) 962-215-666</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

