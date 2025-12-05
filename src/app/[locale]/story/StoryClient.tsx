"use client";
import React, { useEffect, useRef, useState } from "react";
import CauChuyenTroVeBg from "../../../../public/images/cauChuyenBackGround.jpg";
import BonBeSongNuoc from "../../../../public/images/songNuocBonBe.png";
import CayVaiToThanhHa from "../../../../public/images/cayVaiToThanhHa.png"
import VaiThieuChinDo from "../../../../public/images/gocVaiTrai.jpg"
import CanhDongVai from "../../../../public/images/canhDongVai.jpg"
// using public path for Next/Image
import { Kablammo, Playfair_Display, Great_Vibes, Henny_Penny } from "next/font/google";
import {
  ArrowRight,
  ChevronDown,
  Globe,
  Heart,
  Leaf,
  MapPin,
  Quote,
} from "lucide-react";
import Image from "next/image";

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
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
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
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`${playfair.className} min-h-screen bg-[#FDFBF7] text-stone-800 selection:bg-red-900 selection:text-white overflow-x-hidden`}
    >
      {/* HERO SECTION */}
      <header className="relative h-[110vh] flex items-center justify-center overflow-hidden">
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

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-20">
          <FadeIn direction="down">
            <div className="inline-block mb-8">
              <h2 className={`${greatVibes.className} text-[100.3px] text-white mb-4 drop-shadow-lg tracking-wide italic`}>
                Hành Trình Trở Về
              </h2>
              <div className="h-2 w-40 bg-gradient-to-r from-red-300 via-red-400 to-red-600 mx-auto rounded-full shadow-lg" />
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="flex flex-col items-center">
              <h1 className="text-5xl md:text-6xl font-serif italic text-amber-100 tracking-wide drop-shadow-md">
                Đánh Thức
              </h1>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-4 opacity-70"></div>
              <div className={`${playfair.className} text-red-200/90 italic font-light text-[100px] leading-[1.1] mt-6`}>
                Hương Vị <span className="not-italic"><span className={playfair.className}>Đất</span>{" "}</span>Vải
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={400}>
            <p className="text-white/90 text-lg md:text-2xl font-light max-w-2xl mx-auto mb-16 leading-relaxed text-shadow-sm">
              Từ nỗi tự ti của một người con xa xứ, đến khát vọng mang niềm tự hào
              Vĩnh Lập vươn ra thế giới.
            </p>
          </FadeIn>

          <FadeIn delay={600}>
            <div
              className="animate-bounce text-white/70 flex flex-col items-center gap-2 cursor-pointer"
              onClick={() =>
                window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
              }
            >
              <span className="text-xs uppercase tracking-widest">Khám phá</span>
              <ChevronDown size={24} />
            </div>
          </FadeIn>
        </div>
      </header>

      {/* CHƯƠNG 1 */}
      <section className="py-24 md:py-40 container mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-5 relative order-2 md:order-1">
            <FadeIn direction="right">
              <div className="relative z-10">
                <div className="aspect-[4/5] rounded-sm overflow-hidden shadow-2xl">
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
              <div className="absolute top-10 -right-10 w-full h-full border border-stone-200 -z-10 rounded-sm" />
            </FadeIn>
          </div>

          <div className="md:col-span-7 md:pl-16 order-1 md:order-2">
            <FadeIn>
              <div className="flex items-center gap-4 mb-6">
                <span className="h-px w-12 bg-[#8B1E24]" />
                <h2 className="text-xs font-bold text-[#8B1E24] tracking-[0.2em] uppercase">
                  Chương I
                </h2>
              </div>
              <h3 className="text-4xl md:text-6xl font-serif font-extrabold text-stone-950 mb-8 leading-tight tracking-tight">
                Vùng Đất <br />
                <span className="text-[#8B1E24] drop-shadow-sm">Đẹp Nhưng Nghèo</span>
              </h3>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="prose prose-stone prose-lg text-stone-800 text-justify">
                <p className="mb-6 leading-8">
                  Tôi sinh ra và lớn lên tại Vĩnh Lập – Thanh Hà – Hải Dương, cái
                  nôi của cây vải thiều. Nhưng ngày ấy, tôi chỉ thấy sự nhọc
                  nhằn. Vùng đất này đẹp, nhưng giao thương hạn chế, đời sống
                  người dân thiếu thốn đủ bề.
                </p>
                <p className="leading-8 border-l-2 border-[#8B1E24]/60 pl-6 italic text-stone-700 bg-stone-100 py-4 pr-4 font-medium">
                  &quot;Có một thời, tôi từng tự ti về quê hương mình đến mức không
                  dám nói với bạn bè rằng mình đến từ Vĩnh Lập.&quot;
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CHƯƠNG 2 */}
      <section className="py-32 bg-[#F5F2EB] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-5">
          <Leaf size={600} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <FadeIn direction="up">
              <h2 className="text-xs font-bold text-[#8B1E24] tracking-[0.2em] uppercase mb-4">
                Chương II
              </h2>
              <h3 className="text-3xl md:text-5xl font-serif font-bold text-stone-900">
                Góc Nhìn Từ Xứ Người
              </h3>
            </FadeIn>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            <FadeIn delay={200} className="space-y-8">
              <div className="text-stone-700 text-lg leading-8 text-justify">
                <p className="first-letter:text-5xl first-letter:font-serif first-letter:text-[#8B1E24] first-letter:mr-3 first-letter:float-left">
                  Mười năm du học và làm việc tại Nhật Bản là khoảng thời gian
                  thay đổi cuộc đời tôi. Tại đó, tôi gặp người bạn đời - một cô
                  giáo dạy tiếng Nhật.
                </p>
                <p className="mt-6">
                  Khi cùng nhau trở về Việt Nam, chính ánh mắt của cô ấy đã giúp
                  tôi nhìn lại quê hương mình. Cô chỉ cho tôi thấy vẻ đẹp của tình
                  làng nghĩa xóm, sự bình yên của sông nước, và đặc biệt là{" "}
                  <strong>vị ngon tuyệt hảo của trái vải</strong> mà bấy lâu tôi
                  xem nhẹ.
                </p>
              </div>

              <div className="bg-white p-8 rounded-sm shadow-sm border-t-4 border-[#8B1E24]">
                <h4 className="font-serif text-xl font-bold text-stone-900 mb-4">
                  Sự Thức Tỉnh
                </h4>
                <ul className="space-y-4">
                  {[
                    "Vẻ đẹp chân chất của con người Vĩnh Lập",
                    "Hương vị vải thiều độc bản không nơi nào có",
                    "Niềm tự hào tiềm ẩn trong sự bình dị",
                  ].map((item, idx) => (
                    <li key={item} className="flex items-start gap-3">
                      <Heart
                        size={20}
                        className="text-[#8B1E24] flex-shrink-0 mt-1"
                        fill="#8B1E24"
                        fillOpacity={0.1}
                      />
                      <span className="text-stone-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={400} direction="left">
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=2070&auto=format&fit=crop"
                    className="rounded-sm shadow-md mt-12 w-full h-64 object-cover grayscale-[30%]"
                    alt="Nhật Bản mùa xuân"
                  />
                  <Image
                    src={CanhDongVai}
                    className="rounded-sm shadow-md w-full h-64 object-cover grayscale-[10%]"
                    alt="Cánh đồng vải"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white/90 backdrop-blur px-6 py-4 rounded-full shadow-lg border border-stone-200">
                    <span className="font-serif italic text-stone-800">
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
      <section className="py-40 container mx-auto px-6">
        <FadeIn>
          <div className="max-w-5xl mx-auto text-center relative px-8">
            <Quote
              size={80}
              className="text-[#F2EBE0] absolute -top-12 -left-4 transform -scale-x-100"
            />
            <h3 className="text-3xl md:text-5xl font-serif font-medium text-stone-800 leading-snug">
              "Chúng tôi mang trái vải quê mình mời bạn bè Nhật Bản. <br className="hidden md:block" />
              Từ ánh mắt ngạc nhiên của họ, tôi nhận ra: <br />
              <span className="text-[#8B1E24] font-semibold decoration-2 underline-offset-8">
                Vùng đất tôi từng tự ti, lại là nơi đáng tự hào nhất.
              </span>
              "
            </h3>
            <div className="mt-12 flex flex-col items-center">
              <div className="w-px h-16 bg-stone-300 mb-6" />
              <p className="text-stone-500 uppercase tracking-[0.2em] text-xs font-bold">
                Founder LALA-LYCHEEE
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* CHƯƠNG 3 */}
      <section className="py-24 bg-[#8B1E24] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <FadeIn direction="right">
              <div className="relative group perspective-1000">
                <div className="relative rounded-sm overflow-hidden shadow-2xl aspect-[4/3] transform transition-transform duration-700 group-hover:rotate-1">
                  <Image
                    src={VaiThieuChinDo}
                    alt="Vải thiều chín đỏ"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>

                <div className="absolute -bottom-10 -right-6 w-48 h-36 border-4 border-white rounded-sm overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 z-10">
                  <Image
                    src={CayVaiToThanhHa}
                    alt="Cây vải tổ Thanh Hà"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1504198458649-3128b932f49e?q=80&w=1974&auto=format&fit=crop";
                    }}
                  />
                  <div className="absolute bottom-0 left-0 w-full bg-black/60 text-[10px] text-white p-1 text-center font-bold">
                    Cây Vải Tổ Thanh Hà
                  </div>
                </div>

                <div className="absolute -inset-4 border border-white/20 -z-10 rounded-sm" />
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="flex items-center gap-4 mb-6 mt-10 md:mt-0">
                <Globe className="text-red-300" />
                <h2 className="text-red-200/80 font-bold tracking-[0.2em] uppercase text-xs">
                  Chương III
                </h2>
              </div>

              <h3 className="text-4xl md:text-6xl font-serif font-bold mb-10 leading-tight">
                Mang Vải Thiều <br /> Vươn Ra Thế Giới
              </h3>

              <div className="space-y-8 text-white/90 text-lg font-light leading-8">
                <p>
                  Sứ mệnh của LALA-LYCHEEE không chỉ là bán trái cây. Đó là hành
                  trình khẳng định thương hiệu nông sản Việt. Để thế hệ trẻ Vĩnh
                  Lập có thể dõng dạc nói:{" "}
                  <strong>“Tôi sinh ra ở Vĩnh Lập.”</strong>
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-white/10 p-6 rounded-sm border border-white/10 hover:bg-white/15 transition-colors">
                    <h4 className="font-bold text-white mb-2 text-lg font-serif">
                      Chất Lượng
                    </h4>
                    <p className="text-sm opacity-80">
                      Quy trình canh tác chuẩn Nhật Bản, giữ trọn hương vị tự
                      nhiên.
                    </p>
                  </div>
                  <div className="bg-white/10 p-6 rounded-sm border border-white/10 hover:bg-white/15 transition-colors">
                    <h4 className="font-bold text-white mb-2 text-lg font-serif">
                      Cộng Đồng
                    </h4>
                    <p className="text-sm opacity-80">
                      Tạo sinh kế bền vững, để người nông dân không phải ly
                      hương.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <button className="bg-white text-[#8B1E24] px-8 py-4 rounded-sm font-bold tracking-widest uppercase hover:bg-stone-100 transition-colors shadow-lg flex items-center gap-3">
                  Trải Nghiệm Ngay
                  <ArrowRight size={18} />
                </button>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

    </div>
  );
}

