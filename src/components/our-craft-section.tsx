"use client";
import { handleImageError } from "@/utils/handleImageError";
import { FadeInWhenVisible } from "./fade-in-visiable";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import useTranslations from "@/i18n/useTranslations";

export type CraftStep = {
  title: string;
  description?: string;
  imageUrl?: string;
};

interface OurCraftSectionProps {
  heading?: string;
  subheading?: string;
  steps?: CraftStep[];
}



export const OurCraftSection: React.FC<OurCraftSectionProps> = ({
  heading,
  subheading,
  steps,
}) => {
  const t = useTranslations();
  const displayHeading = t("site.craft_section") || "Quy Trình Sáng Tạo";
  const displaySubheading = t("site.craft_subheading") || "Hành trình từ trái vải tươi ngon đến sản phẩm tinh hoa trên tay bạn.";

  const defaultSteps: CraftStep[] = [
    {
      title: t("our_craft.steps.step1.title") || "Tuyển Chọn Tinh Tế",
      description: t("our_craft.steps.step1.description") || "Từng trái vải được lựa chọn thủ công từ những khu vườn đạt chuẩn, đảm bảo độ chín mọng và hương vị ngọt ngào nhất.",
      imageUrl: "https://images.unsplash.com/photo-1552010099-5dc86fcfaa38?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODB8fGZydWl0c3xlbnwwfHwwfHx8MA%3D%3D",
    },
    {
      title: t("our_craft.steps.step2.title") || "Chế Biến Tỉ Mỉ",
      description: t("our_craft.steps.step2.description") || "Quy trình sản xuất khép kín, ứng dụng công nghệ hiện đại để giữ trọn vẹn dưỡng chất và hương vị tự nhiên của trái vải.",
      imageUrl: "https://plus.unsplash.com/premium_photo-1700145523324-1da4b9000d80?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODV8fGZydWl0c3xlbnwwfHwwfHx8MA%3D%3D",
    },
    {
      title: t("our_craft.steps.step3.title") || "Đóng Gói Sang Trọng",
      description: t("our_craft.steps.step3.description") || "Mỗi sản phẩm là một tác phẩm nghệ thuật, được khoác lên mình bao bì đẳng cấp, tinh xảo trong từng chi tiết.",
      imageUrl: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?q=80&w=800&auto=format&fit=crop",
    },
  ];


  const stepsToUse = (steps && steps.length > 0 ? steps : defaultSteps).map((step, index) => {
    // Override text with translating keys for the first 3 steps
    if (index === 0) return { ...step, title: t("our_craft.steps.step1.title") || step.title, description: t("our_craft.steps.step1.description") || step.description };
    if (index === 1) return { ...step, title: t("our_craft.steps.step2.title") || step.title, description: t("our_craft.steps.step2.description") || step.description };
    if (index === 2) return { ...step, title: t("our_craft.steps.step3.title") || step.title, description: t("our_craft.steps.step3.description") || step.description };
    return step;
  });

  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <section
      id="craft"
      className="py-24 bg-rose-50/50 container m-auto rounded-t-2xl"
    >
      <FadeInWhenVisible>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-800">
              {displayHeading}
            </h2>
            <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
              {displaySubheading}
            </p>
            <p className="mt-2 text-sm text-slate-400 italic">
              {t("our_craft.click_hint") || "(Nhấp vào từng bước để xem chi tiết)"}
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-xl">
              {stepsToUse.map((step, index) => (
                <img
                  key={index}
                  src={
                    step.imageUrl ||
                    "https://images.unsplash.com/photo-1552010099-5dc86fcfaa38?w=500&auto=format&fit=crop&q=60"
                  }
                  alt={step.title}
                  onError={handleImageError}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${index === activeIndex ? "opacity-100" : "opacity-0"
                    }`}
                />
              ))}
            </div>
            <div className="flex flex-col space-y-4">
              {stepsToUse.map((step, index) => (
                <div
                  key={index}
                  className={`group p-6 rounded-xl cursor-pointer transition-all duration-300 ${activeIndex === index
                      ? "bg-white shadow-lg"
                      : "bg-transparent hover:bg-white/50 hover:shadow-md"
                    }`}
                  onClick={() => setActiveIndex(index)}
                >
                  <div className="flex items-start">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mr-6 transition-colors flex-shrink-0 ${activeIndex === index
                          ? "bg-rose-500 text-white"
                          : "bg-rose-200 text-rose-600 group-hover:bg-rose-300"
                        }`}
                    >
                      <span className="font-bold text-lg">{`0${index + 1
                        }`}</span>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-center">
                        <h3 className="font-serif text-2xl font-bold text-slate-800">
                          {step.title}
                        </h3>
                        <ArrowRight
                          size={24}
                          className={`transition-transform duration-300 text-rose-400 group-hover:text-rose-600 ${activeIndex === index ? "rotate-90" : ""
                            }`}
                        />
                      </div>
                      <div
                        className={`grid transition-all duration-500 ease-in-out ${activeIndex === index
                            ? "grid-rows-[1fr] opacity-100 pt-1"
                            : "grid-rows-[0fr] opacity-0"
                          }`}
                      >
                        <div className="overflow-hidden">
                          <p className="text-slate-600">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeInWhenVisible>
    </section>
  );
};
