"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Script from "next/script";
import Image from "next/image";
import IconAnToan from "../../public/images/hg.png";
import certISO from "../../public/images/iso 22000.2018.png";
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
    <footer className="bg-gradient-to-br from-blue-600 to-blue-500 dark:from-gray-800 dark:to-gray-900 text-white py-16 px-4 rounded-t-sm shadow-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center md:text-left">
        {/* Company Logo & Description */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left lg:col-span-1">
          {/* Company Name as a stylish text logo */}
          <h3 className="text-4xl font-extrabold text-white mb-4 tracking-wider">
            Lalalycheee
          </h3>
          <p className="text-blue-100 dark:text-gray-300 leading-relaxed mb-6">
            Chúng tôi tự hào mang đến những sản phẩm vải thiều chất lượng cao,
            bền vững và thân thiện môi trường, góp phần nâng tầm giá trị nông
            sản Việt.
          </p>
          <div className="flex space-x-6">
            <Link
              href="https://www.instagram.com/lala_lycheee?igsh=M2x5cmgwdmZrcDh1&utm_source=qr"
              className="text-blue-200 hover:text-white transition duration-200 transform hover:scale-110"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={IconInstagram}
                alt="Instagram"
                width={20}
                height={20}
                className="w-10 h-10"
              />
            </Link>
          </div>
        </div>

        {/* Contact Info */}
        <div className="text-center md:text-left">
          <h3 className="text-xl font-bold text-white mb-4 rounded-xl">
            Liên hệ chúng tôi
          </h3>
          <address className="not-italic space-y-2">
            <Link
              href="https://maps.app.goo.gl/tKcvMmRWo9zHdDAR7"
              target="_blank"
              suppressHydrationWarning
            >
              <p className="text-blue-200">
                <span className="font-semibold text-blue-300">Địa chỉ: </span>
                thôn Tú Y, xã Hà Đông, Thành Phố Hải Phòng.
              </p>
            </Link>

            <p className="text-blue-200">
              <span className="font-semibold text-blue-300">Email:</span>{" "}
              {isMounted ? (
                <Link
                  href="mailto:lalalycheee1@gmail.com"
                  className="hover:text-white transition duration-200"
                >
                  lalalycheee1@gmail.com
                </Link>
              ) : (
                <span>lalalycheee1@gmail.com</span>
              )}
            </p>
            <p className="text-blue-200">
              <span className="font-semibold text-blue-300">Điện thoại:</span>{" "}
              {isMounted ? (
                <Link
                  href="tel:0962215666"
                  className="hover:text-white transition duration-200"
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
          <h3 className="text-xl font-bold text-white mb-4 rounded-xl">
            Liên kết nhanh
          </h3>
          <nav className="flex flex-col space-y-3">
            <Link
              href={`/${locale}`}
              className="text-blue-200 hover:text-white transition duration-200 rounded-xl hover:translate-x-1 inline-block"
            >
              Trang chủ
            </Link>
            <Link
              href={`/${locale}/products`}
              className="text-blue-200 hover:text-white transition duration-200 rounded-xl hover:translate-x-1 inline-block"
            >
              Sản phẩm
            </Link>
            <Link
              href={`/${locale}/about`}
              className="text-blue-200 hover:text-white transition duration-200 rounded-xl hover:translate-x-1 inline-block"
            >
              Về chúng tôi
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="text-blue-200 hover:text-white transition duration-200 rounded-xl hover:translate-x-1 inline-block"
            >
              Liên hệ
            </Link>
            <Link
              href={`/${locale}/news`}
              className="text-blue-200 hover:text-white transition duration-200 rounded-xl hover:translate-x-1 inline-block"
            >
              Tin tức & Sự kiện
            </Link>
            <Link
              href={`/${locale}/complaints`}
              className="text-blue-200 hover:text-white transition duration-200 rounded-xl hover:translate-x-1 inline-block"
            >
              Giải quyết khiếu nại
            </Link>
          </nav>
        </div>

        {/* Newsletter Signup */}
        <div className="text-center md:text-left">
          <h3 className="text-xl font-bold text-white mb-4 rounded-xl">
            CÔNG TY TNHH LALA - LYCHEEE
          </h3>
          <p className=" font-bold mb-2">Mã Số Thuế: 0801381660</p>
          <p className="italic mb-4">
            Quản Lý Bởi Thanh Hà - Thuế cơ sở 14 Thành Phố Hải Phòng
          </p>

          <div className="flex flex-wrap items-center gap-5 mt-[-2rem]">
            {/* DMCA Badge */}
            <div className="mt-2 flex md:justify-start justify-center">
              <Link
                href="https://www.dmca.com/Protection/Status.aspx?ID=750e685b-0b4b-48fa-bcc5-d198a3f3bd73&refurl=https://lalalycheee.vn/"
                title="DMCA.com Protection Status"
                className="dmca-badge inline-block"
                target="_blank"
              >
                <Image
                  src="https://images.dmca.com/Badges/DMCA_logo-grn-btn150w.png?ID=750e685b-0b4b-48fa-bcc5-d198a3f3bd73"
                  alt="DMCA.com Protection Status"
                  width={200}
                  height={60}
                  className="h-10 w-auto"
                  unoptimized
                />
              </Link>
            </div>
            {/* Certification Seal */}
            <div className="mt-6 flex md:justify-start justify-center">
              <Link
                href="/complaints"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  height={50}
                  width={50}
                  src={IconAnToan}
                  alt="Hợp Phách Vệ Bảo An - Bộ Công Thương"
                  className="h-20 w-auto"
                />
              </Link>
            </div>
            {/* TG BCT Logo */}
            <div className=" flex md:justify-start justify-center">
              <Image
                src={TgBctLogo}
                alt="Bộ Công Thương"
                width={200}
                height={100}
                quality={100}
                priority
                className="h-20 sm:h-24 w-aimage.pnguto object-contain"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Legal Links */}
      <div className="mt-12 pt-8 border-t border-blue-700 text-center text-black text-sm font-bold">
        <p className="mb-2">
          &copy; {new Date().getFullYear()} Lalalycheee. Bảo lưu mọi quyền.
        </p>

        <Script
          src="https://images.dmca.com/Badges/DMCABadgeHelper.min.js"
          strategy="lazyOnload"
        />
      </div>
    </footer>
  );
}

export default Footer;
