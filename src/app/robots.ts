import type { MetadataRoute } from "next";
import { envConfig } from "@/config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = envConfig.NEXT_PUBLIC_URL || "https://lalalycheee.vn";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/employee/",
          "/me/",
          "/payment/",
          "/payment-callback/",
          "/cart/",
          "/login/",
          "/register/",
          "/forget-password/",
          "/test/",
          "/test-api/",
          "/management-test/",
          "/admin-test/",
          "/crud-test/",
          "/dropdown-test/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/employee/",
          "/me/",
          "/payment/",
          "/payment-callback/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
