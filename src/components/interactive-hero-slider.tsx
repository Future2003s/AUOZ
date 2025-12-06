"use client";
import { useTranslations } from "@/hooks/useTranslations";
import { ChevronLeft, ChevronRight, Award, Globe, Users, Star } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeroSlideSkeleton } from "@/components/ui/skeleton-loaders";

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
        Vải Thiều <span className="text-rose-300">Vĩnh Lập</span>
      </>
    ),
    subtitle: "Hương vị độc bản không nơi nào có, kết tinh từ đất trời Thanh Hà.",
    ctaText: "Khám phá ngay",
    ctaLink: "#products",
  },
  {
    id: 4,
    imageUrl:
      "https://res.cloudinary.com/duw5dconp/image/upload/v1752657773/banner_4_dmohbb.jpg",
    title: (
      <>
        Mật Ong <span className="text-rose-300">Hoa Vải</span>
      </>
    ),
    subtitle: "Tinh hoa từ những bông hoa vải thiều, ngọt ngào tự nhiên.",
    ctaText: "Xem sản phẩm",
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
  const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const SLIDE_DURATION = 5000; // 5 giây

  // Preload images
  useEffect(() => {
    const preloadImages = async () => {
      const imagePromises = computedSlides.map((slide) => {
        return new Promise<string>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => {
            setImagesLoaded((prev) => new Set([...prev, slide.imageUrl]));
            resolve(slide.imageUrl);
          };
          img.onerror = reject;
          img.src = slide.imageUrl;
        });
      });

      try {
        await Promise.all(imagePromises);
        setIsLoading(false);
      } catch (error) {
        console.error("Error preloading images:", error);
        setIsLoading(false); // Still show slider even if some images fail
      }
    };

    if (computedSlides.length > 0) {
      preloadImages();
    }
  }, [computedSlides]);

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

  // Enhanced touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isDragging.current = true;
    resetTimeout();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    // Prevent default to avoid scrolling while swiping
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX.current);
    const deltaY = Math.abs(touch.clientY - touchStartY.current);
    
    // Only prevent default if horizontal swipe is more dominant
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const touch = e.changedTouches[0];
    const deltaX = touchStartX.current - touch.clientX;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);
    
    // Only trigger swipe if horizontal movement is dominant
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 50) {
      if (deltaX > 50) {
        handleNext();
      } else if (deltaX < -50) {
        handlePrev();
      } else {
        timerRef.current = setTimeout(handleNext, SLIDE_DURATION);
      }
    } else {
      timerRef.current = setTimeout(handleNext, SLIDE_DURATION);
    }
  };

  // Show skeleton while loading
  if (isLoading) {
    return <HeroSlideSkeleton />;
  }

  return (
    <section
      className="relative h-screen w-full overflow-hidden text-white cursor-grab active:cursor-grabbing"
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseUp={(e) => handleDragEnd(e.clientX)}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
            {/* Use Next.js Image for better optimization, especially on mobile */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <Image
                src={slide.imageUrl}
                alt={typeof slide.title === 'string' ? slide.title : `Hero slide ${index + 1}`}
                fill
                priority={index === 0}
                quality={85}
                sizes="100vw"
                className={`object-cover transition-all duration-1000 ease-in-out ${
                  index === currentIndex ? "animate-ken-burns" : ""
                }`}
                style={{
                  objectPosition: "center",
                }}
                onLoad={() => {
                  setImagesLoaded((prev) => new Set([...prev, slide.imageUrl]));
                }}
              />
            </div>
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
        <div className="max-w-2xl relative z-[31] w-full">
          {/* Badges - USP */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 mb-4 sm:mb-6 animate-slide-up-text">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold pointer-events-auto">
              <Globe size={14} className="sm:w-4 sm:h-4" />
              <span>Xuất khẩu Nhật Bản</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-rose-600/90 backdrop-blur-sm border border-rose-400/50 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold pointer-events-auto">
              <Award size={14} className="sm:w-4 sm:h-4" />
              <span>Chứng nhận chất lượng</span>
            </div>
          </div>

          {/* Highlight - Vĩnh Lập */}
          <div className="overflow-hidden mb-3 sm:mb-4">
            <div
              className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500/90 to-orange-500/90 backdrop-blur-sm text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-bold shadow-lg animate-slide-up-text pointer-events-auto"
              style={{ animationDelay: "0.1s" }}
            >
              <Star size={16} className="sm:w-5 sm:h-5 fill-yellow-300 text-yellow-300" />
              <span>Vải thiều Vĩnh Lập - Hương vị độc bản</span>
            </div>
          </div>

          <div className="overflow-hidden">
            <h1
              key={`title-${computedSlides[currentIndex]?.id ?? currentIndex}`}
              className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-bold animate-slide-up-text leading-tight px-2"
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
              className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg lg:text-xl max-w-xl mx-auto md:mx-0 animate-slide-up-text px-2"
              style={{ animationDelay: "0.2s" }}
            >
              {computedSlides[currentIndex]?.subtitle || ""}
            </p>
          </div>

          {/* Stats - Số liệu ấn tượng */}
          <div className="overflow-hidden mt-4 sm:mt-6">
            <div
              className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 md:gap-6 animate-slide-up-text pointer-events-auto"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 sm:px-4 py-2">
                <Users size={18} className="sm:w-5 sm:h-5 text-yellow-300" />
                <div className="text-left">
                  <div className="text-lg sm:text-xl font-bold text-white">10,000+</div>
                  <div className="text-xs sm:text-sm text-white/80">Khách hàng hài lòng</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 sm:px-4 py-2">
                <Star size={18} className="sm:w-5 sm:h-5 text-yellow-300 fill-yellow-300" />
                <div className="text-left">
                  <div className="text-lg sm:text-xl font-bold text-white">5.0</div>
                  <div className="text-xs sm:text-sm text-white/80">Đánh giá trung bình</div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden text-center md:text-left">
            <a
              href={computedSlides[currentIndex]?.ctaLink || "#"}
              key={`cta-${computedSlides[currentIndex]?.id ?? currentIndex}`}
              className="mt-6 sm:mt-8 inline-block bg-white text-slate-800 font-bold px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-full shadow-lg hover:bg-rose-100 active:scale-95 transition-all duration-300 transform hover:scale-105 animate-slide-up-text pointer-events-auto text-sm sm:text-base"
              style={{ animationDelay: "0.4s" }}
            >
              {computedSlides[currentIndex]?.ctaText || "Khám phá"}
            </a>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-[40] p-3 sm:p-4 md:p-6 safe-area-inset">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
          {/* Thumbnails */}
          <div className="flex items-end gap-1 sm:gap-2 md:gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide max-w-full">
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
                  alt={slide.subtitle || "Hero slide thumbnail"}
                  className={`w-12 h-16 sm:w-16 sm:h-20 md:w-20 md:h-24 object-cover transition-all duration-300 ease-in-out flex-shrink-0 ${
                    currentIndex === index
                      ? "sm:w-18 sm:h-22 md:w-24 md:h-32 opacity-100"
                      : "opacity-60 group-hover:opacity-100"
                  }`}
                  loading="lazy"
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
          <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
            <span className="font-mono text-sm sm:text-base md:text-lg">
              0{currentIndex + 1} / 0{computedSlides.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="p-2.5 sm:p-3 border border-white/30 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors touch-manipulation"
                aria-label="Previous slide"
              >
                <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="p-2.5 sm:p-3 border border-white/30 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors touch-manipulation"
                aria-label="Next slide"
              >
                <ChevronRight size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
