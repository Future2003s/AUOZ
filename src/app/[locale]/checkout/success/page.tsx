"use client";

import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, Home, ShoppingBag } from "lucide-react";

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const params = useParams<{ locale: string }>();
    const locale = (params?.locale as string) || "vi";

    const orderNumber = searchParams.get("orderNumber");

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center px-4 pt-20">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-emerald-100 p-8 text-center">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                    </div>
                </div>

                {/* Heading */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Đặt hàng thành công! 🎉
                </h1>
                <p className="text-gray-500 text-sm mb-6">
                    Cảm ơn bạn đã tin tưởng và mua hàng. Đơn hàng của bạn đã được tiếp
                    nhận và sẽ sớm được xử lý.
                </p>

                {/* Order number */}
                {orderNumber && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-center gap-2 text-emerald-700">
                            <Package className="h-4 w-4" />
                            <span className="text-sm font-medium">Mã đơn hàng:</span>
                        </div>
                        <p className="text-lg font-bold text-emerald-800 mt-1">
                            #{orderNumber}
                        </p>
                    </div>
                )}

                {/* Info */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                    <p className="text-sm font-semibold text-amber-800 mb-1">
                        💵 Thanh toán khi nhận hàng (COD)
                    </p>
                    <p className="text-xs text-amber-700">
                        Vui lòng chuẩn bị đúng số tiền khi nhận hàng. Nhân viên giao hàng
                        sẽ liên hệ với bạn trước khi giao.
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <Link
                        href={`/${locale}/me?tab=orders`}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md"
                    >
                        <Package className="h-4 w-4" />
                        Xem đơn hàng của tôi
                    </Link>
                    <Link
                        href={`/${locale}/products`}
                        className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 font-medium py-3 rounded-xl transition-all"
                    >
                        <ShoppingBag className="h-4 w-4" />
                        Tiếp tục mua sắm
                    </Link>
                    <Link
                        href={`/${locale}`}
                        className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
                    >
                        <Home className="h-4 w-4" />
                        Về trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}
