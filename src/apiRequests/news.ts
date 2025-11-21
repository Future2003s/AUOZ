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
  create: async (payload: Partial<NewsArticle>, token: string) => {
    return http.post("/api/news", payload, {
      baseUrl: "",
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  update: async (
    id: string,
    payload: Partial<NewsArticle>,
    token: string
  ) => {
    return http.put(`/api/news/admin/${id}`, payload, {
      baseUrl: "",
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  delete: async (id: string, token: string) => {
    return http.delete(`/api/news/admin/${id}`, {
      baseUrl: "",
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  adminList: async (
    params: { status?: NewsStatus | "all"; locale?: string; search?: string } = {},
    token: string
  ) => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== "all") {
      searchParams.append("status", params.status);
    }
    if (params.locale) searchParams.append("locale", params.locale);
    if (params.search) searchParams.append("search", params.search);
    const query = searchParams.toString();
    return http.get(
      `/api/news/admin/list${query ? `?${query}` : ""}`,
      {
        baseUrl: "",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },
};

