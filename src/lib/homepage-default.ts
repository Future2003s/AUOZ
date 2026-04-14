import { HomepageSettings } from "@/types/homepage";

export const defaultHomepageSettings: HomepageSettings = {
  typography: {
    fontFamily: "Playfair Display, 'Be Vietnam Pro', sans-serif",
    baseSize: 16,
    headingScale: { h1: 3, h2: 2, h3: 1.5 },
    lineHeight: 1.6,
  },
  colors: {
    primary: "#E11D48", // rose-600 - màu vải thiều chín
    secondary: "#F97316", // orange-500 - màu cam đào
    accent: "#FB923C", // orange-400 - màu cam đào nhạt (vải chín)
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
            title: "",
            subtitle: "",
            cta: { label: "", href: "/vi/products" },
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
        phrases: [],
        speed: 30,
      },
    },
    about: {
      enabled: true,
      order: 2,
      data: {
        heading: "",
        body: "",
        media: {
          url: "https://res.cloudinary.com/demo/image/upload/v1720000000/about.jpg",
          alt: "About",
        },
        founderName: "",
        founderTitle: "",
        founderQuote: "",
      },
    },
    featuredProducts: {
      enabled: true,
      order: 3,
      data: { productIds: [], layout: "grid" },
    },
    socialProof: { enabled: true, order: 4, data: { testimonials: [], logos: [] } },
    collection: { enabled: true, order: 5, data: { cards: [] } },
    craft: {
      enabled: true,
      order: 6,
      data: {
        heading: "",
        subheading: "",
        steps: [
          {
            title: "",
            description: "",
            imageUrl:
              "https://images.unsplash.com/photo-1552010099-5dc86fcfaa38?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODB8fGZydWl0c3xlbnwwfHwwfHx8MA%3D%3D",
          },
          {
            title: "",
            description: "",
            imageUrl:
              "https://plus.unsplash.com/premium_photo-1700145523324-1da4b9000d80?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODV8fGZydWl0c3xlbnwwfHwwfHx8MA%3D%3D",
          },
          {
            title: "",
            description: "",
            imageUrl:
              "https://images.unsplash.com/photo-1559181567-c3190ca9959b?q=80&w=800&auto=format&fit=crop",
          },
        ],
      },
    },
    map: {
      enabled: true,
      order: 7,
      data: {
        title: "",
        description: "",
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

