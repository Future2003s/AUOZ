"use client";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (typeof window !== "undefined") {
      const scrollY = window.pageYOffset || window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollY > 300);
    }
  };

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    // Check initial scroll position
    toggleVisibility();
    
    // Add scroll listener
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-20 right-4 sm:bottom-24 sm:right-6 bg-slate-600 hover:bg-slate-700 text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 z-[60] transform hover:scale-110 active:scale-95 ${
        isVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      aria-label="Quay lại đầu trang"
    >
      <ArrowUp size={20} className="sm:w-6 sm:h-6" />
    </button>
  );
};
