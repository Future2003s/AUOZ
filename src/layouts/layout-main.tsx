"use client";
import { usePathname } from "next/navigation";
import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import CartSidebar from "@/components/ui/cart-sidebar";
import { useCartSidebar } from "@/context/cart-sidebar-context";
import { AdvertisementModal } from "@/components/AdvertisementModal";
import { FloatingCTA } from "@/components/floating-cta";
import { NewsletterCTASection } from "@/components/newsletter-cta-section";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";

function LayoutMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useCartSidebar();

  // check page admin
  const isAdminPage = pathname.startsWith("/dashboard");

  return (
    <div>
      {!isAdminPage && <Header />}
      <main>{children}</main>
      {!isAdminPage && (
        <>
          <NewsletterCTASection />
          <Footer />
        </>
      )}

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
