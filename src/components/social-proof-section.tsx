"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { FadeInWhenVisible } from "./fade-in-visiable";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import Image from "next/image";
import { handleImageError } from "@/utils/handleImageError";

type Partner = {
  id: number;
  name: string;
  logoUrl: string;
};

type Testimonial = {
  id: number;
  quote: string;
  author: string;
  role: string;
  avatarUrl: string;
};

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      "Sản phẩm của LALA-LYCHEE thực sự khác biệt. Vị ngọt thanh và hương thơm tự nhiên khiến tôi rất ấn tượng. Bao bì cũng rất sang trọng!",
    author: "Ngọc Anh",
    role: "Chuyên gia ẩm thực",
    avatarUrl: "https://placehold.co/100x100/fecdd3/44403c?text=NA&font=lora",
  },
  {
    id: 2,
    quote:
      "Tôi đã dùng trà vải của LALA-LYCHEE để tiếp đãi đối tác và họ rất thích. Một sản phẩm chất lượng, thể hiện được sự tinh tế của người tặng.",
    author: "Minh Tuấn",
    role: "Giám đốc Doanh nghiệp",
    avatarUrl: "https://placehold.co/100x100/fecdd3/44403c?text=MT&font=lora",
  },
  {
    id: 3,
    quote:
      "Chưa bao giờ tôi nghĩ một sản phẩm từ quả vải lại có thể tinh tế đến vậy. Chắc chắn sẽ ủng hộ LALA-LYCHEE dài dài.",
    author: "Phương Linh",
    role: "Blogger Du lịch",
    avatarUrl: "https://placehold.co/100x100/fecdd3/44403c?text=PL&font=lora",
  },
];

const partners: Partner[] = [
  {
    id: 1,
    name: "Tomibun Market",
    logoUrl:
      "https://www.tomibun.vn/upload/img/products/06112021/untitled-1.png",
  },
  {
    id: 2,
    name: "EM HÀ NỘI",
    logoUrl:
      "https://placehold.co/200x100/f1f5f9/94a3b8?text=EM+HÀ+NỘI&font=serif",
  },
  {
    id: 3,
    name: "The Artistry",
    logoUrl:
      "https://placehold.co/200x100/f1f5f9/94a3b8?text=The+Artistry&font=serif",
  },
  {
    id: 4,
    name: "Elite Events",
    logoUrl:
      "https://placehold.co/200x100/f1f5f9/94a3b8?text=Elite+Events&font=serif",
  },
  {
    id: 5,
    name: "Vinpearl",
    logoUrl:
      "https://placehold.co/200x100/f1f5f9/94a3b8?text=Vinpearl&font=serif",
  },
  {
    id: 6,
    name: "Sofitel",
    logoUrl:
      "https://placehold.co/200x100/f1f5f9/94a3b8?text=Sofitel&font=serif",
  },
  {
    id: 7,
    name: "Golden Spoon",
    logoUrl:
      "https://placehold.co/200x100/f1f5f9/94a3b8?text=Golden+Spoon&font=serif",
  },
  {
    id: 8,
    name: "Prestige Gifts",
    logoUrl:
      "https://placehold.co/200x100/f1f5f9/94a3b8?text=Prestige+Gifts&font=serif",
  },
];

