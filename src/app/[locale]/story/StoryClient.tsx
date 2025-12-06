"use client";
import React, { useEffect, useRef, useState } from "react";
import CauChuyenTroVeBg from "../../../../public/images/cauChuyenBackGround.jpg";
import BonBeSongNuoc from "../../../../public/images/songNuocBonBe.png";
import CayVaiToThanhHa from "../../../../public/images/cayVaiToThanhHa.png"
import VaiThieuChinDo from "../../../../public/images/gocVaiTrai.jpg"
import CanhDongVai from "../../../../public/images/canhDongVai.jpg"
// using public path for Next/Image
import { Playfair_Display, Great_Vibes } from "next/font/google";
import {
  ArrowRight,
  ChevronDown,
  Globe,
  Heart,
  Leaf,
  MapPin,
  Quote,
  X,
} from "lucide-react";
import Image, { StaticImageData } from "next/image";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
});


const useOnScreen = (options: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentRef = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [options]);

  return [ref, isVisible] as const;
};

const FadeIn = ({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
}) => {
  const [ref, isVisible] = useOnScreen({ threshold: 0.1 });

  const translateClass: Record<string, string> = {
    up: "translate-y-8",
    down: "-translate-y-8",
    left: "translate-x-8",
    right: "-translate-x-8",
    none: "",
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0 translate-x-0"
          : `opacity-0 ${translateClass[direction]}`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default function StoryClient() {
  const [modalImage, setModalImage] = useState<{ src: string | StaticImageData; alt: string } | null>(null);

  const openImageModal = (src: string | StaticImageData, alt: string) => {
    setModalImage({ src, alt });
  };

  const closeImageModal = () => {
    setModalImage(null);
  };

  useEffect(() => {
    if (modalImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalImage]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalImage) {
        closeImageModal();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [modalImage]);

  return (
    <div
      className={`${playfair.className} min-h-screen bg-[#FDFBF7] text-stone-800 selection:bg-red-900 selection:text-white overflow-x-hidden`}
    >
      {/* HERO SECTION */}
      <header className="relative h-[100vh] sm:h-[110vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-stone-900">
          <Image
            src={CauChuyenTroVeBg}
            alt="Dòng sông quê hương"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-70 scale-105 animate-slow-pan"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/40 via-transparent to-[#595353]" />
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto mt-12 sm:mt-20">
          <FadeIn direction="down">
            <div className="inline-block mb-4 sm:mb-8">
              <h2 className={`${greatVibes.className} text-[32px] sm:text-[42px] md:text-[60px] lg:text-[80px] xl:text-[100.3px] text-white mb-2 sm:mb-4 drop-shadow-lg tracking-wide italic leading-tight`}>
                Hành Trình Trở Về
              </h2>
              <div className="h-1 sm:h-2 w-24 sm:w-40 bg-gradient-to-r from-red-300 via-red-400 to-red-600 mx-auto rounded-full shadow-lg" />
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="flex flex-col items-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif italic text-amber-100 tracking-wide drop-shadow-md">
                Đánh Thức
              </h1>
              <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-2 sm:mt-4 opacity-70"></div>
              <div className={`${playfair.className} text-red-200/90 italic font-light text-[32px] sm:text-[42px] md:text-[56px] lg:text-[72px] xl:text-[100px] leading-[1.1] mt-3 sm:mt-6 px-2`}>
                Hương Vị <span className="not-italic"><span className={playfair.className}>Đất</span>{" "}</span>Vải
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={400}>
            <p className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-light max-w-2xl mx-auto mb-8 sm:mb-12 md:mb-16 leading-relaxed text-shadow-sm px-4">
              Từ nỗi tự ti của một người con xa xứ, đến khát vọng mang niềm tự hào
              Vĩnh Lập vươn ra thế giới.
            </p>
          </FadeIn>

          <FadeIn delay={600}>
            <div
              className="animate-bounce text-white/70 flex flex-col items-center gap-1 sm:gap-2 cursor-pointer"
              onClick={() =>
                window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
              }
            >
              <span className="text-[10px] sm:text-xs uppercase tracking-widest">Khám phá</span>
              <ChevronDown size={20} className="sm:w-6 sm:h-6" />
            </div>
          </FadeIn>
        </div>
      </header>

      {/* CHƯƠNG 1 */}
      <section className="py-12 sm:py-16 md:py-24 lg:py-40 container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="grid md:grid-cols-12 gap-8 sm:gap-10 md:gap-12 items-center">
          <div className="md:col-span-5 relative order-2 md:order-1">
            <FadeIn direction="right">
              <div className="relative z-10">
                <div 
                  className="aspect-[4/5] rounded-sm overflow-hidden shadow-2xl cursor-pointer"
                  onClick={() => openImageModal(BonBeSongNuoc, "Vườn vải Vĩnh Lập mênh mông")}
                >
                  <Image
                    src={BonBeSongNuoc}
                    alt="Vườn vải Vĩnh Lập mênh mông"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 grayscale-[10%]"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1596549925433-e794939a9c43?q=80&w=1974&auto=format&fit=crop";
                    }}
                  />
                </div>
                {/* Mobile location card */}
                <div className="mt-4 sm:mt-6 md:hidden bg-[#FDFBF7] p-4 shadow-lg border-l-4 border-[#8B1E24]">
                  <div className="flex items-center gap-2 text-[#8B1E24] mb-2">
                    <MapPin size={14} />
                    <span className="font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                      Vĩnh Lập, Thanh Hà
                    </span>
                  </div>
                  <p className="text-stone-600 text-xs font-serif italic">
                    &quot;Bốn bề là sông nước, người dân quanh năm vất vả...&quot;
                  </p>
                </div>
                {/* Desktop location card */}
                <div className="absolute -bottom-8 -left-8 bg-[#FDFBF7] p-6 shadow-xl border-l-4 border-[#8B1E24] max-w-xs hidden md:block">
                  <div className="flex items-center gap-2 text-[#8B1E24] mb-2">
                    <MapPin size={16} />
                    <span className="font-bold text-xs uppercase tracking-widest">
                      Vĩnh Lập, Thanh Hà
                    </span>
                  </div>
                  <p className="text-stone-600 text-sm font-serif italic">
                    &quot;Bốn bề là sông nước, người dân quanh năm vất vả...&quot;
                  </p>
                </div>
              </div>
              <div className="absolute top-10 -right-10 w-full h-full border border-stone-200 -z-10 rounded-sm hidden md:block" />
            </FadeIn>
          </div>

          <div className="md:col-span-7 md:pl-8 lg:pl-16 order-1 md:order-2">
            <FadeIn>
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <span className="h-px w-8 sm:w-12 bg-[#8B1E24]" />
                <h2 className="text-[10px] sm:text-xs font-bold text-[#8B1E24] tracking-[0.2em] uppercase">
                  Chương I
                </h2>
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif font-extrabold text-stone-950 mb-6 sm:mb-8 leading-tight tracking-tight">
                Vùng Đất <br />
                <span className="text-[#8B1E24] drop-shadow-sm">Đẹp Nhưng Nghèo</span>
              </h3>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="prose prose-stone prose-sm sm:prose-base md:prose-lg text-stone-800 text-justify">
                <p className="mb-4 sm:mb-6 leading-6 sm:leading-7 md:leading-8 text-sm sm:text-base md:text-lg">
                  Tôi sinh ra và lớn lên tại Vĩnh Lập – Thanh Hà – Hải Dương, cái
                  nôi của cây vải thiều. Nhưng ngày ấy, tôi chỉ thấy sự nhọc
                  nhằn. Vùng đất này đẹp, nhưng giao thương hạn chế, đời sống
                  người dân thiếu thốn đủ bề.
                </p>
                <p className="leading-6 sm:leading-7 md:leading-8 border-l-2 border-[#8B1E24]/60 pl-4 sm:pl-6 italic text-stone-700 bg-stone-100 py-3 sm:py-4 pr-3 sm:pr-4 font-medium text-sm sm:text-base md:text-lg">
                  &quot;Có một thời, tôi từng tự ti về quê hương mình đến mức không
                  dám nói với bạn bè rằng mình đến từ Vĩnh Lập.&quot;
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CHƯƠNG 2 */}
      <section className="py-12 sm:py-16 md:py-24 lg:py-32 bg-[#F5F2EB] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 sm:p-16 md:p-20 opacity-5">
          <Leaf size={300} className="sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 md:mb-20">
            <FadeIn direction="up">
              <h2 className="text-[10px] sm:text-xs font-bold text-[#8B1E24] tracking-[0.2em] uppercase mb-3 sm:mb-4">
                Chương II
              </h2>
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-stone-900 px-2">
                Góc Nhìn Từ Xứ Người
              </h3>
            </FadeIn>
          </div>

          <div className="grid md:grid-cols-2 gap-10 sm:gap-12 md:gap-16 items-start">
            <FadeIn delay={200} className="space-y-6 sm:space-y-8">
              <div className="text-stone-700 text-sm sm:text-base md:text-lg leading-6 sm:leading-7 md:leading-8 text-justify">
                <p className="first-letter:text-3xl sm:first-letter:text-4xl md:first-letter:text-5xl first-letter:font-serif first-letter:text-[#8B1E24] first-letter:mr-2 sm:first-letter:mr-3 first-letter:float-left">
                  Mười năm du học và làm việc tại Nhật Bản là khoảng thời gian
                  thay đổi cuộc đời tôi. Tại đó, tôi gặp người bạn đời - một cô
                  giáo dạy tiếng Nhật.
                </p>
                <p className="mt-4 sm:mt-6">
                  Khi cùng nhau trở về Việt Nam, chính ánh mắt của cô ấy đã giúp
                  tôi nhìn lại quê hương mình. Cô chỉ cho tôi thấy vẻ đẹp của tình
                  làng nghĩa xóm, sự bình yên của sông nước, và đặc biệt là{" "}
                  <strong>vị ngon tuyệt hảo của trái vải</strong> mà bấy lâu tôi
                  xem nhẹ.
                </p>
              </div>

              <div className="bg-white p-5 sm:p-6 md:p-8 rounded-sm shadow-sm border-t-4 border-[#8B1E24]">
                <h4 className="font-serif text-lg sm:text-xl font-bold text-stone-900 mb-3 sm:mb-4">
                  Sự Thức Tỉnh
                </h4>
                <ul className="space-y-3 sm:space-y-4">
                  {[
                    "Vẻ đẹp chân chất của con người Vĩnh Lập",
                    "Hương vị vải thiều độc bản không nơi nào có",
                    "Niềm tự hào tiềm ẩn trong sự bình dị",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 sm:gap-3">
                      <Heart
                        size={18}
                        className="sm:w-5 sm:h-5 text-[#8B1E24] flex-shrink-0 mt-0.5 sm:mt-1"
                        fill="#8B1E24"
                        fillOpacity={0.1}
                      />
                      <span className="text-stone-700 text-sm sm:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={400} direction="left">
              <div className="relative">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div
                    className="cursor-pointer"
                    onClick={() => openImageModal("https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=2070&auto=format&fit=crop", "Nhật Bản mùa xuân")}
                  >
                    <Image
                      src="https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=2070&auto=format&fit=crop"
                      width={1035}
                      height={2070}
                      className="rounded-sm shadow-md mt-6 sm:mt-8 md:mt-12 w-full h-40 sm:h-48 md:h-56 lg:h-64 object-cover grayscale-[30%] hover:scale-105 transition-transform duration-300"
                      alt="Nhật Bản mùa xuân"
                      unoptimized
                    />
                  </div>
                  <div
                    className="cursor-pointer"
                    onClick={() => openImageModal(CanhDongVai, "Cánh đồng vải")}
                  >
                    <Image
                      src={CanhDongVai}
                      width={1035}
                      height={2070}
                      className="rounded-sm shadow-md w-full h-40 sm:h-48 md:h-56 lg:h-64 object-cover grayscale-[10%] hover:scale-105 transition-transform duration-300"
                      alt="Cánh đồng vải"
                    />
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-2">
                  <div className="bg-white/90 backdrop-blur px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 rounded-full shadow-lg border border-stone-200">
                    <span className="font-serif italic text-stone-800 text-xs sm:text-sm md:text-base">
                      Tình yêu & Nỗi nhớ
                    </span>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="py-16 sm:py-24 md:py-32 lg:py-40 container mx-auto px-4 sm:px-6 md:px-8">
        <FadeIn>
          <div className="max-w-5xl mx-auto text-center relative px-4 sm:px-6 md:px-8">
            <Quote
              size={50}
              className="sm:w-16 sm:h-16 md:w-20 md:h-20 text-[#F2EBE0] absolute -top-6 sm:-top-8 md:-top-12 -left-2 sm:-left-4 transform -scale-x-100"
            />
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-serif font-medium text-stone-800 leading-relaxed sm:leading-snug px-2 sm:px-0">
              &quot;Chúng tôi mang trái vải quê mình mời bạn bè Nhật Bản. <br className="hidden sm:block" />
              Từ ánh mắt ngạc nhiên của họ, tôi nhận ra: <br className="hidden md:block" />
              <span className="text-[#8B1E24] font-semibold decoration-2 underline-offset-4 sm:underline-offset-8">
                Vùng đất tôi từng tự ti, lại là nơi đáng tự hào nhất.
              </span>
              &quot;
            </h3>
            <div className="mt-8 sm:mt-10 md:mt-12 flex flex-col items-center">
              <div className="w-px h-10 sm:h-12 md:h-16 bg-stone-300 mb-4 sm:mb-5 md:mb-6" />
              <p className="text-stone-500 uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[10px] sm:text-xs font-bold">
                Founder LALA-LYCHEEE
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* CHƯƠNG 3 */}
      <section className="py-12 sm:py-16 md:py-24 bg-[#8B1E24] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />

        <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-10 sm:gap-12 md:gap-16 lg:gap-20 items-center">
            <FadeIn direction="right">
              <div className="relative group perspective-1000 mb-8 md:mb-0">
                {/* Main Image */}
                <div 
                  className="relative rounded-sm overflow-hidden shadow-2xl aspect-[4/3] transform transition-transform duration-700 group-hover:rotate-1 cursor-pointer"
                  onClick={() => openImageModal(VaiThieuChinDo, "Vải thiều chín đỏ")}
                >
                  <Image
                    src={VaiThieuChinDo}
                    alt="Vải thiều chín đỏ"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>

                {/* Small Image - Desktop */}
                <div 
                  className="absolute -bottom-10 -right-6 w-36 h-28 sm:w-40 sm:h-32 md:w-48 md:h-36 border-4 border-white rounded-sm overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-500 z-10 hidden sm:block cursor-pointer"
                  onClick={() => openImageModal(CayVaiToThanhHa, "Cây vải tổ Thanh Hà")}
                >
                  <Image
                    src={CayVaiToThanhHa}
                    alt="Cây vải tổ Thanh Hà"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1504198458649-3128b932f49e?q=80&w=1974&auto=format&fit=crop";
                    }}
                  />
                  <div className="absolute bottom-0 left-0 w-full bg-black/60 text-[8px] sm:text-[10px] text-white p-1 text-center font-bold">
                    Cây Vải Tổ Thanh Hà
                  </div>
                </div>

                {/* Small Image - Mobile */}
                <div 
                  className="mt-4 sm:hidden w-full border-4 border-white rounded-sm overflow-hidden shadow-2xl relative cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => openImageModal(CayVaiToThanhHa, "Cây vải tổ Thanh Hà")}
                >
                  <Image
                    src={CayVaiToThanhHa}
                    alt="Cây vải tổ Thanh Hà"
                    className="w-full h-full object-cover aspect-[4/3]"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1504198458649-3128b932f49e?q=80&w=1974&auto=format&fit=crop";
                    }}
                  />
                  <div className="absolute bottom-0 left-0 w-full bg-black/60 text-xs text-white p-2 text-center font-bold">
                    Cây Vải Tổ Thanh Hà (Nhấn để xem lớn)
                  </div>
                </div>

                <div className="absolute -inset-4 border border-white/20 -z-10 rounded-sm hidden md:block" />
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <Globe className="text-red-300 w-4 h-4 sm:w-5 sm:h-5" />
                <h2 className="text-red-200/80 font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[10px] sm:text-xs">
                  Chương III
                </h2>
              </div>

              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif font-bold mb-6 sm:mb-8 md:mb-10 leading-tight">
                Mang Vải Thiều <br /> Vươn Ra Thế Giới
              </h3>

              <div className="space-y-6 sm:space-y-8 text-white/90 text-sm sm:text-base md:text-lg font-light leading-6 sm:leading-7 md:leading-8">
                <p>
                  Sứ mệnh của LALA-LYCHEEE không chỉ là bán trái cây. Đó là hành
                  trình khẳng định thương hiệu nông sản Việt. Để thế hệ trẻ Vĩnh
                  Lập có thể dõng dạc nói:{" "}
                  <strong>&quot;Tôi sinh ra ở Vĩnh Lập.&quot;</strong>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
                  <div className="bg-white/10 p-4 sm:p-5 md:p-6 rounded-sm border border-white/10 hover:bg-white/15 transition-colors">
                    <h4 className="font-bold text-white mb-2 text-base sm:text-lg font-serif">
                      Chất Lượng
                    </h4>
                    <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
                      Quy trình canh tác chuẩn Nhật Bản, giữ trọn hương vị tự
                      nhiên.
                    </p>
                  </div>
                  <div className="bg-white/10 p-4 sm:p-5 md:p-6 rounded-sm border border-white/10 hover:bg-white/15 transition-colors">
                    <h4 className="font-bold text-white mb-2 text-base sm:text-lg font-serif">
                      Cộng Đồng
                    </h4>
                    <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
                      Tạo sinh kế bền vững, để người nông dân không phải ly
                      hương.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 sm:mt-10 md:mt-12">
                <button className="bg-white text-[#8B1E24] px-6 sm:px-8 py-3 sm:py-4 rounded-sm font-bold tracking-wider sm:tracking-widest uppercase hover:bg-stone-100 transition-colors shadow-lg flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto text-sm sm:text-base">
                  Trải Nghiệm Ngay
                  <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 transition-opacity duration-300"
          onClick={closeImageModal}
        >
          <div
            className="relative max-w-5xl max-h-[95vh] w-full flex flex-col items-center justify-center transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImageModal}
              className="absolute -top-12 sm:-top-16 right-0 sm:right-4 text-white hover:text-red-300 transition-colors z-10 bg-black/50 hover:bg-black/70 rounded-full p-2 backdrop-blur-sm"
              aria-label="Đóng"
            >
              <X size={28} className="sm:w-8 sm:h-8" />
            </button>
            
            <div className="relative w-full max-h-[85vh] flex items-center justify-center overflow-hidden rounded-lg">
              {typeof modalImage.src === "string" ? (
                <Image
                  src={modalImage.src}
                  alt={`${modalImage.alt} - Xem lớn`}
                  className="max-w-full max-h-[85vh] w-auto h-auto object-contain shadow-2xl"
                  width={1920}
                  height={1080}
                  unoptimized
                />
              ) : (
                <Image
                  src={modalImage.src}
                  alt={`${modalImage.alt} - Xem lớn`}
                  className="max-w-full max-h-[85vh] w-auto h-auto object-contain shadow-2xl"
                  width={1920}
                  height={1080}
                />
              )}
            </div>
            
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs sm:text-sm font-bold border border-white/20">
              {modalImage.alt}
            </div>
            
            <p className="text-white/70 text-xs sm:text-sm mt-2 text-center max-w-md px-4">
              Nhấn ESC hoặc click vào vùng tối để đóng
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

