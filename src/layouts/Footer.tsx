"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Script from "next/script";
import Image from "next/image";
import IconAnToan from "../../public/images/hg.png";
import IconInstagram from "../../public/images/instagram.png";
import TgBctLogo from "../../public/images/tg_bct_logo.png";
import useTranslations from "@/i18n/useTranslations";

function Footer() {
  const t = useTranslations();
  const [isMounted, setIsMounted] = useState(false);
  const [businessData, setBusinessData] = useState<{ 
    id: string; 
    name: string; 
    address: string;
    internationalName: string;
    shortName: string;
    status: string;
  } | null>(null);
  const [businessMetadata, setBusinessMetadata] = useState<{
    disclaimer: string;
    source: string;
    updatedAt: string;
    contact: string;
  } | null>(null);
  const params = useParams();
  const locale = (params?.locale as string) || "vi";

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    
    const fetchBusinessData = async () => {
      try {
        const response = await fetch("https://api.vietqr.io/v2/business/0801381660");
        const result = await response.json();
        if (result.code === "00" && result.data) {
          setBusinessData(result.data);
          if (result.metadata) {
            setBusinessMetadata(result.metadata);
          }
        }
      } catch (error) {
        console.error("Failed to fetch business data:", error);
      }
    };
    
    fetchBusinessData();

    return () => clearTimeout(timer);
  }, []);

  return (
    <footer className="bg-slate-900 dark:bg-gray-950 text-white py-16 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center md:text-left">
        {/* Company Logo & Description */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left lg:col-span-1">
          <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">
            LALA-LYCHEEE
          </h3>
          <p className="text-rose-400 text-sm font-medium mb-4">{t("footer.location_title")}</p>
          <p className="text-gray-400 leading-relaxed mb-6 text-sm">
            {t("footer.company_description")}
          </p>
          <div className="flex space-x-4">
            <Link
              href="https://www.instagram.com/lala_lycheee?igsh=M2x5cmgwdmZrcDh1&utm_source=qr"
              className="text-gray-400 hover:text-rose-400 transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={IconInstagram}
                alt="Instagram"
                width={20}
                height={20}
                className="w-8 h-8 opacity-80 hover:opacity-100 transition-opacity"
              />
            </Link>
          </div>
        </div>

        {/* Contact Info */}
        <div className="text-center md:text-left">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-5">
            {t("footer.contact_us")}
          </h3>
          <address className="not-italic space-y-3">
            <Link
              href="https://maps.app.goo.gl/tKcvMmRWo9zHdDAR7"
              target="_blank"
              suppressHydrationWarning
            >
              <p className="text-gray-400 text-sm hover:text-gray-200 transition-colors">
                <span className="block text-gray-300 font-medium mb-0.5">{t("footer.address")}</span>
                {t("footer.address_value")}
              </p>
            </Link>

            <p className="text-gray-400 text-sm">
              <span className="block text-gray-300 font-medium mb-0.5">{t("footer.email")}</span>
              {isMounted ? (
                <Link
                  href="mailto:lalalycheee1@gmail.com"
                  className="hover:text-rose-400 transition-colors duration-200"
                >
                  info@lalalycheee.vn
                </Link>
              ) : (
                <span>lalalycheee1@gmail.com</span>
              )}
            </p>
            <p className="text-gray-400 text-sm">
              <span className="block text-gray-300 font-medium mb-0.5">{t("footer.phone")}</span>
              {isMounted ? (
                <Link
                  href="tel:0962215666"
                  className="hover:text-rose-400 transition-colors duration-200"
                >
                  (+84) 0962-215-666
                </Link>
              ) : (
                <span>(+84) 0962-215-666</span>
              )}
            </p>
          </address>
        </div>

        {/* Quick Links */}
        <div className="text-center md:text-left">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-5">
            {t("footer.quick_links")}
          </h3>
          <nav className="flex flex-col space-y-2.5">
            <Link
              href={`/${locale}`}
              className="text-gray-400 hover:text-rose-400 transition-colors duration-150 text-sm"
            >
              {t("nav.home")}
            </Link>
            <Link
              href={`/${locale}/products`}
              className="text-gray-400 hover:text-rose-400 transition-colors duration-150 text-sm"
            >
              {t("nav.products")}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="text-gray-400 hover:text-rose-400 transition-colors duration-150 text-sm"
            >
              {t("nav.contact")}
            </Link>
            <Link
              href={`/${locale}/news`}
              className="text-gray-400 hover:text-rose-400 transition-colors duration-150 text-sm"
            >
              {t("footer.news_events")}
            </Link>
            <Link
              href={`/${locale}/complaints`}
              className="text-gray-400 hover:text-rose-400 transition-colors duration-150 text-sm"
            >
              {t("footer.complaints")}
            </Link>
          </nav>
        </div>

        {/* Company Info & Certifications */}
        <div className="text-center md:text-left">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-5">
            {businessData ? businessData.name : t("footer.company_info")}
          </h3>
          <p className="text-gray-300 font-medium text-sm mb-1">{t("footer.tax_code_label")} {businessData ? businessData.id : "0801381660"}</p>
          {businessData?.shortName && <p className="text-gray-400 text-sm mb-1">{t("footer.short_name_label")} {businessData.shortName}</p>}
          {businessData?.internationalName && <p className="text-gray-400 text-sm mb-1">{t("footer.intl_name_label")} {businessData.internationalName}</p>}
          {businessData?.status && <p className="text-gray-400 text-sm mb-1">{t("footer.status_label")} <span className="text-green-400 font-medium">{businessData.status}</span></p>}
          {businessData?.address && <p className="text-gray-400 text-sm mb-1">{t("footer.address_label")} <span className="text-gray-300 font-medium">{businessData.address}</span></p>}
          <p className="text-gray-400 text-sm italic mb-4">
            {t("footer.managed_by")}
          </p>

          {businessMetadata && (
            <div className="bg-slate-800/50 rounded-lg p-3 mb-5 border border-slate-700/50">
               <p className="text-xs text-gray-400 leading-relaxed mb-1.5">{businessMetadata.disclaimer}</p>
               <div className="flex flex-col gap-1 text-[11px] text-gray-500">
                  <p>{t("footer.source_label")} <a href={businessMetadata.source} target="_blank" rel="noopener noreferrer" className="hover:text-rose-400 transition-colors">{businessMetadata.source}</a></p>
                  <p>{t("footer.updated_at_label")} {new Date(businessMetadata.updatedAt).toLocaleDateString("vi-VN")}</p>
               </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            {/* DMCA Badge */}
            <Link
              href="https://www.dmca.com/Protection/Status.aspx?ID=750e685b-0b4b-48fa-bcc5-d198a3f3bd73&refurl=https://lalalycheee.vn/"
              title="DMCA.com Protection Status"
              className="dmca-badge inline-block opacity-80 hover:opacity-100 transition-opacity"
              target="_blank"
            >
              <Image
                src="https://images.dmca.com/Badges/DMCA_logo-grn-btn150w.png?ID=750e685b-0b4b-48fa-bcc5-d198a3f3bd73"
                alt="DMCA.com Protection Status"
                width={200}
                height={60}
                className="h-8 w-auto"
                unoptimized
              />
            </Link>
            {/* Certification Seal */}
            <Link
              href="/complaints"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-80 hover:opacity-100 transition-opacity"
            >
              <Image
                height={50}
                width={50}
                src={IconAnToan}
                alt="Hợp Phách Vệ Bảo An - Bộ Công Thương"
                className="h-14 w-auto"
              />
            </Link>
            {/* TG BCT Logo */}
            <Image
              src={TgBctLogo}
              alt="Bộ Công Thương"
              width={200}
              height={100}
              quality={100}
              priority
              className="h-14 w-auto object-contain opacity-80"
              style={{ imageRendering: "crisp-edges" }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-12 pt-8 border-t border-slate-700 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} {t("footer.copyright_notice")}</p>
        <Script
          src="https://images.dmca.com/Badges/DMCABadgeHelper.min.js"
          strategy="lazyOnload"
        />
      </div>
    </footer>
  );
}

export default Footer;
