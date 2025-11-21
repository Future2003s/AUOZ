"use client";
import { usePathname } from "next/navigation";
import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import CartSidebar from "@/components/ui/cart-sidebar";
import { useCartSidebar } from "@/context/cart-sidebar-context";
import { AdvertisementModal } from "@/components/AdvertisementModal";
import { FloatingContactButtons } from "@/components/FloatingContactButtons";

function LayoutMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useCartSidebar();

  // check page admin
  const isAdminPage = pathname.startsWith("/dashboard");

  return (
    <div>
      {!isAdminPage && <Header />}
      <main>{children}</main>
      {!isAdminPage && <Footer />}

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isOpen} onClose={closeSidebar} />
      
      {/* Advertisement Modal */}
      {!isAdminPage && <AdvertisementModal />}

      {/* Floating Contact Buttons */}
      {!isAdminPage && (
        <FloatingContactButtons
          phoneNumber={process.env.NEXT_PUBLIC_CONTACT_PHONE || "0962215666"}
          zaloLink={process.env.NEXT_PUBLIC_ZALO_LINK || "https://zalo.me/0962215666"}
          instagramLink={process.env.NEXT_PUBLIC_INSTAGRAM_LINK || "https://www.instagram.com/lala_lycheee?igsh=M2x5cmgwdmZrcDh1&utm_source=qr"}
          position="right"
        />
      )}
    </div>
  );
}

export default LayoutMain;
