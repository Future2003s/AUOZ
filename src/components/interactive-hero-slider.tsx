"use client";
import { useTranslations } from "@/hooks/useTranslations";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type HeroSlide = {
  id?: string | number;
  imageUrl: string;
  title: React.ReactNode | string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  overlayOpacity?: number;
};

const heroSlides: HeroSlide[] = [
  {
    id: 1,
    imageUrl:
      "https://res.cloudinary.com/duw5dconp/image/upload/v1752657773/banner_1_xqhehz.jpg",
    title: (
      <>
        {/* fallback title in case translation missing */}
        Tinh hoa từ <span className="text-rose-300">Trái Vải</span>
      </>
    ),
    subtitle:
      "Khám phá bộ sưu tập sản phẩm cao cấp được chế tác từ những trái vải tươi ngon và tinh khiết nhất.",
    ctaText: "Khám phá bộ sưu tập",
    ctaLink: "#products",
  },
  {
    id: 2,
    imageUrl:
      "https://res.cloudinary.com/duw5dconp/image/upload/v1752657773/banner_2_uswdjc.jpg",
    title: (
      <>
        {/* static fallback; text below will be overridden by t("home.hero_title") in render */}
        Bộ Sưu Tập <span className="text-rose-300">Quà Tặng Mới</span>
      </>
    ),
    subtitle: "Món quà ý nghĩa và sang trọng cho những người bạn trân quý.",
    ctaText: "Xem ngay",
    ctaLink: "#collections",
  },
  {
    id: 3,
    imageUrl:
      "https://res.cloudinary.com/duw5dconp/image/upload/v1752657773/banner_3_n36dif.jpg",
    title: (
      <>
        Trà Vải <span className="text-rose-300">Thượng Hạng</span>
      </>
    ),
    subtitle: "Trải nghiệm hương vị độc đáo, đánh thức mọi giác quan.",
    ctaText: "Thử ngay",
    ctaLink: "#products",
  },
  {
    id: 4,
    imageUrl:
      "https://res.cloudinary.com/duw5dconp/image/upload/v1752657773/banner_4_dmohbb.jpg",
    title: (
      <>
        Trà Vải <span className="text-rose-300">Thượng Hạng</span>
      </>
    ),
    subtitle: "Trải nghiệm hương vị độc đáo, đánh thức mọi giác quan.",
    ctaText: "Thử ngay",
    ctaLink: "#products",
  },
];

interface InteractiveHeroSliderProps {
  slides?: HeroSlide[];
}

