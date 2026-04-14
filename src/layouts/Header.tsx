"use client";
import { envConfig } from "@/config";
import Link from "next/link";
import Image from "next/image";
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
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { categoryApiRequest, Category } from "@/apiRequests/categories";
import { Monitor, Search, ShoppingCart, User, Menu, ChevronDown, LogOut, Settings, Shield } from "lucide-react";

// ─── Nav links builder ───────────────────────────────────────────────────────
const getNavLinks = (
  t: (key: string) => string,
  locale: string,
  categories: Category[] = []
) => {
  const productSubItems: Array<{
    href: string;
    label: string;
    query?: string;
    categoryId?: string;
    categorySlug?: string;
  }> = [{ href: `/${locale}/products`, label: t("nav.all_products") }];

  const activeCategories = categories
    .filter((cat) => {
      return cat.isActive && (!cat.parent || typeof cat.parent === "string");
    })
    .slice(0, 8)
    .map((cat) => ({
      href: `/${locale}/products?category=${cat._id}`,
      label: cat.name,
      query: cat.name,
      categoryId: cat._id,
      categorySlug: cat.slug,
    }));

  productSubItems.push(...activeCategories);

  interface NavLink {
    label: string;
    href: string;
    subItems?: NavLink[];
  }

  const links: NavLink[] = [
    { label: t("nav.products"), href: `/${locale}/shop`, subItems: productSubItems },
    { href: `/${locale}/story`, label: t("nav.story") },
    { href: `/${locale}/news`, label: t("nav.news") },
    { href: `/${locale}/activities`, label: t("nav.activities") },
    { href: `/${locale}/contact`, label: t("nav.contact") },
  ];
  return links;
};

// ─── Language Quick Toggle ────────────────────────────────────────────────────
const QuickLanguageToggle = () => {
  const { locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  const toggleLanguage = () => {
    const newLocale = locale === "vi" ? "en" : "vi";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath, { scroll: false });
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1 px-2 py-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-xs font-medium"
      aria-label={t("header.select_language")}
    >
      <span>{locale === "vi" ? "🇻🇳" : "🇺🇸"}</span>
      <span>{locale.toUpperCase()}</span>
    </button>
  );
};

