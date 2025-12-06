import AdminImageCompany from "../../public/images/directorCo.png";
import useTranslations from "@/i18n/useTranslations";
import { motion } from "framer-motion";
import { Quote, ArrowRight, Target, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ImageSkeleton } from "@/components/ui/skeleton-loaders";

interface AboutSectionProps {
  heading?: string;
  body?: string;
  imageUrl?: string;
  founderName?: string;
  founderTitle?: string;
  founderQuote?: string;
}

export const AboutSection = ({
  heading,
  body,
  imageUrl,
  founderName,
  founderTitle,
  founderQuote,
}: AboutSectionProps = {}) => {
  const t = useTranslations();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const [imageLoading, setImageLoading] = useState(true);
  
  // Default values
  const defaultHeading = t("site.about_title") || "Câu Chuyện LALA-LYCHEE";
  const defaultBody = `Sinh ra và lớn lên tại vùng quê Vĩnh Lập – Thanh Hà – Hải Dương, nơi được mệnh danh là "đất vải", tôi hiểu sâu sắc cuộc sống còn nhiều khó khăn của người nông dân nơi đây. Vùng đất này đẹp nhưng nghèo, bốn bề là sông nước, giao thương hạn chế. Có một thời, tôi từng tự ti về quê hương mình đến mức không dám nói với bạn bè rằng mình đến từ Vĩnh Lập.

Chúng tôi đã đem những trái vải quê mình sang giới thiệu với bạn bè Nhật Bản, và từ đó tôi nhận ra rằng: Vùng đất mà trước đây tôi từng tự ti, thực chất lại là một nơi vô cùng đáng tự hào. Tôi hiểu rằng mình phải làm điều gì đó để thế hệ trẻ lớn lên tại đây có thể tự tin nói rằng: "Tôi sinh ra ở Vĩnh Lập."

Từ khát vọng đó, tôi bắt đầu hành trình đưa trái vải – tinh hoa của trời đất Thanh Hà – vươn ra thế giới. LALA-LYCHEEE ra đời với sứ mệnh mang vải thiều Vĩnh Lập đến với bạn bè quốc tế, tạo thêm công ăn việc làm cho bà con, để sau mỗi mùa vải, họ không còn cảnh thiếu việc, phải đi làm ăn xa.`;
  
  const defaultQuote = `"Bước ngoặt đến khi tôi có cơ duyên sang Nhật Bản... Chính vợ tôi là người đã chỉ ra cho tôi thấy những vẻ đẹp rất đỗi bình dị nhưng tuyệt vời của làng quê Vĩnh Lập."`;
  
  const displayHeading = heading || defaultHeading;
  const displayBody = body || defaultBody;
  const displayImageUrl = imageUrl || AdminImageCompany;
  const displayFounderName = founderName || "PHẠM VĂN NHÂN";
  const displayFounderTitle = founderTitle || "Founder & CEO";
  const displayFounderQuote = founderQuote || '"Mang niềm tự hào trở lại với quê hương."';
  
  // Split body into paragraphs (split by double newlines)
  const paragraphs = displayBody.split(/\n\n+/).filter(p => p.trim());
  
  // Find quote paragraph (contains quote marks or specific keywords)
  const quoteIndex = paragraphs.findIndex(p => 
    (p.includes('"') && p.length < 200) || 
    p.includes('Bước ngoặt') || 
    p.includes('bước ngoặt')
  );

  return (
    <section
      id="about"
      className="relative py-24 overflow-hidden bg-stone-50/50"
    >
      {/* Background Decor Elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-rose-100 rounded-full blur-3xl opacity-30 mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-orange-100 rounded-full blur-3xl opacity-30 mix-blend-multiply pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Cột Hình Ảnh (Chiếm 5 phần) */}
          <div className="lg:col-span-5 relative group">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              {/* Khung viền trang trí */}
              <div className="absolute inset-0 bg-rose-600 rounded-2xl rotate-3 transform scale-[1.02] opacity-20 group-hover:rotate-2 transition-transform duration-500" />

              {/* Container hình ảnh chính */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[3/4] bg-white">
                {imageLoading && (
                  <div className="absolute inset-0 z-10">
                    <ImageSkeleton className="w-full h-full" />
                  </div>
                )}
                <Image
                  src={typeof displayImageUrl === 'string' ? displayImageUrl : AdminImageCompany}
                  alt="Giám Đốc LALA-LYCHEEE"
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                    imageLoading ? "opacity-0" : "opacity-100"
                  }`}
                  width={400}
                  height={533}
                  onLoad={() => setImageLoading(false)}
                />

                {/* Overlay Gradient cho text trên ảnh */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90" />

                {/* Thông tin Giám đốc trên ảnh */}
                <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                  <p className="text-sm font-medium tracking-wider uppercase text-rose-200 mb-1">
                    {displayFounderTitle}
                  </p>
                  <h3 className="text-2xl font-serif font-bold">
                    {displayFounderName}
                  </h3>
                  <p className="text-white/80 text-sm mt-2 italic">
                    {displayFounderQuote}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Cột Nội Dung (Chiếm 7 phần) */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <span className="h-px w-12 bg-rose-600"></span>
                <span className="text-rose-600 font-bold tracking-widest uppercase text-xs">
                  Về Chúng Tôi
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-slate-900 leading-[1.1] mb-8">
                {displayHeading}
              </h2>

              <div className="prose prose-lg text-slate-600 max-w-none font-body">
                {paragraphs.map((paragraph, index) => {
                  // Check if this paragraph should be a quote
                  const isQuote = index === quoteIndex && quoteIndex !== -1;
                  
                  if (isQuote) {
                    return (
                      <div key={index} className="bg-rose-50/60 border-l-4 border-rose-500 p-8 my-10 rounded-r-xl relative group hover:bg-rose-50 transition-colors">
                        <Quote className="absolute top-6 right-6 w-10 h-10 text-rose-200 -rotate-12 group-hover:text-rose-300 transition-colors" />
                        <p className="italic text-slate-800 font-heading text-xl leading-relaxed relative z-10">
                          {paragraph}
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <p key={index} className="leading-relaxed text-justify">
                      {paragraph}
                    </p>
                  );
                })}

                <div className="mt-10 pt-8 border-t border-slate-200">
                  <p className="text-lg text-slate-500 font-heading italic mb-6">
                    Mỗi sản phẩm là một tác phẩm nghệ thuật, kết tinh từ nguồn
                    nguyên liệu tuyển chọn và tình yêu quê hương xứ sở.
                  </p>
                  
                  {/* CTA Button - Đọc thêm câu chuyện */}
                  <Link
                    href={`/${locale}/story`}
                    className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <span>Đọc thêm câu chuyện</span>
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Sứ mệnh & Tầm nhìn Section */}
        <div className="mt-20 grid md:grid-cols-2 gap-8">
          {/* Sứ mệnh */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl p-8 border border-rose-200 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-600 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Sứ Mệnh</h3>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Mang vải thiều Vĩnh Lập – tinh hoa của đất trời Thanh Hà – vươn ra thế giới, 
              tạo thêm công ăn việc làm bền vững cho bà con nông dân, để thế hệ trẻ 
              Vĩnh Lập có thể tự hào nói: <strong className="text-rose-600">"Tôi sinh ra ở Vĩnh Lập."</strong>
            </p>
          </motion.div>

          {/* Tầm nhìn */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-gradient-to-br from-orange-50 to-rose-50 rounded-2xl p-8 border border-orange-200 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-500 rounded-xl">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Tầm Nhìn</h3>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Trở thành thương hiệu nông sản Việt Nam hàng đầu, được công nhận 
              trên thị trường quốc tế, góp phần nâng tầm giá trị nông sản Việt 
              và mang lại cuộc sống tốt đẹp hơn cho người nông dân quê hương.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
