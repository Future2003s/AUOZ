"use client";
import Link from "next/link";
import { useState } from "react";
import useTranslations from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import dynamic from "next/dynamic";
import { ChevronDown, X } from "lucide-react";

const LanguageSwitcher = dynamic(() => import("@/components/LanguageSwitcher"), {
  ssr: false,
});

export type NavLink = {
  label: string;
  href?: string;
  subItems?: { href: string; label: string }[];
};

export default function MobileNav({
  isOpen,
  onClose,
  isAdmin,
  isEmployee,
  navLinks,
}: {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  isEmployee?: boolean;
  navLinks: NavLink[];
}) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const t = useTranslations();
  const { locale } = useI18n();

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`absolute top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <span className="font-bold text-lg text-rose-800">{t("nav.menu")}</span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-rose-100 rounded-lg transition-colors duration-200"
            aria-label="Đóng menu"
          >
            <X className="text-slate-600 w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 overflow-y-auto h-full pb-20">
          <ul className="space-y-2">
            {navLinks.map((link) => (
              <li key={link.label}>
                {link.subItems ? (
                  <>
                    <button
                      onClick={() =>
                        setActiveDropdown(activeDropdown === link.label ? null : link.label)
                      }
                      className="w-full flex justify-between items-center py-3 px-3 text-base font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors duration-200"
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        className={`transition-transform duration-300 w-4 h-4 ${
                          activeDropdown === link.label ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {activeDropdown === link.label && (
                      <ul className="pl-4 mt-2 space-y-1 border-l-2 border-gray-200">
                        {link.subItems.map((item) => (
                          <li key={item.label}>
                            <Link
                              href={item.href}
                              className="block py-2.5 px-3 text-sm text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-200"
                              onClick={onClose}
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={link.href!}
                    className="block py-3 px-3 text-base font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors duration-200"
                    onClick={onClose}
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
            {isAdmin && (
              <li className="pt-2 border-t border-gray-200 mt-4">
                <Link
                  href={`/${locale}/admin/dashboard`}
                  className="flex items-center gap-2 block py-3 px-3 text-base font-semibold text-white bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 rounded-lg transition-all duration-200 shadow-md"
                  onClick={onClose}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {t("nav.admin")}
                </Link>
              </li>
            )}
            {isEmployee && !isAdmin && (
              <li className="pt-2 border-t border-gray-200 mt-4">
                <Link
                  href={`/${locale}/employee`}
                  className="flex items-center gap-2 block py-3 px-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all duration-200 shadow-md"
                  onClick={onClose}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Trang nhân viên
                </Link>
              </li>
            )}
          </ul>

          {/* Language Switcher in Mobile */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="px-3">
              <div className="mb-3">
                <span className="text-sm font-medium text-slate-600">
                  {t("nav.language")}
                </span>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}

