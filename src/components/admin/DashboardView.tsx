"use client";
import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Ticket,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Plus,
  MoreVertical,
  RefreshCw,
  AlertCircle,
  Globe,
} from "lucide-react";
import { StatusBadge } from "./AdminDashboard";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import StatCard from "./StatCard";
import OrderRow from "./OrderRow";
import DashboardSkeleton from "./DashboardSkeleton";

interface SummaryStat {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

interface RecentOrder {
  id: string;
  customer: string;
  date: string;
  total: string;
  status: string;
}

export default function DashboardView() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "vi";
  const [orders, setOrders] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStat[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Helper functions - defined before useEffect
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

  // Fetch data function
  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch both summary and orders in parallel
      const [summaryRes, ordersRes] = await Promise.all([
        fetch("/api/analytics/summary?range=30d", {
          credentials: "include",
          cache: "no-store", // Always fetch fresh data
        }),
        fetch("/api/orders/admin/all?page=1&size=5", {
          credentials: "include",
          cache: "no-store", // Always fetch fresh data
        }),
      ]);

      // Process summary
      if (summaryRes.ok) {
        let summaryData;
        try {
          const text = await summaryRes.text();
          summaryData = text ? JSON.parse(text) : null;
        } catch (parseError) {
          if (process.env.NODE_ENV === "development") {
            console.error("Error parsing summary response:", parseError);
          }
          summaryData = null;
        }

        const summary = summaryData?.data || summaryData?.result || summaryData || {};

        // Normalize fields to match backend data keys
        const revenueRaw =
          summary?.totalRevenue ??
          summary?.monthRevenue ??
          summary?.revenue ??
          summary?.revenueTotal ??
          0;
        const revenueChangeRaw =
          summary?.revenueChange ??
          summary?.revenueGrowth ??
          summary?.revenueChangePercent ??
          0;

        const ordersRaw =
          summary?.totalOrders ??
          summary?.newOrders ??
          summary?.orders ??
          summary?.ordersTotal ??
          0;
        const ordersChangeRaw =
          summary?.ordersChange ??
          summary?.ordersGrowth ??
          summary?.ordersChangePercent ??
          0;

        const customersRaw =
          summary?.totalCustomers ??
          summary?.newCustomers ??
          summary?.customers ??
          summary?.customersTotal ??
          0;
        const customersChangeRaw =
          summary?.customersChange ??
          summary?.customersGrowth ??
          summary?.customersChangePercent ??
          0;

        const vouchersRaw =
          summary?.vouchersUsed ??
          summary?.usedVouchers ??
          summary?.totalVouchersUsed ??
          summary?.voucherUsage ??
          0;
        const vouchersChangeRaw =
          summary?.vouchersChange ??
          summary?.voucherUsageChange ??
          summary?.voucherChangePercent ??
          0;

        const revenueChange = Number(revenueChangeRaw) || 0;
        const ordersChange = Number(ordersChangeRaw) || 0;
        const customersChange = Number(customersChangeRaw) || 0;
        const vouchersChange = Number(vouchersChangeRaw) || 0;

        const stats: SummaryStat[] = [
          {
            label: "Tổng doanh thu",
            value: formatCurrency(Number(revenueRaw) || 0),
            change: `${revenueChange > 0 ? "+" : ""}${revenueChange.toFixed(1)}%`,
            isPositive: revenueChange >= 0,
            icon: ShoppingBag,
          },
          {
            label: "Đơn hàng mới",
            value: String(Number(ordersRaw) || 0),
            change: `${ordersChange > 0 ? "+" : ""}${ordersChange.toFixed(1)}%`,
            isPositive: ordersChange >= 0,
            icon: Ticket,
          },
          {
            label: "Khách hàng",
            value: formatNumber(Number(customersRaw) || 0),
            change: `${customersChange > 0 ? "+" : ""}${customersChange.toFixed(1)}%`,
            isPositive: customersChange >= 0,
            icon: Users,
          },
          {
            label: "Voucher đã dùng",
            value: formatNumber(Number(vouchersRaw) || 0),
            change: `${vouchersChange > 0 ? "+" : ""}${vouchersChange.toFixed(1)}%`,
            isPositive: vouchersChange >= 0,
            icon: Ticket,
          },
        ];

        setSummaryStats(stats);
      } else {
        // If API fails, try to get error message
        const status = summaryRes?.status ?? 0;
        const statusText = summaryRes?.statusText ?? "Unknown";
        const url = summaryRes?.url ?? "Unknown URL";
        
        // Initialize errorData with base information - use Object.assign to ensure properties are set
        const errorData: any = {};
        errorData.message = `HTTP ${status}: ${statusText}`;
        errorData.status = status;
        errorData.statusText = statusText;
        errorData.url = url;
        
        try {
          // Try to read error response body
          let errorText: string = "";
          try {
            errorText = await summaryRes.text();
          } catch (textError) {
            // If text() fails, note it but don't throw
            errorData.textReadError = textError instanceof Error ? textError.message : String(textError);
          }
          
          if (errorText && errorText.trim()) {
            try {
              const parsed = JSON.parse(errorText);
              // Merge parsed data, but preserve base properties
              Object.assign(errorData, parsed);
              errorData.rawResponse = errorText.substring(0, 500);
            } catch (parseError) {
              // If JSON parse fails, use raw text as message
              errorData.rawResponse = errorText.substring(0, 500);
              errorData.parseError = parseError instanceof Error ? parseError.message : String(parseError);
              if (errorText.length > 0) {
                errorData.message = errorText.substring(0, 200) || errorData.message;
              }
            }
          } else {
            errorData.emptyResponse = true;
          }
        } catch (readError) {
          // Ensure we preserve base properties even on error
          errorData.readError = readError instanceof Error ? readError.message : String(readError);
          errorData.readErrorStack = readError instanceof Error ? readError.stack : undefined;
          if (!errorData.message) {
            errorData.message = `Failed to read error response: ${errorData.readError}`;
          }
        }
        
        // Verify errorData has content before logging
        if (process.env.NODE_ENV === "development") {
          console.error("Analytics API error:");
          console.error("  Status:", status);
          console.error("  Status Text:", statusText);
          console.error("  URL:", url);
          console.error("  Error Data Keys:", Object.keys(errorData));
          console.error("  Error Data:", errorData);
          console.error("  Error Data JSON:", JSON.stringify(errorData, null, 2));
          if (Object.keys(errorData).length === 0) {
            console.error("  WARNING: Error data object is empty!");
            console.error("  Original response:", summaryRes);
          }
        }
        
        // Set fallback stats
        setSummaryStats([
              {
                label: "Tổng doanh thu",
                value: "2.4 Tỷ",
                change: "+12.5%",
                isPositive: true,
                icon: ShoppingBag,
              },
              {
                label: "Đơn hàng mới",
                value: "142",
                change: "+8.2%",
                isPositive: true,
                icon: Ticket,
              },
              {
                label: "Khách hàng",
                value: "8,549",
                change: "-1.4%",
                isPositive: false,
                icon: Users,
              },
              {
                label: "Voucher đã dùng",
                value: "1,203",
                change: "+24%",
                isPositive: true,
                icon: Ticket,
            },
          ]);
      }

      // Process orders
      if (ordersRes.ok) {
        let ordersData;
        try {
          const text = await ordersRes.text();
          ordersData = text ? JSON.parse(text) : null;
        } catch (parseError) {
          if (process.env.NODE_ENV === "development") {
            console.error("Error parsing orders response:", parseError);
          }
          ordersData = null;
        }
        
        const ordersList =
          ordersData?.data?.content ||
          ordersData?.data ||
          ordersData?.content ||
          ordersData?.result ||
          ordersData ||
          [];

        setOrders(ordersList);

        const formatted: RecentOrder[] = ordersList
          .slice(0, 5)
          .map((order: any) => ({
            id:
              order.orderNumber ||
              order._id ||
              order.id ||
              `#ORD-${Date.now()}`,
            customer:
              order.customerFullName ||
              order.customerName ||
              order.customer?.fullName ||
              order.customer?.name ||
              "Khách hàng",
            date: formatDate(
              order.createdAt || order.createdDate || order.date || new Date()
            ),
            total: new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(Number(order.amount || order.total || order.totalAmount || 0)),
            status: mapStatus(order.status || order.orderStatus || "pending"),
          }));
        setRecentOrders(formatted);
      } else {
        // If orders API fails
        const status = ordersRes?.status ?? 0;
        const statusText = ordersRes?.statusText ?? "Unknown";
        const url = ordersRes?.url ?? "Unknown URL";
        
        // Initialize errorData with base information - use direct assignment to ensure properties are set
        const errorData: any = {};
        errorData.message = `HTTP ${status}: ${statusText}`;
        errorData.status = status;
        errorData.statusText = statusText;
        errorData.url = url;
        
        try {
          // Try to read error response body
          let errorText: string = "";
          try {
            errorText = await ordersRes.text();
          } catch (textError) {
            // If text() fails, note it but don't throw
            errorData.textReadError = textError instanceof Error ? textError.message : String(textError);
          }
          
          if (errorText && errorText.trim()) {
            try {
              const parsed = JSON.parse(errorText);
              // Merge parsed data, but preserve base properties
              Object.assign(errorData, parsed);
              errorData.rawResponse = errorText.substring(0, 500);
            } catch (parseError) {
              // If JSON parse fails, use raw text as message
              errorData.rawResponse = errorText.substring(0, 500);
              errorData.parseError = parseError instanceof Error ? parseError.message : String(parseError);
              if (errorText.length > 0) {
                errorData.message = errorText.substring(0, 200) || errorData.message;
              }
            }
          } else {
            errorData.emptyResponse = true;
          }
        } catch (readError) {
          // Ensure we preserve base properties even on error
          errorData.readError = readError instanceof Error ? readError.message : String(readError);
          errorData.readErrorStack = readError instanceof Error ? readError.stack : undefined;
          if (!errorData.message) {
            errorData.message = `Failed to read error response: ${errorData.readError}`;
          }
        }

        // Verify errorData has content before logging
        if (process.env.NODE_ENV === "development") {
          console.error("Orders API error:");
          console.error("  Status:", status);
          console.error("  Status Text:", statusText);
          console.error("  URL:", url);
          console.error("  Error Data Keys:", Object.keys(errorData));
          console.error("  Error Data:", errorData);
          console.error("  Error Data JSON:", JSON.stringify(errorData, null, 2));
          if (Object.keys(errorData).length === 0) {
            console.error("  WARNING: Error data object is empty!");
            console.error("  Original response:", ordersRes);
          }
        }

        // Set fallback orders
        setRecentOrders([
          {
            id: "#ORD-7782",
            customer: "Nguyễn Văn A",
            date: "06/12/2025",
            total: "1.200.000đ",
            status: "Hoàn thành",
          },
          {
            id: "#ORD-7783",
            customer: "Trần Thị B",
            date: "06/12/2025",
            total: "850.000đ",
            status: "Đang xử lý",
          },
          {
            id: "#ORD-7784",
            customer: "Lê Hoàng C",
            date: "05/12/2025",
            total: "2.400.000đ",
            status: "Đã hủy",
          },
          {
            id: "#ORD-7785",
            customer: "Phạm Minh D",
            date: "05/12/2025",
            total: "500.000đ",
            status: "Hoàn thành",
          },
          {
            id: "#ORD-7786",
            customer: "Vũ Thị E",
            date: "04/12/2025",
            total: "3.150.000đ",
            status: "Vận chuyển",
          },
        ]);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Không thể tải dữ liệu";
      setError(errorMessage);

      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching dashboard data:", error);
      }

      // Set fallback data
      setSummaryStats([
            {
              label: "Tổng doanh thu",
              value: "2.4 Tỷ",
              change: "+12.5%",
              isPositive: true,
              icon: ShoppingBag,
            },
            {
              label: "Đơn hàng mới",
              value: "142",
              change: "+8.2%",
              isPositive: true,
              icon: Ticket,
            },
            {
              label: "Khách hàng",
              value: "8,549",
              change: "-1.4%",
              isPositive: false,
              icon: Users,
            },
            {
              label: "Voucher đã dùng",
              value: "1,203",
              change: "+24%",
              isPositive: true,
              icon: Ticket,
            },
          ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [formatCurrency, formatNumber, formatDate, mapStatus]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Export report handler
  const handleExportReport = useCallback(async () => {
    try {
      const response = await fetch("/api/analytics/summary?range=30d", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // Convert to CSV or Excel format
        const csvContent = convertToCSV(data);
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
  }, []);

  // Convert data to CSV
  const convertToCSV = (data: any): string => {
    const summary = data?.data || data?.result || data;
    const rows = [
      ["Báo cáo Dashboard", new Date().toLocaleDateString("vi-VN")],
      [],
      ["Chỉ số", "Giá trị", "Thay đổi"],
      [
        "Tổng doanh thu",
        formatCurrency(summary?.monthRevenue || summary?.totalRevenue || 0),
        summary?.revenueChange
          ? `${summary.revenueChange > 0 ? "+" : ""}${summary.revenueChange.toFixed(1)}%`
          : "N/A",
      ],
      [
        "Đơn hàng mới",
        String(summary?.totalOrders || summary?.newOrders || 0),
        summary?.ordersChange
          ? `${summary.ordersChange > 0 ? "+" : ""}${summary.ordersChange.toFixed(1)}%`
          : "N/A",
      ],
      [
        "Khách hàng",
        formatNumber(summary?.totalCustomers || 0),
        summary?.customersChange
          ? `${summary.customersChange > 0 ? "+" : ""}${summary.customersChange.toFixed(1)}%`
          : "N/A",
      ],
    ];
    return rows.map((row) => row.join(",")).join("\n");
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Lỗi tải dữ liệu: {error}
            </p>
            <p className="text-xs text-red-600 mt-1">
              Đang hiển thị dữ liệu mẫu. Vui lòng thử làm mới trang.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-red-700 border-red-300 hover:bg-red-100"
          >
            Thử lại
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
          <p className="mt-1 text-sm text-gray-500">
            Báo cáo hoạt động kinh doanh ngày hôm nay.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
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
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download size={16} className="mr-2" /> Xuất báo cáo
          </Button>
          <Link href={`/${locale}/admin/orders/create`}>
            <Button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              <Plus size={16} className="mr-2" /> Tạo đơn hàng
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {summaryStats.map((stat, index) => (
          <StatCard
            key={`${stat.label}-${index}`}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            isPositive={stat.isPositive}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders - Chiếm 2/3 */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 lg:col-span-2">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Đơn hàng gần đây
            </h3>
            <Link
              href={`/${locale}/admin/orders`}
              className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Mini CMS Status - Chiếm 1/3 */}
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Trạng thái hệ thống
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Website Frontend</span>
                </div>
                <span className="text-sm font-medium text-green-600">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Database</span>
                </div>
                <span className="text-sm font-medium text-green-600">Tốt</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Bộ nhớ đệm (Cache)</span>
                </div>
                <button className="text-xs text-indigo-600 hover:underline">
                  Xóa cache
                </button>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-bold mb-2">Chỉnh sửa giao diện</h3>
            <p className="text-indigo-100 text-sm mb-4">
              Cập nhật banner Tết Nguyên Đán cho trang chủ ngay.
            </p>
            <Link
              href={`/${locale}/admin/homepage`}
              className="block w-full py-2 bg-white text-indigo-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-center"
            >
              Đến trang cấu hình
            </Link>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center mb-2">
              <Globe className="w-5 h-5 mr-2" />
              <h3 className="text-lg font-bold">Quản lý Đa ngôn ngữ</h3>
            </div>
            <p className="text-green-100 text-sm mb-4">
              Quản lý và chỉnh sửa translations cho website. Hỗ trợ V1 và V2.
            </p>
            <Link
              href={`/${locale}/admin/translations`}
              className="block w-full py-2 bg-white text-green-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-center"
            >
              Mở Quản lý Translations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

