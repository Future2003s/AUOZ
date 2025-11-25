// app/payment/page.tsx (hoặc file PaymentPage của bạn)
"use client";
import { useEffect, useMemo, useState } from "react";
import ProductItem from "./product-item";
import ProductSmall from "../../../public/products/IMG_0404.png";
import ProductBig from "../../../public/products/IMG_0405.png";
import { ButtonLoader } from "@/components/ui/loader";
import { envConfig } from "@/config";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Address, useAddresses } from "@/hooks/useAddresses";
import { Badge } from "@/components/ui/badge";
import { Loader2, Ticket } from "lucide-react";

const formatAddress = (addr?: Address | null) => {
  if (!addr) return "";

  const cityState = [addr.city, addr.state].filter(Boolean).join(", ");
  const zipCountry = [addr.zipCode, addr.country].filter(Boolean).join(", ");
  const legacy = [addr.wardOld, addr.districtOld, addr.provinceOld]
    .filter(Boolean)
    .join(", ");
  const modern = [addr.wardNew, addr.provinceNew].filter(Boolean).join(", ");

  return [
    addr.street,
    cityState,
    zipCountry,
    legacy || modern || "",
  ]
    .filter((part) => Boolean(part && part.toString().trim()))
    .join(", ");
};

const formatCurrency = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

type AppliedVoucher = {
  code: string;
  name?: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscountValue?: number;
  minOrderValue?: number;
  status?: string;
  discountAmount: number;
};

const addressTypeLabels: Record<Address["type"], string> = {
  home: "Nhà riêng",
  work: "Cơ quan",
  other: "Khác",
};