// Helper to fix common HTML typos and ensure valid HTML
const fixHtmlString = (html: string): string => {
  if (!html || typeof html !== 'string') return html;
  // Fix common typos in className
  return html
    .replace(/className="tex\s/g, 'className="text ')
    .replace(/className='tex\s/g, "className='text ");
};

export const InteractiveHeroSlider: React.FC<InteractiveHeroSliderProps> = ({
  slides,
}) => {
  const t = useTranslations();
  const computedSlides = useMemo(
    () => {
      if (slides && slides.length > 0) {
        // Filter out slides without valid imageUrl
        const validSlides = slides
          .filter((slide) => slide.imageUrl && slide.imageUrl.trim() !== "")
          .map((slide, index) => ({
            id: slide.id ?? index,
            imageUrl: slide.imageUrl || "",
            title: slide.title || "",
            subtitle: slide.subtitle || "",
            ctaText: slide.ctaText || "Khám phá",
            ctaLink: slide.ctaLink || "#products",
            overlayOpacity:
              typeof slide.overlayOpacity === "number"
                ? slide.overlayOpacity
                : 0.4,
          }));
        // If no valid slides, fallback to default
        return validSlides.length > 0 ? validSlides : heroSlides;
      }
      return heroSlides;
    },
    [slides]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const SLIDE_DURATION = 5000; // 5 giây

  const resetTimeout = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex(
      (prevIndex) => (prevIndex + 1) % computedSlides.length
    );
  }, [computedSlides.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(
      (prevIndex) =>
        (prevIndex - 1 + computedSlides.length) % computedSlides.length
    );
  }, [computedSlides.length]);

  useEffect(() => {
    resetTimeout();
    timerRef.current = setTimeout(handleNext, SLIDE_DURATION);
    return () => resetTimeout();
  }, [currentIndex, handleNext, resetTimeout]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleDragStart = (clientX: number) => {
    isDragging.current = true;
    dragStartX.current = clientX;
    resetTimeout();
    document.body.style.cursor = "grabbing";
  };

  const handleDragEnd = (clientX: number) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.body.style.cursor = "default";

    const dragDistance = dragStartX.current - clientX;
    if (dragDistance > 50) {
      handleNext();
    } else if (dragDistance < -50) {
      handlePrev();
    } else {
      // If not dragged far enough, restart timer
      timerRef.current = setTimeout(handleNext, SLIDE_DURATION);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging.current) {
      isDragging.current = false;
      document.body.style.cursor = "default";
      timerRef.current = setTimeout(handleNext, SLIDE_DURATION);
    }
  };

  return (
    <section
      className="relative h-screen w-full overflow-hidden text-white cursor-grab active:cursor-grabbing"
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseUp={(e) => handleDragEnd(e.clientX)}
      onMouseLeave={handleMouseLeave}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
      suppressHydrationWarning
    >
      {/* Main Slides */}
      {computedSlides.map((slide, index) => {
        const slideId = typeof slide.id === 'string' || typeof slide.id === 'number' 
          ? String(slide.id) 
          : `slide-${index}`;
        return (
          <div
            key={slideId}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? "opacity-100 z-[1]" : "opacity-0 z-0"
            }`}
          >
            <div
              className={`absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-1000 ease-in-out ${
                index === currentIndex ? "animate-ken-burns" : ""
              }`}
              style={{ backgroundImage: `url(${slide.imageUrl})` }}
            />
            <div
              className="absolute inset-0 bg-black z-[2]"
              style={{
                opacity:
                  typeof slide.overlayOpacity === "number"
                    ? slide.overlayOpacity
                    : 0.4,
              }}
            ></div>
          </div>
        );
      })}

      {/* Content */}
      <div className="relative z-[30] container mx-auto px-4 sm:px-6 h-full flex flex-col justify-center items-center text-center md:items-start md:text-left pointer-events-none">
        <div className="max-w-2xl relative z-[31]">
          <div className="overflow-hidden">
            <h1
              key={`title-${computedSlides[currentIndex]?.id ?? currentIndex}`}
              className="font-serif text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold animate-slide-up-text leading-tight"
            >
              {/* Render title - if it's a string with HTML, parse it; otherwise render as ReactNode */}
              {typeof computedSlides[currentIndex]?.title === 'string' && 
               computedSlides[currentIndex]?.title?.includes('<') ? (
                <span dangerouslySetInnerHTML={{ __html: fixHtmlString(computedSlides[currentIndex]?.title as string) }} />
              ) : (
                computedSlides[currentIndex]?.title || ""
              )}
            </h1>
          </div>
          <div className="overflow-hidden">
            <p
              key={`subtitle-${computedSlides[currentIndex]?.id ?? currentIndex}`}
              className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl max-w-xl animate-slide-up-text"
              style={{ animationDelay: "0.2s" }}
            >
              {computedSlides[currentIndex]?.subtitle || ""}
            </p>
          </div>
          <div className="overflow-hidden">
            <a
              href={computedSlides[currentIndex]?.ctaLink || "#"}
              key={`cta-${computedSlides[currentIndex]?.id ?? currentIndex}`}
              className="mt-6 sm:mt-8 inline-block bg-white text-slate-800 font-bold px-6 sm:px-10 py-3 sm:py-4 rounded-full shadow-lg hover:bg-rose-100 transition-all duration-300 transform hover:scale-105 animate-slide-up-text pointer-events-auto text-sm sm:text-base"
              style={{ animationDelay: "0.4s" }}
            >
              {computedSlides[currentIndex]?.ctaText || "Khám phá"}
            </a>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-[40] p-3 sm:p-4 md:p-6">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
          {/* Thumbnails */}
          <div className="flex items-end gap-1 sm:gap-2 md:gap-3">
            {computedSlides.map((slide, index) => (
              <div
                  key={slide.id ?? index}
                className="cursor-pointer group relative overflow-hidden rounded-md"
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(index);
                }}
              >
                <Image
                  width={100}
                  height={100}
                  src={slide.imageUrl}
                  alt={slide.subtitle}
                  className={`w-12 h-16 sm:w-16 sm:h-20 md:w-20 md:h-24 object-cover transition-all duration-300 ease-in-out ${
                    currentIndex === index
                      ? "sm:w-18 sm:h-22 md:w-24 md:h-32"
                      : "opacity-60 group-hover:opacity-100"
                  }`}
                />
                {currentIndex === index && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-white/30">
                    <div
                      key={currentIndex}
                      className="h-full bg-white animate-progress-bar"
                      style={{ animationDuration: `${SLIDE_DURATION}ms` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Arrows & Counter */}
          <div className="flex items-center gap-4 md:gap-6">
            <span className="font-mono text-base md:text-lg">
              0{currentIndex + 1} / 0{computedSlides.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="p-3 border border-white/30 rounded-full hover:bg-white/20 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="p-3 border border-white/30 rounded-full hover:bg-white/20 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
