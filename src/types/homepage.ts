export type HomepageTypography = {
  fontFamily: string;
  fontUrl?: string;
  baseSize: number;
  headingScale: {
    h1: number;
    h2: number;
    h3: number;
  };
  lineHeight: number;
};

export type HomepageColors = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
};

export type HomepageHeroSlide = {
  title: string;
  subtitle?: string;
  cta?: { label: string; href: string; variant?: string };
  desktopImage: { url: string; alt?: string };
  mobileImage?: { url: string; alt?: string };
  overlayOpacity?: number;
};

export type HomepageSection<TData = any> = {
  enabled: boolean;
  order: number;
  data: TData;
};

export interface HomepageSettings {
  _id?: string;
  version?: number;
  status?: "draft" | "published";
  typography: HomepageTypography;
  colors: HomepageColors;
  sections: {
    hero: HomepageSection<{ slides: HomepageHeroSlide[] }>;
    marquee: HomepageSection<{ phrases: string[]; speed?: number }>;
    about: HomepageSection<{ heading?: string; body?: string; media?: { url: string; alt?: string } }>;
    featuredProducts: HomepageSection<{ productIds: string[]; layout?: "grid" | "carousel" }>;
    socialProof: HomepageSection<{ testimonials: any[]; logos: any[] }>;
    collection: HomepageSection<{ cards: any[] }>;
    craft: HomepageSection<{ steps: any[] }>;
    map: HomepageSection<{ title?: string; description?: string; coordinates?: { lat: number; lng: number } }>;
  };
  seo: {
    title: string;
    description: string;
    coverImage?: { url: string; alt?: string };
  };
  updatedAt?: string;
}

