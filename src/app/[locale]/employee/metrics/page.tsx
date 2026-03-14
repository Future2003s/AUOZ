"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  CheckCircle,
  Clock,
  TrendingUp,
  Package,
  Printer,
  Download,
  Calendar,
} from "lucide-react";

interface DailyMetric {
  date: string;
  processed: number;
  delivered: number;
}

interface EmployeeOrder {
  _id?: string;
  id?: string;
  createdAt?: string;
  status?: string;
  customerFullName?: string;
  customerName?: string;
  amount?: number;
  total?: number;
  totalAmount?: number;
  orderNumber?: string;
}

// Build daily processed stats from an orders list
function buildDailyMetrics(orders: EmployeeOrder[]): DailyMetric[] {
  const grouped: Record<string, { processed: number; delivered: number }> = {};
  const now = new Date();

  // Pre-fill last 14 days
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    grouped[key] = { processed: 0, delivered: 0 };
  }

  orders.forEach((order) => {
    if (!order.createdAt) return;
    const d = new Date(order.createdAt);
    const daysAgo = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (daysAgo > 13) return;
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    if (!grouped[key]) return;
    grouped[key].processed += 1;
    if (order.status === "delivered" || order.status === "completed") {
      grouped[key].delivered += 1;
    }
  });

  return Object.entries(grouped).map(([date, data]) => ({
    date,
    ...data,
  }));
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-sm">
      <p className="text-gray-500 mb-2 font-medium">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="font-semibold">
          {entry.dataKey === "processed" ? "Đã xử lý" : "Đã giao"}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function EmployeeMetricsPage() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "vi";

  const [orders, setOrders] = useState<EmployeeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/employee/orders?page=1&size=200", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: EmployeeOrder[] = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.data?.content)
        ? data.data.content
        : Array.isArray(data)
        ? data
        : [];
      setOrders(list);
    } catch (err: any) {
      setError(err?.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const dailyMetrics = useMemo(() => buildDailyMetrics(orders), [orders]);

  const totalProcessed = orders.length;
  const totalDelivered = orders.filter(
    (o) => o.status === "delivered" || o.status === "completed"
  ).length;
  const todayProcessed = useMemo(() => {
    const today = new Date();
    const key = `${today.getDate()}/${today.getMonth() + 1}`;
    return dailyMetrics.find((d) => d.date === key)?.processed ?? 0;
  }, [dailyMetrics]);

  const avgPerDay = dailyMetrics.length > 0
    ? (dailyMetrics.reduce((s, d) => s + d.processed, 0) / 14).toFixed(1)
    : "0";

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    const rows = [
      ["Ngày", "Đã xử lý", "Đã giao"],
      ...dailyMetrics.map((d) => [d.date, d.processed, d.delivered]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `employee-metrics-${new Date().toISOString().split("T")[0]}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] mt-25">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm">Đang tải dữ liệu hiệu suất...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] mt-25">
        <div className="text-center">
          <p className="text-red-600 mb-4">⚠️ {error}</p>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-25 p-4 md:p-6 print:mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Hiệu suất làm việc
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Thống kê đơn hàng xử lý trong 14 ngày gần nhất
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Printer className="h-4 w-4" />
            In báo cáo
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            Xuất CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Hôm nay", value: todayProcessed, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Trung bình/ngày", value: avgPerDay, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
          { label: "Tổng đã xử lý", value: totalProcessed, icon: Package, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "Đã giao hàng", value: totalDelivered, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-[#1f1f1f] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <div className={`inline-flex p-2 rounded-xl ${bg} mb-3`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Processed per day — Area */}
        <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-blue-500" />
            <h2 className="text-[15px] font-[500] text-gray-900 dark:text-gray-100">Đơn hàng xử lý theo ngày</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dailyMetrics} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="processedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="processed" stroke="#3b82f6" strokeWidth={2} fill="url(#processedGrad)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Delivered per day — Bar */}
        <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <h2 className="text-[15px] font-[500] text-gray-900 dark:text-gray-100">Đơn hàng đã giao theo ngày</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyMetrics} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="delivered" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
