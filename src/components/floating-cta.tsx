"use client";
import { useState, useEffect, useRef } from "react";
import { ShoppingBag, MessageCircle, X, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export const FloatingCTA: React.FC = () => {
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const [isVisible, setIsVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show CTA after scrolling down a bit
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  if (!isVisible) return null;

  const handleConsultClick = () => {
    setShowContact(true);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Floating CTA - Single Icon Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50" ref={menuRef}>
        {/* Contact Panel */}
        {showContact && (
          <div className="bg-white rounded-2xl shadow-2xl p-5 mb-3 animate-fade-in-down border border-rose-100 min-w-[280px] ml-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Liên hệ tư vấn</h3>
              <button
                onClick={() => setShowContact(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <a
              href="tel:0962215666"
              className="block text-rose-600 font-bold text-lg hover:text-rose-700 mb-4 transition-colors"
            >
              (+84) 0962-215-666
            </a>
            <div className="flex gap-2">
              <a
                href="https://zalo.me/0962215666"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg text-center transition-colors"
              >
                Zalo
              </a>
              <a
                href="mailto:lalalycheee1@gmail.com"
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg text-center transition-colors"
              >
                Email
              </a>
            </div>
          </div>
        )}

        {/* Menu Options */}
        {isMenuOpen && !showContact && (
          <div className="mb-3 space-y-2 animate-fade-in-up flex flex-col items-end">
            <Link
              href={`/${locale}/products`}
              onClick={() => setIsMenuOpen(false)}
              className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-3 font-semibold transition-all duration-300 transform hover:scale-105 group min-w-[200px]"
            >
              <ShoppingBag size={20} className="group-hover:rotate-12 transition-transform" />
              <span>Đặt hàng ngay</span>
            </Link>
            <button
              onClick={handleConsultClick}
              className="bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-600 px-5 py-3 rounded-full shadow-lg flex items-center gap-3 font-semibold transition-all duration-300 transform hover:scale-105 w-full"
            >
              <MessageCircle size={20} />
              <span>Tư vấn</span>
            </button>
          </div>
        )}

        {/* Main Icon Button */}
        <button
          onClick={() => {
            setIsMenuOpen(!isMenuOpen);
            if (showContact) setShowContact(false);
          }}
          className="w-14 h-14 sm:w-16 sm:h-16 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95"
          aria-label="Menu"
        >
          {isMenuOpen ? (
            <X size={24} className="sm:w-6 sm:h-6 transition-transform rotate-90" />
          ) : (
            <Plus size={24} className="sm:w-6 sm:h-6 transition-transform" />
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

