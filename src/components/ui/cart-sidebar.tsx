"use client";

import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Ticket,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount
  );

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    totalQuantity,
    discountAmount,
    grandTotal,
    appliedVoucher,
    applyVoucher,
    removeVoucher,
  } = useCart();
  const [mounted, setMounted] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (appliedVoucher) {
      setVoucherCode(appliedVoucher.code);
    } else {
      setVoucherCode("");
    }
  }, [appliedVoucher]);

  const handleApplyVoucher = async () => {
    const code = voucherCode.trim();
    if (!code) {
      setVoucherError("Vui lòng nhập mã voucher");
      return;
    }
    if (subtotal <= 0) {
      setVoucherError("Giỏ hàng trống, không thể áp dụng voucher");
      return;
    }
    setVoucherLoading(true);
    setVoucherError(null);
    try {
      await applyVoucher(code);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể áp dụng voucher";
      setVoucherError(message);
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    removeVoucher();
    setVoucherError(null);
    setVoucherCode("");
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-rose-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Giỏ hàng
            </h2>
            {totalQuantity > 0 && (
              <Badge
                variant="secondary"
                className="bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300"
              >
                {totalQuantity}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          {items.length === 0 ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <ShoppingBag className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Giỏ hàng trống
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Bạn chưa có sản phẩm nào trong giỏ hàng
              </p>
              <Button onClick={onClose} asChild>
                <Link href="/vi/products">Tiếp tục mua sắm</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Items list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {items.map((item) => (
                  <div
                    key={`${item.id}-${item.variantId || ""}`}
                    className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    {/* Product image */}
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* Product details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
                        {item.name}
                      </h4>
                      {item.variantName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {item.variantName}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-1">
                        {formatCurrency(item.price)}
                      </p>

                      {/* Quantity controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1),
                                item.variantId
                              )
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity + 1,
                                item.variantId
                              )
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={() => removeItem(item.id, item.variantId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Mã ưu đãi
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={voucherCode}
                        onChange={(e) => {
                          setVoucherCode(e.target.value);
                          if (voucherError) setVoucherError(null);
                        }}
                        placeholder="Nhập mã voucher"
                        className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 dark:border-gray-600 dark:bg-gray-900"
                        disabled={voucherLoading}
                      />
                      <Button
                        onClick={handleApplyVoucher}
                        disabled={
                          voucherLoading || !voucherCode.trim() || subtotal <= 0
                        }
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
                      <p className="text-xs text-red-500 mt-1">
                        {voucherError}
                      </p>
                    )}
                    {appliedVoucher && (
                      <div className="mt-3 flex items-center justify-between rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/10 dark:text-emerald-300">
                        <div>
                          <p className="font-semibold text-sm">
                            Đã áp dụng: {appliedVoucher.code}
                          </p>
                          <p className="text-xs">
                            Giảm {formatCurrency(discountAmount)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-200"
                          onClick={handleRemoveVoucher}
                        >
                          Gỡ
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                    <span>Tạm tính</span>
                    <span className="font-medium">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  {appliedVoucher && discountAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-300">
                      <span>Voucher {appliedVoucher.code}</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      Thành tiền
                  </span>
                  <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(grandTotal)}
                  </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button className="w-full" size="lg">
                    Thanh toán
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={onClose}
                    asChild
                  >
                    <Link href="/vi/cart">Xem giỏ hàng</Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
