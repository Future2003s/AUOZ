import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { NextFont } from "next/dist/compiled/@next/font";
import NextTopLoader from "nextjs-toploader";
import AppProvider from "@/context/app-provider";
import LayoutMain from "@/layouts/layout-main";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import AppContext from "@/context/app-context";
import { CartProvider } from "@/context/cart-context";
import { CartSidebarProvider } from "@/context/cart-sidebar-context";
import { ThemeProvider } from "@/context/theme-context";
import { QueryProvider } from "@/providers/query-provider";
import { I18nProvider } from "../i18n/I18nProvider";

const fontSans: NextFont = Quicksand({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LALA-LYCHEEE",
  description: "CÔNG TY TNHH LALA-LYCHEEE",
  themeColor: "#e11d48",
  icons: {
    icon: [
      { url: "/images/logo.png", type: "image/png", sizes: "192x192" },
      { url: "/images/logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/images/logo.png" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("sessionToken");

  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${fontSans.className}`} suppressHydrationWarning>
        <NextTopLoader
          color="#e11d48"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          showSpinner={false}
        />
        <AppProvider>
          <AppContext initialSessionToken={sessionToken?.value as string}>
            <QueryProvider>
              <CartProvider>
                <CartSidebarProvider>
                  <ThemeProvider>
                    <I18nProvider>
                      <LayoutMain>{children}</LayoutMain>
                    </I18nProvider>
                  </ThemeProvider>
                </CartSidebarProvider>
              </CartProvider>
            </QueryProvider>
          </AppContext>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
