"use client";
import { useState } from "react";
import { FadeInWhenVisible } from "./fade-in-visiable";
import Image from "next/image";
import { handleImageError } from "@/utils/handleImageError";

type CollectionSlide = {
  id: number;
  imageUrl: string;
  title: string;
  category: string;
};

import useTranslations from "@/i18n/useTranslations";

export const CollectionSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const t = useTranslations();
  
  const collectionSlides: CollectionSlide[] = [
    {
      id: 1,
      imageUrl:
        "https://res.cloudinary.com/duw5dconp/image/upload/v1752658344/DO_VAI_l6xevs.jpg",
      title: t("collection.items.item1.title") || "Thu Hoạch Vải",
      category: t("collection.items.item1.category") || "Năng lượng tích cực cùng mọi người thu hoạch.",
    },
    {
      id: 2,
      imageUrl:
        "https://res.cloudinary.com/duw5dconp/image/upload/v1752658344/HAI_VAI_sxr3qj.jpg",
      title: t("collection.items.item2.title") || "Tinh Tế Trong Từng Công Đoạn",
      category: t("collection.items.item2.category") || "Lựa chọn những trái vải tốt nhất.",
    },
    {
      id: 3,
      imageUrl:
        "https://res.cloudinary.com/duw5dconp/image/upload/v1752658345/HAI_VAI_ANH_NANG_naxaqz.jpg",
      title: t("collection.items.item3.title") || "Kết Hợp Với Ánh Nắng Mặt Trời",
      category: t("collection.items.item3.category") || "Phơi khô tự nhiên để giữ trọn hương vị.",
    },
    {
      id: 4,
      imageUrl:
        "https://res.cloudinary.com/duw5dconp/image/upload/v1752658344/THAM_VAI_eirspj.jpg",
      title: t("collection.items.item4.title") || "Thành Quả Ngọt Ngào",
      category: t("collection.items.item4.category") || "Những trái vải khô mọng, sẵn sàng để chế biến.",
    },
    {
      id: 5,
      imageUrl:
        "https://res.cloudinary.com/duw5dconp/image/upload/v1752658344/DO_VAI_2_j4boul.jpg",
      title: t("collection.items.item5.title") || "Đóng Gói",
      category: t("collection.items.item5.category") || "Sản phẩm được đóng gói tỉ mỉ và sang trọng.",
    },
  ];

  return (
    <section id="collections" className="py-24 bg-white overflow-hidden">
      <FadeInWhenVisible>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-800">
              {t("collection.title") || "Bộ Sưu Tập Đặc Biệt"}
            </h2>
            <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
              {t("collection.subtitle") || "Khám phá những dòng sản phẩm độc đáo được sáng tạo dành riêng cho bạn."}
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Stack */}
            <div className="space-y-4">
              {collectionSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`p-6 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                    currentIndex === index
                      ? "bg-rose-50 border-rose-500 shadow-lg"
                      : "bg-slate-50 border-transparent hover:border-rose-200 hover:bg-white"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                >
                  <p className="text-sm font-bold tracking-widest uppercase text-rose-400">
                    {slide.category}
                  </p>
                  <h3 className="text-2xl font-serif font-bold mt-1 text-slate-800">
                    {slide.title}
                  </h3>
                </div>
              ))}
            </div>

            {/* Right Column: Image Display */}
            <div className="relative w-full h-[600px] flex items-center justify-center">
              {collectionSlides.map((slide, index) => {
                return (
                  <div
                    key={slide.id}
                    className={`absolute w-full h-full transition-opacity duration-700 ease-in-out ${
                      currentIndex === index ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Image
                      width={1000}
                      height={1000}
                      src={slide.imageUrl}
                      alt={slide.title}
                      onError={handleImageError}
                      className="w-full h-full object-cover rounded-2xl shadow-2xl"
                      quality={100}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </FadeInWhenVisible>
    </section>
  );
};
