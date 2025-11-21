export type NewsStatus = "draft" | "published";

export interface NewsArticle {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  authorName?: string;
  authorRole?: string;
  readTime?: string;
  locale: string;
  status: NewsStatus;
  isFeatured: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

