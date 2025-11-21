import { Star } from "lucide-react";

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
          "100% Vải Tươi Tuyển Chọn",
          "Công Thức Độc Quyền",
          "Quà Tặng Sang Trọng",
          "Giao Hàng Toàn Quốc",
          "Chất Lượng Hàng Đầu",
        ];
  const marqueeContent = [...bannerItems, ...bannerItems];
  return (
    <section
      className="py-4 border-y border-rose-200/80"
      style={{ backgroundColor }}
    >
      <div className="relative flex overflow-x-hidden" style={{ color: textColor }}>
        <div className="py-2 animate-marquee whitespace-nowrap flex items-center">
          {marqueeContent.map((item, index) => (
            <div key={index} className="flex items-center">
              <span className="text-base md:text-lg mx-8 font-serif">
                {item}
              </span>
              <Star size={16} className="text-rose-300 fill-current" />
            </div>
          ))}
        </div>
        <div className="absolute top-0 py-2 animate-marquee2 whitespace-nowrap flex items-center">
          {marqueeContent.map((item, index) => (
            <div key={index} className="flex items-center">
              <span className="text-base md:text-lg mx-8 font-serif">
                {item}
              </span>
              <Star size={16} className="text-rose-300 fill-current" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
