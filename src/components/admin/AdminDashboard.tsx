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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import MenuItem from "./MenuItem";
import AdminHeader from "./AdminHeader";
import NavigationOptimizer from "./NavigationOptimizer";
import ClientContent from "./ClientContent";

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
    "Hoàn thành": "bg-green-100 text-green-700",
    "Đang xử lý": "bg-blue-100 text-blue-700",
    "Vận chuyển": "bg-yellow-100 text-yellow-700",
    "Đã hủy": "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-700"
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
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <NavigationOptimizer />
      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
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
        <div className="p-4 overflow-y-auto h-[calc(100vh-4rem)]">
          {/* Quick Action: Back to Homepage */}
          <div className="mb-4 pb-4 border-b border-gray-100">
            <Link
              href={`/${locale}`}
              className="flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors group"
            >
              <Home
                size={18}
                className="mr-3 text-gray-400 group-hover:text-indigo-600"
              />
              <span>Quay lại trang chủ</span>
            </Link>
          </div>

          {SIDEBAR_MENU.map((section, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.category}
              </h3>
              <ul className="space-y-1">
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
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
