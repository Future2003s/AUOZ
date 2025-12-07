"use client";
import { usePathname } from "next/navigation";
import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import CartSidebar from "@/components/ui/cart-sidebar";
import { useCartSidebar } from "@/context/cart-sidebar-context";
import { AdvertisementModal } from "@/components/AdvertisementModal";
import { FloatingCTA } from "@/components/floating-cta";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { StructuredData } from "@/components/StructuredData";
import ErrorBoundary from "@/components/ErrorBoundary";

function LayoutMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useCartSidebar();

  // check page admin - exclude header and footer for admin routes
  // Check if pathname contains /admin, /dashboard, or /employee (with or without locale prefix)
  const isAdminPage = pathname 
    ? /\/admin|\/dashboard|\/employee/.test(pathname)
    : false;

  return (
    <div>
      {/* Organization Structured Data - Global */}
      {!isAdminPage && (
        <StructuredData
          type="Organization"
          data={{}}
        />
      )}

      {!isAdminPage && <Header />}
      <ErrorBoundary>
        <main>{children}</main>
      </ErrorBoundary>
      {!isAdminPage && <Footer />}

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isOpen} onClose={closeSidebar} />
      
      {/* Advertisement Modal */}
      {!isAdminPage && <AdvertisementModal />}

      {/* Floating CTA - Order & Contact */}
      {!isAdminPage && <FloatingCTA />}

      {/* Scroll to Top Button */}
      {!isAdminPage && <ScrollToTopButton />}
    </div>
  );
}

export default LayoutMain;