// ─── Main Header Component ────────────────────────────────────────────────────
export default function Header() {
  const [isAtTop, setIsAtTop] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const router = useRouter();
  const { logout, isAuthenticated, user } = useAuth();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { totalQuantity } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openSidebar } = useCartSidebar();
  const t = useTranslations();
  const { locale } = useI18n();
  const isLoggedIn = isAuthenticated;
  const pathname = usePathname();

  // Fetch categories
  useEffect(() => {
    categoryApiRequest
      .getCategories({ isActive: true, sort: "order", order: "asc" })
      .then((res) => {
        if (res.success && res.data) setCategories(res.data);
      })
      .catch(console.error);
  }, []);

  const navLinks = getNavLinks(t, locale, categories);

  // Scroll behaviour
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          setIsAtTop(y < 10);
          if (isMobileMenuOpen) { setIsHeaderVisible(true); }
          else if (y > lastScrollY.current && y > 80) { setIsHeaderVisible(false); }
          else { setIsHeaderVisible(true); }
          lastScrollY.current = y;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobileMenuOpen]);

  // Admin/Employee check
  useEffect(() => {
    if (!isAuthenticated || !user) { setIsAdmin(false); setIsEmployee(false); return; }
    const role = (user?.role || "").toUpperCase();
    setIsAdmin(role === "ADMIN" || role === "STAFF");
    setIsEmployee(role === "EMPLOYEE" || role === "ADMIN");
  }, [user, isAuthenticated]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (accountTimeoutRef.current) clearTimeout(accountTimeoutRef.current);
    };
  }, []);

  const handleNavEnter = (label: string) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setActiveNav(label);
  };
  const handleNavLeave = () => {
    closeTimeoutRef.current = setTimeout(() => setActiveNav(null), 200);
  };
  const handleDropdownEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  };
  const handleDropdownLeave = () => {
    closeTimeoutRef.current = setTimeout(() => setActiveNav(null), 200);
  };

  const handleAccountEnter = () => {
    if (accountTimeoutRef.current) clearTimeout(accountTimeoutRef.current);
    setIsAccountOpen(true);
  };
  const handleAccountLeave = () => {
    accountTimeoutRef.current = setTimeout(() => setIsAccountOpen(false), 180);
  };

  // ─── Header container classes ────────────────────────────────────────────
  // Google Store style: pill bar that floats above content
  const pillClasses = [
    "fixed z-40 left-0 right-0",
    "transition-all duration-300 ease-out",
    isHeaderVisible ? "translate-y-0" : "-translate-y-[120%]",
    isAtTop
      ? "top-0 mx-0 rounded-none bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-none"
      : "top-3 mx-4 xl:mx-auto xl:max-w-screen-xl rounded-2xl bg-white dark:bg-gray-900 shadow-[0_2px_20px_rgba(0,0,0,0.12)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.4)] border border-gray-200/60 dark:border-gray-700/60",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className={pillClasses} suppressHydrationWarning>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3" suppressHydrationWarning>

          {/* ── Logo ──────────────────────────────────────────────────── */}
          <Link
            href={`/${locale}`}
            className="group flex items-center gap-2 flex-shrink-0"
            suppressHydrationWarning
          >
            <Image
              src={envConfig.NEXT_PUBLIC_URL_LOGO}
              alt="LALA-LYCHEEE"
              width={40}
              height={40}
              className="h-8 w-8 sm:h-9 sm:w-9 object-contain rounded-full transition-transform duration-200 group-hover:scale-105"
              priority
            />
            <span className="hidden sm:block font-bold text-sm lg:text-base text-rose-600 dark:text-rose-400 tracking-tight">
              LALA-LYCHEEE
            </span>
          </Link>

          {/* ── Desktop Nav — centered tabs ───────────────────────────── */}
          <nav
            className="hidden lg:flex items-center flex-1 justify-center gap-0.5"
            suppressHydrationWarning
          >
            {navLinks.map((link) => {
              const isActive = activeNav === link.label;
              const isCurrent = pathname.startsWith(link.href) && link.href !== `/${locale}/shop`;

              return (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => link.subItems ? handleNavEnter(link.label) : undefined}
                  onMouseLeave={link.subItems ? handleNavLeave : undefined}
                  suppressHydrationWarning
                >
                  {link.subItems ? (
                    <button
                      className={`flex items-center gap-1 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-150 ${isActive
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                        : isCurrent
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                        }`}
                    >
                      {link.label}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isActive ? "rotate-180" : ""}`}
                      />
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-150 inline-block ${isCurrent
                        ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      suppressHydrationWarning
                    >
                      {link.label}
                    </Link>
                  )}

                  {/* ── Dropdown — Google Store style card ─────────────── */}
                  {link.subItems && isActive && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50"
                      onMouseEnter={handleDropdownEnter}
                      onMouseLeave={handleDropdownLeave}
                      suppressHydrationWarning
                    >
                      {/* Triangle pointer */}
                      <div className="w-3 h-3 mx-auto bg-white dark:bg-gray-900 border-l border-t border-gray-200 dark:border-gray-700 rotate-45 -mb-1.5 relative z-10" />
                      {/* Card */}
                      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.14)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <ProductsMegaMenu
                          items={link.subItems.map((item: {
                            href: string;
                            label: string;
                            query?: string;
                            categoryId?: string;
                            categorySlug?: string;
                          }) => {
                            const catMatch = item.href.match(/[?&]category=([^&]+)/);
                            return {
                              href: item.href,
                              label: item.label,
                              query: item.query || (catMatch ? decodeURIComponent(catMatch[1]) : undefined),
                              categoryId: item.categoryId,
                              categorySlug: item.categorySlug || (catMatch ? decodeURIComponent(catMatch[1]) : undefined),
                            };
                          })}
                          locale={locale}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Admin shortcut in nav */}
            {isAdmin && (
              <Link
                href={`/${locale}/admin/dashboard`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={t("header.admin_page")}
                suppressHydrationWarning
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* ── Right — Icons ─────────────────────────────────────────── */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">

            {/* Cart */}
            <Link
              href={`/${locale}/cart`}
              aria-label={t("header.cart")}
              className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-150"
              suppressHydrationWarning
            >
              <ShoppingCart className="w-5 h-5" />
              {totalQuantity > 0 && (
                <span className="absolute top-1 right-1 min-w-[17px] h-[17px] bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full px-0.5 leading-none">
                  {totalQuantity > 99 ? "99+" : totalQuantity}
                </span>
              )}
            </Link>

            {/* Account */}
            {isLoggedIn ? (
              <div
                className="relative"
                onMouseEnter={handleAccountEnter}
                onMouseLeave={handleAccountLeave}
              >
                <button
                  onClick={() => setIsAccountOpen((v) => !v)}
                  aria-label="Tài khoản"
                  className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-150"
                >
                  <User className="w-5 h-5" />
                </button>

                {isAccountOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 overflow-hidden py-1"
                    onMouseEnter={handleAccountEnter}
                    onMouseLeave={handleAccountLeave}
                  >
                    {/* User greeting */}
                    {(user?.firstName || user?.email) && (
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t("header.hello")}</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.firstName || user.email}
                        </p>
                      </div>
                    )}
                    {isAdmin && (
                      <Link
                        href={`/${locale}/admin/dashboard`}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => setIsAccountOpen(false)}
                        suppressHydrationWarning
                      >
                        <span className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-3 h-3 text-white" />
                        </span>
                        {t("nav.admin")}
                      </Link>
                    )}
                    {isEmployee && !isAdmin && (
                      <Link
                        href={`/${locale}/employee`}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => setIsAccountOpen(false)}
                        suppressHydrationWarning
                      >
                        <span className="w-5 h-5 rounded-md bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <Settings className="w-3 h-3 text-white" />
                        </span>
                        {t("header.employee_page")}
                      </Link>
                    )}
                    <Link
                      href={`/${locale}/me`}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => setIsAccountOpen(false)}
                      suppressHydrationWarning
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      {t("nav.profile")}
                    </Link>
                    <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                      <button
                        className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        onClick={async () => {
                          try {
                            setIsAccountOpen(false);
                            await logout();
                            toast.success(t("header.logout_success"), { position: "top-center" });
                            router.push(`/${locale}/login`);
                            router.refresh();
                          } catch {
                            toast.error(t("header.logout_failed"), { position: "top-center" });
                          }
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        {t("nav.logout")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={`/${locale}/login`}
                aria-label={t("header.login")}
                className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-150"
                suppressHydrationWarning
              >
                <User className="w-5 h-5" />
              </Link>
            )}

            {/* PC View on Mobile */}
            <button
              onClick={() => {
                const html = document.documentElement;
                const isForced = html.classList.contains("force-desktop-view");
                if (isForced) {
                  html.classList.remove("force-desktop-view");
                  document.body.classList.remove("force-desktop-view");
                  document.querySelector('meta[name="viewport"]')?.setAttribute("content", "width=device-width, initial-scale=1");
                } else {
                  html.classList.add("force-desktop-view");
                  document.body.classList.add("force-desktop-view");
                  document.querySelector('meta[name="viewport"]')?.setAttribute("content", "width=1024");
                }
              }}
              className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors lg:hidden"
              aria-label={t("header.pc_mode")}
            >
              <Monitor className="w-5 h-5" />
            </button>

            <ThemeToggle />

            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors lg:hidden"
              aria-label={t("header.open_menu")}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <MobileNavSheet
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          isAdmin={isAdmin}
          isEmployee={isEmployee}
          navLinks={navLinks}
        />
      )}
    </>
  );
}
