import { motion } from "framer-motion";
import { Eye, ShoppingBag, Star } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ImageSkeleton } from "@/components/ui/skeleton-loaders";

export interface Product {
  id: number;
  longDescription?: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  image: string;
  rating: number;
}

const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5 text-yellow-400 text-xs">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={12}
        fill={i < rating ? "currentColor" : "none"}
        className={i < rating ? "" : "text-slate-300"}
      />
    ))}
  </div>
);

export const ProductCard = ({
  product,
  onQuickView,
  badge,
}: {
  product: Product;
  onQuickView: (p: Product) => void;
  badge?: "Mới" | "Bán chạy";
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 border border-stone-100"
    >
      {/* Image Section */}
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
        {imageLoading && !imageError && (
          <div className="absolute inset-0 z-10">
            <ImageSkeleton className="w-full h-full" />
          </div>
        )}
        {!imageError && (
          <Image
            fill
            src={product.image}
            alt={product.name}
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 280px"
            className={`object-cover transition-transform duration-700 group-hover:scale-110 ${
              imageLoading ? "opacity-0" : "opacity-100"
            }`}
            priority={false}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        )}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-200 text-stone-400">
            <span className="text-sm">Không tải được ảnh</span>
          </div>
        )}

        {/* Badge Category */}
        <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
          {product.category}
        </span>

        {/* Badge Mới / Bán chạy */}
        {badge && (
          <span
            className={`absolute top-4 right-4 ${
              badge === "Mới"
                ? "bg-green-500 text-white"
                : "bg-rose-600 text-white"
            } text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm`}
          >
            {badge}
          </span>
        )}

        {/* Action Overlay Buttons */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button
            onClick={() => onQuickView(product)}
            className="transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75 bg-white text-slate-900 hover:bg-rose-600 hover:text-white p-3 rounded-full shadow-lg"
            title="Xem nhanh"
          >
            <Eye size={20} />
          </button>
          <button
            className="transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-100 bg-white text-slate-900 hover:bg-rose-600 hover:text-white p-3 rounded-full shadow-lg"
            title="Thêm vào giỏ"
          >
            <ShoppingBag size={20} />
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-6 text-center">
        <div className="flex justify-center mb-2">
          <RatingStars rating={product.rating} />
        </div>
        <h3
          className="font-heading text-lg font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-rose-600 transition-colors cursor-pointer"
          onClick={() => onQuickView(product)}
        >
          {product.name}
        </h3>
        <p className="font-body text-rose-600 font-semibold">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(product.price)}
        </p>
      </div>
    </motion.div>
  );
};
