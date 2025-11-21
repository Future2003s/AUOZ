import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: {
    // Cho phép SVG từ placehold.co
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.tomibun.vn",
        port: "",
        pathname: "/**",
      },
      // Backend images (nếu có)
      {
        protocol: "http",
        hostname: "localhost",
        port: "8081",
        pathname: "/uploads/**",
      },
      // Cloud storage providers
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "zod/dist/esm": "zod/v3",
      "zod/dist": "zod/v3",
    };
    return config;
  },
};
export default nextConfig;
