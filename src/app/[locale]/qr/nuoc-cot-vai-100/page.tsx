import type { Metadata } from "next";
import { envConfig } from "@/config";
import NuocCotVai100Landing from "@/components/pages/qr/NuocCotVai100Landing";

const baseUrl = envConfig.NEXT_PUBLIC_URL || "https://lala-lycheee.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale = "vi" } = await params;
  const title = "Nước Cốt Vải 100% Thanh Hà | LALA-LYCHEEE";
  const description =
    "Quét QR để tìm hiểu sản phẩm Nước Cốt Vải 100% Thanh Hà. Xem thông tin, lợi ích và đặt hàng nhanh (COD/Thanh toán online).";
  const url = `${baseUrl}/${locale}/qr/nuoc-cot-vai-100`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      images: [
        {
          url: "/images/logo.png",
          width: 1200,
          height: 630,
          alt: "LALA-LYCHEEE",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/logo.png"],
    },
  };
}

export default function NuocCotVai100QrPage() {
  return <NuocCotVai100Landing />;
}

