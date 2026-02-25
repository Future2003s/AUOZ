"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useAppContextProvider } from "@/context/app-context";
import { ButtonLoader } from "@/components/ui/loader";
import { envConfig } from "@/config";
import { useAuth } from "@/hooks/useAuth";
import { Address, useAddresses } from "@/hooks/useAddresses";
import type { AppliedVoucher } from "@/context/cart-context";

export interface BuyNowItem {
  name: string;
  price: number;
  quantity: number;
  productId?: string;
  variantId?: string | null;
}

interface BuyNowModalProps {
  open: boolean;
  onClose: () => void;
  items: BuyNowItem[];
}

interface OrderSuccessData {
  orderNumber: string;
  total: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: BuyNowItem[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount
  );

const formatAddress = (addr?: Address | null) => {
  if (!addr) return "";

  const parts = [
    addr.street,
    [addr.city, addr.state].filter(Boolean).join(", "),
    [addr.zipCode, addr.country].filter(Boolean).join(", "),
    [addr.wardOld, addr.districtOld, addr.provinceOld].filter(Boolean).join(", ") ||
    [addr.wardNew, addr.provinceNew].filter(Boolean).join(", "),
  ];

  return parts
    .map((part) => (part || "").trim())
    .filter((part) => Boolean(part))
    .join(", ");
};

export default function BuyNowModal({
  open,
  onClose,
  items,
}: BuyNowModalProps) {
  const { sessionToken } = useAppContextProvider();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: addresses = [] } = useAddresses({
    enabled: isAuthenticated && open,
  });
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Field-specific validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    phone?: string;
    address?: string;
  }>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [orderSuccessData, setOrderSuccessData] =
    useState<OrderSuccessData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank">("cod");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(
    null
  );

  const { totalQty, totalPrice } = useMemo(() => {
    const totalQty = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    const totalPrice = items.reduce(
      (s, it) => s + (Number(it.quantity) || 0) * (Number(it.price) || 0),
      0
    );
    return { totalQty, totalPrice };
  }, [items]);

  const discountAmount = appliedVoucher?.discountAmount ?? 0;
  const grandTotal = Math.max(totalPrice - discountAmount, 0);

  const defaultAddress = useMemo(() => {
    if (!addresses?.length) {
      return null;
    }
    return addresses.find((addr) => addr.isDefault) || addresses[0];
  }, [addresses]);

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (!open || authLoading) return;

    // If not authenticated, don't populate user data
    if (!isAuthenticated || !user) {
      return;
    }

    const displayName = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (displayName && !fullName) {
      setFullName(displayName);
    }

    const userPhone = (user as any)?.phone;
    if (userPhone && !phone) {
      setPhone(userPhone);
    }

    if (user.email && !email) {
      setEmail(user.email);
    }
  }, [open, authLoading, isAuthenticated, user, fullName, phone, email]);

  useEffect(() => {
    if (!open || !defaultAddress) return;
    setAddress((prev) => (prev ? prev : formatAddress(defaultAddress)));
  }, [open, defaultAddress]);

  useEffect(() => {
    if (open) return;
    setVoucherCode("");
    setVoucherError(null);
    setAppliedVoucher(null);
    setVoucherLoading(false);
  }, [open]);

  const handleApplyVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      setVoucherError("Vui lòng nhập mã voucher");
      return;
    }
    if (totalPrice <= 0) {
      setVoucherError("Vui lòng chọn sản phẩm trước khi áp dụng voucher");
      return;
    }
    setVoucherError(null);
    setVoucherLoading(true);
    try {
      const res = await fetch("/api/vouchers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: totalPrice }),
      });
      const text = await res.text();
      const payload = text ? JSON.parse(text) : null;
      if (!res.ok) {
        throw new Error(
          payload?.message ||
          payload?.data?.message ||
          "Không thể áp dụng voucher"
        );
      }
      const data = payload?.data ?? payload;
      const normalized: AppliedVoucher = {
        id: data?.voucher?.id || data?.id || code,
        code: data?.voucher?.code || code,
        name: data?.voucher?.name,
        description: data?.voucher?.description,
        discountType: data?.voucher?.discountType || "fixed",
        discountValue: Number(data?.voucher?.discountValue || 0),
        maxDiscountValue: data?.voucher?.maxDiscountValue,
        minOrderValue: data?.voucher?.minOrderValue,
        status: data?.voucher?.status || data?.runtimeStatus || "active",
        discountAmount: Number(data?.discountAmount || 0),
      };
      setAppliedVoucher(normalized);
      setVoucherCode(code);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể áp dụng voucher";
      setVoucherError(message);
      setAppliedVoucher(null);
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError(null);
    setVoucherCode("");
  };

  const createPayment = async () => {
    if (totalPrice <= 0 || totalQty <= 0) {
      setError("Vui lòng chọn sản phẩm và số lượng hợp lệ.");
      return;
    }
    // Validate individual fields
    const errors: { fullName?: string; phone?: string; address?: string } = {};
    let hasError = false;

    if (!fullName.trim()) {
      errors.fullName = "Vui lòng nhập họ và tên";
      hasError = true;
    }

    if (!phone.trim()) {
      errors.phone = "Vui lòng nhập số điện thoại";
      hasError = true;
    } else if (!/^[0-9]{10,11}$/.test(phone.trim().replace(/\s/g, ""))) {
      errors.phone = "Số điện thoại không hợp lệ (10-11 số)";
      hasError = true;
    }

    if (!address.trim()) {
      errors.address = "Vui lòng nhập địa chỉ nhận hàng";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(errors);
      // Scroll to first error field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[data-field="${firstErrorField}"]`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Clear field errors if validation passes
    setFieldErrors({});
    if (grandTotal <= 0) {
      setError("Tổng tiền sau ưu đãi phải lớn hơn 0.");
      return;
    }
    // Login is optional for guest checkout
    // if (!sessionToken) {
    //   setError("Vui lòng đăng nhập trước khi đặt hàng.");
    //   return;
    // }
    setLoading(true);
    setError(null);
    setSuccess(null);

    const orderItems = items
      .filter((it) => it.quantity > 0)
      .map((it) => ({
        name: it.name,
        quantity: it.quantity,
        price: it.price,
        ...(it.productId ? { productId: it.productId } : {}),
        ...(it.variantId ? { variantId: it.variantId } : {}),
      }));

    const descriptionParts = [
      `${totalQty} sản phẩm - Người mua: ${fullName} - ĐT: ${phone}`,
    ];

    if (appliedVoucher && discountAmount > 0) {
      descriptionParts.push(
        `Voucher ${appliedVoucher.code} giảm ${formatCurrency(discountAmount)}`
      );
    }

    const orderPayload = {
      amount: grandTotal,
      originalAmount: totalPrice,
      discountAmount,
      voucherCode: appliedVoucher?.code,
      description: descriptionParts.join(" | "),
      items: orderItems,
      customer: { fullName, phone, email, address, note },
      paymentMethod,
      voucher: appliedVoucher
        ? {
          code: appliedVoucher.code,
          description: appliedVoucher.description,
          discountAmount,
        }
        : undefined,
    };

    try {
      if (paymentMethod === "bank") {
        const paymentUrl = `${envConfig.NEXT_PUBLIC_BACKEND_URL}/create-payment-link`;
        const response = await fetch(
          paymentUrl,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderPayload),
          }
        );
        if (!response.ok) {
          let errorData;
          try {
            const text = await response.text();
            errorData = text ? JSON.parse(text) : {};
          } catch (error) {
            console.error("JSON parse error:", error);
            errorData = {};
          }
          throw new Error(errorData.message || "Tạo link thanh toán thất bại!");
        }
        let result;
        try {
          const text = await response.text();
          result = text ? JSON.parse(text) : null;
        } catch (error) {
          console.error("JSON parse error:", error);
          throw new Error("Lỗi khi parse response");
        }
        if (result && result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        } else {
          throw new Error(
            "Không nhận được checkoutUrl từ phản hồi của server."
          );
        }
      } else {
        // Luôn dùng /api/orders vì backend /orders/create cũng map về cùng createOrder controller
        // Backend createOrder chấp nhận cả có user lẫn không có user
        const endpoint = "/api/orders";

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        // Backend createOrder (d:\BeLLLC\src\controllers\orderController.ts) yêu cầu:
        // - items[]: { productId?, name (required), sku (required), quantity, price }
        // - customer: { fullName, phone, address, note } (nếu không có shippingAddress)
        // - paymentMethod: "cod" (KHÔNG phải paymentInfo.method)
        // - notes, couponCode, amount (optional)
        // Khi không truyền shippingAddress, backend tự build từ customer

        const bodyToSend = {
          items: orderItems.map((it) => ({
            ...(it.productId ? { productId: it.productId } : {}),
            name: it.name,                              // REQUIRED
            sku: it.productId || `SKU-${Date.now()}`,   // REQUIRED - dùng productId hoặc generate
            quantity: it.quantity,
            price: it.price,
          })),
          customer: {
            fullName,
            phone,
            email,
            address,
            note,
          },
          paymentMethod: "cod",   // Backend tự map sang "cash_on_delivery"
          notes: note || undefined,
          couponCode: appliedVoucher?.code || undefined,
          amount: grandTotal,
          description: `${totalQty} sản phẩm - ${fullName} - ${phone}`,
        };

        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(bodyToSend),
          credentials: "include",
        });


        if (!response.ok) {
          let errorData;
          try {
            const text = await response.text();
            errorData = text ? JSON.parse(text) : {};
          } catch (error) {
            console.error("JSON parse error:", error);
            errorData = {};
          }
          throw new Error(errorData.message || "Đặt hàng COD thất bại!");
        }

        // Parse response to get order details
        let orderResult;
        try {
          const text = await response.text();
          orderResult = text ? JSON.parse(text) : null;
        } catch (error) {
          console.error("JSON parse error:", error);
          orderResult = null;
        }

        // Create order success data
        const orderNumber = orderResult?.data?.orderNumber || "N/A";
        const orderTotal = orderResult?.data?.total || grandTotal;

        setOrderSuccessData({
          orderNumber,
          total: orderTotal,
          customerName: fullName,
          customerPhone: phone,
          customerAddress: address,
          items: orderItems,
        });

        // Start countdown and auto close modal after 5 seconds
        setCountdown(5);
        const countdownInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              onClose();
              // Reset form
              setFullName("");
              setPhone("");
              setEmail("");
              setAddress("");
              setNote("");
              setSuccess(null);
              setError(null);
              setFieldErrors({});
              setOrderSuccessData(null);
              setCountdown(null);
              setAppliedVoucher(null);
              setVoucherCode("");
              setVoucherError(null);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Đã có lỗi không xác định."
      );
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold">Thông tin mua hàng</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[80vh] overflow-auto">
          {!orderSuccessData && (
            <>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Sản phẩm</h4>
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="truncate pr-2">
                        {it.name} × {it.quantity}
                      </div>
                      <div className="font-medium">
                        {formatCurrency(it.price * it.quantity)}
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Tổng cộng ({totalQty} sản phẩm)
                    </div>
                    <div className="text-pink-600 font-semibold">
                      {formatCurrency(totalPrice)}
                    </div>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm text-green-600">
                      <div>Giảm giá</div>
                      <div>-{formatCurrency(discountAmount)}</div>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-base font-semibold border-t pt-2">
                    <div>Tổng thanh toán</div>
                    <div className="text-pink-600">
                      {formatCurrency(grandTotal)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Mã ưu đãi</h4>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      value={voucherCode}
                      onChange={(e) => {
                        setVoucherCode(e.target.value);
                        if (voucherError) setVoucherError(null);
                      }}
                      placeholder="Nhập mã voucher"
                      className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100"
                      disabled={voucherLoading}
                    />
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      disabled={
                        voucherLoading || !voucherCode.trim() || totalPrice <= 0
                      }
                      className="px-4 py-2 rounded-md bg-pink-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {voucherLoading ? (
                        <div className="flex items-center gap-2 justify-center">
                          <ButtonLoader size="sm" />
                          <span>Đang áp dụng</span>
                        </div>
                      ) : (
                        "Áp dụng"
                      )}
                    </button>
                    {appliedVoucher && (
                      <button
                        type="button"
                        onClick={handleRemoveVoucher}
                        className="px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        Gỡ mã
                      </button>
                    )}
                  </div>
                  {voucherError && (
                    <p className="text-sm text-red-500">{voucherError}</p>
                  )}
                  {appliedVoucher && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
                      <p className="font-semibold">
                        Đã áp dụng: {appliedVoucher.code}
                      </p>
                      <p>Giảm {formatCurrency(discountAmount)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Thông tin khách hàng
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      data-field="fullName"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (fieldErrors.fullName) {
                          setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                        }
                      }}
                      placeholder="Nguyễn Văn A"
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${fieldErrors.fullName
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:ring-pink-500"
                        }`}
                    />
                    {fieldErrors.fullName && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <span>⚠</span>
                        {fieldErrors.fullName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      data-field="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) {
                          setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                        }
                      }}
                      placeholder="09xxxxxxxx"
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${fieldErrors.phone
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:ring-pink-500"
                        }`}
                    />
                    {fieldErrors.phone && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <span>⚠</span>
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Email (tuỳ chọn)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">
                      Địa chỉ nhận hàng <span className="text-red-500">*</span>
                    </label>
                    <input
                      data-field="address"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (fieldErrors.address) {
                          setFieldErrors((prev) => ({ ...prev, address: undefined }));
                        }
                      }}
                      placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${fieldErrors.address
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:ring-pink-500"
                        }`}
                    />
                    {fieldErrors.address && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <span>⚠</span>
                        {fieldErrors.address}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">
                      Ghi chú (tuỳ chọn)
                    </label>
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ghi chú thêm cho đơn hàng..."
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Hình thức thanh toán
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`border rounded-md p-3 cursor-pointer flex items-start gap-3 ${paymentMethod === "cod"
                      ? "border-pink-500 ring-1 ring-pink-200"
                      : "border-gray-200"
                      }`}
                  >
                    <input
                      type="radio"
                      className="mt-1"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                    />
                    <div>
                      <div className="font-medium">
                        Thanh toán khi nhận hàng (COD)
                      </div>
                      <div className="text-sm text-gray-500">
                        Thanh toán tiền mặt khi đơn hàng được giao.
                      </div>
                    </div>
                  </label>
                  <label
                    className={`border rounded-md p-3 cursor-pointer flex items-start gap-3 ${paymentMethod === "bank"
                      ? "border-pink-500 ring-1 ring-pink-200"
                      : "border-gray-200"
                      }`}
                  >
                    <input
                      type="radio"
                      className="mt-1"
                      checked={paymentMethod === "bank"}
                      onChange={() => setPaymentMethod("bank")}
                    />
                    <div>
                      <div className="font-medium">
                        Chuyển khoản/Thanh toán online
                      </div>
                      <div className="text-sm text-gray-500">
                        Tạo link thanh toán và thanh toán qua ngân hàng.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}
            </>
          )}

          {orderSuccessData && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 shadow-lg">
              {/* Success Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-2">
                  🎉 Đặt hàng thành công!
                </h3>
                <p className="text-green-600">
                  Cảm ơn bạn đã tin tưởng chúng tôi
                </p>
              </div>

              {/* Order Details */}
              <div className="space-y-4">
                {/* Order Number */}
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Mã đơn hàng:
                    </span>
                    <span className="text-lg font-bold text-green-700 font-mono">
                      {orderSuccessData.orderNumber}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="font-medium text-gray-900 mb-3">
                    👤 Thông tin khách hàng
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Họ tên:</span>
                      <span className="font-medium">
                        {orderSuccessData.customerName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số điện thoại:</span>
                      <span className="font-medium">
                        {orderSuccessData.customerPhone}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Địa chỉ:</span>
                      <span className="font-medium text-right max-w-xs">
                        {orderSuccessData.customerAddress}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="font-medium text-gray-900 mb-3">
                    📦 Sản phẩm đã đặt
                  </h4>
                  <div className="space-y-2">
                    {orderSuccessData.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-gray-700">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span className="text-gray-800">Tổng tiền:</span>
                        <span className="text-green-600">
                          {formatCurrency(orderSuccessData.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">
                    📞 Bước tiếp theo
                  </h4>
                  <p className="text-sm text-blue-800">
                    Chúng tôi sẽ liên hệ với bạn trong vòng 24h để xác nhận đơn
                    hàng và sắp xếp giao hàng.
                  </p>
                </div>

                {/* Countdown */}
                {countdown !== null && countdown > 0 && (
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">
                      Cửa sổ sẽ tự động đóng sau{" "}
                      <span className="font-bold text-green-600">
                        {countdown}
                      </span>{" "}
                      giây
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(countdown / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {!orderSuccessData && (
          <div className="px-5 py-4 border-t flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Đóng
            </button>
            <button
              onClick={createPayment}
              disabled={loading}
              className="ml-auto px-4 py-2 rounded-md bg-pink-600 text-white hover:bg-pink-700 disabled:bg-gray-400"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <ButtonLoader size="sm" />
                  <span>Đang xử lý...</span>
                </div>
              ) : paymentMethod === "bank" ? (
                "Tiến hành Thanh toán"
              ) : (
                "Đặt hàng COD"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
