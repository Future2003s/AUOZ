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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePathname } from "next/navigation";
import StatCard from "./StatCard";
import OrderRow from "./OrderRow";
import DashboardSkeleton from "./DashboardSkeleton";
import { PWAStatus } from "./PWAStatus";

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

// Fallback data constants
const FALLBACK_STATS: SummaryStat[] = [
  {
    label: "Tổng doanh thu",
    value: "0đ",
    change: "0%",
    isPositive: true,
    icon: ShoppingBag,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    label: "Đơn hàng mới",
    value: "0",
    change: "0%",
    isPositive: true,
    icon: Ticket,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    label: "Khách hàng",
    value: "0",
    change: "0%",
    isPositive: true,
    icon: Users,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    label: "Voucher đã dùng",
    value: "0",
    change: "0%",
    isPositive: true,
    icon: Ticket,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
];

// Helper function to safely parse JSON response
const parseResponse = async (response: Response) => {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

// Helper function to extract nested data
const extractData = (data: any, ...keys: string[]) => {
  for (const key of keys) {
    if (data?.[key] !== undefined) return data[key];
  }
  return 0;
};

export default function DashboardView() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "vi";
  const [summaryStats, setSummaryStats] = useState<SummaryStat[]>(FALLBACK_STATS);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
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
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)} Tỷ`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)} Triệu`;
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }, []);

  const formatNumber = useCallback((num: number): string => {
    return new Intl.NumberFormat("vi-VN").format(num);
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  }, []);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [summaryRes, ordersRes] = await Promise.all([
        fetch("/api/analytics/summary?range=30d", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/orders/admin/all?page=1&size=5", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      // Process summary stats
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
          {
            label: "Tổng doanh thu",
            value: formatCurrency(revenue),
            change: `${revenueChange > 0 ? "+" : ""}${revenueChange.toFixed(1)}%`,
            isPositive: revenueChange >= 0,
            icon: ShoppingBag,
            color: "text-blue-600 dark:text-blue-400",
            bgColor: "bg-blue-100 dark:bg-blue-900/30",
          },
          {
            label: "Đơn hàng mới",
            value: String(orders),
            change: `${ordersChange > 0 ? "+" : ""}${ordersChange.toFixed(1)}%`,
            isPositive: ordersChange >= 0,
            icon: Ticket,
            color: "text-purple-600 dark:text-purple-400",
            bgColor: "bg-purple-100 dark:bg-purple-900/30",
          },
          {
            label: "Khách hàng",
            value: formatNumber(customers),
            change: `${customersChange > 0 ? "+" : ""}${customersChange.toFixed(1)}%`,
            isPositive: customersChange >= 0,
            icon: Users,
            color: "text-green-600 dark:text-green-400",
            bgColor: "bg-green-100 dark:bg-green-900/30",
          },
          {
            label: "Voucher đã dùng",
            value: formatNumber(vouchers),
            change: `${vouchersChange > 0 ? "+" : ""}${vouchersChange.toFixed(1)}%`,
            isPositive: vouchersChange >= 0,
            icon: Ticket,
            color: "text-orange-600 dark:text-orange-400",
            bgColor: "bg-orange-100 dark:bg-orange-900/30",
          },
        ]);
      } else {
        setSummaryStats(FALLBACK_STATS);
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch summary:", summaryRes.status, summaryRes.statusText);
        }
      }

      // Process orders
      if (ordersRes.ok) {
        const ordersData = await parseResponse(ordersRes);
        const ordersList =
          ordersData?.data?.content ||
          ordersData?.data ||
          ordersData?.content ||
          ordersData?.result ||
          ordersData ||
          [];

        const formatted: RecentOrder[] = ordersList
          .slice(0, 5)
          .map((order: any) => ({
            id: order.orderNumber || order._id || order.id || `#ORD-${Date.now()}`,
            customer:
              order.customerFullName ||
              order.customerName ||
              order.customer?.fullName ||
              order.customer?.name ||
              "Khách hàng",
            date: formatDate(order.createdAt || order.createdDate || order.date || new Date()),
            total: new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(Number(order.amount || order.total || order.totalAmount || 0)),
            status: mapStatus(order.status || order.orderStatus || "pending"),
          }));
        setRecentOrders(formatted);
      } else {
        setRecentOrders([]);
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch orders:", ordersRes.status, ordersRes.statusText);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tải dữ liệu";
      setError(errorMessage);
      setSummaryStats(FALLBACK_STATS);
      setRecentOrders([]);
      
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching dashboard data:", err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [formatCurrency, formatNumber, formatDate, mapStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const handleExportReport = useCallback(async () => {
    try {
      const response = await fetch("/api/analytics/summary?range=30d", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        const summary = data?.data || data?.result || data;
        
        const csvRows = [
          ["Báo cáo Dashboard", new Date().toLocaleDateString("vi-VN")],
          [],
          ["Chỉ số", "Giá trị", "Thay đổi"],
          [
            "Tổng doanh thu",
            formatCurrency(extractData(summary, "totalRevenue", "monthRevenue", "revenue")),
            summary?.revenueChange ? `${summary.revenueChange > 0 ? "+" : ""}${summary.revenueChange.toFixed(1)}%` : "N/A",
          ],
          [
            "Đơn hàng mới",
            String(extractData(summary, "totalOrders", "newOrders", "orders")),
            summary?.ordersChange ? `${summary.ordersChange > 0 ? "+" : ""}${summary.ordersChange.toFixed(1)}%` : "N/A",
          ],
          [
            "Khách hàng",
            formatNumber(extractData(summary, "totalCustomers", "newCustomers", "customers")),
            summary?.customersChange ? `${summary.customersChange > 0 ? "+" : ""}${summary.customersChange.toFixed(1)}%` : "N/A",
          ],
        ];
        
        const csvContent = csvRows.map((row) => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `dashboard-report-${new Date().toISOString().split("T")[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Export error:", error);
      }
      alert("Không thể xuất báo cáo. Vui lòng thử lại.");
    }
  }, [formatCurrency, formatNumber]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 mt-25">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              Lỗi tải dữ liệu: {error}
            </p>
            <p className="text-xs mt-1">
              Vui lòng thử làm mới trang.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            Thử lại
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tổng quan</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Báo cáo hoạt động kinh doanh ngày hôm nay.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw
              size={16}
              className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Đang tải..." : "Làm mới"}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportReport}
            className="inline-flex items-center px-4 py-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download size={16} className="mr-2" /> Xuất báo cáo
          </Button>
          <Link href={`/${locale}/admin/orders/create`}>
            <Button className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus size={16} className="mr-2" /> Tạo đơn hàng
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, index) => (
          <StatCard
            key={`${stat.label}-${index}`}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            isPositive={stat.isPositive}
            icon={stat.icon}
            color={stat.color}
            bgColor={stat.bgColor}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders - Chiếm 2/3 */}
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md lg:col-span-2">
          <CardHeader className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-slate-900 dark:text-white">
                Đơn hàng gần đây
              </CardTitle>
              <Link
                href={`/${locale}/admin/orders`}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                Xem tất cả
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {recentOrders.length > 0 ? (
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Mã đơn
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Tổng tiền
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Edit</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {recentOrders.map((order) => (
                      <OrderRow key={order.id} order={order} />
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  <p>Chưa có đơn hàng nào</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PWA Status - Chiếm 1/3 */}
        <div className="lg:col-span-1">
          <PWAStatus />
        </div>
      </div>
    </div>
  );
}
