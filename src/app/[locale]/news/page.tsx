import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/i18n/config";
import { NewsArticle } from "@/types/news";

export const dynamic = "force-dynamic";

const HeroSection = () => (
  <section className="relative bg-white py-16 md:py-24 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50" />
    <div className="relative container mx-auto px-6 max-w-6xl text-center">
      <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-full mb-8">
        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
        Tin tức & Thông tin ngành
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
        Trung tâm <span className="block text-blue-600">Tin tức & Nghiên cứu</span>
      </h1>
      <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
        Cập nhật xu hướng nông nghiệp bền vững, nghiên cứu khoa học và thông tin thị trường toàn cầu.
      </p>
    </div>
  </section>
);

const FeaturedArticleSection = ({
  article,
  locale,
}: {
  article?: NewsArticle;
  locale: string;
}) => {
  if (!article) return null;
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-6 max-w-6xl grid gap-8 lg:grid-cols-2 border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
        <div className="relative min-h-[260px] bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
          {article.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.coverImage}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="text-center text-slate-600">
              <div className="text-6xl mb-4">📰</div>
              <p>Featured Article Image</p>
            </div>
          )}
          <span className="absolute top-4 left-4 px-4 py-1 rounded-full bg-blue-600 text-white text-sm font-semibold">
            Bài viết nổi bật
          </span>
        </div>
        <div className="p-8 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {article.category && (
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                {article.category}
              </span>
            )}
            {article.readTime && <span>{article.readTime}</span>}
            {article.publishedAt && (
              <span>{new Date(article.publishedAt).toLocaleDateString("vi-VN")}</span>
            )}
          </div>
          <h2 className="text-3xl font-bold text-slate-900">{article.title}</h2>
          <p className="text-slate-600 leading-relaxed">{article.excerpt}</p>
          <div className="flex items-center gap-3 mt-auto">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
              {(article.authorName || "NN")
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{article.authorName || "LALA-LYCHEEE"}</p>
              <p className="text-sm text-slate-500">{article.authorRole || "Ban Truyền thông"}</p>
            </div>
            <div className="ml-auto">
              <Link
                href={`/${locale}/news/${article.slug}`}
                className="inline-flex items-center px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Đọc toàn bộ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const NewsCategoriesSection = () => {
  const categories = [
    { label: "Nghiên cứu & Phát triển", icon: "🔬", color: "from-blue-50 to-white" },
    { label: "Thị trường & Xuất khẩu", icon: "🌍", color: "from-green-50 to-white" },
    { label: "Bền vững & Môi trường", icon: "🌱", color: "from-emerald-50 to-white" },
    { label: "Đối tác & Cộng đồng", icon: "🤝", color: "from-purple-50 to-white" },
  ];
  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <div className="container mx-auto px-6 max-w-6xl grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => (
          <div
            key={cat.label}
            className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${cat.color} p-6 shadow-sm`}
          >
            <div className="text-3xl mb-3">{cat.icon}</div>
            <h3 className="text-lg font-semibold text-slate-900">{cat.label}</h3>
            <p className="text-sm text-slate-500 mt-2">
              Khám phá các bài viết liên quan tới {cat.label.toLowerCase()}.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

const LatestArticlesSection = ({
  articles,
  locale,
}: {
  articles: NewsArticle[];
  locale: string;
}) => {
  if (!articles.length) {
    return (
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-4xl text-center text-slate-500">
          Chưa có bài viết mới. Vui lòng quay lại sau.
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Tin tức mới nhất</h2>
            <p className="text-slate-500">Cập nhật liên tục từ đội ngũ của chúng tôi</p>
          </div>
          <span className="px-4 py-2 rounded-full border border-slate-200 text-sm text-slate-600">
            {articles.length} bài viết
          </span>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article._id}
              href={`/${locale}/news/${article.slug}`}
              className="border border-slate-200 rounded-2xl p-6 flex flex-col gap-3 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  {article.category || "Tin tức"}
                </span>
                {article.readTime && <span>{article.readTime}</span>}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 leading-tight">{article.title}</h3>
              <p className="text-slate-600 text-sm line-clamp-3">{article.excerpt}</p>
              <div className="flex items-center justify-between text-sm text-slate-500 mt-auto">
                <span>{article.authorName || "Ban Truyền thông"}</span>
                {article.publishedAt && (
                  <span>{new Date(article.publishedAt).toLocaleDateString("vi-VN")}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const InsightCards = () => {
  const insights = [
    {
      quote:
        "Nông nghiệp số sẽ quyết định năng lực cạnh tranh trong 5 năm tới. Dữ liệu và AI là trọng tâm.",
      author: "Dr. Nguyễn Minh Hạnh",
      role: "Giám đốc R&D",
    },
    {
      quote:
        "Chuỗi cung ứng nông sản tương lai cần minh bạch và truy xuất nguồn gốc thông minh.",
      author: "Trần Quốc Bảo",
      role: "Giám đốc Chuỗi cung ứng",
    },
    {
      quote:
        "Giá trị thương hiệu đến từ câu chuyện bền vững phía sau mỗi sản phẩm chúng ta tạo ra.",
      author: "Phạm Thu Hằng",
      role: "Giám đốc Thương hiệu",
    },
  ];
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-6 max-w-6xl grid gap-6 md:grid-cols-3">
        {insights.map((item) => (
          <div
            key={item.author}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4"
          >
            <p className="text-lg text-slate-700 leading-relaxed italic">“{item.quote}”</p>
            <div>
              <p className="font-semibold text-slate-900">{item.author}</p>
              <p className="text-sm text-slate-500">{item.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const ResearchSpotlightSection = () => {
  const projects = [
    { title: "Công nghệ bảo quản lạnh sâu", tags: ["Bảo quản", "Chuỗi lạnh"], status: "80%" },
    { title: "Bao bì sinh học từ phụ phẩm", tags: ["Bền vững", "Innovation"], status: "Thử nghiệm" },
    { title: "AI dự đoán mùa vụ", tags: ["AI", "SmartFarm"], status: "Triển khai" },
  ];
  return (
    <section className="py-16 md:py-24 bg-slate-900 text-white">
      <div className="container mx-auto px-6 max-w-6xl grid gap-6 md:grid-cols-3">
        {projects.map((project) => (
          <div key={project.title} className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <span className="text-xs uppercase tracking-wide text-white/70">Tiến độ: {project.status}</span>
            <h3 className="text-xl font-semibold mt-3 mb-2">{project.title}</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              {project.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-white/10">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const NewsletterSection = () => (
  <section className="py-16 md:py-24 bg-white">
    <div className="container mx-auto px-6 max-w-4xl text-center">
      <div className="bg-gradient-to-br from-rose-50 to-blue-50 rounded-3xl p-10 border border-slate-100 shadow-xl">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Bản tin chuyên sâu
        </h2>
        <p className="text-slate-600 mb-6">
          Nhận báo cáo, dữ liệu và phân tích độc quyền từ đội ngũ chuyên gia của chúng tôi.
        </p>
        <form className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
          <input
            type="email"
            placeholder="Nhập email công việc của bạn"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
            Đăng ký
          </button>
        </form>
      </div>
    </div>
  </section>
);

const ResourcesSection = () => {
  const resources = [
    { title: "Báo cáo thị trường EU 2024", icon: "📊" },
    { title: "Whitepaper AI trong nông nghiệp", icon: "🤖" },
    { title: "Tài liệu ESG & Bền vững", icon: "🌿" },
  ];
  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <div className="container mx-auto px-6 max-w-6xl grid gap-6 md:grid-cols-3">
        {resources.map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
            <p className="text-sm text-slate-500 mt-2">Tải xuống để tham khảo chi tiết.</p>
          </div>
        ))}
      </div>
    </section>
  );
};

async function fetchNews(locale: string): Promise<NewsArticle[]> {
  const h = headers();
  const host = h.get("host");
  if (!host) return [];
  const proto = h.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}/api/news?locale=${locale}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    console.error("Failed to fetch news", await res.text());
    return [];
  }
  const payload = await res.json();
  return payload?.data ?? [];
}

export default async function NewsPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  if (!locale || !isValidLocale(locale)) {
    notFound();
  }

  const articles = await fetchNews(locale);
  const featured = articles.find((a) => a.isFeatured) || articles[0];
  const latest = featured
    ? articles.filter((article) => article._id !== featured._id)
    : articles;

  return (
    <div className="bg-white min-h-screen">
      <main>
        <HeroSection />
        <FeaturedArticleSection article={featured} locale={locale} />
        <NewsCategoriesSection />
        <LatestArticlesSection articles={latest} locale={locale} />
        <InsightCards />
        <ResearchSpotlightSection />
        <NewsletterSection />
        <ResourcesSection />
      </main>
    </div>
  );
}

