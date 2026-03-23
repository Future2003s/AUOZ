"use client";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import type { Product } from "@/apiRequests/products";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { useCartSidebar } from "@/context/cart-sidebar-context";
import { useAuth } from "@/hooks/useAuth";
import {
  ShoppingCart, Heart, Truck, Shield, RotateCcw, ChevronUp,
  CreditCard, Banknote, CheckCircle2, Package, Minus, Plus,
  ArrowRight, Copy, Check, X, ZoomIn, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import ProductCommentsSection from "@/components/product-comments";
import { envConfig } from "@/config";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

interface Props {
  id: string;
  locale: string;
  initialData?: Product | null;
}

export default function ProductDetailClient({ id, locale, initialData = null }: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const { openSidebar } = useCartSidebar();
  const { isAuthenticated, user } = useAuth();

  const [item, setItem] = useState<Product | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Checkout panel
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank">("cod");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string; total: number } | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const checkoutRef = useRef<HTMLDivElement>(null);

  // Pre-fill from user profile
  useEffect(() => {
    if (isAuthenticated && user) {
      const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
      if (name) setFullName(name);
      if (user.phone) setPhone(user.phone);
    }
  }, [isAuthenticated, user]);

  // Fetch product if no initialData
  useEffect(() => {
    if (!id || initialData) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/public/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        if (data?.data) setItem(data.data as Product);
        else setError("Không thể tải thông tin sản phẩm");
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id, initialData]);

  useEffect(() => {
    if (checkoutOpen && checkoutRef.current) {
      setTimeout(() => checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [checkoutOpen]);

  const getImageUrl = useCallback((index: number): string => {
    if (!item?.images || item.images.length === 0) return "https://placehold.co/800x600";
    const img = item.images[index] as any;
    if (!img) return "https://placehold.co/800x600";
    return typeof img === "string" ? img : img.url || "https://placehold.co/800x600";
  }, [item]);

  const allImageUrls = useMemo(() => {
    if (!item?.images) return [];
    return item.images
      .map((img: any) => typeof img === "string" ? img.trim() : img?.url?.trim() || "")
      .filter((u: string) => u.length > 0 && u !== "undefined" && u !== "null");
  }, [item?.images]);

  const price = useMemo(() => Number(item?.price ?? 0), [item]);
  const isOutOfStock = typeof item?.quantity === "number" && item.quantity === 0;

  const handleAddToCart = useCallback(() => {
    if (!item) return;
    const variant = item.variants?.find((x) => x._id === selectedVariant || x.id === selectedVariant) || null;
    const pid = item._id || (item as any).id || "";
    addItem({
      id: pid, productId: pid,
      variantId: variant?._id || variant?.id || null,
      variantName: variant?.name || null,
      name: variant ? `${item.name} - ${variant.name}` : item.name,
      price: Number(item.price) || 0, quantity: qty,
      imageUrl: getImageUrl(0),
    });
    openSidebar();
    toast.success("Đã thêm vào giỏ hàng!");
  }, [item, selectedVariant, qty, getImageUrl, addItem, openSidebar]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Đã sao chép liên kết sản phẩm!");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("Không thể sao chép liên kết"); }
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    if (!item) return;
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      setOrderError("Vui lòng điền đầy đủ thông tin bắt buộc (*)");
      return;
    }
    if (!/^[0-9]{10,11}$/.test(phone.trim())) {
      setOrderError("Số điện thoại không hợp lệ (10-11 chữ số)");
      return;
    }
    setIsSubmitting(true);
    setOrderError(null);
    const pid = item._id || (item as any).id || "";
    const grandTotal = price * qty;
    try {
      if (paymentMethod === "bank") {
        const response = await fetch(`${envConfig.NEXT_PUBLIC_BACKEND_URL}/create-payment-link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: grandTotal,
            items: [{ name: item.name, sku: pid || `SKU-${Date.now()}`, quantity: qty, price }],
            customer: { fullName: fullName.trim(), phone: phone.trim(), address: address.trim(), note: note.trim() },
            paymentMethod: "bank_transfer",
            description: `${item.name} x${qty} - ${fullName}`,
          }),
        });
        const result = await response.json();
        if (result?.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        } else {
          throw new Error(result?.message || "Không tạo được link thanh toán");
        }
      } else {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            items: [{ ...(pid ? { productId: pid } : {}), name: item.name, sku: pid || `SKU-${Date.now()}`, quantity: qty, price }],
            customer: { fullName: fullName.trim(), phone: phone.trim(), address: address.trim(), note: note.trim() },
            paymentMethod: "cod", amount: grandTotal, notes: note.trim() || undefined,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result?.message || "Đặt hàng thất bại");
        setOrderSuccess({ orderNumber: result?.data?.orderNumber || "N/A", total: grandTotal });
      }
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  }, [item, fullName, phone, address, note, price, qty, paymentMethod]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] pt-25">
        <div className="container mx-auto px-4 py-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr]">
              <div className="p-6"><div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl animate-pulse mb-4" /></div>
              <div className="p-6 space-y-4">
                <div className="h-8 bg-gray-200 rounded-xl animate-pulse w-4/5" />
                <div className="h-6 bg-gray-200 rounded-xl animate-pulse w-2/5" />
                <div className="h-16 bg-orange-100 rounded-2xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] pt-25 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-xl font-semibold">Không tải được sản phẩm</div>
          <div className="text-sm text-gray-600">Vui lòng thử lại sau hoặc quay lại danh sách sản phẩm.</div>
          <button onClick={() => router.back()} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Quay lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pt-25 product-detail-page">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
            <button onClick={() => router.push(`/${locale}`)} className="group flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-orange-600 transition-all duration-200 px-3 py-1.5 rounded-full hover:bg-orange-50">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Trang chủ
            </button>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            <button onClick={() => router.push(`/${locale}/products`)} className="text-sm font-medium text-gray-500 hover:text-orange-600 transition-all px-3 py-1.5 rounded-full hover:bg-orange-50">Sản phẩm</button>
            {item.category && (
              <>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-400 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
                  {typeof item.category === "object" ? (item.category as any).name : item.category}
                </span>
              </>
            )}
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            <span className="text-sm font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full truncate max-w-[220px]">{item.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Panel */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr]">
            {/* Image Gallery */}
            <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div
                className="relative aspect-square bg-gradient-to-br from-orange-50/50 to-amber-50/30 rounded-2xl overflow-hidden mb-4 border border-gray-100 group"
                onClick={() => { setLightboxIndex(selectedImageIndex); setLightboxOpen(true); }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getImageUrl(selectedImageIndex)} alt={item.name} className="w-full h-full object-contain p-8 transition-all duration-300" style={{ cursor: "zoom-in" }} />
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <span className="bg-white text-gray-800 font-bold px-8 py-3 rounded-full text-lg shadow-lg">Hết hàng</span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg">
                    <ZoomIn className="h-5 w-5 text-gray-700" />
                  </div>
                </div>
                {allImageUrls.length > 1 && selectedImageIndex > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i => i - 1); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10">
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </button>
                )}
                {allImageUrls.length > 1 && selectedImageIndex < allImageUrls.length - 1 && (
                  <button onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i => i + 1); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10">
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </button>
                )}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {item.quantity && item.quantity > 0 && item.quantity < 10 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">Sắp hết hàng</span>
                  )}
                </div>
                {allImageUrls.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                    {selectedImageIndex + 1} / {allImageUrls.length}
                  </div>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleShare(); }}
                  className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full shadow flex items-center justify-center hover:bg-white hover:scale-110 transition-all">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-gray-500" />}
                </button>
              </div>
              {allImageUrls.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scroll-smooth snap-x snap-mandatory">
                  {allImageUrls.map((url, i) => (
                    <button key={i} onClick={() => setSelectedImageIndex(i)}
                      className={`flex-shrink-0 snap-start rounded-xl border-2 overflow-hidden transition-all ${allImageUrls.length > 5 ? "w-[60px] h-[60px]" : "w-[72px] h-[72px]"} ${i === selectedImageIndex ? "border-orange-500 shadow-md scale-105" : "border-gray-200 hover:border-orange-300 opacity-60 hover:opacity-100"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Ảnh ${i + 1}`} className="w-full h-full object-contain bg-white p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-snug flex-1">{item.name}</h1>
                  <button
                    onClick={() => { setIsWishlisted(!isWishlisted); toast.success(isWishlisted ? "Đã xoá khỏi yêu thích" : "Đã thêm vào yêu thích"); }}
                    className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${isWishlisted ? "border-red-400 bg-red-50 text-red-400" : "border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-400"}`}>
                    <Heart className={`h-4 w-4 transition-all ${isWishlisted ? "fill-red-400" : ""}`} />
                  </button>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  {(item as any).avgRating != null && (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg key={s} className={`h-3.5 w-3.5 ${s <= Math.round((item as any).avgRating ?? 0) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-current"}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                      <span className="text-xs text-gray-500 ml-1">({(item as any).reviewCount || 0} đánh giá)</span>
                    </div>
                  )}
                  {item.category && (
                    <span className="text-xs bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full font-medium border border-orange-100">
                      {typeof item.category === "object" ? (item.category as any).name : item.category}
                    </span>
                  )}
                  {typeof item.quantity === "number" && (
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${item.quantity > 0 ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"}`}>
                      {item.quantity > 0 ? `✓ Còn ${item.quantity} sản phẩm` : "✗ Hết hàng"}
                    </span>
                  )}
                </div>

                {/* Price */}
                {item.comingSoon ? (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl px-5 py-4 border border-blue-100/80">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl lg:text-5xl font-black text-blue-500 tracking-tight">Comming Soon</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        🔔 Đặt Trước — Sắp ra mắt
                      </span>
                      <span className="text-xs text-gray-400">Sản phẩm sẽ sớm có mặt!</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl px-5 py-4 border border-orange-100/80">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl lg:text-5xl font-black text-orange-500 tracking-tight">{formatCurrency(price)}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Truck className="h-3 w-3" />Miễn phí vận chuyển</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">Đã bao gồm VAT</span>
                    </div>
                  </div>
                )}

                {/* Variants */}
                {(item.variants?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2.5">Chọn loại:</p>
                    <div className="flex flex-wrap gap-2">
                      {item.variants?.map((variant) => (
                        <button key={variant._id || variant.id}
                          onClick={() => setSelectedVariant((variant._id || variant.id) as string)}
                          className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${selectedVariant === (variant._id || variant.id) ? "border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-200 scale-105" : "border-gray-200 text-gray-700 hover:border-orange-300 bg-white"}`}>
                          <span className="block">{variant.name}</span>
                          <span className={`block text-xs font-normal ${selectedVariant === (variant._id || variant.id) ? "text-orange-100" : "text-gray-400"}`}>{formatCurrency(variant.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Qty + Cart — ẩn khi comingSoon */}
                {!item.comingSoon ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                        <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}
                          className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-orange-50 hover:text-orange-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="w-14 text-center text-base font-bold border-x border-gray-200 h-11 flex items-center justify-center text-gray-900">{qty}</div>
                        <button onClick={() => setQty(q => Math.min(q + 1, item.quantity ?? 999))} disabled={qty >= (item.quantity ?? 999)}
                          className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-orange-50 hover:text-orange-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button onClick={handleAddToCart} disabled={isOutOfStock}
                        className="flex-1 h-11 rounded-xl border-2 border-orange-400 text-orange-500 bg-white font-semibold text-sm hover:bg-orange-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                        <ShoppingCart className="h-4 w-4" /> Thêm vào giỏ
                      </button>
                    </div>

                    {/* Buy Now CTA */}
                    <button
                      onClick={() => { if (isOutOfStock) return; setCheckoutOpen(prev => !prev); setOrderSuccess(null); setOrderError(null); }}
                      disabled={isOutOfStock}
                      className={`w-full h-14 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${checkoutOpen ? "bg-gray-800 hover:bg-gray-900 text-white" : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-300"}`}>
                      {checkoutOpen ? <><ChevronUp className="h-5 w-5" />Đóng thông tin đặt hàng</> : <><Package className="h-5 w-5" />Mua ngay — Đặt hàng nhanh<ArrowRight className="h-4 w-4 ml-1" /></>}
                    </button>
                  </>
                ) : (
                  /* Nút Đặt Trước khi comingSoon = true */
                  <button
                    onClick={() => {
                      toast.success("🔔 Cảm ơn bạn! Chúng tôi sẽ thông báo khi sản phẩm ra mắt.", { duration: 4000 });
                    }}
                    className="w-full h-14 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-rose-300"
                  >
                    🔔 Đặt Trước — Nhận thông báo ra mắt
                  </button>
                )}

                {/* Trust badges desktop */}
                <div className="hidden lg:grid grid-cols-3 gap-3 pt-1 border-t border-gray-100">
                  {[
                    { icon: Truck, bg: "bg-blue-50", color: "text-blue-500", label: "Miễn phí", sub: "vận chuyển" },
                    { icon: Shield, bg: "bg-green-50", color: "text-green-500", label: "Hàng chính", sub: "hãng 100%" },
                    { icon: RotateCcw, bg: "bg-orange-50", color: "text-orange-500", label: "Đổi trả", sub: "30 ngày" },
                  ].map(({ icon: Icon, bg, color, label, sub }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}><Icon className={`h-5 w-5 ${color}`} /></div>
                      <div><p className="text-xs font-semibold text-gray-700">{label}</p><p className="text-xs text-gray-400">{sub}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inline Checkout Panel */}
              {checkoutOpen && (
                <div ref={checkoutRef} className="border-t border-orange-100 bg-gradient-to-b from-orange-50/40 to-amber-50/20">
                  {orderSuccess ? (
                    <div className="p-8 lg:p-10 flex flex-col items-center gap-6 text-center">
                      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">Đặt hàng thành công! 🎉</h3>
                        <p className="text-base text-gray-500 mt-2">Cảm ơn bạn đã tin tưởng LALA-LYCHEEE</p>
                      </div>
                      <div className="bg-white rounded-2xl border border-green-100 px-8 py-6 w-full max-w-md shadow-sm">
                        <div className="text-sm text-gray-400 mb-2">Mã đơn hàng</div>
                        <div className="text-2xl font-black text-green-600 tracking-wide">{orderSuccess.orderNumber}</div>
                        <div className="text-sm text-gray-400 mt-5 mb-2">Tổng thanh toán khi nhận hàng</div>
                        <div className="text-3xl font-bold text-gray-900">{formatCurrency(orderSuccess.total)}</div>
                      </div>
                      <button onClick={() => { setCheckoutOpen(false); setOrderSuccess(null); setQty(1); }} className="mt-4 text-base text-orange-500 hover:text-orange-700 font-semibold underline underline-offset-4">Tiếp tục mua sắm</button>
                    </div>
                  ) : (
                    <div className="p-6 lg:p-8 space-y-8">
                      <div className="flex items-center justify-between border-b border-orange-100/50 pb-4">
                        <h3 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-3"><Package className="h-6 w-6 text-orange-500" />Thông tin đặt hàng</h3>
                        <div className="text-lg font-bold text-orange-600">Tổng: {formatCurrency(price * qty)}</div>
                      </div>
                      
                      <div className="bg-white rounded-2xl border border-gray-100/80 px-5 py-4 flex items-center gap-4 shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getImageUrl(0)} alt={item.name} className="w-16 h-16 object-contain rounded-xl bg-gray-50 p-1 border border-gray-100 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-base lg:text-lg font-bold text-gray-800 truncate">{item.name}</p>
                          <p className="text-sm text-gray-500 mt-0.5">Số lượng: {qty} <span className="mx-1.5 text-gray-300">×</span> {formatCurrency(price)}</p>
                        </div>
                        <div className="text-lg font-black text-orange-600 flex-shrink-0">{formatCurrency(price * qty)}</div>
                      </div>

                      {/* Payment tabs */}
                      <div className="pt-2">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Hình thức thanh toán</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {([["cod", "COD", "Thanh toán khi nhận", Banknote, "orange"], ["bank", "Chuyển khoản", "Thanh toán online", CreditCard, "blue"]] as const).map(([val, title, sub, Icon, color]) => (
                            <button key={val} onClick={() => setPaymentMethod(val as "cod" | "bank")}
                              className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all group ${paymentMethod === val
                                ? `border-${color}-500 bg-${color}-50 shadow-sm`
                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"}`}>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${paymentMethod === val ? `bg-${color}-100` : "bg-gray-100 group-hover:bg-gray-200"}`}>
                                <Icon className={`h-5 w-5 ${paymentMethod === val ? `text-${color}-600` : "text-gray-500"}`} />
                              </div>
                              <div>
                                <div className={`text-base font-bold ${paymentMethod === val ? `text-${color}-700` : "text-gray-700"}`}>{title}</div>
                                <div className={`text-xs mt-0.5 ${paymentMethod === val ? `text-${color}-600/80` : "text-gray-500"}`}>{sub}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fields */}
                      <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm space-y-5">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Thông tin giao hàng</p>
                        {orderError && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>{orderError}</div>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {[
                            { label: "Họ và tên", value: fullName, setter: setFullName, placeholder: "Nguyễn Văn A", required: true },
                            { label: "Số điện thoại", value: phone, setter: (v: string) => setPhone(v.replace(/\D/g, "").slice(0, 11)), placeholder: "0901234567", required: true },
                          ].map(({ label, value, setter, placeholder, required }) => (
                            <div key={label}>
                              <label className="text-sm font-bold text-gray-700 mb-2 block">{label} {required && <span className="text-red-500">*</span>}</label>
                              <input type="text" value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder}
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-base font-medium bg-gray-50/50 focus:bg-white focus:outline-none focus:border-orange-500 transition-all placeholder:text-gray-400 placeholder:font-normal" />
                            </div>
                          ))}
                        </div>
                        
                        {[
                          { label: "Địa chỉ nhận hàng", value: address, setter: setAddress, placeholder: "Số nhà, đường, phường/xã...", required: true },
                          { label: "Ghi chú", value: note, setter: setNote, placeholder: "Ghi chú thêm (tuỳ chọn)...", required: false },
                        ].map(({ label, value, setter, placeholder, required }) => (
                          <div key={label}>
                            <label className="text-sm font-bold text-gray-700 mb-2 block">{label} {required && <span className="text-red-500">*</span>}<span className="text-gray-400 font-normal">{!required ? " (tuỳ chọn)" : ""}</span></label>
                            <input type="text" value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder}
                              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-base font-medium bg-gray-50/50 focus:bg-white focus:outline-none focus:border-orange-500 transition-all placeholder:text-gray-400 placeholder:font-normal" />
                          </div>
                        ))}
                      </div>

                      <button onClick={handlePlaceOrder} disabled={isSubmitting}
                        className="w-full h-14 lg:h-16 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-lg lg:text-xl transition-all shadow-xl shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3">
                        {isSubmitting ? <><svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Đang xử lý...</> : "Xác nhận đặt hàng →"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comments + Reviews */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        <ProductCommentsSection productId={id} />
      </div>

      {/* Lightbox */}
      {lightboxOpen && allImageUrls.length > 0 && (
        <div className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all">
            <X className="h-5 w-5" />
          </button>
          {lightboxIndex > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i - 1); }}
              className="absolute left-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all">
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={allImageUrls[lightboxIndex]} alt="" className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          {lightboxIndex < allImageUrls.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i + 1); }}
              className="absolute right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all">
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">{lightboxIndex + 1} / {allImageUrls.length}</div>
        </div>
      )}
    </div>
  );
}
