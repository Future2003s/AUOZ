"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, X, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingContactButtonsProps {
  phoneNumber?: string;
  zaloLink?: string;
  instagramLink?: string;
  position?: "left" | "right";
}

export function FloatingContactButtons({
  phoneNumber = "0123456789",
  zaloLink = "https://zalo.me/0123456789",
  instagramLink = "https://www.instagram.com/lala_lycheee",
  position = "right",
}: FloatingContactButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Show buttons after page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handlePhoneClick = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleZaloClick = () => {
    window.open(zaloLink, "_blank", "noopener,noreferrer");
  };

  const handleInstagramClick = () => {
    window.open(instagramLink, "_blank", "noopener,noreferrer");
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-3 transition-all duration-300",
        position === "right"
          ? "right-4 sm:right-6 bottom-4 sm:bottom-6"
          : "left-4 sm:left-6 bottom-4 sm:bottom-6"
      )}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
      }}
    >
      {/* Main Toggle Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "rounded-full w-14 h-14 sm:w-16 sm:h-16 shadow-lg hover:shadow-xl transition-all duration-300",
          "bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
          "text-white border-0",
          isExpanded && "rotate-45"
        )}
        aria-label="Liên hệ"
      >
        {isExpanded ? (
          <X className="w-6 h-6 sm:w-7 sm:h-7" />
        ) : (
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
        )}
      </Button>

      {/* Phone Button */}
      <div
        className={cn(
          "relative transition-all duration-300 ease-out",
          isExpanded
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-0 pointer-events-none"
        )}
        style={{
          transitionDelay: isExpanded ? "0.1s" : "0s",
        }}
      >
        <Button
          onClick={handlePhoneClick}
          className={cn(
            "rounded-full w-14 h-14 sm:w-16 sm:h-16 shadow-lg hover:shadow-xl transition-all",
            "bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800",
            "text-white border-0 group relative touch-manipulation"
          )}
          aria-label={`Gọi điện ${phoneNumber}`}
        >
          <Phone className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center animate-pulse font-bold">
            !
          </span>
        </Button>
        {/* Tooltip */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-lg whitespace-nowrap",
            "opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50",
            position === "right" ? "right-full mr-3" : "left-full ml-3"
          )}
        >
          Gọi ngay: {phoneNumber}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 border-4 border-transparent",
              position === "right"
                ? "right-0 translate-x-full border-l-gray-900"
                : "left-0 -translate-x-full border-r-gray-900"
            )}
          ></div>
        </div>
      </div>

      {/* Zalo Button */}
      <div
        className={cn(
          "relative transition-all duration-300 ease-out",
          isExpanded
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-0 pointer-events-none"
        )}
        style={{
          transitionDelay: isExpanded ? "0.2s" : "0s",
        }}
      >
        <Button
          onClick={handleZaloClick}
          className={cn(
            "rounded-full w-14 h-14 sm:w-16 sm:h-16 shadow-lg hover:shadow-xl transition-all",
            "bg-gradient-to-br from-[#0068FF] to-[#0052CC] hover:from-[#0052CC] hover:to-[#003D99]",
            "text-white border-0 group relative touch-manipulation p-0 overflow-hidden"
          )}
          aria-label="Chat Zalo"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="300"
              height="300"
              viewBox="0 0 50 50"
              fill="none"
              className="w-8 h-8 sm:w-10 sm:h-10"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M22.782 0.166016H27.199C33.2653 0.166016 36.8103 1.05701 39.9572 2.74421C43.1041 4.4314 45.5875 6.89585 47.2557 10.0428C48.9429 13.1897 49.8339 16.7347 49.8339 22.801V27.1991C49.8339 33.2654 48.9429 36.8104 47.2557 39.9573C45.5685 43.1042 43.1041 45.5877 39.9572 47.2559C36.8103 48.9431 33.2653 49.8341 27.199 49.8341H22.8009C16.7346 49.8341 13.1896 48.9431 10.0427 47.2559C6.89583 45.5687 4.41243 43.1042 2.7442 39.9573C1.057 36.8104 0.166016 33.2654 0.166016 27.1991V22.801C0.166016 16.7347 1.057 13.1897 2.7442 10.0428C4.43139 6.89585 6.89583 4.41245 10.0427 2.74421C13.1707 1.05701 16.7346 0.166016 22.782 0.166016Z"
                fill="#0068FF"
              />
              <path
                opacity="0.12"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M49.8336 26.4736V27.1994C49.8336 33.2657 48.9427 36.8107 47.2555 39.9576C45.5683 43.1045 43.1038 45.5879 39.9569 47.2562C36.81 48.9434 33.265 49.8344 27.1987 49.8344H22.8007C17.8369 49.8344 14.5612 49.2378 11.8104 48.0966L7.27539 43.4267L49.8336 26.4736Z"
                fill="#001A33"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.779 43.5892C10.1019 43.846 13.0061 43.1836 15.0682 42.1825C24.0225 47.1318 38.0197 46.8954 46.4923 41.4732C46.8209 40.9803 47.1279 40.4677 47.4128 39.9363C49.1062 36.7779 50.0004 33.22 50.0004 27.1316V22.7175C50.0004 16.629 49.1062 13.0711 47.4128 9.91273C45.7385 6.75436 43.2461 4.28093 40.0877 2.58758C36.9293 0.894239 33.3714 0 27.283 0H22.8499C17.6644 0 14.2982 0.652754 11.4699 1.89893C11.3153 2.03737 11.1636 2.17818 11.0151 2.32135C2.71734 10.3203 2.08658 27.6593 9.12279 37.0782C9.13064 37.0921 9.13933 37.1061 9.14889 37.1203C10.2334 38.7185 9.18694 41.5154 7.55068 43.1516C7.28431 43.399 7.37944 43.5512 7.779 43.5892Z"
                fill="white"
              />
              <path
                d="M20.5632 17H10.8382V19.0853H17.5869L10.9329 27.3317C10.7244 27.635 10.5728 27.9194 10.5728 28.5639V29.0947H19.748C20.203 29.0947 20.5822 28.7156 20.5822 28.2606V27.1421H13.4922L19.748 19.2938C19.8428 19.1801 20.0134 18.9716 20.0893 18.8768L20.1272 18.8199C20.4874 18.2891 20.5632 17.8341 20.5632 17.2844V17Z"
                fill="#0068FF"
              />
              <path
                d="M32.9416 29.0947H34.3255V17H32.2402V28.3933C32.2402 28.7725 32.5435 29.0947 32.9416 29.0947Z"
                fill="#0068FF"
              />
              <path
                d="M25.814 19.6924C23.1979 19.6924 21.0747 21.8156 21.0747 24.4317C21.0747 27.0478 23.1979 29.171 25.814 29.171C28.4301 29.171 30.5533 27.0478 30.5533 24.4317C30.5723 21.8156 28.4491 19.6924 25.814 19.6924ZM25.814 27.2184C24.2785 27.2184 23.0273 25.9672 23.0273 24.4317C23.0273 22.8962 24.2785 21.645 25.814 21.645C27.3495 21.645 28.6007 22.8962 28.6007 24.4317C28.6007 25.9672 27.3685 27.2184 25.814 27.2184Z"
                fill="#0068FF"
              />
              <path
                d="M40.4867 19.6162C37.8516 19.6162 35.7095 21.7584 35.7095 24.3934C35.7095 27.0285 37.8516 29.1707 40.4867 29.1707C43.1217 29.1707 45.2639 27.0285 45.2639 24.3934C45.2639 21.7584 43.1217 19.6162 40.4867 19.6162ZM40.4867 27.2181C38.9322 27.2181 37.681 25.9669 37.681 24.4124C37.681 22.8579 38.9322 21.6067 40.4867 21.6067C42.0412 21.6067 43.2924 22.8579 43.2924 24.4124C43.2924 25.9669 42.0412 27.2181 40.4867 27.2181Z"
                fill="#0068FF"
              />
              <path
                d="M29.4562 29.0944H30.5747V19.957H28.6221V28.2793C28.6221 28.7153 29.0012 29.0944 29.4562 29.0944Z"
                fill="#0068FF"
              />
            </svg>
          </div>
        </Button>
        {/* Tooltip */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-lg whitespace-nowrap",
            "opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50",
            position === "right" ? "right-full mr-3" : "left-full ml-3"
          )}
        >
          Chat Zalo
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 border-4 border-transparent",
              position === "right"
                ? "right-0 translate-x-full border-l-gray-900"
                : "left-0 -translate-x-full border-r-gray-900"
            )}
          ></div>
        </div>
      </div>

      {/* Instagram Button */}
      <div
        className={cn(
          "relative transition-all duration-300 ease-out",
          isExpanded
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-0 pointer-events-none"
        )}
        style={{
          transitionDelay: isExpanded ? "0.3s" : "0s",
        }}
      >
        <Button
          onClick={handleInstagramClick}
          className={cn(
            "rounded-full w-14 h-14 sm:w-16 sm:h-16 shadow-lg hover:shadow-xl transition-all",
            "bg-gradient-to-br from-[#E4405F] to-[#C13584] hover:from-[#C13584] hover:to-[#833AB4]",
            "text-white border-0 group relative touch-manipulation"
          )}
          aria-label="Instagram"
        >
          <Instagram className="w-6 h-6 sm:w-7 sm:h-7" />
        </Button>
        {/* Tooltip */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-lg whitespace-nowrap",
            "opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50",
            position === "right" ? "right-full mr-3" : "left-full ml-3"
          )}
        >
          Theo dõi Instagram
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 border-4 border-transparent",
              position === "right"
                ? "right-0 translate-x-full border-l-gray-900"
                : "left-0 -translate-x-full border-r-gray-900"
            )}
          ></div>
        </div>
      </div>
    </div>
  );
}