function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(
    null
  );

  const params = useParams<{ locale: string }>();
  const localePrefix = `/${(params?.locale as string) || "vi"}`;

  const {
    data: addresses = [],
    isLoading: addressesLoading,
    isError: addressesError,
  } = useAddresses();

  const defaultAddress = useMemo(() => {
    if (!addresses?.length) {
      return null;
    }
    return addresses.find((addr) => addr.isDefault) || addresses[0];
  }, [addresses]);

  useEffect(() => {
    if (defaultAddress && !selectedAddressId) {
      setSelectedAddressId(defaultAddress._id || defaultAddress.id || null);
      setAddress((prev) => prev || formatAddress(defaultAddress));
    }
  }, [defaultAddress, selectedAddressId]);

  const handleSelectAddress = (addr: Address) => {
    const addrId = addr._id || addr.id || null;
    setSelectedAddressId(addrId);
    setAddress(formatAddress(addr));
  };

  const productInfo = {
    small: {
      name: "Mật Ong Hoa Vải 435g",
      nameJp: "ライチ蜂蜜 435g",
      price: 342000,
      weight: 435,
      priceOrigin: 380000,
    },
    big: {
      name: "Mật Ong Hoa Vải 165g",
      nameJp: "ライチ蜂蜜 165g",
      price: 144000,
      weight: 165,
      priceOrigin: 160000,
    },
  };

  const [smallProductQuantity, setSmallProductQuantity] = useState(0);
  const [bigProductQuantity, setBigProductQuantity] = useState(0);

  const smallProductTotal = smallProductQuantity * productInfo.small.price;
  const bigProductTotal = bigProductQuantity * productInfo.big.price;
  const totalQuantity = smallProductQuantity + bigProductQuantity;
  const totalPrice = smallProductTotal + bigProductTotal;
  const discountAmount = appliedVoucher?.discountAmount ?? 0;
  const grandTotal = Math.max(totalPrice - discountAmount, 0);

  useEffect(() => {
    if (appliedVoucher) {
      setVoucherCode(appliedVoucher.code);
    } else {
      setVoucherCode("");
    }
  }, [appliedVoucher]);

  useEffect(() => {
    if (!appliedVoucher) return;
    if (totalPrice <= 0) {
      setAppliedVoucher(null);
      setVoucherError(null);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();

    const revalidate = async () => {
      try {
        const res = await fetch("/api/vouchers/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: appliedVoucher.code,
            subtotal: totalPrice,
          }),
          signal: controller.signal,
        });
        const text = await res.text();
        const payload = text ? JSON.parse(text) : null;
        if (!res.ok) {
          throw new Error(
            payload?.message ||
              payload?.data?.message ||
              "Voucher không còn hợp lệ"
          );
        }
        if (cancelled) return;
        const data = payload?.data ?? payload;
        setAppliedVoucher((prev) =>
          prev
            ? {
                ...prev,
                discountAmount: Number(data?.discountAmount || 0),
                status: data?.runtimeStatus || data?.voucher?.status || prev.status,
              }
            : prev
        );
      } catch (err) {
        if (cancelled) return;
        console.warn("Voucher revalidation failed", err);
        setAppliedVoucher(null);
        setVoucherError(
          err instanceof Error ? err.message : "Voucher không còn hợp lệ"
        );
      }
    };

    revalidate();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [totalPrice, appliedVoucher?.code]);

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

  const handleCreatePaymentLink = async () => {
    if (totalPrice === 0) {
      setError("Vui lòng chọn ít nhất một sản phẩm.");
      return;
    }
    if (grandTotal <= 0) {
      setError("Tổng tiền sau ưu đãi phải lớn hơn 0.");
      return;
    }
    // Validate customer info
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      setError("Vui lòng nhập họ tên, số điện thoại và địa chỉ nhận hàng.");
      return;
    }
    setLoading(true);
    setError(null);

    const orderItems = [];
    if (smallProductQuantity > 0) {
      orderItems.push({
        name: productInfo.small.name,
        quantity: smallProductQuantity,
        price: productInfo.small.price,
      });
    }
    if (bigProductQuantity > 0) {
      orderItems.push({
        name: productInfo.big.name,
        quantity: bigProductQuantity,
        price: productInfo.big.price,
      });
    }

    const descriptionParts = [
      `${totalQuantity} sản phẩm - Người mua: ${fullName} - ĐT: ${phone}`,
    ];
    if (appliedVoucher && discountAmount > 0) {
      descriptionParts.push(
        `Voucher ${appliedVoucher.code} giảm ${formatCurrency(discountAmount)}`
      );
    }

    const orderPayload = {
      amount: grandTotal,
      description: descriptionParts.join(" | "),
      items: orderItems,
      customer: {
        fullName,
        phone,
        email,
        address,
        note,
      },
    };

    try {
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
        throw new Error("Không nhận được checkoutUrl từ phản hồi của server.");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đã có một lỗi không xác định xảy ra.");
      }
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 mt-25">
      <div className="container mx-auto flex flex-col md:flex-row justify-center items-center md:items-start gap-8">
        <ProductItem
          {...productInfo.small}
          imageSrc={ProductSmall}
          altText="Mật Ong KLT 136g"
          quantity={smallProductQuantity}
          onQuantityChange={setSmallProductQuantity}
        />
        <ProductItem
          {...productInfo.big}
          imageSrc={ProductBig}
          altText="Mật Ong KLT 435g"
          quantity={bigProductQuantity}
          onQuantityChange={setBigProductQuantity}
        />
      </div>

      {/* Saved account addresses */}
      <div className="container mx-auto mt-8 bg-white p-6 rounded-lg shadow-lg max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Địa chỉ tài khoản
            </h2>
            <p className="text-sm text-gray-500">
              Chọn nhanh địa chỉ đã lưu để điền thông tin giao hàng
            </p>
          </div>
          <Link
            href={`${localePrefix}/me?tab=addresses`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Quản lý địa chỉ
          </Link>
        </div>

        {addressesLoading ? (
          <p className="text-sm text-gray-600">Đang tải địa chỉ...</p>
        ) : addressesError ? (
          <p className="text-sm text-red-500">
            Không thể tải danh sách địa chỉ. Vui lòng thử lại sau.
          </p>
        ) : addresses.length > 0 ? (
          <div className="space-y-3">
            {addresses.map((addr) => {
              const addrId = addr._id || addr.id || "";
              const isActive = selectedAddressId === addrId;
              const legacy = [addr.wardOld, addr.districtOld, addr.provinceOld]
                .filter(Boolean)
                .join(", ");
              const modern = [addr.wardNew, addr.provinceNew]
                .filter(Boolean)
                .join(", ");

              return (
                <button
                  key={addrId}
                  type="button"
                  onClick={() => handleSelectAddress(addr)}
                  className={`w-full text-left border rounded-lg p-4 transition-colors ${
                    isActive
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {addressTypeLabels[addr.type] || "Khác"}
                        </span>
                        {addr.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            Mặc định
                          </Badge>
                        )}
                        {isActive && (
                          <Badge className="bg-indigo-600 text-white text-xs">
                            Đang dùng
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">
                        {formatAddress(addr)}
                      </p>
                      {legacy && (
                        <p className="text-xs text-gray-500 mt-1">
                          Địa chỉ cũ: {legacy}
                        </p>
                      )}
                      {modern && (
                        <p className="text-xs text-gray-500">
                          Địa chỉ hành chính mới: {modern}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-indigo-600">
                      Sử dụng địa chỉ này
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Bạn chưa lưu địa chỉ nào.{" "}
            <Link
              href={`${localePrefix}/me?tab=addresses`}
              className="text-indigo-600 font-medium"
            >
              Thêm địa chỉ ngay
            </Link>
            .
          </p>
        )}
      </div>

      {/* Customer information form */}
      <div className="container mx-auto mt-10 bg-white p-6 rounded-lg shadow-lg max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Thông tin khách hàng
        </h2>
        <p className="text-sm text-gray-600 text-center mb-5 border-b pb-3">
          (お客様情報)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xxxxxxxx"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (tuỳ chọn)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ nhận hàng
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú (tuỳ chọn)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Ghi chú thêm cho đơn hàng..."
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto mt-10 bg-white p-6 rounded-lg shadow-lg max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Tóm tắt đơn hàng
        </h2>
        <p className="text-sm text-gray-600 text-center mb-5 border-b pb-3">
          (注文概要)
        </p>

        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-800 mb-2">Mã ưu đãi</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={voucherCode}
              disabled={voucherLoading}
              onChange={(e) => {
                setVoucherCode(e.target.value);
                if (voucherError) setVoucherError(null);
              }}
              placeholder="Nhập mã voucher"
              className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
            <button
              type="button"
              onClick={handleApplyVoucher}
              disabled={
                voucherLoading || !voucherCode.trim() || totalPrice <= 0
              }
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {voucherLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang áp dụng</span>
                </>
              ) : (
                <>
                  <Ticket className="h-4 w-4" />
                  <span>Áp dụng</span>
                </>
              )}
            </button>
          </div>
          {voucherError && (
            <p className="text-xs text-red-500 mt-1">{voucherError}</p>
          )}
          {appliedVoucher && (
            <div className="mt-3 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-md p-3 text-sm text-emerald-700">
              <div>
                <p className="font-semibold">
                  Đã áp dụng: {appliedVoucher.code}
                </p>
                <p>Giảm {formatCurrency(discountAmount)}</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveVoucher}
                className="text-emerald-700 font-medium hover:underline"
              >
                Gỡ
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 text-gray-700">
          {/* Item 1: Mật Ong Hoa Vải 165g */}
          {bigProductQuantity > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <p className="mb-1 sm:mb-0">
                {productInfo.big.name} ({productInfo.big.nameJp})
                <span className="block sm:inline-block sm:ml-2 text-gray-500 text-sm">
                  ({bigProductQuantity} x{" "}
                  {productInfo.big.price.toLocaleString("vi-VN")}đ)
                </span>
              </p>
              <p className="font-semibold text-right sm:text-left">
                {bigProductTotal.toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                })}
              </p>
            </div>
          )}

          {/* Item 2: Mật Ong Hoa Vải 435g */}
          {smallProductQuantity > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <p className="mb-1 sm:mb-0">
                {productInfo.small.name} ({productInfo.small.nameJp})
                <span className="block sm:inline-block sm:ml-2 text-gray-500 text-sm">
                  ({smallProductQuantity} x{" "}
                  {productInfo.small.price.toLocaleString("vi-VN")}đ)
                </span>
              </p>
              <p className="font-semibold text-right sm:text-left">
                {smallProductTotal.toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                })}
              </p>
            </div>
          )}
        </div>
        <hr className="my-4" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xl font-bold">
          <p className="mb-1 sm:mb-0">
            Tổng cộng ({totalQuantity} sản phẩm)
            <span className="block sm:inline-block sm:ml-2 text-gray-600 text-base font-normal">
              (合計 {totalQuantity}点)
            </span>
          </p>
          <p className="text-indigo-600 text-right sm:text-left">
            {formatCurrency(grandTotal)}
          </p>
        </div>
        <div className="mt-3 space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>Tạm tính</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span>Ưu đãi</span>
            <span
              className={
                discountAmount > 0 ? "text-emerald-600 font-semibold" : ""
              }
            >
              {discountAmount > 0
                ? `- ${formatCurrency(discountAmount)}`
                : "0₫"}
            </span>
          </div>
        </div>
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        <button
          onClick={handleCreatePaymentLink}
          disabled={loading || totalQuantity === 0 || grandTotal <= 0}
          className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors duration-300 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <ButtonLoader size="sm" />
              <span className="ml-2">Đang xử lý... (処理中...)</span>
            </>
          ) : (
            <span>Tiến hành Thanh toán (支払いへ進む)</span>
          )}
        </button>
      </div>
    </div>
  );
}

export default PaymentPage;
