"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Ticket,
  Users,
  Download,
  Plus,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import StatCard from "./StatCard";
import OrderRow from "./OrderRow";
import DashboardSkeleton from "./DashboardSkeleton";
import { PWAStatus } from "./PWAStatus";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SummaryStat {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  bgColor?: string;
}

interface RecentOrder {
  id: string;
  customer: string;
  date: string;
  total: string;
  status: string;
}

interface RevenuePoint {
  date: string;
  revenue: number;
}

interface TopProduct {
  id: string;
  name: string;
  sold: number;
  price: number;
  image?: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  quantity: number;
  sku?: string;
}

const FALLBACK_STATS: SummaryStat[] = [
  { label: "Tổng doanh thu", value: "0đ", change: "0%", isPositive: true, icon: ShoppingBag, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  { label: "Đơn hàng mới", value: "0", change: "0%", isPositive: true, icon: Ticket, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  { label: "Khách hàng", value: "0", change: "0%", isPositive: true, icon: Users, color: "text-green-600 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30" },
  { label: "Voucher đã dùng", value: "0", change: "0%", isPositive: true, icon: Ticket, color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
];

const parseResponse = async (response: Response) => {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

const extractData = (data: any, ...keys: string[]) => {
  for (const key of keys) {
    if (data?.[key] !== undefined) return data[key];
  }
  return 0;
};

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-sm">
      <p className="text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="font-semibold text-blue-600 dark:text-blue-400">
        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(payload[0].value)}
      </p>
    </div>
  );
}

export default function DashboardView() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "vi";
  const [summaryStats, setSummaryStats] = useState<SummaryStat[]>(FALLBACK_STATS);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const mapStatus = useCallback((status: string): string => {
    const statusMap: Record<string, string> = {
      delivered: "Hoàn thành",
      processing: "Đang xử lý",
      shipped: "Vận chuyển",
      cancelled: "Đã hủy",
      pending: "Đang xử lý",
    };
    return statusMap[status?.toLowerCase() || ""] || "Đang xử lý";
  }, []);

  const formatCurrency = useCallback((amount: number): string => {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} Tỷ`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)} Triệu`;
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  }, []);

  const formatNumber = useCallback((num: number): string => {
    return new Intl.NumberFormat("vi-VN").format(num);
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateString;
    }
  }, []);

  const buildRevenueData = useCallback((orders: any[]): RevenuePoint[] => {
    const grouped: Record<string, number> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getDate()}/${d.getMonth() + 1}`;
      grouped[key] = 0;
    }
    orders.forEach((order: any) => {
      if (!order.createdAt) return;
      const d = new Date(order.createdAt);
      const daysAgo = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (daysAgo > 13) return;
      const key = `${d.getDate()}/${d.getMonth() + 1}`;
      grouped[key] = (grouped[key] || 0) + Number(order.amount || order.total || order.totalAmount || 0);
    });
    return Object.entries(grouped).map(([date, revenue]) => ({ date, revenue }));
  }, []);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [summaryRes, ordersRes, topProductsRes, lowStockRes] = await Promise.all([
        fetch("/api/analytics/summary?range=30d", { credentials: "include", cache: "no-store" }),
        fetch("/api/orders/admin/all?page=1&size=50", { credentials: "include", cache: "no-store" }),
        fetch("/api/products/public?sort=sold&order=desc&size=5&status=active", { cache: "no-store" }),
        fetch("/api/products/public?maxQuantity=10&trackQuantity=true&status=active&size=10", { cache: "no-store" }),
      ]);

      if (summaryRes.ok) {
        const summaryData = await parseResponse(summaryRes);
        const summary = summaryData?.data || summaryData?.result || summaryData || {};
        const revenue = Number(extractData(summary, "totalRevenue", "monthRevenue", "revenue", "revenueTotal")) || 0;
        const revenueChange = Number(extractData(summary, "revenueChange", "revenueGrowth", "revenueChangePercent")) || 0;
        const orders = Number(extractData(summary, "totalOrders", "newOrders", "orders", "ordersTotal")) || 0;
        const ordersChange = Number(extractData(summary, "ordersChange", "ordersGrowth", "ordersChangePercent")) || 0;
        const customers = Number(extractData(summary, "totalCustomers", "newCustomers", "customers", "customersTotal")) || 0;
        const customersChange = Number(extractData(summary, "customersChange", "customersGrowth", "customersChangePercent")) || 0;
        const vouchers = Number(extractData(summary, "vouchersUsed", "usedVouchers", "totalVouchersUsed", "voucherUsage")) || 0;
        const vouchersChange = Number(extractData(summary, "vouchersChange", "voucherUsageChange", "voucherChangePercent")) || 0;
        setSummaryStats([
          { label: "Tổng doanh thu", value: formatCurrency(revenue), change: `${revenueChange > 0 ? "+" : ""}${revenueChange.toFixed(1)}%`, isPositive: revenueChange >= 0, icon: ShoppingBag, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
          { label: "Đơn hàng mới", value: String(orders), change: `${ordersChange > 0 ? "+" : ""}${ordersChange.toFixed(1)}%`, isPositive: ordersChange >= 0, icon: Ticket, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
          { label: "Khách hàng", value: formatNumber(customers), change: `${customersChange > 0 ? "+" : ""}${customersChange.toFixed(1)}%`, isPositive: customersChange >= 0, icon: Users, color: "text-green-600 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30" },
          { label: "Voucher đã dùng", value: formatNumber(vouchers), change: `${vouchersChange > 0 ? "+" : ""}${vouchersChange.toFixed(1)}%`, isPositive: vouchersChange >= 0, icon: Ticket, color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
        ]);
      } else {
        setSummaryStats(FALLBACK_STATS);
      }

      if (ordersRes.ok) {
        const ordersData = await parseResponse(ordersRes);
        const ordersList = ordersData?.data?.content || ordersData?.data || ordersData?.content || ordersData?.result || ordersData || [];
        const formatted: RecentOrder[] = ordersList.slice(0, 5).map((order: any) => ({
          id: order.orderNumber || order._id || order.id || `#ORD-${Date.now()}`,
          customer: order.customerFullName || order.customerName || order.customer?.fullName || order.customer?.name || "Khách hàng",
          date: formatDate(order.createdAt || order.createdDate || order.date || new Date()),
          total: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(order.amount || order.total || order.totalAmount || 0)),
          status: mapStatus(order.status || order.orderStatus || "pending"),
        }));
        setRecentOrders(formatted);
        setRevenueData(buildRevenueData(ordersList));
      } else {
        setRecentOrders([]);
      }

      if (topProductsRes.ok) {
        const tpData = await parseResponse(topProductsRes);
        const tpList: any[] = Array.isArray(tpData?.data) ? tpData.data : [];
        setTopProducts(tpList.slice(0, 5).map((p: any) => ({
          id: p._id || p.id,
          name: p.name || "Sản phẩm",
          sold: Number(p.sold || p.soldCount || 0),
          price: Number(p.price || 0),
          image: p.images?.find((img: any) => img.isMain)?.url || p.images?.[0]?.url,
        })));
      }

      if (lowStockRes.ok) {
        const lsData = await parseResponse(lowStockRes);
        const lsList: any[] = Array.isArray(lsData?.data) ? lsData.data : [];
        setLowStock(
          lsList
            .filter((p: any) => Number(p.quantity ?? p.stock ?? 999) <= 10)
            .slice(0, 8)
            .map((p: any) => ({
              id: p._id || p.id,
              name: p.name || "Sản phẩm",
              quantity: Number(p.quantity ?? p.stock ?? 0),
              sku: p.sku,
            }))
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tải dữ liệu";
      setError(errorMessage);
      setSummaryStats(FALLBACK_STATS);
      setRecentOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [formatCurrency, formatNumber, formatDate, mapStatus, buildRevenueData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => fetchData(true), [fetchData]);

  const handleExportReport = useCallback(async () => {
    try {
      const response = await fetch("/api/analytics/summary?range=30d", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        const summary = data?.data || data?.result || data;
        const csvRows = [
          ["Báo cáo Dashboard", new Date().toLocaleDateString("vi-VN")],
          [],
          ["Chỉ số", "Giá trị"],
          ["Tổng doanh thu", formatCurrency(extractData(summary, "totalRevenue", "monthRevenue", "revenue"))],
          ["Đơn hàng mới", String(extractData(summary, "totalOrders", "newOrders", "orders"))],
          ["Khách hàng", formatNumber(extractData(summary, "totalCustomers", "newCustomers", "customers"))],
        ];
        const csvContent = csvRows.map((row) => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `dashboard-report-${new Date().toISOString().split("T")[0]}.csv`;
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      alert("Không thể xuất báo cáo. Vui lòng thử lại.");
    }
  }, [formatCurrency, formatNumber]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 mt-25">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Lỗi tải dữ liệu: {error}</p>
            <p className="text-xs mt-1">Vui lòng thử làm mới trang.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30">Thử lại</Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[24px] font-[400] text-gray-900 dark:text-white leading-tight">Tổng quan hoạt động</h1>
          <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">Dữ liệu tổng hợp từ 30 ngày gần nhất</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="inline-flex items-center px-4 py-2 h-10 rounded-full border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-[14px] font-[500] text-gray-700 dark:text-gray-300 transition-colors">
            <RefreshCw size={16} className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Đang tải" : "Làm mới"}
          </Button>
          <Button variant="outline" onClick={handleExportReport} className="inline-flex items-center px-4 py-2 h-10 rounded-full border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-[14px] font-[500] text-gray-700 dark:text-gray-300 transition-colors">
            <Download size={16} className="mr-2" /> Xuất báo cáo
          </Button>
          <Link href={`/${locale}/admin/orders/create`}>
            <Button className="inline-flex items-center px-5 py-2 h-10 rounded-full bg-[#0b57d0] dark:bg-[#a8c7fa] hover:bg-[#0b57d0]/90 dark:hover:bg-[#a8c7fa]/90 text-white dark:text-[#041e49] text-[14px] font-[500] transition-colors shadow-sm">
              <Plus size={18} className="mr-2" /> Tạo đơn hàng
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, index) => (
          <StatCard key={`${stat.label}-${index}`} label={stat.label} value={stat.value} change={stat.change} isPositive={stat.isPositive} icon={stat.icon} color={stat.color} bgColor={stat.bgColor} />
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-[#1f1f1f] rounded-[24px] border border-[#f1f3f4] dark:border-gray-800 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          <h2 className="text-[18px] font-[500] text-gray-900 dark:text-gray-100">Doanh thu 14 ngày gần nhất</h2>
        </div>
        {revenueData.some((d) => d.revenue > 0) ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}tr` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <Tooltip content={<RevenueTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: "#3b82f6" }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
            Chưa có dữ liệu doanh thu trong 14 ngày qua
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white dark:bg-[#1f1f1f] rounded-[24px] border border-[#f1f3f4] dark:border-gray-800 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#f1f3f4] dark:border-gray-800 flex justify-between items-center">
            <h2 className="text-[18px] font-[500] text-gray-900 dark:text-gray-100">Đơn hàng gần đây</h2>
            <Link href={`/${locale}/admin/orders`} className="text-[14px] font-[500] text-[#0b57d0] dark:text-[#a8c7fa] hover:bg-[#d3e3fd]/50 dark:hover:bg-[#004a77]/50 px-4 py-2 rounded-full transition-colors">Xem tất cả</Link>
          </div>
          <div className="overflow-x-auto">
            {recentOrders.length > 0 ? (
              <table className="min-w-full">
                <thead className="border-b border-[#f1f3f4] dark:border-gray-800">
                  <tr>
                    {["Mã đơn", "Khách hàng", "Tổng tiền", "Trạng thái", ""].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-[12px] font-[600] text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-[#f8f9fa]/50 dark:bg-gray-800/20">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1f1f1f]">
                  {recentOrders.map((order) => <OrderRow key={order.id} order={order} />)}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="text-gray-400 dark:text-gray-500 w-8 h-8" />
                </div>
                <h3 className="text-gray-900 dark:text-gray-100 font-[500] text-[16px] mb-1">Chưa có đơn hàng nào</h3>
                <p className="text-gray-500 dark:text-gray-400 text-[14px]">Các đơn hàng mới sẽ xuất hiện tại đây.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          {/* Top 5 Products */}
          <div className="bg-white dark:bg-[#1f1f1f] rounded-[24px] border border-[#f1f3f4] dark:border-gray-800 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-purple-500" />
              <h3 className="text-[16px] font-[500] text-gray-900 dark:text-gray-100">Top 5 bán chạy</h3>
            </div>
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-500"}`}>
                      {i + 1}
                    </span>
                    {p.image && (
                      <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-[500] text-gray-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-[11px] text-gray-400">{p.sold.toLocaleString("vi-VN")} đã bán</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Chưa có dữ liệu bán hàng</p>
            )}
          </div>

          {/* Low Stock Alerts */}
          {lowStock.length > 0 && (
            <div className="bg-white dark:bg-[#1f1f1f] rounded-[24px] border border-amber-200 dark:border-amber-800/50 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="text-[16px] font-[500] text-gray-900 dark:text-gray-100">Sắp hết hàng</h3>
                <span className="ml-auto bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold px-2 py-0.5 rounded-full">{lowStock.length}</span>
              </div>
              <div className="space-y-2.5">
                {lowStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-[500] text-gray-900 dark:text-white truncate">{p.name}</p>
                      {p.sku && <p className="text-[11px] text-gray-400">{p.sku}</p>}
                    </div>
                    <span className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full ${p.quantity <= 3 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                      {p.quantity} còn
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PWA Status */}
          <PWAStatus />
        </div>
      </div>
    </div>
  );
}
