import {
  API_CONFIG,
  buildApiUrl,
  getAuthHeaders,
  getCommonHeaders,
} from "../lib/api-config";

// Types
export interface TranslationV2Data {
  key: string;
  baseKey: string;
  locale: string;
  variant?: string;
  category:
    | "product"
    | "category"
    | "brand"
    | "ui"
    | "error"
    | "success"
    | "validation"
    | "email"
    | "notification"
    | "selling_point"
    | "message";
  value: string;
  description?: string;
  isActive?: boolean;
}

export interface TranslationV2Response {
  success: boolean;
  message: string;
  data?: any;
}

export interface PaginatedTranslationsV2 {
  translations: TranslationV2Data[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Functions
export const translationV2Api = {
  // Get translation by key
  async getByKey(
    key: string,
    locale?: string,
    variant?: string
  ): Promise<TranslationV2Response> {
    const url = buildApiUrl("/translations-v2/key/:key", { key: key });
    const params = new URLSearchParams();
    if (locale) params.append("locale", locale);
    if (variant) params.append("variant", variant);

    const response = await fetch(`${url}?${params}`, {
      method: "GET",
      headers: getCommonHeaders(),
    });

    return response.json();
  },

  // Get multiple translations by keys
  async getByKeys(
    keys: string[],
    locale?: string
  ): Promise<TranslationV2Response> {
    const url = buildApiUrl("/translations-v2/bulk");
    const params = new URLSearchParams();
    if (locale) params.append("locale", locale);

    const response = await fetch(`${url}?${params}`, {
      method: "POST",
      headers: getCommonHeaders(),
      body: JSON.stringify({ keys }),
    });

    return response.json();
  },

  // Get all translations for a locale
  async getAll(locale?: string): Promise<TranslationV2Response> {
    const url = buildApiUrl("/translations-v2/all");
    const params = new URLSearchParams();
    if (locale) params.append("locale", locale);

    const response = await fetch(`${url}?${params}`, {
      method: "GET",
      headers: getCommonHeaders(),
    });

    return response.json();
  },

  // Get translations by baseKey
  async getByBaseKey(
    baseKey: string,
    variant?: string
  ): Promise<TranslationV2Response> {
    const url = buildApiUrl("/translations-v2/base/:baseKey", { baseKey });
    const params = new URLSearchParams();
    if (variant) params.append("variant", variant);

    const response = await fetch(`${url}?${params}`, {
      method: "GET",
      headers: getCommonHeaders(),
    });

    return response.json();
  },

  // Admin functions
  // Get paginated translations (Admin)
  async getPaginated(
    token: string,
    page: number = 1,
    limit: number = 20,
    locale?: string,
    category?: string,
    search?: string,
    baseKey?: string
  ): Promise<TranslationV2Response> {
    const url = buildApiUrl("/translations-v2/admin");
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (locale) params.append("locale", locale);
    if (category) params.append("category", category);
    if (search) params.append("search", search);
    if (baseKey) params.append("baseKey", baseKey);

    const response = await fetch(`${url}?${params}`, {
      method: "GET",
      headers: getAuthHeaders(token),
    });

    return response.json();
  },

  // Create or update translation (Admin)
  async upsert(
    data: {
      key: string;
      value: string;
      category: TranslationV2Data["category"];
      description?: string;
    },
    token: string
  ): Promise<TranslationV2Response> {
    const url = buildApiUrl("/translations-v2/admin");

    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });

    return response.json();
  },

  // Bulk import translations (Admin)
  async bulkImport(
    translations: Array<{
      key: string;
      value: string;
      category: TranslationV2Data["category"];
      description?: string;
    }>,
    token: string
  ): Promise<TranslationV2Response> {
    const url = buildApiUrl("/translations-v2/admin/bulk-import");

    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify({ translations }),
    });

    return response.json();
  },
};

