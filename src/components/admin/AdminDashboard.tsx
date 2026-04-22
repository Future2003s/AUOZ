"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  Suspense,
  useLayoutEffect,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Ticket,
  Settings,
  X,
  Home,
  Megaphone,
  FileText,
  Briefcase,
  Calendar,
  Package,
  BarChart3,
  ClipboardList,
  Scissors,
  Receipt,
  Bell,
  Camera,
  FileX,
  Truck,
  CreditCard,
  AlertCircle,
  UserCog,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import MenuItem from "./MenuItem";
import AdminHeader from "./AdminHeader";
import NavigationOptimizer from "./NavigationOptimizer";
import ClientContent from "./ClientContent";
import { UpdateBanner } from "@/components/pwa/UpdateBanner";
import { InstallPrompt } from "@/components/employee/InstallPrompt";
import { AdminPWAManifest } from "./AdminPWAManifest";

interface MenuSection {
  category: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href?: string;
}

const StatusBadge = memo(({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    "Hoàn thành": "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    "Đang xử lý": "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    "Vận chuyển": "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    "Đã hủy": "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        }`}
    >
      {status}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

interface AdminDashboardProps {
  children?: React.ReactNode;
  userName?: string;
  locale?: string;
}

export default function AdminDashboard({
  children,
  userName = "Admin User",
  locale = "vi",
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  // Determine active tab from pathname - use useMemo to avoid effect
  const computedActiveTab = useMemo(() => {
    if (!pathname) return "dashboard";
    const pathParts = pathname.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    return lastPart && lastPart !== "admin" ? lastPart : "dashboard";
  }, [pathname]);

  // Sync activeTab with computed value - use useLayoutEffect to sync before paint
  useLayoutEffect(() => {
    if (computedActiveTab !== activeTab) {
      setActiveTab(computedActiveTab);
    }
  }, [computedActiveTab, activeTab]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // Menu structure - memoized to prevent recreation on every render
  const SIDEBAR_MENU: MenuSection[] = useMemo(
    () => [
      {
        category: "Tổng quan",
        items: [
          {
            id: "dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
            href: `/${locale}/admin/dashboard`,
          },
        ],
      },
      {
        category: "Quản lý",
        items: [
          {
            id: "orders",
            label: "Đơn hàng",
            icon: ShoppingBag,
            href: `/${locale}/admin/orders`,
          },
          {
            id: "accounts",
            label: "Khách hàng",
            icon: Users,
            href: `/${locale}/admin/accounts`,
          },
          {
            id: "vouchers",
            label: "Mã giảm giá",
            icon: Ticket,
            href: `/${locale}/admin/vouchers`,
          },
          {
            id: "tasks",
            label: "Phân Công Công Việc Nhân Viên",
            icon: Briefcase,
            href: `/${locale}/admin/tasks`,
          },
        ],
      },
      {
        category: "Cấu hình giao diện (CMS)",
        items: [
          {
            id: "pastoral",
            label: "Khoảnh Khắc Đồng Quê",
            icon: ImageIcon,
            href: `/${locale}/admin/pastoral`,
          },
          {
            id: "cms",
            label: "CMS Dashboard",
            icon: LayoutDashboard,
            href: `/${locale}/admin/cms`,
          },
          {
            id: "homepage",
            label: "Trang chủ",
            icon: Home,
            href: `/${locale}/admin/homepage`,
          },
          {
            id: "advertisements",
            label: "Banners & Slider",
            icon: Megaphone,
            href: `/${locale}/admin/advertisements`,
          },
          {
            id: "story",
            label: "Chân trang",
            icon: FileText,
            href: `/${locale}/admin/story`,
          },
        ],
      },
      {
        category: "Quản lý Nhân viên",
        items: [
          {
            id: "employee-dashboard",
            label: "Dashboard Nhân viên",
            icon: LayoutDashboard,
            href: `/${locale}/employee`,
          },
          {
            id: "employee-orders",
            label: "Đơn hàng Nhân viên",
            icon: ShoppingBag,
            href: `/${locale}/employee/orders`,
          },
          {
            id: "employee-tasks",
            label: "Công việc Nhân viên",
            icon: ClipboardList,
            href: `/${locale}/employee/tasks`,
          },
          {
            id: "employee-inventory",
            label: "Kho Xuất Nhập Tồn",
            icon: Package,
            href: `/${locale}/employee/inventory`,
          },
          {
            id: "employee-shipping",
            label: "Gửi Hàng & Chụp Ảnh",
            icon: Camera,
            href: `/${locale}/employee/shipping`,
          },
          {
            id: "employee-debt",
            label: "Quản Lý Công Nợ",
            icon: Receipt,
            href: `/${locale}/employee/debt`,
          },
          {
            id: "employee-invoices",
            label: "Nhắc Nhở Hóa Đơn",
            icon: Bell,
            href: `/${locale}/employee/invoices`,
          },
          {
            id: "employee-flower-logs",
            label: "Sổ Cắt Hoa",
            icon: Scissors,
            href: `/${locale}/employee/flower-logs`,
          },
          {
            id: "employee-metrics",
            label: "Thống Kê Nhân viên",
            icon: BarChart3,
            href: `/${locale}/employee/metrics/incomplete-invoices`,
          },
          {
            id: "employee-settings",
            label: "Cài đặt Nhân viên",
            icon: UserCog,
            href: `/${locale}/employee/settings`,
          },
        ],
      },
      {
        category: "Hệ thống",
        items: [
          {
            id: "settings",
            label: "Cài đặt chung",
            icon: Settings,
            href: `/${locale}/admin/settings`,
          },
        ],
      },
    ],
    [locale]
  );

  const handleMenuClick = useCallback((id: string) => {
    setActiveTab(id);
    setIsSidebarOpen(false);
    // Navigation is handled by Link component with prefetch for better performance
  }, []);

  return (
    <div className="flex h-screen bg-[#f8f9fa] dark:bg-[#111] font-sans text-gray-900 transition-colors duration-200">
      <AdminPWAManifest />
      <NavigationOptimizer />
      {/* PWA Components */}
      <UpdateBanner />
      <InstallPrompt />
      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[260px] bg-white dark:bg-[#1f1f1f] border-r border-[#f1f3f4] dark:border-gray-800 transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 flex flex-col
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between h-[64px] px-6 border-b border-[#f1f3f4] dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#0b57d0] dark:bg-[#a8c7fa] rounded-[8px] flex items-center justify-center shadow-sm">
              <span className="text-white dark:text-[#041e49] font-bold text-lg">L</span>
            </div>
            <span className="text-[18px] font-bold tracking-tight text-gray-900 dark:text-gray-100">
              LALA-LYCHEEE
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
          {/* Quick Action: Back to Homepage */}
          <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <Link
              href={`/${locale}`}
              className="flex items-center px-4 py-[10px] my-[2px] text-[14px] font-[500] rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors group"
            >
              <Home
                size={20}
                className="mr-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
              />
              <span>Trang chủ cửa hàng</span>
            </Link>
          </div>

          {SIDEBAR_MENU.map((section, idx) => (
            <div key={idx} className="mb-4">
              <h3 className="px-4 mb-1 mt-2 text-[11px] font-[600] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {section.category}
              </h3>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <MenuItem
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    icon={item.icon}
                    href={item.href}
                    isActive={activeTab === item.id}
                    onClick={handleMenuClick}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      {/* Overlay cho Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER */}
        <AdminHeader
          locale={locale}
          userName={
            (user && "fullName" in user
              ? (user as { fullName?: string }).fullName
              : undefined) ||
            (user && "firstName" in user
              ? (user as { firstName?: string }).firstName
              : undefined) ||
            userName
          }
          onMenuToggle={toggleSidebar}
        />

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-[#f8f9fa] dark:bg-[#111]">
          <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Đang tải...</p>
                  </div>
                </div>
              }
            >
              <ClientContent>{children}</ClientContent>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

export { StatusBadge };
