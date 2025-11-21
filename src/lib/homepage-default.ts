import { HomepageSettings } from "@/types/homepage";

export const defaultHomepageSettings: HomepageSettings = {
  typography: {
    fontFamily: "Playfair Display",
    baseSize: 16,
    headingScale: { h1: 3, h2: 2, h3: 1.5 },
    lineHeight: 1.6,
  },
  colors: {
    primary: "#1D4ED8",
    secondary: "#9333EA",
    accent: "#F97316",
    background: "#FFFFFF",
    text: "#0F172A",
    muted: "#94A3B8",
  },
  sections: {
    hero: {
      enabled: true,
      order: 0,
      data: {
        slides: [
          {
            title: "Tinh tuý từ thiên nhiên",
            subtitle:
              "Sản phẩm mật ong thuần khiết được tuyển chọn cẩn thận cho gia đình bạn.",
            cta: { label: "Khám phá ngay", href: "/vi/products" },
            desktopImage: {
              url: "https://res.cloudinary.com/demo/image/upload/v1720000000/hero-default.jpg",
              alt: "Hero",
            },
            overlayOpacity: 0.35,
          },
        ],
      },
    },
    marquee: {
      enabled: true,
      order: 1,
      data: {
        phrases: [
          "100% Vải Tươi Tuyển Chọn",
          "Công Thức Độc Quyền",
          "Quà Tặng Sang Trọng",
          "Giao Hàng Toàn Quốc",
        ],
        speed: 40,
      },
    },
    about: {
      enabled: true,
      order: 2,
      data: {
        heading: "Câu chuyện của chúng tôi",
        body: "Được nuôi dưỡng từ những vườn hoa tốt nhất, mỗi giọt mật mang trong mình sự tận tâm.",
        media: {
          url: "https://res.cloudinary.com/demo/image/upload/v1720000000/about.jpg",
          alt: "About",
        },
      },
    },
    featuredProducts: {
      enabled: true,
      order: 3,
      data: { productIds: [], layout: "grid" },
    },
    socialProof: { enabled: true, order: 4, data: { testimonials: [], logos: [] } },
    collection: { enabled: true, order: 5, data: { cards: [] } },
    craft: { enabled: true, order: 6, data: { steps: [] } },
    map: {
      enabled: true,
      order: 7,
      data: {
        title: "Nhà máy của chúng tôi",
        description: "Hải Phòng, Việt Nam",
        coordinates: { lat: 20.85, lng: 106.68 },
      },
    },
  },
  seo: {
    title: "Trang chủ",
    description: "Thương hiệu mật ong cao cấp",
    coverImage: {
      url: "https://res.cloudinary.com/demo/image/upload/v1720000000/seo-cover.jpg",
      alt: "Cover",
    },
  },
};

