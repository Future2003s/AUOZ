"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import BuyNowModal from "@/components/ui/buy-now-modal";
import type { Product } from "@/apiRequests/products";
import { toast } from "sonner";
import {
  CheckCircle2,
  Leaf,
  ShieldCheck,
  Truck,
  PhoneCall,
  ExternalLink,
  Sparkles,
} from "lucide-react";

type PublicProductsResponse = {
  data?: Product[];
  pagination?: unknown;
  message?: string;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount
  );

function TetCornerOrnament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="tetGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path
        d="M14 14h44c24 0 48 10 48 34v58"
        fill="none"
        stroke="url(#tetGold)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M14 14v44c0 24 10 48 34 48h58"
        fill="none"
        stroke="url(#tetGold)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="22" cy="22" r="6" fill="#fde68a" />
      <circle cx="42" cy="20" r="4" fill="#fbbf24" opacity="0.9" />
      <circle cx="20" cy="42" r="4" fill="#fbbf24" opacity="0.9" />
    </svg>
  );
}

function TetBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-gradient-to-r from-rose-50 to-amber-50 px-3 py-1 text-xs font-semibold text-rose-900 shadow-sm">
      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
      {children}
    </span>
  );
}

function TetIconLantern({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="lanternRed" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ef4444" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id="lanternGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path
        d="M32 4c6 0 10 4 10 10v4H22v-4c0-6 4-10 10-10Z"
        fill="url(#lanternGold)"
      />
      <path
        d="M20 18h24c4 6 6 12 6 18 0 12-8 22-18 22S14 48 14 36c0-6 2-12 6-18Z"
        fill="url(#lanternRed)"
      />
      <path
        d="M18 28h28"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M18 36h28"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M32 58v4"
        stroke="url(#lanternGold)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="32" cy="22" r="2" fill="#fde68a" opacity="0.9" />
    </svg>
  );
}

function TetIconApricot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="apricot" cx="50%" cy="40%" r="70%">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
      <g transform="translate(32 32)">
        {[0, 72, 144, 216, 288].map((deg) => (
          <path
            key={deg}
            d="M0-22c10 0 18 8 18 18S10 14 0 14-18 6-18-4-10-22 0-22Z"
            fill="url(#apricot)"
            transform={`rotate(${deg})`}
            opacity="0.95"
          />
        ))}
        <circle r="6" fill="#b45309" opacity="0.9" />
        <circle r="3" fill="#fff7ed" opacity="0.8" />
      </g>
    </svg>
  );
}

function TetIconFirecracker({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="cracker" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ef4444" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      <path
        d="M18 10h28v44H18z"
        fill="url(#cracker)"
        rx="6"
        ry="6"
      />
      <path
        d="M18 18h28"
        stroke="#fde68a"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M18 30h28"
        stroke="#fde68a"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M18 42h28"
        stroke="#fde68a"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M32 6c-3 3-3 6 0 9"
        fill="none"
        stroke="#f59e0b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="30" cy="9" r="2" fill="#f59e0b" />
      <circle cx="36" cy="12" r="1.5" fill="#fde68a" />
    </svg>
  );
}

