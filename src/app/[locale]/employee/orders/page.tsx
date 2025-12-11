"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ListChecks, Loader2 } from "lucide-react";

type DeliveryOrder = {
  _id?: string;
  id?: string;
  orderCode?: string;
  buyerName?: string;
  deliveryDate?: string;
  createdAt?: string;
  amount?: number;
  status?: string;
};

export default function OrdersPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";

  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/delivery?status=completed&limit=50", {
        cache: "no-store",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to load orders");
      }
      const data = await res.json();
      const list =
        data?.data && Array.isArray(data.data)
          ? data.data
          : data?.data?.content || [];
      setOrders(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const totalAmountToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return orders
      .filter((o) => (o.deliveryDate || "").startsWith(today))
      .reduce((sum, o) => sum + (o.amount || 0), 0);
  }, [orders]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/${locale}/employee/shipping`)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Tổng hợp đơn hàng
          </h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-1">
            <ListChecks size={16} />
            <span>{orders.length} đơn</span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <span>Tổng hôm nay:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {totalAmountToday.toLocaleString("vi-VN")} ₫
            </span>
          </div>
        </div>
      </header>

      <main className="px-4 py-4">
        {loading && (
          <div className="flex items-center justify-center py-10 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Đang tải danh sách đơn...
          </div>
        )}
        {error && (
          <div className="text-red-500 dark:text-red-400 py-4">{error}</div>
        )}
        {!loading && !error && orders.length === 0 && (
          <div className="text-gray-500 dark:text-gray-400 py-6">
            Chưa có đơn hàng nào.
          </div>
        )}
        <div className="grid gap-3">
          {orders.map((order) => {
            const deliveryDateObj = order.deliveryDate
              ? new Date(order.deliveryDate)
              : null;
            const createdAtObj = order.createdAt ? new Date(order.createdAt) : null;
            const dateDisplay = deliveryDateObj
              ? deliveryDateObj.toLocaleDateString("vi-VN")
              : "--";
            const timeDisplay = createdAtObj
              ? createdAtObj.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "--";
            return (
              <div
                key={order._id || order.id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  router.push(`/${locale}/employee/orders/${order._id || order.id}`)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(
                      `/${locale}/employee/orders/${order._id || order.id}`
                    );
                  }
                }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-blue-400 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Mã đơn
                    </span>
                    <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                      {order.orderCode || "--"}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      order.status === "completed"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                    }`}
                  >
                    {order.status || "unknown"}
                  </span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-200 font-semibold">
                  {order.buyerName || "Chưa có đơn vị mua hàng"}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 gap-3">
                  <span className="flex flex-col leading-tight">
                    <span>Ngày giao: {dateDisplay}</span>
                    <span>Giờ tạo: {timeDisplay}</span>
                  </span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {(order.amount || 0).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
