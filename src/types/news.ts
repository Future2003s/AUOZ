export type NewsStatus = "draft" | "published";

export type NewsContentBlock =
  | { type: "p"; content: string }
  | { type: "h2" | "h3"; id?: string; content: string }
  | { type: "quote"; content: string }
  | { type: "ul"; content: string[] }
  | { type: "img"; src: string; caption?: string };

export interface NewsArticle {
  _id?: string;
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  contentBlocks?: NewsContentBlock[];
  coverImage?: string;
  category?: string;
  tags?: string[];
  authorName?: string;
  authorRole?: string;
  readTime?: string;
  locale: string;
  status: NewsStatus;
  isFeatured: boolean;
  views?: number;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

