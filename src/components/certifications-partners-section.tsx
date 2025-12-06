"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Award, CheckCircle } from "lucide-react";
import { useState } from "react";
import { ImageSkeleton } from "@/components/ui/skeleton-loaders";

interface Partner {
  name: string;
  logoUrl: string;
}

interface Certification {
  name: string;
  description: string;
  icon?: React.ReactNode;
}

const partners: Partner[] = [
  {
    name: "Tomibun Market",
    logoUrl: "https://www.tomibun.vn/upload/img/products/06112021/untitled-1.png",
  },
  {
    name: "COWS MASUDA",
    logoUrl: "https://cowsmasuda.com/wp-content/uploads/2021/11/logo2-1024x294.png",
  },
  {
    name: "SAIGON ECO CRAFT",
    logoUrl: "https://saigonecocraft.com/wp-content/uploads/2023/03/logo-ecocraft.png",
  },
];

// Partner logo component with loading state
const PartnerLogo = ({ partner, index }: { partner: Partner; index: number }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative h-16 w-auto hover:grayscale transition-all duration-300 opacity-60 hover:opacity-100"
    >
      {imageLoading && !imageError && (
        <div className="absolute inset-0 z-10">
          <div className="h-16 w-32">
            <ImageSkeleton className="w-full h-full" />
          </div>
        </div>
      )}
      {!imageError && (
        <Image
          src={partner.logoUrl}
          alt={partner.name}
          width={120}
          height={64}
          className={`h-full w-auto object-contain ${
            imageLoading ? "opacity-0" : "opacity-100"
          }`}
          unoptimized
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
        />
      )}
      {imageError && (
        <div className="h-16 w-32 bg-stone-200 flex items-center justify-center rounded">
          <span className="text-xs text-stone-400">{partner.name}</span>
        </div>
      )}
    </motion.div>
  );
};

const certifications: Certification[] = [
  {
    name: "Chứng Nhận Chất Lượng",
    description: "Đạt tiêu chuẩn chất lượng quốc tế",
    icon: <Award className="w-6 h-6" />,
  },
  {
    name: "Xuất Khẩu Nhật Bản",
    description: "Được tin dùng tại thị trường Nhật Bản",
    icon: <CheckCircle className="w-6 h-6" />,
  },
  {
    name: "ISO 22000:2018",
    description: "Hệ thống quản lý an toàn thực phẩm",
    icon: <Award className="w-6 h-6" />,
  },
];

export const CertificationsPartnersSection: React.FC = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-rose-600 font-bold tracking-widest uppercase text-xs mb-3 block">
            Chứng Nhận & Đối Tác
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Được Công Nhận
          </h2>
          <div className="w-20 h-1 bg-rose-600 mx-auto rounded-full mb-8" />

          {/* Certifications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
            {certifications.map((cert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl p-6 border border-rose-100 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center text-white">
                    {cert.icon}
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{cert.name}</h3>
                <p className="text-sm text-slate-600">{cert.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Partners */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-2xl font-bold text-slate-900 text-center mb-8 font-serif">
            Đối Tác Đồng Hành
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {partners.map((partner, index) => (
              <PartnerLogo key={index} partner={partner} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

