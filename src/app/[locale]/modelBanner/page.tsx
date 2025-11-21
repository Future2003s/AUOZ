"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Search,
  ArrowRight,
  CheckCircle,
  ShoppingBag,
  TrendingUp,
  Gift,
  Sparkles,
  Star,
  Crown,
} from "lucide-react";

// --- UTILS: FONT STYLES ---
const FontStyles = () => (
  <style
    dangerouslySetInnerHTML={{
      __html: `
      @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
      .font-heading { font-family: 'Playfair Display', serif; }
      .font-body { font-family: 'Be Vietnam Pro', sans-serif; }
      
      /* Hiệu ứng Shimmer cho nút */
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .animate-shimmer {
        animation: shimmer 2s infinite;
      }
      
      /* Hiệu ứng hào quang xoay */
      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .animate-spin-slow {
        animation: spin-slow 10s linear infinite;
      }
    `,
    }}
  />
);

// --- COMPONENT PHỤ: CONFETTI (Pháo giấy đơn giản) ---
const ConfettiParticle = ({ delay }: { delay: number }) => {
  const randomX = Math.random() * 400 - 200;
  const randomY = Math.random() * -300 - 50;
  const randomRotate = Math.random() * 360;
  const colors = ["#f43f5e", "#fbbf24", "#34d399", "#60a5fa"];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
      animate={{
        x: randomX,
        y: randomY,
        opacity: 0,
        scale: [0, 1, 0.5],
        rotate: randomRotate,
      }}
      transition={{ duration: 1.5, delay: delay, ease: "easeOut" }}
      className="absolute w-3 h-3 rounded-sm"
      style={{ backgroundColor: color, left: "50%", top: "50%" }}
    />
  );
};

const ConfettiExplosion = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-0">
      {[...Array(30)].map((_, i) => (
        <ConfettiParticle key={i} delay={Math.random() * 0.2} />
      ))}
    </div>
  );
};

