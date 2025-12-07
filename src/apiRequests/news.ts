import { http } from "@/lib/http";
import { NewsArticle, NewsStatus } from "@/types/news";

export interface NewsListResponse {
  success: boolean;
  data: NewsArticle[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface NewsResponse {
  success: boolean;
  data: NewsArticle;
}

export const newsApi = {
  list: async (params?: {
    locale?: string;
    search?: string;
    page?: number;
  }): Promise<NewsListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.locale) searchParams.append("locale", params.locale);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.page) searchParams.append("page", String(params.page));
    const query = searchParams.toString();
    return http.get(`/api/news${query ? `?${query}` : ""}`, { baseUrl: "" });
  },
  getBySlug: async (slug: string, locale?: string): Promise<NewsResponse> => {
    const searchParams = new URLSearchParams();
    if (locale) searchParams.append("locale", locale);
    const query = searchParams.toString();
    return http.get(
      `/api/news/${slug}${query ? `?${query}` : ""}`,
      { baseUrl: "" }
    );
  },
  create: async (payload: Partial<NewsArticle>, token?: string) => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return http.post("/api/news", payload, {
      baseUrl: "",
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    } as any);
  },
  update: async (
    id: string,
    payload: Partial<NewsArticle>,
    token?: string
  ) => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return http.put(`/api/news/admin/${id}`, payload, {
      baseUrl: "",
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    } as any);
  },
  delete: async (id: string, token?: string) => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return http.delete(`/api/news/admin/${id}`, {
      baseUrl: "",
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    } as any);
  },
  adminList: async (
    params: { status?: NewsStatus | "all"; locale?: string; search?: string } = {},
    token?: string // Optional: token will be sent via cookie if not provided
  ) => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== "all") {
      searchParams.append("status", params.status);
    }
    if (params.locale) searchParams.append("locale", params.locale);
    if (params.search) searchParams.append("search", params.search);
    const query = searchParams.toString();
    
    // Token is sent via httpOnly cookie, so we don't need to pass it in header
    // But if token is provided, we'll use it for backward compatibility
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return http.get(
      `/api/news/admin/list${query ? `?${query}` : ""}`,
      {
        baseUrl: "",
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        // credentials: 'include' is needed to send cookies
      } as any
    );
  },
  getById: async (id: string, token?: string): Promise<NewsResponse> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return http.get(`/api/news/admin/${id}`, {
      baseUrl: "",
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    } as any);
  },
};

