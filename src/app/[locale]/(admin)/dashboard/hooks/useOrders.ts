"use client";
import { useEffect, useState } from "react";
import type { Order } from "../types";

interface PaginationInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: false,
  });
  const fetchOrders = async (page = 1, size = 10) => {
    setLoading(true);
    setError(null);

    try {

      const res = await fetch(
        `/api/orders/admin/all?page=${page}&size=${size}`,
        {
          credentials: "include", // Use cookies instead of Authorization header
          cache: "no-store",
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Orders API error:", errorText);

        if (res.status === 401) {
          throw new Error("Vui lòng đăng nhập để xem đơn hàng");
        } else if (res.status === 403) {
          throw new Error("Bạn không có quyền xem đơn hàng");
        } else if (res.status === 404) {
          throw new Error("API endpoint không tồn tại");
        } else if (res.status === 500) {
          throw new Error("Lỗi server - vui lòng thử lại sau");
        } else {
          throw new Error(`Lỗi tải đơn hàng: ${res.status} - ${errorText}`);
        }
      }

      let payload;
      try {
        const text = await res.text();
        payload = text ? JSON.parse(text) : null;
      } catch (error) {
        console.error("JSON parse error:", error);
        payload = null;
      }
      const data = payload?.data || payload;

      // Extract pagination info
      const paginationInfo: PaginationInfo = {
        page: data.page || 1,
        size: data.size || 10,
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 0,
        first: data.first || true,
        last: data.last || false,
      };

      const list: any[] = data.content || data || [];

      const mapped: Order[] = list.map((o: any) => {
        const backendId =
          (typeof o._id === "object" ? o._id?.toString() : o._id) ||
          o.id ||
          "";
        const orderNumber = o.orderNumber || backendId || "N/A";
        const rawStatus = typeof o.status === "string" ? o.status : "pending";
        const statusTranslations: Record<string, Order["status"]> = {
          pending: "Chờ xử lý",
          processing: "Đang xử lý",
          shipped: "Đang giao",
          delivered: "Đã giao",
          cancelled: "Đã huỷ",
        };
        const status =
          statusTranslations[rawStatus as keyof typeof statusTranslations] ||
          "Chờ xử lý";

        return {
          id: orderNumber,
          backendId,
          customerName:
            o.customerFullName ||
            o.customerName ||
            o.customer?.fullName ||
            "Khách hàng",
          date: o.createdAt || o.date || new Date().toISOString(),
          total: new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(Number(o.amount || o.total || 0)),
          status,
          rawStatus,
          items: Array.isArray(o.items)
            ? o.items.map((it: any) => ({
                id: it.id || it._id || "N/A",
                name: it.productName || it.name || "Sản phẩm",
                quantity: it.quantity || 0,
                price: new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(Number(it.price || 0)),
              }))
            : [],
        };
      });

      setOrders(mapped);
      setPagination(paginationInfo);
    } catch (err) {
      console.error("💥 Error in fetchOrders:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []); // Remove sessionToken dependency

  const updateOrder = (updatedOrder: Order) => {
    setOrders((prevOrders) =>
      prevOrders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
  };

  const syncOrderStatus = (backendId: string, backendStatus: string) => {
    const statusMap: Record<string, Order["status"]> = {
      pending: "Chờ xử lý",
      processing: "Đang xử lý",
      shipped: "Đang giao",
      delivered: "Đã giao",
      cancelled: "Đã huỷ",
    };
    const normalizedStatus =
      typeof backendStatus === "string" ? backendStatus.toLowerCase() : "";
    const mappedStatus = statusMap[normalizedStatus] ?? "Chờ xử lý";

    setOrders((prevOrders) =>
      prevOrders.map((o) =>
        o.backendId === backendId || o.id === backendId
          ? {
              ...o,
              status: mappedStatus,
            }
          : o
      )
    );
  };

  const goToPage = (page: number) => {
    fetchOrders(page, pagination.size);
  };

  const changePageSize = (size: number) => {
    fetchOrders(1, size);
  };

  const refreshOrders = () => {
    fetchOrders(pagination.page, pagination.size);
  };

  return {
    orders,
    loading,
    error,
    pagination,
    updateOrder,
    syncOrderStatus,
    refreshOrders,
    goToPage,
    changePageSize,
  };
};