function normalizeText(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickBestMatch(list: Product[], target: string) {
  const t = normalizeText(target);
  const scored = list
    .map((p) => {
      const name = normalizeText(p?.name || "");
      let score = 0;
      if (!name) score -= 1000;
      if (name.includes("nuoc cot vai")) score += 10;
      if (name.includes("100")) score += 4;
      if (name.includes("thanh ha")) score += 4;
      if (name.includes(t)) score += 6;
      // Prefer visible/active items if present in model
      if ((p as any)?.status === "active") score += 1;
      if ((p as any)?.isVisible === true) score += 1;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.score > 0 ? scored[0].p : null;
}

function getFirstImageUrl(product?: Product | null) {
  const imgs: any[] = (product as any)?.images || [];
  if (!Array.isArray(imgs) || imgs.length === 0) return "/images/vaiThieuChinDo.jpg";
  const first = imgs[0];
  if (typeof first === "string" && first.trim()) return first.trim();
  if (first && typeof first === "object" && typeof first.url === "string")
    return first.url.trim();
  return "/images/vaiThieuChinDo.jpg";
}

export default function NuocCotVai100Landing() {
  const params = useParams<{ locale?: string }>();
  const router = useRouter();
  const locale = params?.locale || "vi";

  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [buyOpen, setBuyOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const tryQueries = ["Nước Cốt Vải 100%", "Nước Cốt Vải", "nuoc cot vai"];
        let found: Product | null = null;

        for (const q of tryQueries) {
          const res = await fetch(
            `/api/products/public?q=${encodeURIComponent(q)}&page=1&size=24`,
            { next: { revalidate: 60 } }
          );
          if (!res.ok) continue;
          const data = (await res.json()) as PublicProductsResponse;
          const list = Array.isArray(data?.data) ? data.data : [];
          found = pickBestMatch(list, "Nước Cốt Vải 100% Thanh Hà");
          if (found) break;
        }

        // Fallback: fetch first page and try match (in case backend search is strict)
        if (!found) {
          const res = await fetch(`/api/products/public?page=1&size=100`, {
            next: { revalidate: 60 },
          });
          if (res.ok) {
            const data = (await res.json()) as PublicProductsResponse;
            const list = Array.isArray(data?.data) ? data.data : [];
            found = pickBestMatch(list, "Nước Cốt Vải 100% Thanh Hà");
          }
        }

        if (!cancelled) {
          setProduct(found);
          if (!found) {
            toast.error(
              "Chưa tìm thấy sản phẩm 'Nước Cốt Vải 100%'. Vui lòng liên hệ để được hỗ trợ đặt hàng."
            );
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          toast.error("Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.");
          setProduct(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const productName = product?.name || "Nước Cốt Vải 100% Thanh Hà";
  const price = useMemo(() => Number((product as any)?.price) || 0, [product]);
  const imageUrl = useMemo(() => getFirstImageUrl(product), [product]);
  const total = useMemo(() => Math.max(price * qty, 0), [price, qty]);

  const canOrder = price > 0;

  return (
    <div className="min-h-screen pt-25">
      {/* Tet background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#7f1d1d] via-[#b91c1c] to-[#fff7e6] opacity-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.22),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(225,29,72,0.18),transparent_55%)]" />
          <div className="absolute inset-0 opacity-[0.08]">
            {/* Subtle Vietnamese background photo as texture */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cauChuyenBackGround.jpg"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Decorative corners */}
        <TetCornerOrnament className="pointer-events-none absolute -top-8 -left-8 h-28 w-28 opacity-80" />
        <TetCornerOrnament className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rotate-90 opacity-80" />
        <TetCornerOrnament className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 -rotate-90 opacity-80" />
        <TetCornerOrnament className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rotate-180 opacity-80" />

        <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-0 bg-gradient-to-r from-[#7f1d1d] to-[#b91c1c] text-[#fff7e6] shadow-md hover:from-[#6f1515] hover:to-[#a11212]">
                    Sắc Tết • Thông tin chính hãng LALA-LYCHEEE
                  </Badge>
                  <TetBadge>Quét QR • Tìm hiểu & đặt hàng nhanh</TetBadge>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                  {productName}
                </h1>
                <div className="flex items-center gap-3 text-amber-900/70">
                  <TetIconLantern className="h-7 w-7 drop-shadow-sm" />
                  <TetIconApricot className="h-7 w-7 drop-shadow-sm" />
                  <TetIconFirecracker className="h-7 w-7 drop-shadow-sm" />
                  <span className="text-sm font-semibold">
                    Sản phẩm mới • Nước cốt vải 100% (không phải Mật Ong)
                  </span>
                </div>
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                  Nước cốt vải nguyên chất từ vải thiều Thanh Hà – thơm ngọt tự
                  nhiên, tiện dùng mỗi ngày. Bạn có thể đặt hàng nhanh ngay trên
                  trang này.
                </p>
              </div>

              <Card className="border border-amber-200/60 shadow-xl overflow-hidden bg-[#fff7e6]/70 backdrop-blur">
                <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-white to-amber-50">
                  <Image
                    src={imageUrl}
                    alt={productName}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/5 to-transparent" />
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Leaf className="h-4 w-4 text-green-600" />
                      100% nguyên chất
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      Nguồn gốc rõ ràng
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Truck className="h-4 w-4 text-amber-700" />
                      Giao hàng toàn quốc
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      "Hương vị thơm ngon, dễ uống",
                      "Phù hợp pha chế/đồ uống",
                      "Đóng gói tiện lợi",
                    ].map((t) => (
                      <div
                        key={t}
                        className="flex items-start gap-2 text-sm rounded-lg p-3 border border-amber-100 bg-white/70"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                        <span className="text-gray-700">{t}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-amber-200/60 shadow-lg bg-white/75 backdrop-blur">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Gợi ý dùng trong ngày Tết
                    </h2>
                    <span className="text-xs font-semibold text-amber-700">
                      “Ngọt lành đón lộc”
                    </span>
                  </div>
                  <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                    <li>Pha cùng nước mát/đá để uống giải khát.</li>
                    <li>Mix với sữa chua, soda hoặc cocktail nhẹ.</li>
                    <li>Dùng làm topping cho món tráng miệng.</li>
                  </ul>
                  <p className="text-xs text-gray-500">
                    Lưu ý: thông tin mang tính tham khảo. Vui lòng xem hướng dẫn
                    trên nhãn sản phẩm khi sử dụng.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-amber-200/60 shadow-lg bg-white/75 backdrop-blur">
                <CardContent className="p-5 space-y-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Chứng nhận & uy tín
                  </h2>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative h-12 w-[160px]">
                      <Image
                        src="/images/iso 22000.2018.png"
                        alt="ISO 22000:2018"
                        fill
                        className="object-contain"
                        sizes="160px"
                      />
                    </div>
                    <div className="relative h-12 w-[140px]">
                      <Image
                        src="/images/tg_bct_logo.png"
                        alt="Bộ Công Thương"
                        fill
                        className="object-contain"
                        sizes="140px"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    Sản phẩm được kiểm soát chất lượng trong quá trình sản xuất và
                    đóng gói.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right: order card */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
              <Card className="border border-amber-200/60 shadow-2xl bg-[#fff7e6]/85 backdrop-blur">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-gray-600">Giá bán</div>
                      <div className="text-2xl font-bold text-[#b91c1c]">
                        {canOrder ? formatCurrency(price) : "Liên hệ"}
                      </div>
                      {loading && (
                        <div className="text-xs text-gray-500 mt-1">
                          Đang tải thông tin sản phẩm...
                        </div>
                      )}
                    </div>
                    {product?._id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/${locale}/products/${product._id}`)}
                        className="border-amber-300 bg-white/70 hover:bg-white"
                      >
                        Xem chi tiết <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800">
                      Số lượng
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        disabled={qty <= 1}
                      >
                        -
                      </Button>
                      <div className="w-14 text-center font-semibold">
                        {qty}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setQty((q) => q + 1)}
                      >
                        +
                      </Button>
                      <div className="ml-auto text-sm text-gray-600">
                        Tạm tính:{" "}
                        <span className="font-semibold text-gray-900">
                          {canOrder ? formatCurrency(total) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      className="h-12 bg-gradient-to-r from-[#b91c1c] to-[#f59e0b] hover:from-[#991b1b] hover:to-[#d97706] text-[#fff7e6] shadow-lg"
                      onClick={() => {
                        if (!canOrder) {
                          toast.info("Sản phẩm chưa có giá hiển thị. Vui lòng liên hệ để đặt hàng.");
                          return;
                        }
                        setBuyOpen(true);
                      }}
                      disabled={loading}
                    >
                      Đặt hàng lấy lộc
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 border-amber-300 bg-white/70 hover:bg-white"
                      onClick={() => {
                        window.location.href = "tel:0900000000";
                      }}
                    >
                      <PhoneCall className="h-4 w-4 mr-2" />
                      Gọi hỗ trợ
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500">
                    Sau khi đặt hàng, hệ thống sẽ hiển thị{" "}
                    <span className="font-medium">Đặt hàng thành công</span> và
                    đội ngũ sẽ liên hệ xác nhận.
                  </div>
                </CardContent>
              </Card>

              {/* Desktop-only trust box */}
              <div className="hidden lg:block">
                <Card className="border border-amber-200/60 shadow-lg bg-white/75 backdrop-blur">
                  <CardContent className="p-5 space-y-3">
                    <div className="text-sm font-semibold text-gray-900">
                      Cam kết
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                        <span>Đóng gói cẩn thận, giao nhanh.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                        <span>Hỗ trợ đổi trả theo chính sách.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                        <span>Thanh toán COD hoặc online.</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-amber-200/70 bg-[#fff7e6]/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-xs text-gray-600">Giá</div>
            <div className="text-base font-bold text-[#b91c1c] truncate">
              {canOrder ? formatCurrency(price) : "Liên hệ"}
            </div>
          </div>
          <Button
            className="ml-auto h-11 px-5 bg-gradient-to-r from-[#b91c1c] to-[#f59e0b] hover:from-[#991b1b] hover:to-[#d97706] text-[#fff7e6]"
            onClick={() => {
              if (!canOrder) {
                toast.info("Sản phẩm chưa có giá hiển thị. Vui lòng liên hệ để đặt hàng.");
                return;
              }
              setBuyOpen(true);
            }}
            disabled={loading}
          >
            Đặt hàng
          </Button>
        </div>
      </div>

      <BuyNowModal
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
        items={[{ name: productName, price: canOrder ? price : 0, quantity: qty }]}
      />
        </div>
      </div>
  );
}

