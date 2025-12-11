"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
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
  Menu,
  X,
  LogOut,
  Receipt,
  Bell,
  Camera,
  History,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const navItems = [
  {
    id: "dashboard",
    label: "Tổng Quan",
    icon: LayoutDashboard,
    href: "/employee",
  },
  {
    id: "tasks",
    label: "Lịch Phân Công",
    icon: ClipboardList,
    href: "/employee/tasks",
  },
  {
    id: "orders",
    label: "Đơn Hàng",
    icon: ShoppingBag,
    href: "/employee/orders",
  },
  {
    id: "products",
    label: "Sản Phẩm",
    icon: Package,
    href: "/employee/products",
  },
  {
    id: "customers",
    label: "Khách Hàng",
    icon: Users,
    href: "/employee/customers",
  },
  {
    id: "flower-logs",
    label: "Sổ Cắt Hoa",
    icon: Scissors,
    href: "/employee/flower-logs",
  },
  {
    id: "debt",
    label: "Quản Lý Công Nợ",
    icon: Receipt,
    href: "/employee/debt",
  },
  {
    id: "invoices",
    label: "Nhắc Nhở Hóa Đơn",
    icon: Bell,
    href: "/employee/invoices",
  },
  {
    id: "shipping",
    label: "Gửi Hàng & Chụp Ảnh",
    icon: Camera,
    href: "/employee/shipping",
  },
  {
    id: "invoice-history",
    label: "Lịch Sử Hóa Đơn",
    icon: History,
    href: "/employee/invoice-history",
  },
  {
    id: "reports",
    label: "Báo Cáo",
    icon: BarChart3,
    href: "/employee/reports",
  },
  {
    id: "documents",
    label: "Tài Liệu",
    icon: FileText,
    href: "/employee/documents",
  },
  {
    id: "profile",
    label: "Hồ Sơ Nhân Viên",
    icon: User,
    href: "/employee/profile",
  },
  {
    id: "settings",
    label: "Cài Đặt",
    icon: Settings,
    href: "/employee/settings",
  },
];

export function EmployeeMobileNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const { user, logout } = useAuth();
  const router = useRouter();

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`;
    if (href === "/employee") {
      return pathname === fullPath || pathname === `/${locale}/employee`;
    }
    return pathname?.startsWith(fullPath);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Đã đăng xuất", {
        position: "top-center",
      });
      router.push(`/${locale}/login`);
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Đăng xuất thất bại", {
        position: "top-center",
      });
    }
  };

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email?.split("@")[0] || "Nhân viên";

  const userInitial = user?.firstName?.[0]?.toUpperCase() || 
                     user?.lastName?.[0]?.toUpperCase() || 
                     user?.email?.[0]?.toUpperCase() || 
                     "N";

  return (
    <>
      {/* Mobile Navbar Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(true)}
            className="h-10 w-10"
          >
            <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Button>

          {/* User Info & Theme Toggle */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-semibold text-sm">
                {userInitial}
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {userName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Nhân viên
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Side Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Side Menu */}
          <aside className="absolute left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 shadow-xl flex flex-col">
            {/* Menu Header */}
            <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-lg">
                  L
                </div>
                <div>
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
                onClick={() => setIsMenuOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>


            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.id}
                    href={`/${locale}${item.href}`}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 py-3 px-4 mx-2 my-1 rounded-lg transition-colors ${
                      active
                        ? "bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 text-pink-700 dark:text-pink-400 font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon
                      size={20}
                      className={
                        active
                          ? "text-pink-600 dark:text-pink-400"
                          : "text-gray-500 dark:text-gray-400"
                      }
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 dark:border-gray-800 p-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 py-2.5 px-4 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={20} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="lg:hidden h-16" />
    </>
  );
}

