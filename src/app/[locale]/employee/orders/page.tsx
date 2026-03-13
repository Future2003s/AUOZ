"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ListChecks, Loader2, Package, User, Calendar, DollarSign,
  Truck, ImageIcon, Trash2, Search, ChevronLeft, ChevronRight,
  RefreshCw, TrendingUp, Clock, CheckCircle2, XCircle, Eye,
  Filter, ArrowUpDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────
type Order = {
  _id?: string;
  id?: string;
  orderNumber?: string;
  user?: { firstName?: string; lastName?: string; email?: string; phone?: string } | string;
  shippingAddress?: { firstName?: string; lastName?: string; street?: string; city?: string; phone?: string };
  items?: Array<{ name: string; quantity: number; price: number }>;
  total?: number;
  status?: string;
  payment?: { status?: string; method?: string };
  createdAt?: string;
  updatedAt?: string;
  deliveredAt?: string;
};

type MergedOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  items: any[];
  total: number;
  status: string;
  createdAt: string;
  deliveryDate?: string;
  payment?: any;
  proofImage?: string;
  type: "order" | "delivery";
  originalData: any;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  pending:    { label: "Chờ xử lý",    color: "bg-amber-50  text-amber-700  border-amber-200  dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",  dot: "bg-amber-400" },
  confirmed:  { label: "Đã xác nhận",  color: "bg-blue-50   text-blue-700   border-blue-200   dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",    dot: "bg-blue-400" },
  processing: { label: "Đang xử lý",   color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800", dot: "bg-indigo-400" },
  shipped:    { label: "Đã gửi hàng",  color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800", dot: "bg-purple-400" },
  delivered:  { label: "Đã giao hàng", color: "bg-teal-50   text-teal-700   border-teal-200   dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800",    dot: "bg-teal-400" },
  completed:  { label: "Hoàn thành",   color: "bg-green-50  text-green-700  border-green-200  dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",  dot: "bg-green-400" },
  cancelled:  { label: "Đã hủy",       color: "bg-red-50    text-red-700    border-red-200    dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",        dot: "bg-red-400" },
  returned:   { label: "Trả hàng",     color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800", dot: "bg-orange-400" },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: "bg-gray-50 text-gray-700 border-gray-200", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${meta.color}`}>
      <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function PaymentBadge({ method, status }: { method?: string; status?: string }) {
  const isPaid = status === "completed" || status === "paid";
  const methodLabel = method === "cash_on_delivery" ? "COD"
    : method === "bank_transfer" ? "Chuyển khoản"
    : method ?? "COD";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${
      isPaid
        ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
        : "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
    }`}>
      {methodLabel} · {isPaid ? "Đã TT" : "Chưa TT"}
    </span>
  );
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────
async function fetchOrders(page: number, limit: number, statusFilter: string) {
  const queryParams = new URLSearchParams();
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());
  if (statusFilter) queryParams.append("status", statusFilter);
  const res = await fetch(`/api/employee/orders?${queryParams.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

async function fetchDeliveryOrders(page: number, limit: number, statusFilter: string) {
  const queryParams = new URLSearchParams();
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());
  if (statusFilter) queryParams.append("status", statusFilter);
  const res = await fetch(`/api/employee/shipping/delivery?${queryParams.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return { success: false, data: [] };
  return res.json();
}

async function updateOrderStatusApi(orderId: string, newStatus: string) {
  const res = await fetch(`/api/employee/orders/${orderId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status: newStatus }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  if (!data.success) throw new Error(data.message || "Cập nhật thất bại");
  return data;
}

async function deleteOrderApi(orderId: string, orderType: "order" | "delivery") {
  const endpoint = orderType === "delivery"
    ? `/api/delivery/${orderId}`
    : `/api/employee/orders/${orderId}`;
  const res = await fetch(endpoint, { method: "DELETE", credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Không thể xóa đơn hàng");
  }
  return res.json();
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrdersPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<{ id: string; orderNumber: string; type: "order" | "delivery" } | null>(null);

  // useDeferredValue: filter runs at low priority, never blocks typing
  const deferredSearch = useDeferredValue(searchQuery);

  const enabled = !authLoading && isAuthenticated;

  // ─── Queries ───────────────────────────────────────────────────────────────
  const ordersQuery = useQuery({
    queryKey: ["employee-orders", page, limit, statusFilter],
    queryFn: () => fetchOrders(page, limit, statusFilter),
    enabled,
    placeholderData: keepPreviousData, // ← giữ dữ liệu cũ trong khi tải trang mới, không flicker
    staleTime: 30 * 1000,             // 30s — dữ liệu vẫn fresh, không re-fetch ngay
    gcTime: 5 * 60 * 1000,
  });

  const deliveryQuery = useQuery({
    queryKey: ["employee-delivery-orders", page, limit, statusFilter],
    queryFn: () => fetchDeliveryOrders(page, limit, statusFilter),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: string; newStatus: string }) =>
      updateOrderStatusApi(orderId, newStatus),

    // Optimistic update — UI phản hồi ngay lập tức
    onMutate: async ({ orderId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["employee-orders"] });
      const previousData = queryClient.getQueryData(["employee-orders", page, limit, statusFilter]);

      queryClient.setQueryData(["employee-orders", page, limit, statusFilter], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((order: any) =>
            (order._id || order.id) === orderId ? { ...order, status: newStatus } : order
          ),
        };
      });

      return { previousData };
    },

    // Nếu lỗi → rollback về dữ liệu cũ
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["employee-orders", page, limit, statusFilter], context.previousData);
      }
      alert(_err instanceof Error ? _err.message : "Không thể cập nhật trạng thái");
    },

    // Sau khi thành công → invalidate để server confirm
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-orders"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ orderId, orderType }: { orderId: string; orderType: "order" | "delivery" }) =>
      deleteOrderApi(orderId, orderType),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-orders"] });
      queryClient.invalidateQueries({ queryKey: ["employee-delivery-orders"] });
      setDeleteConfirmOrder(null);
    },

    onError: (err) => {
      alert(err instanceof Error ? err.message : "Không thể xóa đơn hàng");
    },
  });

  // ─── Derived data ──────────────────────────────────────────────────────────
  const orders: Order[] = ordersQuery.data?.data ?? [];
  const deliveryOrders: any[] = deliveryQuery.data?.data ?? [];
  
  // Tổng các order từ 2 API để tính tổng item và số trang (lấy số trang lớn nhất)
  const totalRegular: number = ordersQuery.data?.pagination?.total || 0;
  const pagesRegular: number = ordersQuery.data?.pagination?.totalPages || Math.ceil(totalRegular / limit) || 1;
  
  const totalDelivery: number = deliveryQuery.data?.pagination?.total || deliveryQuery.data?.data?.length || 0;
  const pagesDelivery: number = deliveryQuery.data?.pagination?.totalPages || Math.ceil(totalDelivery / limit) || 1;
  
  const total = totalRegular + totalDelivery;
  const totalPages = Math.max(pagesRegular, pagesDelivery, 1);

  const getCustomerName = (order: Order) => {
    if (order.user && typeof order.user === "object") {
      return `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() || order.user.email || "Khách hàng";
    }
    if (order.shippingAddress) {
      return `${order.shippingAddress.firstName || ""} ${order.shippingAddress.lastName || ""}`.trim() || "Khách hàng";
    }
    return "Khách vãng lai";
  };

  const getCustomerPhone = (order: Order) => {
    if (order.user && typeof order.user === "object") return order.user.phone;
    if (order.shippingAddress) return order.shippingAddress.phone;
    return undefined;
  };

  const allOrders = useMemo<MergedOrder[]>(() => {
    const merged: MergedOrder[] = [];
    orders.forEach((order) => {
      merged.push({
        id: order._id || order.id || "",
        orderNumber: order.orderNumber || "",
        customerName: getCustomerName(order),
        customerPhone: getCustomerPhone(order),
        items: order.items || [],
        total: order.total || 0,
        status: order.status || "pending",
        createdAt: order.createdAt || "",
        payment: order.payment,
        type: "order",
        originalData: order,
      });
    });
    deliveryOrders.forEach((d) => {
      merged.push({
        id: d._id || d.id || "",
        orderNumber: d.orderCode || "",
        customerName: d.buyerName || "Khách hàng",
        items: d.items || [],
        total: d.amount || 0,
        status: d.status === "completed" ? "completed" : d.isShipped ? "shipped" : "pending",
        createdAt: d.createdAt || "",
        deliveryDate: d.deliveryDate,
        proofImage: d.proofImage,
        type: "delivery",
        originalData: d,
      });
    });
    return merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [orders, deliveryOrders]);

  // deferredSearch: filtering happens at transition priority (no input lag)
  const filteredOrders = useMemo(() => {
    let result = allOrders;
    // Client-side status filter for delivery orders (server filters regular orders)
    if (statusFilter) {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (!deferredSearch.trim()) return result;
    const q = deferredSearch.toLowerCase();
    return result.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerPhone && o.customerPhone.includes(q))
    );
  }, [allOrders, deferredSearch, statusFilter]);

  const totalAmountToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return allOrders.filter((o) => (o.createdAt || "").startsWith(today)).reduce((sum, o) => sum + (o.total || 0), 0);
  }, [allOrders]);

  const pendingCount  = useMemo(() => allOrders.filter((o) => o.status === "pending").length, [allOrders]);
  const completedCount = useMemo(() => allOrders.filter((o) => o.status === "completed" || o.status === "delivered").length, [allOrders]);
  const cancelledCount = useMemo(() => allOrders.filter((o) => o.status === "cancelled").length, [allOrders]);

  // isLoading = true chỉ lần đầu (chưa có data nào)
  // isFetching = true khi revalidate → dùng spinner nhỏ, không ẩn bảng
  const isFirstLoad = ordersQuery.isLoading || deliveryQuery.isLoading;
  const isRefetching = (ordersQuery.isFetching || deliveryQuery.isFetching) && !isFirstLoad;
  const error = ordersQuery.error;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["employee-orders"] });
    queryClient.invalidateQueries({ queryKey: ["employee-delivery-orders"] });
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Quản lý đơn hàng</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{allOrders.length} đơn hàng</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw className={`w-5 h-5 ${isRefetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Revalidation progress bar — không flicker, chỉ một thanh mỏng ở trên */}
        {isRefetching && (
          <div className="h-0.5 bg-blue-100 dark:bg-blue-900/30 overflow-hidden">
            <div className="h-full bg-blue-500 animate-[progress_1.2s_ease-in-out_infinite]" style={{ width: "60%" }} />
          </div>
        )}
      </div>

      <div className="px-6 sm:px-8 py-5 space-y-5 max-w-[1600px] mx-auto">

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Tổng hôm nay</span>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {totalAmountToday.toLocaleString("vi-VN")}₫
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Chờ xử lý</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Hoàn thành</span>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Đã hủy</span>
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{cancelledCount}</p>
          </div>
        </div>

        {/* ── Search & Filters ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã đơn, tên khách, số điện thoại..."
                className="w-full pl-11 pr-4 py-3 text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              )}
              {/* Subtle indicator khi search đang được defer */}
              {searchQuery !== deferredSearch && (
                <span className="absolute right-10 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                </span>
              )}
            </div>
            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="pl-11 pr-10 py-3 text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer min-w-[200px]"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xử lý</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="processing">Đang xử lý</option>
                <option value="shipped">Đã gửi hàng</option>
                <option value="delivered">Đã giao hàng</option>
                <option value="completed">Hoàn thành</option>
                <option value="returned">Trả hàng</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            {/* Limit Selector */}
            <div className="relative">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1); // Reset to first page when limit changes
                }}
                className="pl-4 pr-10 py-3 text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value={10}>10 dòng/trang</option>
                <option value={20}>20 dòng/trang</option>
                <option value={50}>50 dòng/trang</option>
                <option value={100}>100 dòng/trang</option>
              </select>
            </div>
          </div>

          {/* Filter chips */}
          {(searchQuery || statusFilter) && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-sm text-gray-500">Lọc:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium border border-blue-200 dark:border-blue-800">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery("")} className="hover:text-blue-900 text-base leading-none">×</button>
                </span>
              )}
              {statusFilter && STATUS_META[statusFilter] && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-sm font-medium border border-purple-200 dark:border-purple-800">
                  {STATUS_META[statusFilter].label}
                  <button onClick={() => setStatusFilter("")} className="hover:text-purple-900 text-base leading-none">×</button>
                </span>
              )}
              <button
                onClick={() => { setSearchQuery(""); setStatusFilter(""); }}
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Xóa tất cả
              </button>
              <span className="ml-auto text-sm text-gray-500 font-medium">{filteredOrders.length} kết quả</span>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        {isFirstLoad ? (
          /* Skeleton — chỉ hiện lần đầu tiên */
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Đang tải đơn hàng...</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 animate-pulse flex items-center gap-4">
                  <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-300 text-sm">Lỗi tải dữ liệu</p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  {error instanceof Error ? error.message : "Không thể tải dữ liệu."}
                </p>
                <button
                  onClick={handleRefresh}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Thử lại
                </button>
              </div>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {searchQuery || statusFilter ? "Không tìm thấy đơn hàng phù hợp" : "Chưa có đơn hàng nào"}
            </p>
            {(searchQuery || statusFilter) && (
              <button
                onClick={() => { setSearchQuery(""); setStatusFilter(""); }}
                className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          /* ── Table ── */
          /* opacity-transition khi revalidate, không ẩn bảng */
          <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-opacity duration-200 ${isRefetching ? "opacity-70" : "opacity-100"}`}>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5"><ArrowUpDown className="w-3.5 h-3.5" /> Mã đơn</div>
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Khách hàng</div>
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sản phẩm</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thanh toán</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center justify-end gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Tổng tiền</div>
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Ngày tạo</div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredOrders.map((order) => {
                    const createdAt = order.createdAt ? new Date(order.createdAt) : null;
                    const isUpdating = statusMutation.isPending && statusMutation.variables?.orderId === order.id;
                    const isDeleting = deleteMutation.isPending && deleteConfirmOrder?.id === order.id;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/${locale}/employee/orders/${order.id}`)}
                        className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                      >
                        {/* Order Number */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${order.type === "delivery" ? "bg-purple-50 dark:bg-purple-900/20" : "bg-blue-50 dark:bg-blue-900/20"}`}>
                              {order.type === "delivery"
                                ? <Truck className="w-4.5 h-4.5 text-purple-500" />
                                : <Package className="w-4.5 h-4.5 text-blue-500" />}
                            </div>
                            <span className="font-mono font-bold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {order.orderNumber || "—"}
                            </span>
                            {order.type === "delivery" && (
                              <span className="hidden lg:inline px-1.5 py-0.5 rounded text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">LALC</span>
                            )}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-base leading-tight">{order.customerName}</p>
                            {order.customerPhone && (
                              <p className="text-sm text-gray-400 mt-0.5">{order.customerPhone}</p>
                            )}
                          </div>
                        </td>

                        {/* Items */}
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-[220px] truncate">
                            {order.items?.length > 0
                              ? `${order.items.length} sp · ${order.items.slice(0, 1).map(i => i.name).join("")}${order.items.length > 1 ? "..." : ""}`
                              : "—"}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {order.type === "order" ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={order.status}
                                onChange={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  statusMutation.mutate({ orderId: order.id, newStatus: e.target.value });
                                }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                disabled={isUpdating}
                                className="text-sm px-3 py-1.5 rounded-xl border font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ appearance: "auto" }}
                                title="Đổi trạng thái"
                              >
                                {Object.entries(STATUS_META).map(([val, meta]) => (
                                  <option key={val} value={val}>{meta.label}</option>
                                ))}
                              </select>
                              {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                            </div>
                          ) : (
                            <div onClick={(e) => e.stopPropagation()}>
                              <StatusBadge status={order.status} />
                            </div>
                          )}
                          {order.proofImage && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-green-500" />
                              <span className="text-xs text-green-600 dark:text-green-400">Có ảnh bằng chứng</span>
                            </div>
                          )}
                        </td>

                        {/* Payment */}
                        <td className="px-6 py-4">
                          {order.payment
                            ? <PaymentBadge method={order.payment.method} status={order.payment.status} />
                            : <span className="text-sm text-gray-400">—</span>}
                        </td>

                        {/* Total */}
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-gray-900 dark:text-white tabular-nums text-base">
                            {(order.total || 0).toLocaleString("vi-VN")}₫
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4">
                          {createdAt ? (
                            <div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                                {format(createdAt, "dd/MM/yyyy", { locale: vi })}
                              </p>
                              <p className="text-sm text-gray-400 mt-0.5">
                                {format(createdAt, "HH:mm", { locale: vi })}
                              </p>
                            </div>
                          ) : <span className="text-sm text-gray-400">—</span>}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => router.push(`/${locale}/employee/orders/${order.id}`)}
                              className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmOrder({ id: order.id, orderNumber: order.orderNumber, type: order.type })}
                              disabled={isDeleting}
                              className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                              title="Xóa đơn hàng"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {filteredOrders.map((order) => {
                const createdAt = order.createdAt ? new Date(order.createdAt) : null;
                return (
                  <div
                    key={order.id}
                    onClick={() => router.push(`/${locale}/employee/orders/${order.id}`)}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {order.type === "delivery"
                          ? <Truck className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          : <Package className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                        <span className="font-mono font-bold text-gray-900 dark:text-white text-sm">{order.orderNumber || "—"}</span>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{order.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {createdAt ? format(createdAt, "dd/MM/yyyy HH:mm", { locale: vi }) : "—"}
                      </div>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {(order.total || 0).toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Trang {page}/{totalPages} · {total} đơn
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                          pageNum === page
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirmOrder && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Xóa đơn hàng?</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
              Đơn hàng <span className="font-mono font-bold text-gray-900 dark:text-white">{deleteConfirmOrder.orderNumber}</span> sẽ bị xóa vĩnh viễn.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setDeleteConfirmOrder(null)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => deleteMutation.mutate({ orderId: deleteConfirmOrder.id, orderType: deleteConfirmOrder.type })}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang xóa...</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Xóa đơn hàng</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
