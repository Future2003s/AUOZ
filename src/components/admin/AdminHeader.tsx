"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Menu,
  Home,
  Search,
  LogOut,
  User,
  Settings,
  ChevronDown,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SearchInput from "./SearchInput";

interface AdminHeaderProps {
  locale: string;
  userName?: string;
  onMenuToggle: () => void;
}

export default function AdminHeader({
  locale,
  userName = "Admin",
  onMenuToggle,
}: AdminHeaderProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Get page title from pathname
  const getPageTitle = useCallback(() => {
    const path = pathname || "";
    const segments = path.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    
    const titleMap: Record<string, string> = {
      dashboard: "Tổng quan",
      orders: "Đơn hàng",
      accounts: "Khách hàng",
      vouchers: "Mã giảm giá",
      tasks: "Công việc",
      homepage: "Trang chủ",
      advertisements: "Banners & Slider",
      story: "Chân trang",
      settings: "Cài đặt",
      products: "Sản phẩm",
      categories: "Danh mục",
      brands: "Thương hiệu",
      analytics: "Thống kê",
      translations: "Đa ngôn ngữ",
      activities: "Hoạt động",
      complaints: "Khiếu nại",
    };

    return titleMap[lastSegment] || "Dashboard";
  }, [pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = useCallback(() => {
    // Add logout logic here
    router.push(`/${locale}/login`);
  }, [router, locale]);

  const displayName =
    (user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user?.firstName || user?.lastName) || userName;
  const userInitial =
    user?.firstName?.[0]?.toUpperCase() ||
    user?.lastName?.[0]?.toUpperCase() ||
    userName?.[0]?.toUpperCase() ||
    "A";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center flex-1 min-w-0">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors mr-2"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>

          {/* Page Title */}
          <div className="hidden sm:block ml-2">
            <h1 className="text-lg font-semibold text-gray-900">
              {getPageTitle()}
            </h1>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block ml-8 flex-1 max-w-md">
            <SearchInput />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search Button - Mobile */}
          <button
            className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Search"
          >
            <Search size={20} />
          </button>

          {/* Home Button */}
          <Link
            href={`/${locale}`}
            className="hidden sm:flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
            title="Quay lại trang chủ"
          >
            <Home size={18} />
            <span className="hidden lg:inline">Trang chủ</span>
          </Link>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Thông báo
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    Không có thông báo mới
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm group-hover:shadow-md transition-shadow">
                {userInitial}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500">Quản trị viên</p>
              </div>
              <ChevronDown
                size={16}
                className={`hidden sm:block text-gray-400 transition-transform ${
                  showUserMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || "admin@example.com"}
                  </p>
                </div>
                <div className="py-1">
                  <Link
                    href={`/${locale}/me`}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User size={16} className="mr-3 text-gray-400" />
                    Hồ sơ của tôi
                  </Link>
                  <Link
                    href={`/${locale}/admin/settings`}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings size={16} className="mr-3 text-gray-400" />
                    Cài đặt
                  </Link>
                  <Link
                    href={`/${locale}`}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Home size={16} className="mr-3 text-gray-400" />
                    Về trang chủ
                  </Link>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} className="mr-3" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

