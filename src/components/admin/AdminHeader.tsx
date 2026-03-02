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

  // Focus trap and styling
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#111]/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800 transition-colors">
      <div className="h-[64px] flex items-center justify-between px-4 sm:px-6">

        {/* Left Section: Mobile Menu Toggle */}
        <div className="flex items-center">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors mr-2 focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Center Section: Google-style Search Palette */}
        <div className={`flex-1 max-w-[720px] mx-4 hidden md:flex items-center transition-all duration-300 ${isSearchFocused ? 'shadow-md rounded-full bg-white dark:bg-[#222]' : 'bg-[#f1f3f4] dark:bg-[#202124] rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/80 hover:shadow-sm'}`}>
          <div className="pl-4 pr-2 text-gray-500">
            <Search size={20} />
          </div>
          <div
            className="flex-1"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          >
            {/* Wrapper around generic SearchInput to inherit styles */}
            <div className="[&>div>input]:bg-transparent [&>div>input]:border-none [&>div>input]:shadow-none [&>div>input]:focus:ring-0 [&>div>input]:h-12 [&>div>input]:text-[15px] [&>div>svg]:hidden">
              <SearchInput />
            </div>
          </div>
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center space-x-1 sm:space-x-2">

          {/* Mobile Search Icon */}
          <button
            className="md:hidden p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors focus:outline-none"
            aria-label="Search"
          >
            <Search size={22} />
          </button>

          {/* Home Action */}
          <Link
            href={`/${locale}`}
            className="hidden sm:flex p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
            title="Quay lại trang chủ"
          >
            <Home size={22} />
          </Link>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
              aria-label="Notifications"
            >
              <Bell size={22} />
              <span className="absolute top-[8px] right-[8px] block h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-white dark:border-[#111]"></span>
            </button>

            {/* Notifications Dropdown (Glassmorphism) */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white/95 dark:bg-[#1f1f1f]/95 backdrop-blur-xl rounded-[24px] shadow-lg border border-gray-100 dark:border-gray-800 py-3 z-50 transform origin-top-right transition-all animate-in zoom-in-95">
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800/50 flex justify-between items-center">
                  <h3 className="text-[15px] font-[500] text-gray-900 dark:text-gray-100">
                    Thông báo
                  </h3>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-[360px] overflow-y-auto overflow-x-hidden">
                  <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                      <Bell className="text-gray-300 dark:text-gray-600" size={28} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Bạn đã xem hết thông báo</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Component */}
          <div className="relative ml-2" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
            >
              <div className="h-9 w-9 rounded-full bg-[#0b57d0] dark:bg-[#a8c7fa] flex items-center justify-center text-white dark:text-[#041e49] font-[500] text-[15px] shadow-sm">
                {userInitial}
              </div>
            </button>

            {/* Profile Dropdown (Google Cloud / Google Account style) */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white/95 dark:bg-[#1f1f1f]/95 backdrop-blur-xl rounded-[24px] shadow-lg border border-gray-100 dark:border-gray-800 p-2 z-50 transform origin-top-right transition-all animate-in zoom-in-95">

                {/* Profile Card Header */}
                <div className="flex flex-col items-center p-6 bg-gray-50/50 dark:bg-gray-800/30 rounded-[18px] mb-2">
                  <div className="h-16 w-16 rounded-full bg-[#0b57d0] dark:bg-[#a8c7fa] flex items-center justify-center text-white dark:text-[#041e49] font-[400] text-[28px] shadow-md mb-3">
                    {userInitial}
                  </div>
                  <h3 className="text-[15px] font-[500] text-gray-900 dark:text-gray-100 truncate w-full text-center">
                    {displayName}
                  </h3>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate w-full text-center">
                    {user?.email || "admin@example.com"}
                  </p>
                  <p className="mt-2 text-[11px] font-[500] text-[#0b57d0] dark:text-[#a8c7fa] bg-[#d3e3fd]/50 dark:bg-[#004a77]/50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Quản trị viên
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/${locale}/me`}
                    className="flex items-center px-4 py-[10px] text-[14px] font-[500] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User size={18} className="mr-3 text-gray-400 dark:text-gray-500" />
                    Quản lý tài khoản
                  </Link>
                  <Link
                    href={`/${locale}/admin/settings`}
                    className="flex items-center px-4 py-[10px] text-[14px] font-[500] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings size={18} className="mr-3 text-gray-400 dark:text-gray-500" />
                    Cài đặt hệ thống
                  </Link>

                  <div className="h-[1px] bg-gray-100 dark:bg-gray-800 my-1 mx-2" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-[10px] text-[14px] font-[500] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <LogOut size={18} className="mr-3 text-gray-400 dark:text-gray-500" />
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
