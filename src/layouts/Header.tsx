"use client";
import { envConfig } from "@/config";
import Link from "next/link";
import Image from "next/image";
import { useAppContextProvider } from "@/context/app-context";
import { useCart } from "@/context/cart-context";
import { useCartSidebar } from "@/context/cart-sidebar-context";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { ThemeToggle } from "@/components/ui/theme-toggle";
const LanguageSwitcher = dynamic(
  () => import("@/components/LanguageSwitcher"),
  { ssr: false }
);
import ProductsMegaMenu from "@/components/ProductsMegaMenu";
import type { ComponentType } from "react";
const MobileNavSheet = dynamic(() => import("./MobileNav"), {
  ssr: false,
}) as unknown as ComponentType<{
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  isEmployee?: boolean;
  navLinks: ReturnType<typeof getNavLinks>;
}>;
import { useI18n } from "@/i18n/I18nProvider";
import useTranslations from "@/i18n/useTranslations";
import { useAuth } from "@/hooks/useAuth";
import accountApiRequest from "@/apiRequests/account";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { categoryApiRequest, Category } from "@/apiRequests/categories";
import { Monitor } from "lucide-react";

// Navigation links will be translated in component
const getNavLinks = (
  t: (key: string) => string,
  locale: string,
  categories: Category[] = []
) => {
  // Build product subItems from categories
  const productSubItems: Array<{
    href: string;
    label: string;
    query?: string;
    categoryId?: string;
    categorySlug?: string;
  }> = [{ href: `/${locale}/products`, label: t("nav.all_products") }];

  // Add categories as menu items (limit to top-level active categories)
  // Filter out categories that don't have products (like "Nước Ép")
  const activeCategories = categories
    .filter((cat) => {
      // Bỏ category "Nước Ép" vì chưa có sản phẩm
      const categoryNameLower = cat.name?.toLowerCase() || "";
      if (
        categoryNameLower.includes("nước ép") ||
        categoryNameLower.includes("nuoc ep")
      ) {
        return false;
      }
      return cat.isActive && (!cat.parent || typeof cat.parent === "string");
    })
    .slice(0, 8) // Limit to 8 categories to avoid menu being too long
    .map((category) => ({
      href: `/${locale}/products?category=${category.slug}`,
      label: category.name,
      query: category.name,
      categoryId: category._id,
      categorySlug: category.slug,
    }));

  productSubItems.push(...activeCategories);

  if (process.env.NODE_ENV === "development") {
    console.log("📋 Product menu items:", productSubItems);
  }

  interface NavLink {
    label: string;
    href: string;
    subItems?: NavLink[];
  }

  const links: NavLink[] = [
    {
      label: t("nav.products"),
      href: `/${locale}/shop`,
      subItems: productSubItems,
    },
    { href: `/${locale}/story`, label: t("nav.story") },
    { href: `/${locale}/news`, label: t("nav.news") },
    { href: `/${locale}/activities`, label: t("nav.activities") },
    { href: `/${locale}/contact`, label: t("nav.contact") },
  ];
  return links;
};

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const ShoppingCartIcon = ({ className }: { className?: string }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16" />
  </svg>
);
const UserIcon = ({ className }: { className?: string }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const MenuIcon = ({ className }: { className?: string }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const QuickLanguageToggle = () => {
  const { locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const newLocale = locale === "vi" ? "en" : "vi";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1 p-2 text-slate-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors duration-200"
      aria-label="Chọn ngôn ngữ"
    >
      <span className="text-sm">{locale === "vi" ? "🇻🇳" : "🇺🇸"}</span>
      <span className="text-xs font-medium">{locale.toUpperCase()}</span>
    </button>
  );
};

export default function Header() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const lastScrollY = useRef(0);
  const router = useRouter();
  const { sessionToken, setSessionToken } = useAppContextProvider();
  // Sử dụng useAuth để lấy user data thay vì gọi API trực tiếp
  const { logout, isAuthenticated, user } = useAuth();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { totalQuantity } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Enable realtime user updates - tự động cập nhật khi admin thay đổi
  const { openSidebar } = useCartSidebar();
  const t = useTranslations();
  const { locale } = useI18n();
  // Kiểm tra đăng nhập từ sessionToken hoặc isAuthenticated
  const isLoggedIn = Boolean(sessionToken) || isAuthenticated;

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        console.log("🔄 Fetching categories from API...");
        const response = await categoryApiRequest.getCategories({
          isActive: true,
          sort: "order",
          order: "asc",
        });
        if (process.env.NODE_ENV === "development") {
          console.log("📋 Categories response:", response);
        }
        if (response.success && response.data) {
          if (process.env.NODE_ENV === "development") {
            console.log("✅ Categories loaded:", response.data.length);
          }
          setCategories(response.data);
        } else {
          if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ Categories response not successful:", response);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching categories:", error);
        // Keep empty array on error, will show default menu
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const navLinks = getNavLinks(t, locale, categories);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      setIsAtTop(currentScrollY < 50);

      if (isMobileMenuOpen) {
        setIsHeaderVisible(true);
        return;
      }

      // Smart header: ẩn khi scroll xuống, hiện khi scroll lên
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    // Throttle scroll event để performance tốt hơn
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });
    return () => window.removeEventListener("scroll", throttledScroll);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    // Chỉ check admin/employee status nếu đã authenticated và có user
    if (!isAuthenticated || !user) {
      setIsAdmin(false);
      setIsEmployee(false);
      return;
    }

    // Check admin and employee status từ user data đã có (không cần gọi API)
    // Only ADMIN and STAFF can access admin routes, EMPLOYEE cannot
    const userRole = (user?.role || "").toUpperCase();
    const isUserAdmin = userRole === "ADMIN" || userRole === "STAFF";
    const isUserEmployee = userRole === "EMPLOYEE" || userRole === "ADMIN";
    setIsAdmin(isUserAdmin);
    setIsEmployee(isUserEmployee);
  }, [user, isAuthenticated]);

  // Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Tính toán các giá trị cho Smart Header dựa trên scroll position
  const isScrolled = scrollY > 50;
  const isCompact = isScrolled && isHeaderVisible;

  // Dynamic classes cho Smart Header với thu nhỏ, bo tròn và blur
  const headerClasses = [
    "fixed z-40",
    "transition-all duration-500 ease-out",
    isHeaderVisible ? "translate-y-0" : "-translate-y-full",
    isCompact
      ? "top-3 left-4 right-4 max-w-[calc(100%-2rem)] rounded-2xl"
      : "top-0 left-0 right-0 w-full rounded-none",
    isCompact
      ? "shadow-2xl shadow-rose-500/10 dark:shadow-black/50"
      : !isAtTop
      ? "shadow-lg dark:shadow-gray-900/20"
      : "",
    isCompact
      ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50"
      : "bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800",
  ]
    .filter(Boolean)
    .join(" ");

  // Dynamic height cho container
  const containerHeightClass = isCompact
    ? "h-14 sm:h-14 lg:h-16"
    : "h-16 sm:h-18 lg:h-20";

  // Dynamic padding
  const containerPaddingClass = isCompact
    ? "px-4 sm:px-5 lg:px-6"
    : "px-3 sm:px-4 lg:px-6";

  // Dynamic logo size
  const logoSizeClass = isCompact
    ? "h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10"
    : "h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14";

  return (
    <>
      <header className={headerClasses} suppressHydrationWarning>
        <div
          className={`max-w-screen-xl mx-auto ${containerPaddingClass}`}
          suppressHydrationWarning
        >
          <div
            className={`flex items-center justify-between ${containerHeightClass}`}
            suppressHydrationWarning
          >
            {/* Logo với animation khi scroll */}
            <Link
              href={`/${locale}`}
              className={`group flex items-center gap-2 flex-shrink-0 transition-all duration-500 ${
                isCompact ? "gap-1.5" : "gap-2"
              }`}
              suppressHydrationWarning
            >
              <div className="relative">
                <Image
                  src={envConfig.NEXT_PUBLIC_URL_LOGO}
                  alt="LALA-LYCHEEE Logo"
                  width={56}
                  height={56}
                  sizes="(max-width: 768px) 48px, 56px"
                  className={`${logoSizeClass} object-contain rounded-full transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg group-hover:shadow-rose-500/50 ${
                    isCompact ? "ring-2 ring-rose-100 dark:ring-rose-900/30" : ""
                  }`}
                  priority
                />
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500/0 via-pink-500/0 to-rose-500/0 group-hover:from-rose-500/20 group-hover:via-pink-500/30 group-hover:to-rose-500/20 blur-xl transition-all duration-500 -z-10 opacity-0 group-hover:opacity-100" />
              </div>
              <span
                className={`font-bold tracking-tighter hidden sm:block bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent transition-all duration-500 group-hover:from-red-600 group-hover:to-pink-600 group-hover:scale-105 ${
                  isCompact
                    ? "text-base sm:text-lg lg:text-xl"
                    : "text-base sm:text-lg lg:text-xl xl:text-2xl"
                }`}
              >
                LALA-LYCHEEE
              </span>
            </Link>

            {/* Navigation Links (Desktop) với animation khi scroll */}
            <nav
              className={`hidden lg:flex items-center transition-all duration-500 ${
                isCompact ? "gap-3 xl:gap-4" : "gap-4 xl:gap-6"
              }`}
              suppressHydrationWarning
            >
              {navLinks.map((link) => (
                <div
                  key={link.label}
                  className="relative group"
                  suppressHydrationWarning
                >
                  {link.subItems ? (
                    <>
                      <span
                        className={`flex items-center gap-1.5 cursor-pointer py-2 px-1 font-medium text-slate-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200 ${
                          isCompact ? "text-sm" : "text-sm"
                        }`}
                      >
                        {link.label}
                        <ChevronDownIcon
                          className={`transition-transform duration-300 group-hover:rotate-180 ${
                            isCompact ? "w-3 h-3" : "w-4 h-4"
                          }`}
                        />
                      </span>
                      {/* Mega Menu for Products, Regular Dropdown for others */}
                      {link.label === t("nav.products") ? (
                        <div
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 -translate-y-2 z-50"
                          suppressHydrationWarning
                        >
                          <ProductsMegaMenu
                            items={link.subItems.map(
                              (item: {
                                href: string;
                                label: string;
                                query?: string;
                                categoryId?: string;
                                categorySlug?: string;
                              }) => {
                                // Extract category slug or search query from href if not already provided
                                const categoryMatch =
                                  item.href.match(/[?&]category=([^&]+)/);
                                const searchMatch =
                                  item.href.match(/[?&]q=([^&]+)/);
                                return {
                                  href: item.href,
                                  label: item.label,
                                  query:
                                    item.query ||
                                    (categoryMatch
                                      ? decodeURIComponent(categoryMatch[1])
                                      : searchMatch
                                      ? decodeURIComponent(searchMatch[1])
                                      : undefined),
                                  categoryId: item.categoryId,
                                  categorySlug:
                                    item.categorySlug ||
                                    (categoryMatch
                                      ? decodeURIComponent(categoryMatch[1])
                                      : undefined),
                                };
                              }
                            )}
                            locale={locale}
                          />
                        </div>
                      ) : (
                        <div
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 -translate-y-2 z-50 border border-gray-200 dark:border-gray-700"
                          suppressHydrationWarning
                        >
                          <div className="py-2" suppressHydrationWarning>
                            {link.subItems.map(
                              (item: { href: string; label: string }) => (
                                <Link
                                  key={item.label}
                                  href={item.href}
                                  className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-slate-900 dark:hover:text-white transition-colors duration-200"
                                  suppressHydrationWarning
                                >
                                  {item.label}
                                </Link>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={link.href!}
                      className={`py-2 px-1 font-medium text-slate-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200 ${
                        isCompact ? "text-sm" : "text-sm"
                      }`}
                      suppressHydrationWarning
                    >
                      {link.label}
                    </Link>
                  )}
                  <span className="absolute bottom-0 left-0 block h-[2px] w-full bg-rose-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out"></span>
                </div>
              ))}
              {/* Nút Admin - chỉ hiển thị icon để tiết kiệm không gian */}
              {isAdmin ? (
                <Link
                  href={`/${locale}/admin/dashboard`}
                  className="flex items-center justify-center w-9 h-9 text-white bg-gradient-to-r from-slate-900 to-slate-800 dark:from-gray-700 dark:to-gray-600 hover:from-black hover:to-slate-900 dark:hover:from-gray-600 dark:hover:to-gray-500 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  title="Trang quản trị"
                  suppressHydrationWarning
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </Link>
              ) : null}
              {/* Nút Employee - chỉ hiển thị icon để tiết kiệm không gian */}
              {isEmployee && !isAdmin ? (
                <Link
                  href={`/${locale}/employee`}
                  className="flex items-center justify-center w-9 h-9 text-white bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  title="Trang nhân viên"
                  suppressHydrationWarning
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </Link>
              ) : null}
            </nav>

            {/* Icons & Mobile Menu Trigger */}
            <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
              {sessionToken || isAuthenticated ? (
                <div
                  className="relative group"
                  onMouseEnter={() => {
                    if (closeTimeoutRef.current) {
                      clearTimeout(closeTimeoutRef.current);
                      closeTimeoutRef.current = null;
                    }
                    setIsAccountOpen(true);
                  }}
                  onMouseLeave={() => {
                    closeTimeoutRef.current = setTimeout(() => {
                      setIsAccountOpen(false);
                    }, 150); // Delay 150ms trước khi đóng
                  }}
                >
                  <button
                    onClick={() => setIsAccountOpen((v) => !v)}
                    aria-label="Tài khoản"
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-slate-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all duration-200"
                  >
                    <UserIcon className="w-5 h-5" />
                    <span className="hidden md:block text-sm font-medium">
                      {t("nav.account")}
                    </span>
                    <ChevronDownIcon className="hidden md:block w-4 h-4" />
                  </button>
                  {isAccountOpen && (
                    <div
                      className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
                      onMouseEnter={() => {
                        if (closeTimeoutRef.current) {
                          clearTimeout(closeTimeoutRef.current);
                          closeTimeoutRef.current = null;
                        }
                        setIsAccountOpen(true);
                      }}
                      onMouseLeave={() => {
                        closeTimeoutRef.current = setTimeout(() => {
                          setIsAccountOpen(false);
                        }, 150);
                      }}
                    >
                      {isAdmin && (
                        <Link
                          href={`/${locale}/admin/dashboard`}
                          className="block px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 transition-colors duration-200 rounded-t-lg"
                          onClick={() => setIsAccountOpen(false)}
                          suppressHydrationWarning
                        >
                          <span className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                              />
                            </svg>
                            {t("nav.admin")}
                          </span>
                        </Link>
                      )}
                      {isEmployee && !isAdmin && (
                        <Link
                          href={`/${locale}/employee`}
                          className="block px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 rounded-t-lg"
                          onClick={() => setIsAccountOpen(false)}
                          suppressHydrationWarning
                        >
                          <span className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            Trang nhân viên
                          </span>
                        </Link>
                      )}
                      <Link
                        href={`/${locale}/me`}
                        className={`block px-4 py-2.5 text-sm text-slate-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-gray-700 hover:text-rose-600 dark:hover:text-rose-400 transition-colors duration-200 ${
                          isAdmin || isEmployee ? "" : "rounded-t-lg"
                        }`}
                        onClick={() => setIsAccountOpen(false)}
                        suppressHydrationWarning
                      >
                        {t("nav.profile")}
                      </Link>
                      <button
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200 rounded-b-lg"
                        onClick={async () => {
                          try {
                            setIsAccountOpen(false);
                            await logout();
                            setSessionToken("");
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
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          {t("nav.logout")}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={`/${locale}/login`}
                  aria-label="Đăng nhập"
                  className="p-2 text-slate-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all duration-200"
                  suppressHydrationWarning
                >
                  <UserIcon className="w-5 h-5" />
                </Link>
              )}
              <Link
                href={`/${locale}/cart`}
                aria-label="Giỏ hàng"
                className="relative p-2 text-slate-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all duration-200"
                suppressHydrationWarning
              >
                <ShoppingCartIcon className="w-5 h-5" />
                {totalQuantity > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs font-medium leading-none px-1.5 py-1 rounded-full min-w-[18px] text-center">
                    {totalQuantity}
                  </span>
                )}
              </Link>
              {/* PC View Toggle Button - Mobile Only */}
              <button
                onClick={() => {
                  // Toggle desktop view trong session hiện tại
                  const html = document.documentElement;
                  const body = document.body;
                  const isForced = html.classList.contains('force-desktop-view');
                  
                  if (isForced) {
                    html.classList.remove('force-desktop-view');
                    body.classList.remove('force-desktop-view');
                    const viewport = document.querySelector('meta[name="viewport"]');
                    if (viewport) {
                      viewport.setAttribute('content', 'width=device-width, initial-scale=1');
                    }
                  } else {
                    html.classList.add('force-desktop-view');
                    body.classList.add('force-desktop-view');
                    const viewport = document.querySelector('meta[name="viewport"]');
                    if (viewport) {
                      viewport.setAttribute('content', 'width=1024');
                    }
                  }
                }}
                className="p-2 text-slate-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors duration-200 lg:hidden"
                aria-label="Chuyển sang chế độ PC"
                title="Chuyển sang chế độ PC"
              >
                <Monitor className="w-5 h-5" />
              </button>
              <ThemeToggle />
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-slate-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors duration-200 lg:hidden"
                aria-label="Mở menu"
              >
                <MenuIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Right block (desktop) would typically host account/cart icons. Already present above. */}
      </header>
      {isMobileMenuOpen ? (
        <MobileNavSheet
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          isAdmin={isAdmin}
          isEmployee={isEmployee}
          navLinks={navLinks}
        />
      ) : null}
    </>
  );
}
