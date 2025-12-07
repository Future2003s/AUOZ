// Common meta types for categories and brands

export interface Category {
  _id?: string;
  id?: string;
  name?: string;
  categoryName?: string;
  title?: string;
  label?: string;
  value?: string | number;
  slug?: string;
  description?: string;
  image?: string;
  parentId?: string;
  children?: Category[];
  [key: string]: unknown; // Allow additional properties
}

export interface Brand {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  label?: string;
  value?: string | number;
  slug?: string;
  description?: string;
  image?: string;
  [key: string]: unknown; // Allow additional properties
}

export interface NavLink {
  label: string;
  href: string;
  subItems?: NavLink[];
  query?: string;
  categoryId?: string;
  categorySlug?: string;
}

