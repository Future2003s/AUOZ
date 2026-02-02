"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ListChecks, Loader2, Package, User, Calendar, DollarSign, Truck, ImageIcon, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

type Order = {
  _id?: string;
  id?: string;
  orderNumber?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  } | string;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    street?: string;
    city?: string;
    phone?: string;
  };
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total?: number;
  status?: string;
  payment?: {
    status?: string;
    method?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  deliveredAt?: string;
};

export default function OrdersPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deliveryTotal, setDeliveryTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<{ id: string; orderNumber: string } | null>(null);
  const limit = 20;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      if (statusFilter) {
        queryParams.append("status", statusFilter);
      }

      console.log("[Orders Page] Fetching orders, page:", page, "status:", statusFilter);
      
      const res = await fetch(`/api/employee/orders?${queryParams.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      
      console.log("[Orders Page] Response status:", res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("[Orders Page] Error response:", errorData);
        throw new Error(errorData?.message || errorData?.error || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("[Orders Page] Response data:", {
        success: data.success,
        dataLength: Array.isArray(data.data) ? data.data.length : "not array",
        pagination: data.pagination,
      });
      
      if (data.success) {
        if (Array.isArray(data.data)) {
          setOrders(data.data);
          setTotal(data.pagination?.total || data.data.length);
        } else {
          console.warn("[Orders Page] Response data is not an array:", data.data);
          setOrders([]);
          setTotal(0);
        }
      } else {
        throw new Error(data.message || "Failed to load orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      const errorMessage = err instanceof Error ? err.message : "Không thể tải dữ liệu. Vui lòng thử lại sau.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryOrders = async () => {
    try {
      setLoadingDelivery(true);
      
      const queryParams = new URLSearchParams();
      queryParams.append("page", deliveryPage.toString());
      queryParams.append("limit", limit.toString());
      if (statusFilter) {
        // Map order status to delivery status if needed
        queryParams.append("status", statusFilter);
      }

      console.log("[Orders Page] Fetching delivery orders, page:", deliveryPage);
      
      const res = await fetch(`/api/employee/shipping/delivery?${queryParams.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("[Orders Page] Delivery orders error response:", errorData);
        throw new Error(errorData?.message || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("[Orders Page] Delivery orders response:", {
        success: data.success,
        dataLength: Array.isArray(data.data) ? data.data.length : "not array",
        pagination: data.pagination,
      });
      
      if (data.success) {
        if (Array.isArray(data.data)) {
          setDeliveryOrders(data.data);
          setDeliveryTotal(data.pagination?.total || data.data.length);
        } else {
          setDeliveryOrders([]);
          setDeliveryTotal(0);
        }
      } else {
        throw new Error(data.message || "Failed to load delivery orders");
      }
    } catch (err) {
      console.error("Error fetching delivery orders:", err);
      // Don't set error state for delivery orders, just log it
      setDeliveryOrders([]);
      setDeliveryTotal(0);
    } finally {
      setLoadingDelivery(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchOrders();
      fetchDeliveryOrders();
    }
  }, [isAuthenticated, authLoading, page, deliveryPage, statusFilter]);

  const getCustomerName = (order: Order) => {
    if (order.user && typeof order.user === "object") {
      return `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() || order.user.email || "Khách hàng";
    }
    if (order.shippingAddress) {
      return `${order.shippingAddress.firstName || ""} ${order.shippingAddress.lastName || ""}`.trim() || "Khách hàng";
    }
    return "Khách vãng lai";
  };

  // Merge and sort all orders by date (newest first)
  const allOrders = useMemo(() => {
    const merged: Array<{
      id: string;
      orderNumber: string;
      customerName: string;
      items: any[];
      total: number;
      status: string;
      createdAt: string;
      deliveryDate?: string;
      payment?: any;
      proofImage?: string;
      type: "order" | "delivery";
      originalData: any;
    }> = [];

    // Add regular orders
    orders.forEach((order) => {
      merged.push({
        id: order._id || order.id || "",
        orderNumber: order.orderNumber || "",
        customerName: getCustomerName(order),
        items: order.items || [],
        total: order.total || 0,
        status: order.status || "pending",
        createdAt: order.createdAt || "",
        payment: order.payment,
        type: "order",
        originalData: order,
      });
    });

    // Add delivery orders
    deliveryOrders.forEach((deliveryOrder) => {
      merged.push({
        id: deliveryOrder._id || deliveryOrder.id || "",
        orderNumber: deliveryOrder.orderCode || "",
        customerName: deliveryOrder.buyerName || "Khách hàng",
        items: deliveryOrder.items || [],
        total: deliveryOrder.amount || 0,
        status: deliveryOrder.status === "completed" 
          ? "completed" 
          : deliveryOrder.isShipped 
          ? "shipped" 
          : "pending",
        createdAt: deliveryOrder.createdAt || "",
        deliveryDate: deliveryOrder.deliveryDate,
        proofImage: deliveryOrder.proofImage,
        type: "delivery",
        originalData: deliveryOrder,
      });
    });

    // Sort by date (newest first)
    return merged.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [orders, deliveryOrders]);

  const totalAmountToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return allOrders
      .filter((o) => (o.createdAt || "").startsWith(today))
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [allOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "processing":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400";
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Chờ xử lý",
      confirmed: "Đã xác nhận",
      processing: "Đang xử lý",
      shipped: "Đã gửi hàng",
      delivered: "Đã giao hàng",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return labels[status] || status;
  };

  const handleDeleteOrder = async (orderId: string, orderType: "order" | "delivery") => {
    try {
      setDeletingOrderId(orderId);
      
      // Determine the API endpoint based on order type
      const endpoint = orderType === "delivery" 
        ? `/api/delivery/${orderId}`
        : `/api/employee/orders/${orderId}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || "Không thể xóa đơn hàng");
      }

      // Refresh orders list
      await fetchOrders();
      await fetchDeliveryOrders();
      setDeleteConfirmOrder(null);
    } catch (err) {
      console.error("Error deleting order:", err);
      alert(err instanceof Error ? err.message : "Không thể xóa đơn hàng");
    } finally {
      setDeletingOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Quản lý đơn hàng
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-1">
              <ListChecks size={16} />
              <span>{allOrders.length} đơn</span>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              <span>Tổng hôm nay:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {totalAmountToday.toLocaleString("vi-VN")} ₫
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="processing">Đang xử lý</option>
            <option value="shipped">Đã gửi hàng</option>
            <option value="delivered">Đã giao hàng</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </header>

      <main className="px-4 py-4">
        {(loading || loadingDelivery) && (
          <div className="flex items-center justify-center py-10 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Đang tải danh sách đơn...
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-4">
            <p className="font-semibold mb-1">Lỗi:</p>
            <p>{error}</p>
            <button
              onClick={() => {
                fetchOrders();
                fetchDeliveryOrders();
              }}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        )}
        {!loading && !loadingDelivery && !error && allOrders.length === 0 && (
          <div className="text-gray-500 dark:text-gray-400 py-6">
            Chưa có đơn hàng nào.
          </div>
        )}
        
        {/* Unified Orders List */}
        {allOrders.length > 0 && (
          <div className="grid gap-3">
            {allOrders.map((order) => {
              const createdAtObj = order.createdAt ? new Date(order.createdAt) : null;
              const dateDisplay = createdAtObj
                ? format(createdAtObj, "dd/MM/yyyy", { locale: vi })
                : "--";
              const timeDisplay = createdAtObj
                ? format(createdAtObj, "HH:mm", { locale: vi })
                : "--";
              
              return (
                <div
                  key={order.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (order.type === "delivery") {
                      router.push(`/${locale}/employee/orders/${order.id}`);
                    } else {
                      router.push(`/${locale}/employee/orders/${order.id}`);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/${locale}/employee/orders/${order.id}`);
                    }
                  }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm flex flex-col gap-3 cursor-pointer hover:border-blue-400 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-2 flex-1 cursor-pointer"
                      onClick={() => {
                        router.push(`/${locale}/employee/orders/${order.id}`);
                      }}
                    >
                      {order.type === "delivery" ? (
                        <Truck className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      ) : (
                        <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      )}
                      <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Mã đơn
                      </span>
                      <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                        {order.orderNumber || "--"}
                      </span>
                      {order.type === "delivery" && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                          LALC
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmOrder({ id: order.id, orderNumber: order.orderNumber });
                        }}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                        title="Xóa đơn hàng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="font-semibold">{order.customerName}</span>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {order.items.length} sản phẩm
                      {order.items.slice(0, 2).map((item: any, idx: number) => (
                        <span key={idx}>
                          {idx > 0 && ", "}
                          {item.name} x{item.quantity}
                        </span>
                      ))}
                      {order.items.length > 2 && ` và ${order.items.length - 2} sản phẩm khác`}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col gap-1 text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{dateDisplay} {timeDisplay}</span>
                      </div>
                      {order.type === "order" && order.payment && (
                        <div className="text-xs">
                          Thanh toán: {order.payment.method === "cash_on_delivery" ? "COD" : order.payment.method} - {order.payment.status === "completed" ? "Đã thanh toán" : "Chưa thanh toán"}
                        </div>
                      )}
                      {order.type === "delivery" && order.deliveryDate && (
                        <div className="text-xs">
                          Ngày giao: {format(new Date(order.deliveryDate), "dd/MM/yyyy", { locale: vi })}
                        </div>
                      )}
                      {order.type === "delivery" && order.proofImage && (
                        <div className="flex items-center gap-1 text-xs">
                          <ImageIcon className="w-3 h-3" />
                          <span>Đã có ảnh bằng chứng</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                      <DollarSign className="w-4 h-4" />
                      <span>{(order.total || 0).toLocaleString("vi-VN")} ₫</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOrder && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Xác nhận xóa đơn hàng
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Bạn có chắc chắn muốn xóa đơn hàng <span className="font-mono font-semibold">{deleteConfirmOrder.orderNumber}</span>? 
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmOrder(null)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                disabled={deletingOrderId === deleteConfirmOrder.id}
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const order = allOrders.find(o => o.id === deleteConfirmOrder.id);
                  if (order) {
                    handleDeleteOrder(deleteConfirmOrder.id, order.type);
                  }
                }}
                disabled={deletingOrderId === deleteConfirmOrder.id}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {deletingOrderId === deleteConfirmOrder.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Xóa đơn hàng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
