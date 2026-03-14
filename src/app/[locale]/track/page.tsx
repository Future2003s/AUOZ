"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { orderApiRequest } from "@/apiRequests/orders";
import { Search, Package, Truck, CheckCircle, Clock, XCircle, AlertCircle, ShoppingBag, Receipt, MapPin, Wifi } from "lucide-react";
import Image from "next/image";
import { envConfig } from "@/config";
import { useSocket } from "@/providers/SocketProvider";

function OrderTrackingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { socket, connected } = useSocket();

    // The order ID can be in ?orderNumber=XXX or just ?ORD-XXX (first key in search params)
    const initialOrderFromQuery = searchParams.get("orderNumber") || Array.from(searchParams.keys())[0] || "";

    const [orderNumber, setOrderNumber] = useState(initialOrderFromQuery);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [orderData, setOrderData] = useState<any>(null);

    // Auto trigger search if we loaded with a query param
    useEffect(() => {
        if (initialOrderFromQuery) {
            performSearch(initialOrderFromQuery);
        }
    }, [initialOrderFromQuery]);

    const performSearch = async (codeToSearch: string) => {
        if (!codeToSearch.trim()) {
            setError("Vui lòng nhập mã đơn hàng");
            return;
        }

        setLoading(true);
        setError("");
        setOrderData(null);

        try {
            const formattedCode = codeToSearch.trim().toUpperCase();
            const res = await orderApiRequest.trackOrderByNumber(formattedCode);
            if (res.success) {
                setOrderData(res.data);

                // Join socket room for realtime updates
                if (socket && connected) {
                    socket.emit("join-order-room", formattedCode);
                }

                // Optional: Update URL without reloading page if they typed it manually
                if (codeToSearch !== initialOrderFromQuery) {
                    router.replace(`?${formattedCode}`, { scroll: false });
                }
            } else {
                setError("Không tìm thấy đơn hàng hoặc mã không hợp lệ.");
            }
        } catch (err: any) {
            setError(err?.payload?.message || "Không tìm thấy đơn hàng này.");
        } finally {
            setLoading(false);
        }
    };

    // Socket realtime: listen for order-status-updated events
    useEffect(() => {
        if (!socket || !orderData?.orderNumber) return;
        const handler = (data: any) => {
            if (data?.orderNumber === orderData.orderNumber || data?.orderId === orderData._id) {
                setOrderData((prev: any) => prev ? { ...prev, ...data } : prev);
            }
        };
        socket.on("order-status-updated", handler);
        return () => { socket.off("order-status-updated", handler); };
    }, [socket, orderData?.orderNumber, orderData?._id]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(orderNumber);
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "pending":
                return { label: "Chờ xác nhận", color: "text-amber-500", bg: "bg-amber-100", border: "border-amber-200", icon: Clock, index: 0 };
            case "processing":
                return { label: "Đang xử lý", color: "text-blue-500", bg: "bg-blue-100", border: "border-blue-200", icon: Package, index: 1 };
            case "shipped":
                return { label: "Đang giao", color: "text-purple-500", bg: "bg-purple-100", border: "border-purple-200", icon: Truck, index: 2 };
            case "delivered":
                return { label: "Thành công", color: "text-emerald-500", bg: "bg-emerald-100", border: "border-emerald-200", icon: CheckCircle, index: 3 };
            case "cancelled":
                return { label: "Đã hủy", color: "text-red-500", bg: "bg-red-100", border: "border-red-200", icon: XCircle, index: -1 };
            default:
                return { label: "Không xác định", color: "text-gray-500", bg: "bg-gray-100", border: "border-gray-200", icon: Package, index: -1 };
        }
    };

    const STEPS = ["pending", "processing", "shipped", "delivered"];

    const getProductImageUrl = (url: string | null) => {
        if (!url) return null;
        if (url.startsWith("http")) return url;
        return `${envConfig.NEXT_PUBLIC_BACKEND_URL || ""}${url}`;
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-8 sm:py-16 px-3 sm:px-6 lg:px-8 font-sans selection:bg-blue-500/30 overflow-x-hidden">
            {/* Background decorative blobs */}
            <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none -z-10" />
            <div className="absolute top-32 right-1/4 w-72 h-72 bg-purple-200/30 dark:bg-purple-900/10 rounded-full blur-[100px] pointer-events-none -z-10" />
            <div className="absolute top-16 left-1/4 w-96 h-96 bg-blue-200/30 dark:bg-blue-900/10 rounded-full blur-[120px] pointer-events-none -z-10" />

            <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 relative z-10 w-full">
                {/* Elaborate Search Bar */}
                <form onSubmit={handleSearch} className="max-w-2xl mx-auto group mt-5">
                    <div className="relative flex flex-col sm:flex-row gap-3 p-2 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-neutral-200/50 dark:border-neutral-800/50 group-focus-within:border-blue-300 dark:group-focus-within:border-blue-700/50 transition-all duration-300 ring-1 ring-black/5 dark:ring-white/5">
                        <div className="relative flex-grow flex items-center">
                            <Search className="absolute left-4 w-6 h-6 text-neutral-400" />
                            <input
                                type="text"
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value)}
                                className="w-full bg-transparent pl-12 pr-4 py-4 text-lg font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none tracking-wide"
                                placeholder="Mã đơn hàng (VD: ORD-JWJK4V...)"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-8 py-4 sm:py-0 rounded-xl font-bold tracking-wide text-white transition-all overflow-hidden relative ${loading ? 'bg-neutral-400 cursor-not-allowed' : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-md hover:shadow-lg'}`}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Đang tìm...
                                    </>
                                ) : "Tra Cứu"}
                            </span>
                        </button>
                    </div>
                </form>

                {/* Error message */}
                {error && (
                    <div className="max-w-2xl mx-auto p-4 bg-red-50/50 dark:bg-red-900/20 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 rounded-2xl flex items-center gap-4 text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-4 shadow-sm">
                        <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <p className="font-semibold">{error}</p>
                    </div>
                )}

                {/* Premium Results View */}
                {orderData && (
                    <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl shadow-2xl shadow-neutral-200/40 dark:shadow-black/40 rounded-[2rem] overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60 animate-in fade-in zoom-in-[0.98] duration-500 mb-10">
                        {/* Status Header */}
                        <div className="px-4 py-6 sm:px-10 sm:py-8 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
                                <div>
                                    <p className="text-sm font-semibold tracking-wider text-neutral-500 uppercase mb-1">Mã vận đơn</p>
                                    <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                                        #{orderData.orderNumber}
                                        {connected && (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                                <Wifi className="w-3 h-3" /> Trực tuyến
                                            </span>
                                        )}
                                    </h2>
                                    <p className="text-sm text-neutral-500 mt-2 flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {new Date(orderData.createdAt).toLocaleDateString("vi-VN", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                {(() => {
                                    const Info = getStatusInfo(orderData.status);
                                    const StatusIcon = Info.icon;
                                    return (
                                        <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl ${Info.bg} ${Info.color} ${Info.border} border shadow-sm`}>
                                            <StatusIcon className="w-6 h-6" />
                                            <span className="font-bold tracking-wide">{Info.label}</span>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Main Progress Stepper */}
                            {orderData.status !== "cancelled" && (
                                <div className="mt-8 md:mt-12 mb-2 relative overflow-x-auto pt-2 pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                                    <div className="min-w-[400px] sm:min-w-0 relative sm:px-4">
                                        <div className="absolute top-1/2 left-8 right-8 h-1 bg-neutral-200 dark:bg-neutral-800 -translate-y-1/2 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                                                style={{ width: `${Math.max(0, (getStatusInfo(orderData.status).index / (STEPS.length - 1)) * 100)}%` }}
                                            />
                                        </div>
                                        <div className="relative flex justify-between">
                                            {STEPS.map((step, idx) => {
                                                const stepInfo = getStatusInfo(step);
                                                const StepIcon = stepInfo.icon;
                                                const currentIdx = getStatusInfo(orderData.status).index;
                                                const isCompleted = idx <= currentIdx;
                                                const isActive = idx === currentIdx;

                                                return (
                                                    <div key={step} className="flex flex-col items-center gap-2 sm:gap-3 relative z-10">
                                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-4 border-white dark:border-neutral-900 shadow-sm transition-all duration-500 ${isCompleted ? 'bg-blue-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'} ${isActive ? 'ring-4 ring-blue-500/20 scale-110' : ''}`}>
                                                            <StepIcon className="w-5 h-5" />
                                                        </div>
                                                        <span className={`text-xs sm:text-sm font-semibold whitespace-nowrap hidden sm:block ${isActive ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>
                                                            {stepInfo.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-neutral-100 dark:divide-neutral-800">

                            {/* Left Column: Products & Financials */}
                            <div className="lg:col-span-3 p-4 sm:p-6 md:p-10 bg-white dark:bg-neutral-900 overflow-hidden">
                                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-neutral-400" />
                                    Chi tiết sản phẩm
                                </h3>

                                <div className="space-y-4 sm:space-y-6">
                                    {orderData.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex flex-row gap-3 sm:gap-4 group items-center lg:items-start">
                                            <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 border border-neutral-200/50 dark:border-neutral-700/50">
                                                {item.image ? (
                                                    <Image src={getProductImageUrl(item.image) as string} alt={item.name} fill sizes="(max-width: 768px) 100vw, 20vw" className="object-cover group-hover:scale-110 transition-transform duration-500 bg-white" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="w-8 h-8 text-neutral-300" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 w-6 h-6 bg-white/90 dark:bg-neutral-900/90 backdrop-blur rounded-full flex items-center justify-center text-xs font-bold text-neutral-900 dark:text-white shadow-sm">
                                                    {item.quantity}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                                                <div>
                                                    <p className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white line-clamp-2 leading-tight mb-0.5 sm:mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.name}</p>
                                                    <p className="text-xs sm:text-sm text-neutral-500 font-mono line-clamp-1">SKU: {item.sku}</p>
                                                </div>
                                                <div className="font-bold text-neutral-900 dark:text-white mt-1 sm:mt-0 text-sm sm:text-base whitespace-nowrap">
                                                    {item.price?.toLocaleString("vi-VN")} <span className="text-[10px] sm:text-xs font-normal text-neutral-500">₫</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <hr className="my-8 border-neutral-100 dark:border-neutral-800" />

                                {/* Detailed Financial Breakdown */}
                                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Receipt className="w-4 h-4 text-neutral-400" /> Chi tiết thanh toán
                                    </h3>
                                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                        <span>Tạm tính</span>
                                        <span className="font-medium text-neutral-900 dark:text-white">{orderData.subtotal?.toLocaleString("vi-VN")} ₫</span>
                                    </div>
                                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                        <span>Phí vận chuyển</span>
                                        <span className="font-medium text-neutral-900 dark:text-white">{orderData.shippingCost === 0 ? "Miễn phí" : `${orderData.shippingCost?.toLocaleString("vi-VN")} ₫`}</span>
                                    </div>
                                    {orderData.discount > 0 && (
                                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                            <span>Khuyến mãi</span>
                                            <span className="font-medium">- {orderData.discount?.toLocaleString("vi-VN")} ₫</span>
                                        </div>
                                    )}
                                    <div className="pt-4 mt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-end gap-2">
                                        <span className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">Tổng cộng</span>
                                        <div className="text-right flex-shrink-0">
                                            <span className="text-2xl sm:text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400">
                                                {orderData.total?.toLocaleString("vi-VN")} ₫
                                            </span>
                                            <p className="text-xs text-neutral-500 mt-1 uppercase font-semibold">Đã bao gồm VAT</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Timeline & Shipping Info */}
                            <div className="lg:col-span-2 p-4 sm:p-6 md:p-10 bg-neutral-50/30 dark:bg-neutral-900/30">

                                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-6 sm:mb-8 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-neutral-400" />
                                    Lịch trình
                                </h3>

                                <div className="relative pl-4 sm:pl-6 space-y-6 sm:space-y-8">
                                    <div className="absolute top-3 left-[7px] sm:left-[11px] bottom-3 w-0.5 bg-neutral-200 dark:bg-neutral-700" />

                                    {orderData.trackingHistory?.map((history: any, idx: number) => {
                                        const HistInfo = getStatusInfo(history.status);
                                        const HIcon = HistInfo.icon;
                                        const isLatest = idx === orderData.trackingHistory.length - 1;

                                        return (
                                            <div key={idx} className="relative">
                                                <div className={`absolute top-0 -left-[24.5px] sm:-left-[32.5px] w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-neutral-900 z-10 ${isLatest ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20 scale-110' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'}`}>
                                                    <HIcon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isLatest ? 'text-white' : ''}`} />
                                                </div>
                                                <div className={`pt-0.5 ${isLatest ? '' : 'opacity-60'} pl-4 sm:pl-0`}>
                                                    <h4 className={`text-sm font-bold sm:text-base ${isLatest ? 'text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                                        {history.description}
                                                    </h4>
                                                    <span className="text-xs sm:text-sm font-medium text-neutral-500 tracking-wide mt-1 block">
                                                        {new Date(history.timestamp).toLocaleString("vi-VN", {
                                                            hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric"
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }).reverse() /* Show newest at top */}
                                </div>

                                {orderData.shippingAddress && (
                                    <div className="mt-8 sm:mt-12 bg-white dark:bg-neutral-800/80 rounded-2xl p-4 sm:p-5 border border-neutral-100 dark:border-neutral-700 shadow-sm overflow-hidden break-words">
                                        <p className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Thông tin người nhận</p>
                                        <p className="font-bold text-neutral-900 dark:text-white text-sm sm:text-base">{orderData.shippingAddress.firstName} {orderData.shippingAddress.lastName}</p>
                                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 flex flex-col gap-0.5">
                                            <span>{orderData.shippingAddress.phone}</span>
                                            <span>{orderData.shippingAddress.street}</span>
                                            <span>{orderData.shippingAddress.city}, {orderData.shippingAddress.state}</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Wrap with suspense boundary because useSearchParams() requires it in Next.js App Router
export default function OrderTrackingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
            <OrderTrackingContent />
        </Suspense>
    );
}