export const SocialProofSection: React.FC = () => {
  // Logic from TestimonialsSection
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const testimonialTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartX = useRef(0);
  const isDragging = useRef(false);

  const nextTestimonial = useCallback(
    () =>
      setTestimonialIndex((prevIndex) => (prevIndex + 1) % testimonials.length),
    [testimonials.length]
  );

  const prevTestimonial = useCallback(
    () =>
      setTestimonialIndex(
        (prevIndex) =>
          (prevIndex - 1 + testimonials.length) % testimonials.length
      ),
    [testimonials.length]
  );

  const resetTestimonialTimeout = useCallback(() => {
    if (testimonialTimeoutRef.current)
      clearTimeout(testimonialTimeoutRef.current);
  }, []);

  useEffect(() => {
    resetTestimonialTimeout();
    testimonialTimeoutRef.current = setTimeout(nextTestimonial, 5000);
    return () => resetTestimonialTimeout();
  }, [testimonialIndex, nextTestimonial, resetTestimonialTimeout]);

  const handleDragStart = (clientX: number) => {
    resetTestimonialTimeout();
    isDragging.current = true;
    dragStartX.current = clientX;
  };

  const handleDragEnd = (clientX: number) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dragDistance = dragStartX.current - clientX;
    if (dragDistance > 50) nextTestimonial();
    else if (dragDistance < -50) prevTestimonial();
    testimonialTimeoutRef.current = setTimeout(nextTestimonial, 5000);
  };

  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX);
  const onTouchStart = (e: React.TouchEvent) =>
    handleDragStart(e.touches[0].clientX);
  const onMouseUp = (e: React.MouseEvent) => handleDragEnd(e.clientX);
  const onTouchEnd = (e: React.TouchEvent) =>
    handleDragEnd(e.changedTouches[0].clientX);

  const onMouseLeave = () => {
    if (isDragging.current) {
      isDragging.current = false;
      testimonialTimeoutRef.current = setTimeout(nextTestimonial, 5000);
    }
  };

  // Logic from PartnerCarouselSection
  const radius = 200;
  const angle = (360 / partners.length) as number;

  return (
    <section id="social-proof" className="py-24 bg-rose-50/50">
      <FadeInWhenVisible>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-800">
              Sự Tin Tưởng Từ Cộng Đồng
            </h2>
            <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
              Niềm vui của khách hàng và sự đồng hành của các thương hiệu uy tín
              là minh chứng cho chất lượng của chúng tôi.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Testimonials Column */}
            <div id="testimonials">
              <h3 className="flex justify-center items-center font-serif text-2xl font-bold text-slate-700 text-center mb-8 pb-2">
                Khách Hàng Phản Hồi ?
              </h3>
              <div
                className="relative max-w-md mx-auto h-80 cursor-grab active:cursor-grabbing"
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                {testimonials.map((testimonial, index) => (
                  <div
                    key={testimonial.id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out select-none ${
                      index === testimonialIndex ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <div className="relative bg-white pt-16 pb-8 px-8 rounded-lg shadow-xl h-full flex flex-col justify-center border border-rose-100 pointer-events-none">
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                        <Image
                          width={80}
                          height={80}
                          src={testimonial.avatarUrl}
                          alt={`Avatar của ${testimonial.author}`}
                          onError={handleImageError}
                          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                        />
                      </div>
                      <div className="flex text-yellow-400 mb-4 justify-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} fill="currentColor" />
                        ))}
                      </div>
                      <p className="text-slate-600 italic text-center text-lg">
                        &quot;{testimonial.quote}&quot;
                      </p>
                      <div className="mt-4 text-center">
                        <p className="font-bold text-slate-800">
                          {testimonial.author}
                        </p>
                        <p className="text-sm text-slate-500">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={prevTestimonial}
                  className="absolute top-1/2 -left-4 transform -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 shadow-md transition z-10"
                  aria-label="Đánh giá trước"
                >
                  <ChevronLeft className="text-slate-600" />
                </button>
                <button
                  onClick={nextTestimonial}
                  className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 shadow-md transition z-10"
                  aria-label="Đánh giá tiếp theo"
                >
                  <ChevronRight className="text-slate-600" />
                </button>
              </div>
            </div>
            {/* Partners Column */}
            <div id="partners" className="pt-10 lg:pt-0">
              <h3 className="font-serif text-2xl font-bold text-slate-700 text-center mb-12">
                Đối Tác Đồng Hành
              </h3>
              <div className="scene mx-auto h-[200px] w-[200px] flex items-center justify-center">
                <div className="carousel">
                  {partners.map((partner, index) => (
                    <div
                      key={partner.id}
                      className="carousel__cell"
                      style={{
                        transform: `rotateY(${
                          index * angle
                        }deg) translateZ(${radius}px)`,
                      }}
                    >
                      <Image
                        width={80}
                        height={80}
                        src={partner.logoUrl}
                        alt={partner.name}
                        onError={handleImageError}
                        className="w-32 object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeInWhenVisible>
    </section>
  );
};
