"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import type { Product } from "@/apiRequests/products";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { useCartSidebar } from "@/context/cart-sidebar-context";
import { useAuth } from "@/hooks/useAuth";
import { Loader } from "@/components/ui/loader";
import {
  ShoppingCart,
  Heart,
  Truck,
  Shield,
  RotateCcw,
  ChevronUp,
  CreditCard,
  Banknote,
  CheckCircle2,
  Package,
  Minus,
  Plus,
  ArrowRight,
  Star,
  Copy,
  Check,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ProductCommentsSection from "@/components/product-comments";
import { StructuredData } from "@/components/StructuredData";
import { envConfig } from "@/config";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export default function ProductDetailPage() {
  const params = useParams<{ id: string; locale?: string }>();
  const router = useRouter();
  const id = params?.id as string;
  const locale = params?.locale || "vi";
  const { addItem } = useCart();
  const { openSidebar } = useCartSidebar();
  const { isAuthenticated, user } = useAuth();

  const [item, setItem] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Checkout panel state
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

  // Pre-fill từ user profile nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated && user) {
      const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
      if (name) setFullName(name);
      if (user.phone) setPhone(user.phone);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/public/${id}`, { next: { revalidate: 60 } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        if (data?.data) setItem(data.data as Product);
        else setError("Không thể tải thông tin sản phẩm");
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi tải sản phẩm");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  // Scroll to checkout when opened
  useEffect(() => {
    if (checkoutOpen && checkoutRef.current) {
      setTimeout(() => checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [checkoutOpen]);

  const getImageUrl = (index: number) => {
    if (!item?.images || item.images.length === 0) return "https://placehold.co/800x600";
    const imageEntry = item.images[index] as Product["images"][number] | string | undefined;
    if (!imageEntry) return "https://placehold.co/800x600";
    if (typeof imageEntry === "string") return imageEntry;
    return imageEntry.url || "https://placehold.co/800x600";
  };

  const getAllImageUrls = useMemo(() => {
    if (!item?.images || item.images.length === 0) return [];
    return item.images
      .map((img) => {
        const entry = img as Product["images"][number] | string;
        if (typeof entry === "string") return entry.trim();
        return entry?.url?.trim() || "";
      })
      .filter((url) => url.length > 0 && url !== "undefined" && url !== "null");
  }, [item?.images]);

  const price = useMemo(() => {
    if (!item) return 0;
    return Number(item.price);
  }, [item]);

  const productStructuredData = useMemo(() => {
    if (!item) return null;
    const baseUrl = envConfig.NEXT_PUBLIC_URL || "";
    const mainImage = getAllImageUrls[0] || "/images/logo.png";
    const imageUrl = mainImage.startsWith("http")
      ? mainImage
      : `${envConfig.NEXT_PUBLIC_BACKEND_URL || ""}${mainImage}`;
    return {
      name: item.name,
      description: item.description || item.name,
      image: imageUrl,
      brand: { "@type": "Brand", name: "LALA-LYCHEEE" },
      offers: {
        "@type": "Offer",
        price: item.price,
        priceCurrency: "VND",
        availability: item.quantity && item.quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        url: `${baseUrl}/${locale}/products/${id}`,
      },
      ...(item.rating ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: item.rating,
          reviewCount: item.numReviews || 0,
        },
      } : {}),
    };
  }, [item, id, locale, getAllImageUrls]);

  const handleAddToCart = () => {
    if (!item) return;
    const variant = item.variants?.find((x) => x._id === selectedVariant || x.id === selectedVariant) || null;
    const normalizedProductId = item._id || (item as { id?: string }).id || "";
    addItem({
      id: normalizedProductId,
      productId: normalizedProductId,
      variantId: variant?._id || variant?.id || null,
      variantName: variant?.name || null,
      name: variant ? `${item.name} - ${variant.name}` : item.name,
      price: Number(item.price) || 0,
      quantity: qty,
      imageUrl: getImageUrl(0),
    });
    openSidebar();
    toast.success("Đã thêm vào giỏ hàng!");
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Đã sao chép liên kết sản phẩm!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép liên kết");
    }
  };

  const handlePlaceOrder = async () => {
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

    const productId = item._id || (item as { id?: string }).id || "";
    const grandTotal = price * qty;

    try {
      if (paymentMethod === "bank") {
        // Online payment
        const response = await fetch(`${envConfig.NEXT_PUBLIC_BACKEND_URL}/create-payment-link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: grandTotal,
            items: [{ name: item.name, sku: productId || `SKU-${Date.now()}`, quantity: qty, price }],
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
        // COD
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            items: [{
              ...(productId ? { productId } : {}),
              name: item.name,
              sku: productId || `SKU-${Date.now()}`,
              quantity: qty,
              price,
            }],
            customer: {
              fullName: fullName.trim(),
              phone: phone.trim(),
              address: address.trim(),
              note: note.trim(),
            },
            paymentMethod: "cod",
            amount: grandTotal,
            notes: note.trim() || undefined,
            description: `${item.name} x${qty} - ${fullName}`,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result?.message || "Đặt hàng thất bại");
        setOrderSuccess({
          orderNumber: result?.data?.orderNumber || "N/A",
          total: grandTotal,
        });
      }
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] pt-25">
        {/* Breadcrumb skeleton */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-2 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-2 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        {/* Main panel skeleton */}
        <div className="container mx-auto px-4 py-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr]">
              {/* Image skeleton */}
              <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-100">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl animate-pulse mb-4" />
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-[72px] h-[72px] bg-gray-200 rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
              {/* Info skeleton */}
              <div className="p-6 flex flex-col gap-4">
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded-xl animate-pulse w-4/5" />
                  <div className="h-8 bg-gray-200 rounded-xl animate-pulse w-3/5" />
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-5 w-28 bg-gray-200 rounded-full animate-pulse" />
                </div>
                <div className="bg-orange-50/50 rounded-2xl px-5 py-4 border border-orange-100/50">
                  <div className="h-10 w-40 bg-orange-200/60 rounded-xl animate-pulse" />
                  <div className="h-3 w-56 mt-2 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-36 bg-gray-200 rounded-xl animate-pulse" />
                  <div className="h-11 flex-1 bg-gray-200 rounded-xl animate-pulse" />
                </div>
                <div className="h-14 w-full bg-orange-200/60 rounded-xl animate-pulse" />
                <div className="grid grid-cols-3 gap-3 pt-1 border-t border-gray-100">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
                      <div className="space-y-1"><div className="h-3 w-16 bg-gray-200 rounded animate-pulse" /><div className="h-2 w-12 bg-gray-200 rounded animate-pulse" /></div>
                    </div>
                  ))}
                </div>
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
          <Button onClick={() => router.back()} variant="outline">Quay lại</Button>
        </div>
      </div>
    );
  }

  const isOutOfStock = typeof item.quantity === "number" && item.quantity === 0;

  return (
    <div className="min-h-screen bg-[#f5f5f5] pt-25 product-detail-page">
      {productStructuredData && <StructuredData type="Product" data={productStructuredData} />}

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
            {/* Trang chủ */}
            <button
              onClick={() => router.push(`/${locale}`)}
              className="group flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-orange-600 transition-all duration-200 px-3 py-1.5 rounded-full hover:bg-orange-50 hover:shadow-sm"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Trang chủ
            </button>
            {/* Separator */}
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            {/* Sản phẩm */}
            <button
              onClick={() => router.push(`/${locale}/products`)}
              className="text-sm font-medium text-gray-500 hover:text-orange-600 transition-all duration-200 px-3 py-1.5 rounded-full hover:bg-orange-50 hover:shadow-sm"
            >
              Sản phẩm
            </button>
            {/* Category */}
            {item.category && (
              <>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-400 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
                  {typeof item.category === "object" ? item.category.name : item.category}
                </span>
              </>
            )}
            {/* Current page — tên sản phẩm */}
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            <span className="text-sm font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full truncate max-w-[220px]">
              {item.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Product Panel */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr]">

            {/* LEFT: Image Gallery */}
            <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div
                className="relative aspect-square bg-gradient-to-br from-orange-50/50 to-amber-50/30 rounded-2xl overflow-hidden mb-4 border border-gray-100 group"
                onClick={() => { setLightboxIndex(selectedImageIndex); setLightboxOpen(true); }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageUrl(selectedImageIndex)}
                  alt={item.name}
                  className="w-full h-full object-contain p-8 transition-all duration-300"
                  style={{ cursor: "zoom-in" }}
                />
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <span className="bg-white text-gray-800 font-bold px-8 py-3 rounded-full text-lg shadow-lg">Hết hàng</span>
                  </div>
                )}
                {/* Zoom hint — center, hidden when arrows needed */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg">
                    <ZoomIn className="h-5 w-5 text-gray-700" />
                  </div>
                </div>
                {/* Prev arrow */}
                {getAllImageUrls.length > 1 && selectedImageIndex > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((i) => i - 1); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all hover:scale-110 opacity-0 group-hover:opacity-100 z-10"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </button>
                )}
                {/* Next arrow */}
                {getAllImageUrls.length > 1 && selectedImageIndex < getAllImageUrls.length - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((i) => i + 1); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all hover:scale-110 opacity-0 group-hover:opacity-100 z-10"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </button>
                )}
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {item.quantity && item.quantity > 0 && item.quantity < 10 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">Sắp hết hàng</span>
                  )}
                </div>
                {getAllImageUrls.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                    {selectedImageIndex + 1} / {getAllImageUrls.length}
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleShare(); }}
                  className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full shadow flex items-center justify-center hover:bg-white hover:scale-110 transition-all"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-gray-500" />}
                </button>
              </div>

              {/* Thumbnails — scroll ngang nếu nhiều hình */}
              {getAllImageUrls.length > 1 && (
                <div className="relative">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scroll-smooth snap-x snap-mandatory">
                    {getAllImageUrls.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImageIndex(i)}
                        className={`flex-shrink-0 snap-start rounded-xl border-2 overflow-hidden transition-all ${getAllImageUrls.length > 5 ? "w-[60px] h-[60px]" : "w-[72px] h-[72px]"
                          } ${i === selectedImageIndex
                            ? "border-orange-500 shadow-md scale-105"
                            : "border-gray-200 hover:border-orange-300 opacity-60 hover:opacity-100"
                          }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Ảnh ${i + 1}`} className="w-full h-full object-contain bg-white p-1" />
                      </button>
                    ))}
                  </div>
                  {/* Scroll fade indicator nếu có nhiều ảnh */}
                  {getAllImageUrls.length > 5 && (
                    <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent pointer-events-none rounded-r-lg" />
                  )}
                  {/* Counter badge */}
                  <p className="text-center text-xs text-gray-400 mt-1">
                    {getAllImageUrls.length} ảnh • Nhấp để xem to
                  </p>
                </div>
              )}

              {/* Trust badges - Mobile only, shown below image */}
              <div className="lg:hidden mt-5 grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                {[
                  { icon: Truck, color: "blue", label: "Miễn phí vận chuyển" },
                  { icon: Shield, color: "green", label: "Hàng chính hãng 100%" },
                  { icon: RotateCcw, color: "orange", label: "Đổi trả 30 ngày" },
                ].map(({ icon: Icon, color, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 text-center">
                    <div className={`w-9 h-9 bg-${color}-50 rounded-full flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 text-${color}-500`} />
                    </div>
                    <span className="text-[10px] text-gray-500 leading-tight font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Product Info + Checkout */}
            <div className="flex flex-col">

              {/* Product Info Section */}
              <div className="p-6 flex flex-col gap-4">

                {/* Title row */}
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-snug flex-1">{item.name}</h1>
                  <button
                    onClick={() => { setIsWishlisted(!isWishlisted); toast.success(isWishlisted ? "Đã xoá khỏi yêu thích" : "Đã thêm vào yêu thích"); }}
                    className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${isWishlisted ? "border-red-400 bg-red-50 text-red-400" : "border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-400"}`}
                  >
                    <Heart className={`h-4 w-4 transition-all ${isWishlisted ? "fill-red-400" : ""}`} />
                  </button>
                </div>

                {/* Rating + Meta */}
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  {item.rating && (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(item.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">({item.numReviews || 0} đánh giá)</span>
                    </div>
                  )}
                  {item.category && (
                    <span className="text-xs bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full font-medium border border-orange-100">
                      {typeof item.category === "object" ? item.category.name : item.category}
                    </span>
                  )}
                  {typeof item.quantity === "number" && (
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${item.quantity > 0 ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"}`}>
                      {item.quantity > 0 ? `✓ Còn ${item.quantity} sản phẩm` : "✗ Hết hàng"}
                    </span>
                  )}
                </div>

                {/* Price box */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl px-5 py-4 border border-orange-100/80">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl lg:text-5xl font-black text-orange-500 tracking-tight">
                      {formatCurrency(price)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Truck className="h-3 w-3" />Miễn phí vận chuyển</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">Đã bao gồm VAT</span>
                  </div>
                </div>

                {/* Variants */}
                {(item.variants?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2.5">Chọn loại:</p>
                    <div className="flex flex-wrap gap-2">
                      {item.variants?.map((variant) => (
                        <button
                          key={variant._id || variant.id}
                          onClick={() => setSelectedVariant((variant._id || variant.id) as string)}
                          className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${selectedVariant === (variant._id || variant.id)
                            ? "border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-200 scale-105"
                            : "border-gray-200 text-gray-700 hover:border-orange-300 bg-white hover:bg-orange-50/50"
                            }`}
                        >
                          <span className="block">{variant.name}</span>
                          <span className={`block text-xs font-normal ${selectedVariant === (variant._id || variant.id) ? "text-orange-100" : "text-gray-400"}`}>{formatCurrency(variant.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity + Add to cart row */}
                <div className="flex items-center gap-3">
                  {/* Qty stepper */}
                  <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-orange-50 hover:text-orange-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="w-14 text-center text-base font-bold border-x border-gray-200 h-11 flex items-center justify-center text-gray-900">{qty}</div>
                    <button
                      onClick={() => setQty((q) => Math.min(q + 1, item.quantity ?? 999))}
                      disabled={qty >= (item.quantity ?? 999)}
                      className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-orange-50 hover:text-orange-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Add to cart */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="flex-1 h-11 rounded-xl border-2 border-orange-400 text-orange-500 bg-white font-semibold text-sm hover:bg-orange-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Thêm vào giỏ
                  </button>
                </div>

                {/* BUY NOW CTA — full width, prominent */}
                <button
                  onClick={() => {
                    if (isOutOfStock) return;
                    setCheckoutOpen((prev) => !prev);
                    setOrderSuccess(null);
                    setOrderError(null);
                  }}
                  disabled={isOutOfStock}
                  className={`w-full h-14 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${checkoutOpen
                    ? "bg-gray-800 hover:bg-gray-900 text-white shadow-gray-300"
                    : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-300"
                    }`}
                >
                  {checkoutOpen ? (
                    <><ChevronUp className="h-5 w-5" />Đóng thông tin đặt hàng</>
                  ) : (
                    <><Package className="h-5 w-5" />Mua ngay — Đặt hàng nhanh<ArrowRight className="h-4 w-4 ml-1" /></>
                  )}
                </button>

                {/* Trust badges — Desktop */}
                <div className="hidden lg:grid grid-cols-3 gap-3 pt-1 border-t border-gray-100">
                  {[
                    { icon: Truck, bg: "bg-blue-50", color: "text-blue-500", label: "Miễn phí", sub: "vận chuyển" },
                    { icon: Shield, bg: "bg-green-50", color: "text-green-500", label: "Hàng chính", sub: "hãng 100%" },
                    { icon: RotateCcw, bg: "bg-orange-50", color: "text-orange-500", label: "Đổi trả", sub: "30 ngày" },
                  ].map(({ icon: Icon, bg, color, label, sub }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{label}</p>
                        <p className="text-xs text-gray-400">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* INLINE CHECKOUT PANEL */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {checkoutOpen && (
                <div
                  ref={checkoutRef}
                  className="border-t border-orange-100 bg-gradient-to-b from-orange-50/40 to-amber-50/20"
                >
                  {orderSuccess ? (
                    /* ── Success state ── */
                    <div className="p-6 flex flex-col items-center gap-4 text-center">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Đặt hàng thành công! 🎉</h3>
                        <p className="text-sm text-gray-500 mt-1">Cảm ơn bạn đã tin tưởng LALA-LYCHEEE</p>
                      </div>
                      <div className="bg-white rounded-2xl border border-green-100 px-6 py-4 w-full max-w-sm">
                        <div className="text-xs text-gray-400 mb-1">Mã đơn hàng</div>
                        <div className="text-xl font-black text-green-600">{orderSuccess.orderNumber}</div>
                        <div className="text-xs text-gray-400 mt-3 mb-1">Tổng thanh toán khi nhận hàng</div>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(orderSuccess.total)}</div>
                        <div className="mt-3 text-xs text-gray-500 bg-green-50 rounded-lg px-3 py-2">
                          Đơn hàng COD — Thanh toán khi nhận hàng
                        </div>
                      </div>
                      <button
                        onClick={() => { setCheckoutOpen(false); setOrderSuccess(null); setQty(1); }}
                        className="mt-2 text-sm text-orange-500 hover:text-orange-700 font-medium underline underline-offset-2"
                      >
                        Tiếp tục mua sắm
                      </button>
                    </div>
                  ) : (
                    /* ── Form state ── */
                    <div className="p-6 space-y-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                          <Package className="h-4 w-4 text-orange-500" />
                          Thông tin đặt hàng
                        </h3>
                        <div className="text-sm font-semibold text-orange-500">
                          Tổng: {formatCurrency(price * qty)}
                        </div>
                      </div>

                      {/* Order summary mini */}
                      <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getImageUrl(0)} alt={item.name} className="w-12 h-12 object-contain rounded-lg bg-gray-50 p-1 border border-gray-100 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">Số lượng: {qty} × {formatCurrency(price)}</p>
                        </div>
                        <div className="text-sm font-bold text-orange-500 flex-shrink-0">{formatCurrency(price * qty)}</div>
                      </div>

                      {/* Payment method tabs */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Hình thức thanh toán</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setPaymentMethod("cod")}
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${paymentMethod === "cod"
                              ? "border-orange-500 bg-orange-50 text-orange-700"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                              }`}
                          >
                            <Banknote className={`h-4 w-4 flex-shrink-0 ${paymentMethod === "cod" ? "text-orange-500" : "text-gray-400"}`} />
                            <div className="text-left">
                              <div className="text-xs font-bold">COD</div>
                              <div className="text-[10px] opacity-70 leading-tight">Thanh toán khi nhận</div>
                            </div>
                          </button>
                          <button
                            onClick={() => setPaymentMethod("bank")}
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${paymentMethod === "bank"
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                              }`}
                          >
                            <CreditCard className={`h-4 w-4 flex-shrink-0 ${paymentMethod === "bank" ? "text-blue-500" : "text-gray-400"}`} />
                            <div className="text-left">
                              <div className="text-xs font-bold">Chuyển khoản</div>
                              <div className="text-[10px] opacity-70 leading-tight">Thanh toán online</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Customer info form */}
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Thông tin giao hàng</p>

                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Họ và tên <span className="text-red-400">*</span></label>
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Nguyễn Văn A"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all placeholder:text-gray-300"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-gray-600 mb-1 block">Số điện thoại <span className="text-red-400">*</span></label>
                              <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                                placeholder="0901234567"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all placeholder:text-gray-300"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600 mb-1 block">Email <span className="text-gray-300">(tuỳ chọn)</span></label>
                              <input
                                type="email"
                                placeholder="email@example.com"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all placeholder:text-gray-300"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Địa chỉ nhận hàng <span className="text-red-400">*</span></label>
                            <input
                              type="text"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all placeholder:text-gray-300"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Ghi chú <span className="text-gray-300">(tuỳ chọn)</span></label>
                            <textarea
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder="Giao hàng giờ hành chính, gọi trước 30 phút..."
                              rows={2}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all resize-none placeholder:text-gray-300"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Error */}
                      {orderError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                          <span className="text-red-400 flex-shrink-0 mt-0.5">⚠</span>
                          {orderError}
                        </div>
                      )}

                      {/* Submit */}
                      <button
                        onClick={handlePlaceOrder}
                        disabled={isSubmitting}
                        className={`w-full h-13 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${paymentMethod === "cod"
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-200"
                          : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-blue-200"
                          }`}
                      >
                        {isSubmitting ? (
                          <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang xử lý...</>
                        ) : paymentMethod === "cod" ? (
                          <><Banknote className="h-5 w-5" />Đặt hàng COD — {formatCurrency(price * qty)}</>
                        ) : (
                          <><CreditCard className="h-5 w-5" />Thanh toán Online — {formatCurrency(price * qty)}</>
                        )}
                      </button>

                      <p className="text-center text-[11px] text-gray-400">
                        Bằng cách đặt hàng, bạn đồng ý với <span className="text-orange-500 cursor-pointer hover:underline">điều khoản dịch vụ</span> của chúng tôi
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description & Tags */}
        {(item.description || (item.tags?.length ?? 0) > 0) && (
          <div className="bg-white rounded-2xl shadow-sm mt-4 overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Mô tả sản phẩm</h2>
            </div>
            <div className="px-6 py-5 space-y-5">
              {item.description && (
                <div className="product-description whitespace-pre-line">{item.description}</div>
              )}
              {(item.tags?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Từ khoá</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags?.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="container mx-auto px-4 pb-12">
        <ProductCommentsSection productId={id} />
      </div>

      {/* ═══════════════════ LIGHTBOX ═══════════════════ */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setLightboxOpen(false);
            if (e.key === "ArrowLeft") setLightboxIndex((i) => Math.max(0, i - 1));
            if (e.key === "ArrowRight") setLightboxIndex((i) => Math.min(getAllImageUrls.length - 1, i + 1));
          }}
          tabIndex={0}
          style={{ outline: "none" }}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          {getAllImageUrls.length > 1 && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/10 text-white text-sm px-4 py-1.5 rounded-full backdrop-blur-sm">
              {lightboxIndex + 1} / {getAllImageUrls.length}
            </div>
          )}

          {/* Prev button */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-all z-10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Next button */}
          {lightboxIndex < getAllImageUrls.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-all z-10"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Main image */}
          <div
            className="max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getAllImageUrls[lightboxIndex] || getImageUrl(lightboxIndex)}
              alt={`${item.name} - Ảnh ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              style={{ userSelect: "none" }}
            />
          </div>

          {/* Thumbnail strip at bottom */}
          {getAllImageUrls.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-sm px-2">
              {getAllImageUrls.map((url, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === lightboxIndex ? "border-white scale-110" : "border-white/30 opacity-50 hover:opacity-80"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover bg-white" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
