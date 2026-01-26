"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import ShippingPhotoCapture from "@/components/employee/ShippingPhotoCapture";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Plus, Calendar, DollarSign, User, Truck, Loader2, ImageIcon } from "lucide-react";
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
};

export default function ShippingPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("create");
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deliveryTotal, setDeliveryTotal] = useState(0);
  const limit = 20;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const res = await fetch(`/api/employee/shipping/orders?${queryParams.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.message || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        if (Array.isArray(data.data)) {
          // Filter orders that are not delivered (for shipping)
          const undeliveredOrders = data.data.filter(
            (order: Order) => order.status !== "delivered" && order.status !== "cancelled"
          );
          setOrders(undeliveredOrders);
          // Note: total count might be different after filtering
          setTotal(undeliveredOrders.length);
        } else {
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
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryOrders = async () => {
    try {
      setLoadingDelivery(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      queryParams.append("page", deliveryPage.toString());
      queryParams.append("limit", limit.toString());

      const res = await fetch(`/api/employee/shipping/delivery?${queryParams.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.message || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
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
      const errorMessage = err instanceof Error ? err.message : "Không thể tải dữ liệu. Vui lòng thử lại sau.";
      setError(errorMessage);
      setDeliveryOrders([]);
      setDeliveryTotal(0);
    } finally {
      setLoadingDelivery(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && activeTab === "list") {
      fetchOrders();
      fetchDeliveryOrders();
    }
  }, [isAuthenticated, authLoading, activeTab, page, deliveryPage]);

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
    };
    return labels[status] || status;
  };

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Gửi hàng & Chụp ảnh
            </h1>
          </div>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus size={16} />
              Tạo đơn mới
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Package size={16} />
              Danh sách đơn hàng ({allOrders.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="create" className="mt-0">
          <ShippingPhotoCapture />
        </TabsContent>

        <TabsContent value="list" className="mt-0 px-4 py-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-4">
              <p className="font-semibold mb-1">Lỗi:</p>
              <p>{error}</p>
              <Button
                onClick={() => fetchOrders()}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Thử lại
              </Button>
            </div>
          )}

          {(loading || loadingDelivery) ? (
            <div className="flex items-center justify-center py-10 text-gray-500 dark:text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Đang tải danh sách đơn...
            </div>
          ) : allOrders.length === 0 ? (
            <Card className="border border-slate-200 dark:border-slate-700">
              <CardContent className="p-8 text-center">
                <Truck className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 dark:text-slate-400">
                  Chưa có đơn hàng nào cần gửi
                </p>
              </CardContent>
            </Card>
          ) : (
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
                  <Card
                    key={order.id}
                    className="border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setActiveTab("create");
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
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
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : order.status === "shipped"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                              : getStatusColor(order.status)
                          }`}
                        >
                          {order.status === "completed"
                            ? "Hoàn thành"
                            : getStatusLabel(order.status)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 mb-2">
                        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="font-semibold">{order.customerName}</span>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

