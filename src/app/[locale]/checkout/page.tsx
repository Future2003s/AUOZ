"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { Address, useAddresses } from "@/hooks/useAddresses";
import { useAuth } from "@/hooks/useAuth";
import { envConfig } from "@/config";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    Ticket,
    Truck,
    CreditCard,
    Package,
    CheckCircle2,
    MapPin,
    ShoppingBag,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
    Number(value || 0).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
    });

const formatAddress = (addr?: Address | null): string => {
    if (!addr) return "";
    const parts = [
        addr.street,
        [addr.city, addr.state].filter(Boolean).join(", "),
        [addr.zipCode, addr.country].filter(Boolean).join(", "),
        [addr.wardOld, addr.districtOld, addr.provinceOld]
            .filter(Boolean)
            .join(", ") ||
        [addr.wardNew, addr.provinceNew].filter(Boolean).join(", "),
    ].filter((p) => Boolean(p?.toString().trim()));
    return parts.join(", ");
};

const addressTypeLabels: Record<Address["type"], string> = {
    home: "Nhà riêng",
    work: "Cơ quan",
    other: "Khác",
};

type PaymentMethod = "cod" | "online";

// ─── component ──────────────────────────────────────────────────────────────

export default function CheckoutPage() {
    const router = useRouter();
    const params = useParams<{ locale: string }>();
    const locale = (params?.locale as string) || "vi";

    const {
        items,
        subtotal,
        discountAmount,
        grandTotal,
        appliedVoucher,
        clear,
    } = useCart();

    const { isAuthenticated } = useAuth();

    const {
        data: addresses = [],
        isLoading: addressesLoading,
    } = useAddresses({ enabled: true });

    // ── state ──
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [note, setNote] = useState("");
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [voucherCode, setVoucherCode] = useState("");

    // ── redirect if cart empty ──
    useEffect(() => {
        if (items.length === 0) {
            router.replace(`/${locale}/cart`);
        }
    }, [items.length, locale, router]);

    // ── sync voucher code from context ──
    useEffect(() => {
        if (appliedVoucher) setVoucherCode(appliedVoucher.code);
        else setVoucherCode("");
    }, [appliedVoucher]);

    // ── auto-fill default address ──
    const defaultAddress = useMemo(() => {
        if (!addresses?.length) return null;
        return addresses.find((a) => a.isDefault) || addresses[0];
    }, [addresses]);

    useEffect(() => {
        if (defaultAddress && !selectedAddressId) {
            setSelectedAddressId(defaultAddress._id || defaultAddress.id || null);
            setAddress((prev) => prev || formatAddress(defaultAddress));
        }
    }, [defaultAddress, selectedAddressId]);

    const handleSelectAddress = (addr: Address) => {
        setSelectedAddressId(addr._id || addr.id || null);
        setAddress(formatAddress(addr));
    };

    // ── COD handler ──
    const handleCODOrder = async () => {
        if (!fullName.trim() || !phone.trim() || !address.trim()) {
            setError("Vui lòng nhập họ tên, số điện thoại và địa chỉ nhận hàng.");
            return;
        }

        setLoading(true);
        setError(null);

        const orderItems = items.map((item) => ({
            name: item.name,
            productId: item.productId || item.id,
            variantId: item.variantId || undefined,
            quantity: item.quantity,
            price: item.price,
        }));

        const shippingAddress = {
            street: address,
            city: "",
            state: "",
            zipCode: "",
            country: "VN",
            phone,
        };

        try {
            let res: Response;

            if (isAuthenticated) {
                // Authenticated user → use /api/orders
                res = await fetch("/api/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items: orderItems,
                        shippingAddress,
                        paymentMethod: "cod",
                        notes: note || undefined,
                        couponCode: appliedVoucher?.code || undefined,
                    }),
                });
            } else {
                // Guest → use /api/orders/create (calls backend /orders/guest)
                res = await fetch("/api/orders/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items: orderItems,
                        customer: {
                            fullName,
                            phone,
                            address,
                            note,
                        },
                        paymentMethod: "cod",
                        amount: grandTotal,
                        couponCode: appliedVoucher?.code || undefined,
                    }),
                });
            }

            let data: Record<string, unknown> | null = null;
            try {
                const text = await res.text();
                data = text ? JSON.parse(text) : null;
            } catch {
                // ignore parse error
            }

            if (!res.ok) {
                const msg =
                    (data as any)?.message ||
                    (data as any)?.data?.message ||
                    "Đặt hàng thất bại. Vui lòng thử lại.";
                throw new Error(msg);
            }

            const orderNumber =
                (data as any)?.data?.orderNumber ||
                (data as any)?.orderNumber ||
                "";

            // Success: clear cart and redirect
            clear();
            router.push(
                `/${locale}/checkout/success${orderNumber ? `?orderNumber=${orderNumber}` : ""}`
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
            setLoading(false);
        }
    };

    // ── Online payment handler ──
    const handleOnlineOrder = async () => {
        if (!fullName.trim() || !phone.trim() || !address.trim()) {
            setError("Vui lòng nhập họ tên, số điện thoại và địa chỉ nhận hàng.");
            return;
        }

        setLoading(true);
        setError(null);

        const descriptionParts = [
            `${items.reduce((s, i) => s + i.quantity, 0)} sản phẩm - ${fullName} - ĐT: ${phone}`,
        ];
        if (appliedVoucher && discountAmount > 0) {
            descriptionParts.push(
                `Voucher ${appliedVoucher.code} giảm ${formatCurrency(discountAmount)}`
            );
        }

        const orderItems = items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
        }));

        try {
            const backendUrl = envConfig.NEXT_PUBLIC_BACKEND_URL;
            const res = await fetch(`${backendUrl}/create-payment-link`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: grandTotal,
                    description: descriptionParts.join(" | "),
                    items: orderItems,
                    customer: { fullName, phone, address, note },
                }),
            });

            if (!res.ok) {
                let errorData: unknown = null;
                try {
                    const text = await res.text();
                    errorData = text ? JSON.parse(text) : {};
                } catch { }
                throw new Error(
                    (errorData as any)?.message || "Tạo link thanh toán thất bại!"
                );
            }

            let result: unknown = null;
            try {
                const text = await res.text();
                result = text ? JSON.parse(text) : null;
            } catch {
                throw new Error("Lỗi khi xử lý phản hồi từ server.");
            }

            const checkoutUrl = (result as any)?.checkoutUrl;
            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                throw new Error("Không nhận được link thanh toán từ server.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        setError(null);
        if (paymentMethod === "cod") {
            handleCODOrder();
        } else {
            handleOnlineOrder();
        }
    };

    // ── render guard ──
    if (items.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Link
                            href={`/${locale}/cart`}
                            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                            ← Quay lại giỏ hàng
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Thanh toán</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Hoàn tất đơn hàng của bạn
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* ── Left column: shipping + payment ── */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Saved addresses */}
                        {addresses.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-indigo-600" />
                                        <h2 className="text-lg font-semibold text-gray-800">
                                            Địa chỉ đã lưu
                                        </h2>
                                    </div>
                                    <Link
                                        href={`/${locale}/me?tab=addresses`}
                                        className="text-xs text-indigo-600 hover:underline"
                                    >
                                        Quản lý
                                    </Link>
                                </div>
                                {addressesLoading ? (
                                    <p className="text-sm text-gray-500">Đang tải...</p>
                                ) : (
                                    <div className="space-y-2">
                                        {addresses.map((addr) => {
                                            const addrId = addr._id || addr.id || "";
                                            const isActive = selectedAddressId === addrId;
                                            return (
                                                <button
                                                    key={addrId}
                                                    type="button"
                                                    onClick={() => handleSelectAddress(addr)}
                                                    className={`w-full text-left border rounded-xl p-3.5 transition-all text-sm ${isActive
                                                        ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-400"
                                                        : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span className="font-medium text-gray-800">
                                                                    {addressTypeLabels[addr.type] || "Khác"}
                                                                </span>
                                                                {addr.isDefault && (
                                                                    <Badge variant="outline" className="text-xs py-0">
                                                                        Mặc định
                                                                    </Badge>
                                                                )}
                                                                {isActive && (
                                                                    <Badge className="bg-indigo-600 text-white text-xs py-0">
                                                                        Đang dùng
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-gray-600">
                                                                {formatAddress(addr)}
                                                            </p>
                                                        </div>
                                                        {isActive && (
                                                            <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Shipping info form */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <Truck className="h-5 w-5 text-indigo-600" />
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Thông tin giao hàng
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Họ và tên <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Nguyễn Văn A"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số điện thoại <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="09xxxxxxxx"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Địa chỉ nhận hàng <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ghi chú (tuỳ chọn)
                                    </label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        rows={2}
                                        placeholder="Ghi chú thêm cho đơn hàng..."
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment method */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <CreditCard className="h-5 w-5 text-indigo-600" />
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Phương thức thanh toán
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* COD */}
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod("cod")}
                                    className={`flex items-start gap-3 border rounded-xl p-4 transition-all text-left ${paymentMethod === "cod"
                                        ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-400"
                                        : "border-gray-200 hover:border-indigo-300"
                                        }`}
                                >
                                    <div
                                        className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === "cod"
                                            ? "border-indigo-600"
                                            : "border-gray-300"
                                            }`}
                                    >
                                        {paymentMethod === "cod" && (
                                            <div className="w-2 h-2 rounded-full bg-indigo-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">
                                            💵 Thanh toán khi nhận hàng (COD)
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Trả tiền mặt khi nhận được hàng
                                        </p>
                                    </div>
                                </button>

                                {/* Online */}
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod("online")}
                                    className={`flex items-start gap-3 border rounded-xl p-4 transition-all text-left ${paymentMethod === "online"
                                        ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-400"
                                        : "border-gray-200 hover:border-indigo-300"
                                        }`}
                                >
                                    <div
                                        className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === "online"
                                            ? "border-indigo-600"
                                            : "border-gray-300"
                                            }`}
                                    >
                                        {paymentMethod === "online" && (
                                            <div className="w-2 h-2 rounded-full bg-indigo-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">
                                            💳 Thanh toán online
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Chuyển khoản qua cổng thanh toán PayOS
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Right column: order summary ── */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            {/* Title */}
                            <div className="flex items-center gap-2 mb-5">
                                <ShoppingBag className="h-5 w-5 text-indigo-600" />
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Đơn hàng ({totalQuantity} sản phẩm)
                                </h2>
                            </div>

                            {/* Items */}
                            <div className="space-y-3 mb-4">
                                {items.map((item) => (
                                    <div
                                        key={`${item.id}-${item.variantId || ""}`}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="h-5 w-5 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {item.name}
                                            </p>
                                            {item.variantName && (
                                                <p className="text-xs text-gray-500">{item.variantName}</p>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                {item.quantity} x {formatCurrency(item.price)}
                                            </p>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-800 shrink-0">
                                            {formatCurrency(item.price * item.quantity)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <hr className="border-gray-100 my-4" />

                            {/* Voucher */}
                            {appliedVoucher && (
                                <div className="mb-4 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700">
                                    <div className="flex items-center gap-2">
                                        <Ticket className="h-4 w-4" />
                                        <div>
                                            <p className="font-semibold">{appliedVoucher.code}</p>
                                            <p className="text-xs">
                                                Giảm {formatCurrency(discountAmount)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Totals */}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Tạm tính</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Ưu đãi</span>
                                    <span className={discountAmount > 0 ? "text-emerald-600 font-medium" : ""}>
                                        {discountAmount > 0
                                            ? `- ${formatCurrency(discountAmount)}`
                                            : "0₫"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Phí vận chuyển</span>
                                    <span className="text-green-600 font-medium">Miễn phí</span>
                                </div>
                            </div>

                            <hr className="border-gray-100 my-4" />

                            <div className="flex justify-between items-center mb-5">
                                <span className="text-base font-bold text-gray-900">
                                    Tổng cộng
                                </span>
                                <span className="text-xl font-bold text-indigo-600">
                                    {formatCurrency(grandTotal)}
                                </span>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading || grandTotal <= 0}
                                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold py-3.5 rounded-xl transition-all shadow-md disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Đang xử lý...</span>
                                    </>
                                ) : paymentMethod === "cod" ? (
                                    <>
                                        <Truck className="h-4 w-4" />
                                        <span>Đặt hàng COD</span>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="h-4 w-4" />
                                        <span>Thanh toán online</span>
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-400 text-center mt-3">
                                🔒 Thông tin của bạn được bảo mật an toàn
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
