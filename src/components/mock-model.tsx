import { AnimatePresence } from "framer-motion";
import { Product } from "./product-card";
import { motion } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";

export const MockModal = ({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) => {
  if (!product) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-rose-600"
          >
            <X size={24} />
          </button>
          <div className="text-center">
            <Image
              width={500}
              height={500}
              src={product.image}
              alt={product.name}
              className="w-32 h-32 object-cover rounded-full mx-auto mb-4 shadow-lg"
            />
            <h3 className="font-heading text-2xl font-bold mb-2">
              {product.name}
            </h3>
            <p className="text-rose-600 font-bold text-xl mb-4">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(product.price)}
            </p>
            <p className="text-slate-500 text-sm mb-6">
              {product.longDescription
                ? product.longDescription
                : "Mô tả ngắn về sản phẩm sẽ hiển thị ở đây. Đây là phiên bản xem nhanh (Quick View)."}
            </p>
            <button className="w-full bg-rose-600 text-white py-3 rounded-full font-bold hover:bg-rose-700 transition-colors">
              Thêm vào giỏ hàng
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