// ============================================================================
// MODEL 1: NEWSLETTER SUBSCRIPTION (Đăng ký nhận tin - Có hiệu ứng Zoom ảnh)
// ============================================================================
const NewsletterModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 font-body">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white md:text-slate-400 hover:text-rose-500 z-20 transition-colors bg-black/20 md:bg-transparent rounded-full p-1 md:p-0"
            >
              <X size={24} />
            </button>

            {/* Image Side - Ken Burns Effect */}
            <div className="md:w-2/5 bg-rose-900 relative min-h-[220px] md:min-h-full overflow-hidden group">
              <motion.img
                initial={{ scale: 1 }}
                animate={{ scale: 1.1 }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                src="https://images.unsplash.com/photo-1591639673393-b46a83c72b1d?q=80&w=800&auto=format&fit=crop"
                alt="Lychee Tea"
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-rose-900 via-rose-900/40 to-transparent md:bg-gradient-to-r" />

              <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-6 text-center z-10">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 mx-auto border border-white/20">
                    <Mail size={32} />
                  </div>
                  <span className="font-heading font-bold text-2xl italic tracking-wider">
                    LALA News
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Form Side - Staggered Text */}
            <div className="md:w-3/5 p-8 md:p-12 bg-white flex flex-col justify-center relative">
              {/* Decor background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -mr-10 -mt-10 z-0 pointer-events-none" />

              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
                }}
                className="relative z-10"
              >
                <motion.h3
                  variants={{
                    hidden: { y: 10, opacity: 0 },
                    visible: { y: 0, opacity: 1 },
                  }}
                  className="font-heading text-3xl font-bold text-slate-900 mb-2"
                >
                  Đừng bỏ lỡ ưu đãi
                </motion.h3>

                <motion.p
                  variants={{
                    hidden: { y: 10, opacity: 0 },
                    visible: { y: 0, opacity: 1 },
                  }}
                  className="text-slate-500 mb-6 text-sm leading-relaxed"
                >
                  Đăng ký nhận bản tin để là người đầu tiên biết về mùa vụ vải
                  thiều mới và nhận ngay mã giảm giá{" "}
                  <strong className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                    10%
                  </strong>
                  .
                </motion.p>

                <motion.form
                  variants={{
                    hidden: { y: 10, opacity: 0 },
                    visible: { y: 0, opacity: 1 },
                  }}
                  className="space-y-4"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="group">
                    <input
                      type="email"
                      placeholder="vidu@gmail.com"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all group-hover:bg-white"
                    />
                  </div>
                  <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-200 transition-all duration-300 flex items-center justify-center gap-2 group">
                    <span>Đăng Ký Ngay</span>
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </motion.form>

                <motion.p
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                  className="text-xs text-slate-400 mt-4 text-center"
                >
                  Chúng tôi tôn trọng quyền riêng tư của bạn.
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// MODEL 2: FULLSCREEN SEARCH (Tìm kiếm toàn màn hình - Glassmorphism sâu)
// ============================================================================
const SearchOverlayModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] bg-white/90 flex flex-col pt-24 px-4 sm:px-8 font-body"
        >
          <button
            onClick={onClose}
            className="absolute top-8 right-8 p-3 bg-white rounded-full hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-sm border border-slate-100 group"
          >
            <X
              size={28}
              className="group-hover:rotate-90 transition-transform duration-300"
            />
          </button>

          <div className="w-full max-w-4xl mx-auto">
            {/* Search Input */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="relative mb-16 group"
            >
              <input
                type="text"
                placeholder="Bạn đang tìm gì hôm nay?"
                className="w-full text-3xl md:text-5xl font-heading font-bold text-slate-900 placeholder:text-slate-300 bg-transparent border-b-2 border-slate-200 py-6 focus:outline-none focus:border-rose-600 transition-colors pl-14"
                autoFocus
              />
              <Search
                className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-600 transition-colors"
                size={40}
              />
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid md:grid-cols-2 gap-16"
            >
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-rose-600 mb-6">
                  <TrendingUp size={16} /> Xu hướng phổ biến
                </h4>
                <div className="flex flex-wrap gap-3">
                  {[
                    "Vải thiều sấy",
                    "Trà vải",
                    "Hộp quà biếu",
                    "Mật ong",
                    "Rượu vải",
                  ].map((tag, i) => (
                    <motion.button
                      key={tag}
                      whileHover={{
                        scale: 1.05,
                        backgroundColor: "#fff1f2",
                        borderColor: "#fb7185",
                        color: "#e11d48",
                      }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="px-5 py-2.5 bg-white border border-slate-200 rounded-full text-slate-600 transition-all shadow-sm"
                    >
                      {tag}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-rose-600 mb-6">
                  <ShoppingBag size={16} /> Gợi ý cho bạn
                </h4>
                <ul className="space-y-4">
                  {[
                    {
                      name: "Combo Quà Tết LALA",
                      price: "550.000đ",
                      img: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=100&q=80",
                    },
                    {
                      name: "Vải Thiều Thanh Hà (5kg)",
                      price: "250.000đ",
                      img: "https://images.unsplash.com/photo-1550521168-404194e1142d?w=100&q=80",
                    },
                  ].map((item, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-4 group cursor-pointer bg-white/50 p-3 rounded-xl hover:bg-white hover:shadow-md transition-all"
                    >
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover shadow-sm"
                      />
                      <div>
                        <p className="font-heading font-bold text-lg text-slate-900 group-hover:text-rose-600 transition-colors">
                          {item.name}
                        </p>
                        <p className="text-sm text-slate-500 font-bold">
                          {item.price}
                        </p>
                      </div>
                      <ArrowRight className="ml-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-rose-600" />
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// MODEL 3: SUCCESS NOTIFICATION (Thông báo thành công - Có Pháo giấy)
// ============================================================================
const SuccessModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 font-body">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotateX: 45 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 text-center shadow-2xl overflow-hidden"
          >
            {/* Confetti Explosion Effect */}
            <ConfettiExplosion />

            <div className="relative z-10">
              {/* Success Icon Animation */}
              <div className="w-24 h-24 mx-auto mb-6 bg-green-50 rounded-full flex items-center justify-center relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20"
                />
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.1 }}
                >
                  <CheckCircle className="text-green-500 w-12 h-12" />
                </motion.div>
              </div>

              <motion.h3
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="font-heading text-2xl font-bold text-slate-900 mb-2"
              >
                Tuyệt vời!
              </motion.h3>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-slate-500 mb-8"
              >
                Đơn hàng của bạn đã được ghi nhận. Chúng tôi sẽ sớm liên hệ lại.
              </motion.p>

              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={onClose}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all"
              >
                Tiếp tục mua sắm
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// MODEL 4: SHOPEE STYLE PROMO (Banner sinh động, lấp lánh)
// ============================================================================
const ShopeeStyleModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 font-body">
          {/* Backdrop tối màu để nổi bật banner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-[2px]"
          />

          {/* Hiệu ứng hào quang xoay phía sau */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.6, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="w-[600px] h-[600px] bg-gradient-to-r from-rose-500/30 via-orange-500/30 to-purple-500/30 rounded-full blur-3xl animate-spin-slow"
            />
          </div>

          {/* Nội dung chính */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="relative w-full max-w-[400px] flex flex-col items-center z-10"
          >
            {/* Banner Image Container */}
            <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl cursor-pointer group bg-white">
              <img
                src="https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=800&auto=format&fit=crop"
                alt="Shopee Promo"
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
              />

              {/* Overlay Content */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-rose-900 flex flex-col justify-end p-6 text-center items-center pb-10">
                {/* Pulsing Badge */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="bg-yellow-400 text-rose-900 text-xs font-black px-3 py-1 rounded mb-3 uppercase tracking-wider shadow-lg border-2 border-white"
                >
                  ⚡ Flash Sale ⚡
                </motion.div>

                <h2 className="text-4xl font-heading font-bold text-white mb-1 drop-shadow-md">
                  Săn Deal <span className="text-yellow-400">0Đ</span>
                </h2>
                <p className="text-rose-100 mb-6 text-sm font-medium">
                  Duy nhất khung giờ vàng 12H - 14H
                </p>

                {/* Shimmer Button */}
                <div className="relative w-full max-w-[220px] overflow-hidden rounded-full shadow-[0_0_20px_rgba(225,29,72,0.6)] group-hover:shadow-[0_0_30px_rgba(225,29,72,0.8)] transition-shadow">
                  <button className="relative z-10 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold py-3.5 px-8 w-full rounded-full hover:scale-105 transition-transform active:scale-95">
                    MUA NGAY
                  </button>
                  {/* Lớp phủ lấp lánh chạy qua */}
                  <div className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none">
                    <div className="w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-shimmer" />
                  </div>
                </div>
              </div>
            </div>

            {/* Nút đóng nằm dưới - Phong cách App */}
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={onClose}
              className="mt-6 w-12 h-12 rounded-full bg-white/10 border border-white/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-rose-900 transition-all shadow-lg"
            >
              <X size={24} />
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// MODEL 5: LUXURY PRODUCT REVEAL (Quảng cáo sản phẩm mới chất lượng cao)
// ============================================================================
const NewProductModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 font-body">
          {/* Dark Cinematic Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0c0a09]/95"
          />

          {/* Ambient Spotlight */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.3, scale: 1.2 }}
              transition={{ duration: 1.5 }}
              className="w-[500px] h-[500px] bg-rose-500 rounded-full blur-[150px]"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="relative w-full max-w-5xl bg-[#1c1917] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-white/50 hover:text-white z-20 transition-colors"
            >
              <X size={24} />
            </button>

            {/* Left: Product Image (Hero) */}
            <div className="md:w-1/2 relative min-h-[300px] md:min-h-full flex items-center justify-center bg-[#1c1917]">
              {/* Floating Product Effect */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative z-10 w-4/5"
              >
                <img
                  src="https://images.unsplash.com/photo-1523301343968-6a6ebf63c672?q=80&w=800&auto=format&fit=crop"
                  alt="Luxury Product"
                  className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                />
                {/* Reflection Shadow */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-2/3 h-4 bg-black/50 blur-xl rounded-[100%]" />
              </motion.div>

              {/* Background Texture */}
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
            </div>

            {/* Right: Content */}
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center text-left relative z-10">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Star size={12} fill="currentColor" /> New Arrival
                  </span>
                </div>

                <h2 className="font-heading text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                  Lục Ngạn <br />{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-300">
                    Premium Gold
                  </span>
                </h2>

                <p className="text-white/60 text-lg mb-8 leading-relaxed">
                  Tuyệt phẩm vải thiều sấy khô thượng hạng, được tuyển chọn từ
                  những cây vải cổ thụ trên 50 năm tuổi. Hương vị đậm đà, ngọt
                  hậu khó quên.
                </p>

                <div className="flex flex-wrap gap-4 mb-10">
                  <div className="flex flex-col">
                    <span className="text-white/40 text-xs uppercase tracking-wider mb-1">
                      Đóng gói
                    </span>
                    <span className="text-white font-medium">Hộp Sơn Mài</span>
                  </div>
                  <div className="w-px h-10 bg-white/10 mx-2" />
                  <div className="flex flex-col">
                    <span className="text-white/40 text-xs uppercase tracking-wider mb-1">
                      Trọng lượng
                    </span>
                    <span className="text-white font-medium">500g</span>
                  </div>
                  <div className="w-px h-10 bg-white/10 mx-2" />
                  <div className="flex flex-col">
                    <span className="text-white/40 text-xs uppercase tracking-wider mb-1">
                      Số lượng
                    </span>
                    <span className="text-rose-400 font-bold">
                      Limited Edition
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="flex-1 py-4 bg-white text-black font-bold rounded-xl hover:bg-rose-500 hover:text-white hover:shadow-[0_0_20px_rgba(225,29,72,0.5)] transition-all duration-300 flex items-center justify-center gap-2 group">
                    <span>Đặt Trước Ngay</span>
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                  <button className="px-6 py-4 border border-white/20 text-white rounded-xl font-bold hover:bg-white/10 transition-colors">
                    Chi tiết
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// SHOWCASE COMPONENT
// ============================================================================
const ModalCollection = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <section className="py-24 bg-slate-50 min-h-[80vh] flex flex-col justify-center relative overflow-hidden">
      <FontStyles />

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-orange-100/40 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Bộ Sưu Tập <span className="text-rose-600 italic">Interactive</span>{" "}
            Modal
          </h2>
          <p className="text-slate-500 mb-12 text-lg max-w-2xl mx-auto">
            Các mẫu popup được nâng cấp với hiệu ứng chuyển động mượt mà và
            tương tác sinh động.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 justify-center">
          {/* Button Triggers */}
          {[
            {
              id: "newsletter",
              icon: Mail,
              label: "Newsletter",
              color: "text-rose-500",
            },
            {
              id: "search",
              icon: Search,
              label: "Search",
              color: "text-blue-500",
            },
            {
              id: "success",
              icon: CheckCircle,
              label: "Success",
              color: "text-green-500",
            },
            {
              id: "shopee",
              icon: Sparkles,
              label: "Shopee Promo",
              color: "text-orange-500",
            },
            {
              id: "new-product",
              icon: Crown,
              label: "Luxury Reveal",
              color: "text-purple-500",
            },
          ].map((btn) => (
            <motion.button
              key={btn.id}
              onClick={() => setActiveModal(btn.id)}
              whileHover={{
                y: -5,
                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
              }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-6 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold shadow-sm transition-all flex flex-col items-center gap-3 hover:border-rose-300"
            >
              <div
                className={`p-3 bg-slate-50 rounded-full group-hover:scale-110 transition-transform ${btn.color}`}
              >
                <btn.icon size={24} />
              </div>
              <span className="text-sm">{btn.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Render Active Modal */}
      <NewsletterModal
        isOpen={activeModal === "newsletter"}
        onClose={() => setActiveModal(null)}
      />
      <SearchOverlayModal
        isOpen={activeModal === "search"}
        onClose={() => setActiveModal(null)}
      />
      <SuccessModal
        isOpen={activeModal === "success"}
        onClose={() => setActiveModal(null)}
      />
      <ShopeeStyleModal
        isOpen={activeModal === "shopee"}
        onClose={() => setActiveModal(null)}
      />
      <NewProductModal
        isOpen={activeModal === "new-product"}
        onClose={() => setActiveModal(null)}
      />
    </section>
  );
};

export default ModalCollection;
