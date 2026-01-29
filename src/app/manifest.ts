import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LALA-LYCHEEE - Employee Portal",
    short_name: "LALA Employee",
    description: "CÔNG TY TNHH LALA-LYCHEEE - Hệ thống quản lý nhân viên",
    start_url: "/vi/employee",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    background_color: "#ffffff",
    theme_color: "#e11d48",
    orientation: "any",
    lang: "vi",
    categories: ["business", "productivity"],
    shortcuts: [
      {
        name: "Đơn hàng",
        short_name: "Đơn hàng",
        description: "Quản lý đơn hàng",
        url: "/vi/employee/orders",
        icons: [{ src: "/images/logo.png", sizes: "192x192" }],
      },
      {
        name: "Nhiệm vụ",
        short_name: "Nhiệm vụ",
        description: "Xem nhiệm vụ",
        url: "/vi/employee/tasks",
        icons: [{ src: "/images/logo.png", sizes: "192x192" }],
      },
      {
        name: "Gửi hàng",
        short_name: "Gửi hàng",
        description: "Chụp ảnh gửi hàng",
        url: "/vi/employee/shipping",
        icons: [{ src: "/images/logo.png", sizes: "192x192" }],
      },
    ],
    icons: [
      {
        src: "/images/logo.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/logo.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/logo.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/logo.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/logo.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/images/logo.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
