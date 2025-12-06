import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tối ưu hiệu năng tối đa cho trải nghiệm mượt mà
  experimental: {
    // Tối ưu package imports để giảm bundle size (experimental nhưng rất hữu ích)
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-select",
      "@radix-ui/react-avatar",
      "@tanstack/react-query",
      "framer-motion",
      "recharts",
    ],
  },
  
  // Tối ưu server components
  serverExternalPackages: [],

  // Tối ưu compiler
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Tối ưu image optimization cho hiệu năng cao
  images: {
    // Cho phép SVG từ placehold.co
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    // Cấu hình quality cho images
    qualities: [100, 90, 75, 50],

    // Tối ưu formats và sizes cho hiệu năng tốt nhất
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Đầy đủ sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 640], // Đầy đủ sizes

    // Tăng cache TTL để giảm tải server
    minimumCacheTTL: 31536000, // Cache 1 năm
    // Tối ưu loader
    loader: "default",
    loaderFile: undefined,

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
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Tối ưu webpack cho hiệu năng cao
  webpack: (config, { isServer, dev }) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "zod/dist/esm": "zod/v3",
      "zod/dist": "zod/v3",
    };

    // Tối ưu cho production client bundle
    if (!dev && !isServer) {
      // Tối ưu chunk splitting cho client
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            framework: {
              chunks: "all",
              name: "framework",
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name: "lib",
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            commons: {
              name: "commons",
              minChunks: 2,
              priority: 20,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              priority: -10,
              chunks: "all",
            },
          },
        },
      };
    }

    return config;
  },

  // Tối ưu output
  output: "standalone", // Giảm kích thước build output

  // Compress responses
  compress: true,

  // Tối ưu on-demand entries để giữ nhiều pages trong memory
  onDemandEntries: {
    // Giữ pages trong memory lâu hơn để tăng tốc độ
    maxInactiveAge: 25 * 1000, // 25 giây
    pagesBufferLength: 10, // Giữ 10 pages để tăng tốc độ navigation
  },

  // Tối ưu poweredByHeader
  poweredByHeader: false,

  // Tối ưu production source maps
  productionBrowserSourceMaps: false,

  // Tối ưu React strict mode (có thể tắt trong production để tăng hiệu năng)
  reactStrictMode: true,
};

export default nextConfig;
