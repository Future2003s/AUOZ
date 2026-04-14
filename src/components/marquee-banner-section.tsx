import { Star, Leaf, Globe } from "lucide-react";

interface MarqueeBannerProps {
  items?: string[];
  backgroundColor?: string;
  textColor?: string;
}

import useTranslations from "@/i18n/useTranslations";

export const MarqueeBannerSection: React.FC<MarqueeBannerProps> = ({
  items,
  backgroundColor = "#fff1f2",
  textColor = "#9f1239",
}) => {
  const t = useTranslations();
  const bannerItems =
    items && items.length > 0
      ? items
      : [
        t("marquee.item1") || "🍒 Vĩnh Lập - Đất Vải Thanh Hà",
        t("marquee.item2") || "⭐ Hương Vị Độc Bản",
        t("marquee.item3") || "🌏 Xuất Khẩu Nhật Bản",
        t("marquee.item4") || "✨ 100% Vải Tươi Tuyển Chọn",
        t("marquee.item5") || "🏆 Chứng Nhận Chất Lượng",
        t("marquee.item6") || "💝 Quà Tặng Sang Trọng",
        t("marquee.item7") || "🚚 Giao Hàng Toàn Quốc",
        t("marquee.item8") || "👥 10,000+ Khách Hàng Hài Lòng",
      ];
  const marqueeContent = [...bannerItems, ...bannerItems];

  // Icon mapping for different message types
  const getIcon = (item: string) => {
    // English mapping fallback
    if (item.includes("Vĩnh Lập") || item.includes("Đất Vải") || item.includes("Vinh Lap") || item.includes("ヴィンラップ")) {
      return <Leaf size={18} className="text-rose-500 fill-rose-200" />;
    }
    if (item.includes("Xuất Khẩu") || item.includes("Nhật Bản") || item.includes("Exported") || item.includes("Japan") || item.includes("輸出")) {
      return <Globe size={18} className="text-rose-500" />;
    }
    if (item.includes("Hương Vị") || item.includes("Độc Bản") || item.includes("Flavor") || item.includes("味わい")) {
      return <Star size={18} className="text-yellow-400 fill-yellow-300" />;
    }
    return <Star size={16} className="text-rose-300 fill-current" />;
  };
  return (
    <section
      className="py-4 border-y border-rose-200/80"
      style={{ backgroundColor }}
    >
      <div className="relative flex overflow-x-hidden" style={{ color: textColor }}>
        <div className="py-2 animate-marquee whitespace-nowrap flex items-center">
          {marqueeContent.map((item, index) => {
            // Remove emoji from text if present (we'll use icon instead)
            const cleanText = item.replace(/[🍒⭐🌏✨🏆💝🚚👥]/g, '').trim();
            return (
              <div key={index} className="flex items-center gap-2">
                {getIcon(item)}
                <span className="text-base md:text-lg mx-6 font-serif font-semibold">
                  {cleanText}
                </span>
              </div>
            );
          })}
        </div>
        <div className="absolute top-0 py-2 animate-marquee2 whitespace-nowrap flex items-center">
          {marqueeContent.map((item, index) => {
            const cleanText = item.replace(/[🍒⭐🌏✨🏆💝🚚👥]/g, '').trim();
            return (
              <div key={index} className="flex items-center gap-2">
                {getIcon(item)}
                <span className="text-base md:text-lg mx-6 font-serif font-semibold">
                  {cleanText}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
