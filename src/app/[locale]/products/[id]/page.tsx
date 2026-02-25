"use client";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/apiRequests/products";
import { useParams, useRouter } from "next/navigation";
import BuyNowModal from "@/components/ui/buy-now-modal";
import { useAppContextProvider } from "@/context/app-context";
import { useCart } from "@/context/cart-context";
import { useCartSidebar } from "@/context/cart-sidebar-context";
import { Loader } from "@/components/ui/loader";
import {
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ProductCommentsSection from "@/components/product-comments";
import { StructuredData } from "@/components/StructuredData";
import { envConfig } from "@/config";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount
  );

export default function ProductDetailPage() {
  const params = useParams<{ id: string; locale?: string }>();
  const router = useRouter();
  const id = params?.id as string;
  const locale = params?.locale || "vi";
  const { sessionToken } = useAppContextProvider();
  const { addItem } = useCart();
  const { openSidebar } = useCartSidebar();

  const [item, setItem] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [buyOpen, setBuyOpen] = useState(false);

  // suppress unused warning — kept for session-aware future features
  void sessionToken;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/public/${id}`, {
          next: { revalidate: 60 },
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;
        if (data?.data) {
          setItem(data.data as Product);
        } else {
          setError("Không thể tải thông tin sản phẩm");
        }
      } catch (err: unknown) {
        if (cancelled) return;
        console.error("Error loading product:", err);
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi tải sản phẩm");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

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
        availability:
          item.quantity && item.quantity > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        url: `${baseUrl}/${locale}/products/${id}`,
      },
      ...(item.rating
        ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: item.rating,
            reviewCount: item.numReviews || 0,
          },
        }
        : {}),
    };
  }, [item, id, locale, getAllImageUrls]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] pt-25 flex items-center justify-center">
        <Loader isLoading={true} message="Đang tải thông tin sản phẩm..." size="lg" overlay={false} />
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

  return (
    <div className="min-h-screen bg-[#f5f5f5] pt-25">
      {productStructuredData && (
        <StructuredData type="Product" data={productStructuredData} />
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-2">
          <nav className="flex items-center gap-1 text-xs text-gray-500 flex-wrap">
            <button onClick={() => router.push(`/${locale}`)} className="hover:text-orange-500 transition-colors">Trang chủ</button>
            <span>›</span>
            <button onClick={() => router.push(`/${locale}/products`)} className="hover:text-orange-500 transition-colors">Sản phẩm</button>
            {item.category && (
              <>
                <span>›</span>
                <span className="text-gray-600">
                  {typeof item.category === "object" ? item.category.name : item.category}
                </span>
              </>
            )}
            <span>›</span>
            <span className="text-gray-800 font-medium truncate max-w-[200px]">{item.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Panel */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[500px_1fr]">

            {/* LEFT: Image Gallery */}
            <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-100">
              {/* Main image */}
              <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4 border border-gray-100 group cursor-zoom-in">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageUrl(selectedImageIndex)}
                  alt={item.name}
                  className="w-full h-full object-contain p-8 transition-transform duration-300 group-hover:scale-110"
                />
                {typeof item.quantity === "number" && item.quantity === 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-white text-gray-800 font-bold px-6 py-2 rounded-full text-lg">Hết hàng</span>
                  </div>
                )}
                {getAllImageUrls.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                    {selectedImageIndex + 1}/{getAllImageUrls.length}
                  </div>
                )}
                <button
                  className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <Share2 className="h-3.5 w-3.5 text-gray-500" />
                </button>
              </div>

              {/* Thumbnail strip */}
              {getAllImageUrls.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {getAllImageUrls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImageIndex(i)}
                      className={`flex-shrink-0 w-[72px] h-[72px] rounded-lg border-2 overflow-hidden transition-all ${i === selectedImageIndex
                          ? "border-orange-500 shadow-md"
                          : "border-gray-200 hover:border-orange-300 opacity-70 hover:opacity-100"
                        }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Ảnh ${i + 1}`} className="w-full h-full object-contain bg-white p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Product Info */}
            <div className="p-6 flex flex-col gap-5">

              {/* Title */}
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 leading-snug flex-1">
                  {item.name}
                </h1>
                <button className="flex-shrink-0 w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:border-red-400 hover:text-red-400 transition-colors group">
                  <Heart className="h-4 w-4 group-hover:fill-red-100 transition-all" />
                </button>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 text-sm flex-wrap">
                {item.brand && (
                  <span className="text-gray-500">
                    Thương hiệu:{" "}
                    <span className="text-blue-600 font-medium">
                      {typeof item.brand === "object" ? item.brand.name : item.brand}
                    </span>
                  </span>
                )}
                {item.brand && item.category && <span className="text-gray-300">|</span>}
                {item.category && (
                  <span className="text-gray-500">
                    Danh mục:{" "}
                    <span className="font-medium text-gray-700">
                      {typeof item.category === "object" ? item.category.name : item.category}
                    </span>
                  </span>
                )}
                {typeof item.quantity === "number" && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className={`font-semibold text-sm ${item.quantity > 0 ? "text-green-600" : "text-red-500"}`}>
                      {item.quantity > 0 ? `✓ Còn hàng (${item.quantity})` : "✗ Hết hàng"}
                    </span>
                  </>
                )}
              </div>

              {/* Price */}
              <div className="bg-orange-50 rounded-xl px-5 py-4 border border-orange-100">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl lg:text-4xl font-bold text-orange-500">
                    {formatCurrency(price)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Giá đã bao gồm VAT • Miễn phí vận chuyển toàn quốc</p>
              </div>

              {/* Variants */}
              {(item.variants?.length ?? 0) > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Chọn loại:</p>
                  <div className="flex flex-wrap gap-2">
                    {item.variants?.map((variant) => (
                      <button
                        key={variant._id || variant.id}
                        onClick={() => setSelectedVariant((variant._id || variant.id) as string)}
                        className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${selectedVariant === (variant._id || variant.id)
                            ? "border-orange-500 bg-orange-50 text-orange-600 shadow-sm"
                            : "border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50/50"
                          }`}
                      >
                        <span className="block">{variant.name}</span>
                        <span className="block text-xs font-normal text-gray-400">{formatCurrency(variant.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">Số lượng:</span>
                <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xl select-none"
                  >−</button>
                  <div className="w-14 text-center text-base font-semibold border-x-2 border-gray-200 h-10 flex items-center justify-center">
                    {qty}
                  </div>
                  <button
                    onClick={() => setQty((q) => Math.min(q + 1, item.quantity ?? 999))}
                    disabled={qty >= (item.quantity ?? 999)}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xl select-none"
                  >+</button>
                </div>
                {typeof item.quantity === "number" && (
                  <span className="text-xs text-gray-400">{item.quantity} có sẵn</span>
                )}
              </div>

              {/* CTA */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const variant = item.variants?.find(
                      (x) => x._id === selectedVariant || x.id === selectedVariant
                    ) || null;
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
                  }}
                  disabled={item.quantity === 0}
                  className="flex-1 h-12 rounded-lg border-2 border-orange-500 text-orange-500 bg-white font-semibold text-sm hover:bg-orange-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Thêm vào giỏ hàng
                </button>
                <button
                  onClick={() => setBuyOpen(true)}
                  disabled={item.quantity === 0}
                  className="flex-1 h-12 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mua ngay
                </button>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <Truck className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-[11px] text-gray-500 leading-tight font-medium">Miễn phí<br />vận chuyển</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-green-500" />
                  </div>
                  <span className="text-[11px] text-gray-500 leading-tight font-medium">Hàng chính<br />hãng 100%</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                    <RotateCcw className="h-5 w-5 text-orange-500" />
                  </div>
                  <span className="text-[11px] text-gray-500 leading-tight font-medium">Đổi trả<br />30 ngày</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description & Tags */}
        {(item.description || (item.tags?.length ?? 0) > 0) && (
          <div className="bg-white rounded-lg shadow-sm mt-4 overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-800">Mô tả sản phẩm</h2>
            </div>
            <div className="px-6 py-5 space-y-5">
              {item.description && (
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {item.description}
                </div>
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

      <BuyNowModal
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
        items={[{ name: item.name, price, quantity: qty }]}
      />
    </div>
  );
}
