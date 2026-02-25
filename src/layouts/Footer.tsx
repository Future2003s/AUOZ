"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Script from "next/script";
import Image from "next/image";
import IconAnToan from "../../public/images/hg.png";
import IconInstagram from "../../public/images/instagram.png";
import TgBctLogo from "../../public/images/tg_bct_logo.png";

function Footer() {
  const [isMounted, setIsMounted] = useState(false);
  const params = useParams();
  const locale = (params?.locale as string) || "vi";

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
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
          <p className="text-rose-400 text-sm font-medium mb-4">Vải Thiều Vĩnh Lập - Thanh Hà</p>
          <p className="text-gray-400 leading-relaxed mb-6 text-sm">
            Chúng tôi tự hào mang đến những sản phẩm vải thiều chất lượng cao,
            bền vững và thân thiện môi trường, góp phần nâng tầm giá trị nông
            sản Việt.
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
            Liên hệ
          </h3>
          <address className="not-italic space-y-3">
            <Link
              href="https://maps.app.goo.gl/tKcvMmRWo9zHdDAR7"
              target="_blank"
              suppressHydrationWarning
            >
              <p className="text-gray-400 text-sm hover:text-gray-200 transition-colors">
                <span className="block text-gray-300 font-medium mb-0.5">Địa chỉ</span>
                thôn Tú Y, xã Hà Đông, Thành Phố Hải Phòng.
              </p>
            </Link>

            <p className="text-gray-400 text-sm">
              <span className="block text-gray-300 font-medium mb-0.5">Email</span>
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
              <span className="block text-gray-300 font-medium mb-0.5">Điện thoại</span>
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
            Liên kết nhanh
          </h3>
          <nav className="flex flex-col space-y-2.5">
            <Link
              href={`/${locale}`}
              className="text-gray-400 hover:text-rose-400 transition-colors duration-150 text-sm"
            >
              Trang chủ
            </Link>
            <Link
              href={`/${locale}/products`}
              className="text-gray-400 hover:text-rose-400 transition-colors duration-150 text-sm"
            >
              Sản phẩm
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="text-gray-400 hover:text-rose-400 transition-colors duration-150 text-sm"
            >
              Liên hệ
            </Link>
            <Link
              href={`/${locale}/news`}
              className="text-gray-400 hover:text-rose-400 transition-colors duration-150 text-sm"
            >
              Tin tức & Sự kiện
            </Link>
            <Link
              href={`/${locale}/complaints`}
              className="text-gray-400 hover:text-rose-400 transition-colors duration-150 text-sm"
            >
              Giải quyết khiếu nại
            </Link>
          </nav>
        </div>

        {/* Company Info & Certifications */}
        <div className="text-center md:text-left">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-5">
            CÔNG TY TNHH LALA - LYCHEEE
          </h3>
          <p className="text-gray-300 font-medium text-sm mb-1">Mã Số Thuế: 0801381660</p>
          <p className="text-gray-400 text-sm italic mb-5">
            Quản Lý Bởi Thanh Hà - Thuế cơ sở 14 Thành Phố Hải Phòng
          </p>

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
        <p>&copy; {new Date().getFullYear()} Lalalycheee CO.,LTD. Bảo lưu mọi quyền.</p>
        <Script
          src="https://images.dmca.com/Badges/DMCABadgeHelper.min.js"
          strategy="lazyOnload"
        />
      </div>
    </footer>
  );
}

export default Footer;
