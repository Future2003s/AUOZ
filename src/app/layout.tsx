import type { Metadata, Viewport } from "next";
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
import { envConfig } from "@/config";

const fontSans: NextFont = Quicksand({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const baseUrl = envConfig.NEXT_PUBLIC_URL || "https://lala-lycheee.com";
const siteName = "LALA-LYCHEEE";
const defaultDescription = "CÔNG TY TNHH LALA-LYCHEEE - Chuyên sản xuất và phân phối các sản phẩm từ vải thiều và mật ong chất lượng cao";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    "vải thiều",
    "mật ong",
    "LALA-LYCHEEE",
    "sản phẩm tự nhiên",
    "lychee",
    "honey",
    "organic",
  ],
  authors: [{ name: "LALA-LYCHEEE" }],
  creator: "LALA-LYCHEEE",
  publisher: "LALA-LYCHEEE",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/images/logo.png", type: "image/png", sizes: "192x192" },
      { url: "/images/logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/images/logo.png" }],
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: baseUrl,
    siteName: siteName,
    title: siteName,
    description: defaultDescription,
    images: [
      {
        url: "/images/logo.png",
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: defaultDescription,
    images: ["/images/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
};

export const viewport: Viewport = {
  themeColor: "#e11d48",
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
