import { Star, Leaf, Globe } from "lucide-react";

interface MarqueeBannerProps {
  items?: string[];
  backgroundColor?: string;
  textColor?: string;
}

export const MarqueeBannerSection: React.FC<MarqueeBannerProps> = ({
  items,
  backgroundColor = "#fff1f2",
  textColor = "#9f1239",
}) => {
  const bannerItems =
    items && items.length > 0
      ? items
      : [
          "🍒 Vĩnh Lập - Đất Vải Thanh Hà",
          "⭐ Hương Vị Độc Bản",
          "🌏 Xuất Khẩu Nhật Bản",
          "✨ 100% Vải Tươi Tuyển Chọn",
          "🏆 Chứng Nhận Chất Lượng",
          "💝 Quà Tặng Sang Trọng",
          "🚚 Giao Hàng Toàn Quốc",
          "👥 10,000+ Khách Hàng Hài Lòng",
        ];
  const marqueeContent = [...bannerItems, ...bannerItems];
  
  // Icon mapping for different message types
  const getIcon = (item: string) => {
    if (item.includes("Vĩnh Lập") || item.includes("Đất Vải")) {
      return <Leaf size={18} className="text-rose-500 fill-rose-200" />;
    }
    if (item.includes("Xuất Khẩu") || item.includes("Nhật Bản")) {
      return <Globe size={18} className="text-rose-500" />;
    }
    if (item.includes("Hương Vị") || item.includes("Độc Bản")) {
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
