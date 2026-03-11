"use client";

import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Plus,
  Minus,
  Truck,
  Shield,
  CreditCard,
  Ticket,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { defaultLocale, getLocaleFromPathname } from "@/i18n/config";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount
  );

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    clear,
    subtotal,
    totalQuantity,
    appliedVoucher,
    discountAmount,
    grandTotal,
    applyVoucher,
    removeVoucher,
  } = useCart();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname || "") ?? defaultLocale;

  useEffect(() => {
    if (appliedVoucher) {
      setVoucherCode(appliedVoucher.code);
    } else {
      setVoucherCode("");
    }
  }, [appliedVoucher]);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError("Vui lòng nhập mã voucher");
      return;
    }
    setVoucherError(null);
    setVoucherLoading(true);
    try {
      await applyVoucher(voucherCode);
    } catch (error) {
      if (error instanceof Error) {
        setVoucherError(error.message);
      } else {
        setVoucherError("Không thể áp dụng voucher");
      }
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleUpdateQuantity = async (
    id: string,
    quantity: number,
    variantId?: string | null
  ) => {
    setIsUpdating(id);
    try {
      updateQuantity(id, quantity, variantId);
    } finally {
      setIsUpdating(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pt-25">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-12">
              <ShoppingBag className="mx-auto h-24 w-24 text-gray-300 dark:text-gray-600 mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Giỏ hàng trống
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các sản
                phẩm tuyệt vời của chúng tôi!
              </p>
              <div className="space-y-4">
                <Button size="lg" asChild className="w-full">
                  <Link href="/vi/products">Tiếp tục mua sắm</Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="w-full">
                  <Link href="/vi">Về trang chủ</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pt-25">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vi/products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tiếp tục mua sắm
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Giỏ hàng
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Bạn có {totalQuantity} sản phẩm trong giỏ hàng
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg dark:shadow-gray-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-rose-600" />
                  Sản phẩm ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item) => (
                    <div
                      key={`${item.id}-${item.variantId || ""}`}
                      className="p-6"
                    >
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="relative w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 30vw"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                              <ShoppingBag className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                {item.name}
                              </h3>
                              {item.variantName && (
                                <Badge variant="secondary" className="mb-2">
                                  {item.variantName}
                                </Badge>
                              )}
                              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                {formatCurrency(item.price)}
                              </p>
                            </div>

                            {/* Remove Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() =>
                                removeItem(item.id, item.variantId)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Quantity controls */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Số lượng:
                              </span>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      item.id,
                                      Math.max(1, item.quantity - 1),
                                      item.variantId
                                    )
                                  }
                                  disabled={isUpdating === item.id}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-lg font-semibold min-w-[3rem] text-center text-gray-900 dark:text-white">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      item.id,
                                      item.quantity + 1,
                                      item.variantId
                                    )
                                  }
                                  disabled={isUpdating === item.id}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Tổng:
                              </p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={clear}
                className="flex-1"
              >
                Xóa tất cả
              </Button>
              <Button variant="outline" size="lg" asChild className="flex-1">
                <Link href="/vi/products">Tiếp tục mua sắm</Link>
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg dark:shadow-gray-900/50 sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 dark:text-white">
                  Tóm tắt đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary Details */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Mã ưu đãi
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <Input
                          placeholder="Nhập mã voucher"
                          value={voucherCode}
                          disabled={voucherLoading}
                          onChange={(e) => setVoucherCode(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleApplyVoucher}
                        disabled={voucherLoading || !voucherCode.trim()}
                        className="flex items-center gap-2"
                      >
                        {voucherLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang áp dụng
                          </>
                        ) : (
                          <>
                            <Ticket className="h-4 w-4" />
                            Áp dụng
                          </>
                        )}
                      </Button>
                    </div>
                    {voucherError && (
                      <p className="text-xs text-red-500 mt-1">{voucherError}</p>
                    )}
                    {appliedVoucher && (
                      <div className="mt-3 flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900 text-emerald-700 dark:text-emerald-200 rounded-lg p-3">
                        <div>
                          <p className="font-semibold">
                            Đã áp dụng: {appliedVoucher.code}
                          </p>
                          <p className="text-xs">
                            Giảm {formatCurrency(discountAmount)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeVoucher}
                          className="text-sm text-emerald-600 dark:text-emerald-200"
                        >
                          Gỡ
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">
                        Tạm tính ({totalQuantity} sản phẩm):
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">
                        Mã giảm giá:
                      </span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {discountAmount > 0
                          ? `- ${formatCurrency(discountAmount)}`
                          : "Không áp dụng"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">
                        Phí vận chuyển:
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Miễn phí
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900 dark:text-white">
                        Tổng cộng:
                      </span>
                      <span className="text-rose-600 dark:text-rose-400">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <Truck className="h-4 w-4 text-green-600" />
                    <span>Miễn phí vận chuyển</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span>Bảo hành chính hãng</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700"
                  onClick={() => {
                    if (items.length === 0) return;
                    router.push(`/${locale}/checkout`);
                  }}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Thanh toán ngay
                </Button>

                {/* Security Note */}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  🔒 Thanh toán an toàn với SSL encryption
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
