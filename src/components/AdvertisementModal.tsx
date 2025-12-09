"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { advertisementApi, type Advertisement } from "@/apiRequests/advertisements";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// Hook để detect mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export function AdvertisementModal() {
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || "vi";
  const { user } = useAuth();
  const userRole = user?.role;
  const isMobile = useIsMobile();
  const [advertisement, setAdvertisement] = useState<Advertisement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Kiểm tra xem có đang ở trang chủ không
  const isHomePage = () => {
    if (!pathname) return false;
    // Loại bỏ locale prefix và trailing slash để kiểm tra
    let normalizedPath = pathname;
    
    // Nếu có locale prefix, loại bỏ nó
    if (locale && normalizedPath.startsWith(`/${locale}`)) {
      normalizedPath = normalizedPath.slice(`/${locale}`.length);
    }
    
    // Loại bỏ trailing slash
    normalizedPath = normalizedPath.replace(/\/$/, "") || "/";
    
    // Trang chủ là khi path chỉ còn "/" hoặc rỗng
    return normalizedPath === "/" || normalizedPath === "";
  };

  useEffect(() => {
    // Chỉ hiển thị modal ở trang chủ
    if (!isHomePage()) {
      setIsLoading(false);
      return;
    }

    // Kiểm tra xem modal đã được hiển thị trong session này chưa
    const hasShownModal = sessionStorage.getItem("advertisementModalShown");
    if (hasShownModal === "true") {
      setIsLoading(false);
      return;
    }

    const fetchAdvertisement = async () => {
      try {
        setIsLoading(true);
        const response = await advertisementApi.getActive();
        
        if (response.success && response.data) {
          const ad = response.data;
          
          // Kiểm tra locale nếu có target audience
          if (ad.targetAudience?.locales && ad.targetAudience.locales.length > 0) {
            if (!ad.targetAudience.locales.includes(locale)) {
              setIsLoading(false);
              return;
            }
          }
          
          // Kiểm tra role nếu có target audience
          if (ad.targetAudience?.roles && ad.targetAudience.roles.length > 0) {
            if (!userRole || !ad.targetAudience.roles.includes(userRole)) {
              setIsLoading(false);
              return;
            }
          }
          
          setAdvertisement(ad);
          
          // Delay hiển thị theo delayTime với animation mượt mà
          if (ad.delayTime > 0) {
            setTimeout(() => {
              setIsAnimating(true);
              setIsOpen(true);
              // Đánh dấu đã hiển thị modal trong session này
              sessionStorage.setItem("advertisementModalShown", "true");
            }, ad.delayTime);
          } else {
            setIsAnimating(true);
            setIsOpen(true);
            // Đánh dấu đã hiển thị modal trong session này
            sessionStorage.setItem("advertisementModalShown", "true");
          }
          
          // Tự động đóng nếu có autoCloseTime
          if (ad.autoCloseTime && ad.autoCloseTime > 0) {
            setTimeout(() => {
              setIsOpen(false);
            }, ad.delayTime + ad.autoCloseTime);
          }
        } else {
        }
      } catch (error) {
        console.error("❌ Error fetching advertisement:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdvertisement();
  }, [locale, userRole, pathname]);

  const handleClose = () => {
    setIsOpen(false);
    // Reset animation state sau khi đóng
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
    // Đánh dấu đã hiển thị modal khi người dùng đóng
    sessionStorage.setItem("advertisementModalShown", "true");
  };

  // Thêm style cho overlay để animation mượt hơn
  useEffect(() => {
    if (isOpen || isAnimating) {
      const style = document.createElement("style");
      style.id = "advertisement-modal-overlay-style";
      style.textContent = `
        [data-radix-dialog-overlay] {
          animation-duration: 300ms !important;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
      `;
      document.head.appendChild(style);
      return () => {
        const existingStyle = document.getElementById("advertisement-modal-overlay-style");
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [isOpen, isAnimating]);

  const handleClickOutside = (e: React.MouseEvent) => {
    if (advertisement?.closeOnClickOutside && e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (advertisement?.closeOnEscape && e.key === "Escape") {
      handleClose();
    }
  };

  if (isLoading || !advertisement || (!isOpen && !isAnimating)) {
    return null;
  }

  const getPositionClasses = () => {
    // DialogContent mặc định đã có center positioning, chỉ cần override khi cần
    return "";
  };

  // Responsive styles based on screen size
  const getResponsiveStyles = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: "auto",
      height: "auto",
    };

    // Mobile: force responsive values
    if (isMobile) {
      return {
        ...baseStyle,
        width: "calc(100vw - 2rem)",
        maxWidth: "calc(100vw - 2rem)",
        maxHeight: "90vh",
      };
    }

    // Desktop: use configured values
    return {
      ...baseStyle,
      width: advertisement.width && advertisement.width !== "auto" ? advertisement.width : "auto",
      height: advertisement.height && advertisement.height !== "auto" ? advertisement.height : "auto",
      maxWidth: advertisement.maxWidth || "90vw",
      maxHeight: advertisement.maxHeight || "90vh",
    };
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          setIsOpen(false);
        }
      }}
    >
      <DialogContent
        className={cn(
          "gap-0 p-0 overflow-hidden",
          "w-[calc(100vw-2rem)] sm:w-auto",
          "max-w-[calc(100vw-2rem)] sm:max-w-[90vw]",
          "max-h-[90vh]",
          "m-2 sm:m-4 md:m-auto",
          "rounded-lg sm:rounded-xl",
          // Smooth animation effects
          "duration-300 ease-out",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-90 data-[state=open]:zoom-in-100",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          getPositionClasses()
        )}
        style={getResponsiveStyles()}
        onInteractOutside={(e) => {
          if (!advertisement.closeOnClickOutside) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!advertisement.closeOnEscape) {
            e.preventDefault();
          }
        }}
      >
        <DialogTitle className="sr-only">
          {advertisement.title || "Quảng cáo"}
        </DialogTitle>
        <div className="relative w-full h-full flex flex-col max-h-[90vh] overflow-hidden">
          {/* Close button */}
          {advertisement.showCloseButton && (
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 rounded-full bg-black/60 hover:bg-black/80 active:bg-black/90 text-white p-1.5 sm:p-2 transition-all shadow-lg touch-manipulation"
              aria-label="Đóng"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}

          {/* Scrollable content container */}
          <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {/* Image */}
            {advertisement.imageUrl && (
              <div className="relative w-full h-auto min-h-[200px] sm:min-h-[300px] bg-gray-50 flex items-center justify-center">
                <Image
                  src={advertisement.imageUrl}
                  alt={advertisement.title || "Quảng cáo"}
                  width={800}
                  height={600}
                  className="w-full h-auto max-h-[60vh] sm:max-h-[70vh] object-contain"
                  unoptimized
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 800px"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-4 sm:p-6 md:p-8 bg-white">
              {advertisement.title && (
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 md:mb-4 text-gray-900 leading-tight">
                  {advertisement.title}
                </h2>
              )}
              
              <div
                className="text-gray-700 mb-4 sm:mb-6 prose prose-sm sm:prose-base max-w-none"
                style={{
                  fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
                  lineHeight: "1.6",
                }}
                dangerouslySetInnerHTML={{ __html: advertisement.content }}
              />

              {/* Link button */}
              {advertisement.link && (
                <div className="flex justify-start sm:justify-start">
                  <Button
                    asChild
                    className="w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 min-h-[44px] touch-manipulation"
                  >
                    <a
                      href={advertisement.link}
                      target={advertisement.link.startsWith("http") ? "_blank" : "_self"}
                      rel={advertisement.link.startsWith("http") ? "noopener noreferrer" : undefined}
                      onClick={handleClose}
                    >
                      {advertisement.linkText || "Xem thêm"}
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

