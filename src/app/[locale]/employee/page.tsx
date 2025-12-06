"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Calendar,
  Package,
  FileText,
  BarChart3,
  Users,
  ShoppingBag,
  CheckCircle2,
  Clock,
  TrendingUp,
  Settings,
  ArrowRight,
  ClipboardList,
} from "lucide-react";

interface TaskCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  bgColor: string;
  badge?: string;
  badgeColor?: string;
}

const taskCards: TaskCard[] = [
  {
    id: "calendar",
    title: "Lịch Phân Công",
    description: "Quản lý và theo dõi công việc theo lịch",
    icon: Calendar,
    href: "/employee/tasks",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    badge: "Mới",
    badgeColor: "bg-indigo-500",
  },
  {
    id: "orders",
    title: "Quản Lý Đơn Hàng",
    description: "Xử lý và theo dõi đơn hàng",
    icon: ShoppingBag,
    href: "/employee/orders",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    id: "products",
    title: "Quản Lý Sản Phẩm",
    description: "Thêm, sửa, xóa sản phẩm",
    icon: Package,
    href: "/employee/products",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    id: "reports",
    title: "Báo Cáo & Thống Kê",
    description: "Xem báo cáo doanh thu và hiệu suất",
    icon: BarChart3,
    href: "/employee/reports",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    id: "customers",
    title: "Quản Lý Khách Hàng",
    description: "Xem thông tin và lịch sử khách hàng",
    icon: Users,
    href: "/employee/customers",
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
  },
  {
    id: "documents",
    title: "Tài Liệu & Hướng Dẫn",
    description: "Truy cập tài liệu và hướng dẫn làm việc",
    icon: FileText,
    href: "/employee/documents",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
];

const stats = [
  {
    label: "Đơn hàng hôm nay",
    value: "24",
    icon: ShoppingBag,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    change: "+12%",
    changeColor: "text-green-600 dark:text-green-400",
  },
  {
    label: "Công việc đang làm",
    value: "8",
    icon: ClipboardList,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    change: "+3",
    changeColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    label: "Hoàn thành hôm nay",
    value: "16",
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    change: "+8%",
    changeColor: "text-green-600 dark:text-green-400",
  },
  {
    label: "Đang chờ xử lý",
    value: "5",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    change: "-2",
    changeColor: "text-red-600 dark:text-red-400",
  },
];

export default function EmployeeDashboard() {
  const router = useRouter();

  const handleTaskClick = (href: string) => {
    // Extract locale from current path
    const currentPath = window.location.pathname;
    const locale = currentPath.split("/")[1] || "vi";
    router.push(`/${locale}${href}`);
  };

  return (
    <div className="space-y-6 mt-25">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Dashboard Nhân Viên
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Quản lý công việc và nhiệm vụ hàng ngày
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Badge variant="outline" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-slate-300">
            <Clock className="w-3 h-3 mr-1" />
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div
                    className={`text-sm font-semibold flex items-center gap-1 ${stat.changeColor}`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Task Cards Grid */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Các Nhiệm Vụ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {taskCards.map((task) => {
            const Icon = task.icon;
            return (
              <Card
                key={task.id}
                className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
                onClick={() => handleTaskClick(task.href)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl ${task.bgColor} group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${task.color}`} />
                    </div>
                    {task.badge && (
                      <Badge
                        className={`${task.badgeColor} text-white text-xs`}
                      >
                        {task.badge}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-slate-900 dark:text-white">
                    {task.title}
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {task.description}
                  </p>
                  <div className="flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
                    <span>Xem chi tiết</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border border-slate-200 dark:border-slate-700 shadow-lg bg-gradient-to-r from-indigo-600 to-blue-700 dark:from-indigo-700 dark:to-blue-800 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Cần hỗ trợ?
              </h3>
              <p className="text-indigo-100 dark:text-indigo-200">
                Liên hệ với quản lý hoặc xem tài liệu hướng dẫn
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleTaskClick("/employee/documents")}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Tài liệu
              </button>
              <button
                onClick={() => handleTaskClick("/employee/settings")}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Cài đặt
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

