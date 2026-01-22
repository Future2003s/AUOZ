"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardNotifications } from "@/components/employee/DashboardNotifications";
import { Loader2 } from "lucide-react";

interface OrderItem {
  id: string;
  buyer: string;
  amount: number;
  date: string;
  isDebt: boolean;
  isInvoice: boolean;
  isShipped: boolean;
  isInvoiceSent?: boolean;
  orderCode?: string;
  orderNumber?: string;
}

export default function NotificationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all orders and delivery orders
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchAllOrders();
    }
  }, [isAuthenticated, authLoading]);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch regular orders
      const ordersRes = await fetch("/api/employee/orders?page=1&limit=1000", {
        credentials: "include",
        cache: "no-store",
      });

      // Fetch delivery orders
      const deliveryRes = await fetch("/api/employee/shipping/delivery?page=1&limit=1000", {
        credentials: "include",
        cache: "no-store",
      });

      const ordersData = ordersRes.ok ? await ordersRes.json() : { success: false, data: [] };
      const deliveryData = deliveryRes.ok ? await deliveryRes.json() : { success: false, data: [] };

      if (ordersData.success && Array.isArray(ordersData.data)) {
        setOrders(ordersData.data);
      }

      if (deliveryData.success && Array.isArray(deliveryData.data)) {
        setDeliveryOrders(deliveryData.data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Transform data to OrderItem format
  const transformedData: OrderItem[] = useMemo(() => {
    const result: OrderItem[] = [];

    // Transform regular orders
    orders.forEach((order) => {
      const customerName =
        order.user && typeof order.user === "object"
          ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() || order.user.email || "Khách hàng"
          : order.shippingAddress
          ? `${order.shippingAddress.firstName || ""} ${order.shippingAddress.lastName || ""}`.trim() || "Khách hàng"
          : "Khách vãng lai";

      result.push({
        id: order._id || order.id || "",
        buyer: customerName,
        amount: order.total || 0,
        date: order.createdAt || new Date().toISOString(),
        isDebt: order.payment?.status !== "completed" && order.status !== "cancelled",
        isInvoice: false, // Regular orders don't have isInvoice flag
        isShipped: order.status === "shipped" || order.status === "delivered",
        isInvoiceSent: false,
        orderNumber: order.orderNumber,
      });
    });

    // Transform delivery orders
    deliveryOrders.forEach((deliveryOrder) => {
      result.push({
        id: deliveryOrder._id || deliveryOrder.id || "",
        buyer: deliveryOrder.buyerName || "Khách hàng",
        amount: deliveryOrder.amount || 0,
        date: deliveryOrder.createdAt || deliveryOrder.deliveryDate || new Date().toISOString(),
        isDebt: deliveryOrder.isDebt === true,
        isInvoice: deliveryOrder.isInvoice === true,
        isShipped: deliveryOrder.isShipped === true || deliveryOrder.status === "completed",
        isInvoiceSent: deliveryOrder.isInvoice === true && deliveryOrder.status === "completed",
        orderCode: deliveryOrder.orderCode,
      });
    });

    return result;
  }, [orders, deliveryOrders]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg max-w-md">
          <p className="font-semibold mb-1">Lỗi:</p>
          <p>{error}</p>
          <button
            onClick={fetchAllOrders}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Thông báo & Nhắc nhở
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Theo dõi công nợ, hóa đơn và đơn hàng đã gửi
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-[calc(100vh-12rem)] sm:h-[calc(100vh-10rem)]">
          <DashboardNotifications data={transformedData} />
        </div>
      </div>
    </div>
  );
}

