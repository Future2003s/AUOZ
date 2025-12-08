"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useParams } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Settings,
  ClipboardList,
  FileText,
  BarChart3,
  Scissors,
  X,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    id: "dashboard",
    label: "Tổng Quan",
    icon: <LayoutDashboard size={18} />,
    href: "/employee",
  },
  {
    id: "tasks",
    label: "Lịch Phân Công",
    icon: <ClipboardList size={18} />,
    href: "/employee/tasks",
  },
  {
    id: "orders",
    label: "Đơn Hàng",
    icon: <ShoppingBag size={18} />,
    href: "/employee/orders",
  },
  {
    id: "products",
    label: "Sản Phẩm",
    icon: <Package size={18} />,
    href: "/employee/products",
  },
  {
    id: "customers",
    label: "Khách Hàng",
    icon: <Users size={18} />,
    href: "/employee/customers",
  },
  {
    id: "flower-logs",
    label: "Sổ Cắt Hoa",
    icon: <Scissors size={18} />,
    href: "/employee/flower-logs",
  },
  {
    id: "reports",
    label: "Báo Cáo",
    icon: <BarChart3 size={18} />,
    href: "/employee/reports",
  },
  {
    id: "documents",
    label: "Tài Liệu",
    icon: <FileText size={18} />,
    href: "/employee/documents",
  },
  {
    id: "settings",
    label: "Cài Đặt",
    icon: <Settings size={18} />,
    href: "/employee/settings",
  },
];

export function EmployeeSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const { isOpen, close } = useSidebar();

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`;
    if (href === "/employee") {
      return pathname === fullPath || pathname === `/${locale}/employee`;
    }
    return pathname?.startsWith(fullPath);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm z-20 flex-col">
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 flex-shrink-0">
          <div className="h-9 w-9 rounded-md bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center font-bold text-lg">
            L
          </div>
          <div className="ml-3">
            <div className="font-bold text-gray-900 dark:text-white">
              LALA-LYCHEE
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Nhân viên
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={`/${locale}${item.href}`}
                className={`flex items-center gap-3 py-3 px-6 mx-2 my-1 rounded-lg transition-colors ${
                  active
                    ? "bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 text-pink-700 dark:text-pink-400 font-medium border-l-4 border-pink-600 dark:border-pink-500"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <span
                  className={
                    active
                      ? "text-pink-600 dark:text-pink-400"
                      : "text-gray-500 dark:text-gray-400"
                  }
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={close}
          ></div>
          <aside className="relative z-10 w-64 h-full bg-white dark:bg-gray-900 shadow-xl flex flex-col">
            <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-md bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center font-bold text-lg">
                  L
                </div>
                <div className="ml-3">
                  <div className="font-bold text-gray-900 dark:text-white">
                    LALA-LYCHEE
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Nhân viên
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={close}
                className="h-8 w-8"
              >
                <X size={18} />
              </Button>
            </div>
            <nav className="flex-1 py-4 overflow-y-auto">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.id}
                    href={`/${locale}${item.href}`}
                    onClick={close}
                    className={`flex items-center gap-3 py-3 px-4 mx-2 my-1 rounded-lg transition-colors ${
                      active
                        ? "bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 text-pink-700 dark:text-pink-400 font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span
                      className={
                        active
                          ? "text-pink-600 dark:text-pink-400"
                          : "text-gray-500 dark:text-gray-400"
                      }
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

