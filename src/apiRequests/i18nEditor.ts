/**
 * i18nEditor.ts
 * API request helper cho trang JSON Editor admin
 * Dùng endpoint /api/v1/i18n/:locale (I18nTranslation model)
 * Auth: x-api-key header dùng NEXT_PUBLIC_TRANSLATION_API_KEY
 */
import { buildApiUrl, getCommonHeaders } from "../lib/api-config";

const BASE = "/i18n";

/** Header với API key cho các endpoint write (PATCH / DELETE / POST /bulk) */
function getApiKeyHeaders(): Record<string, string> {
  return {
    ...getCommonHeaders(),
    "x-api-key": process.env.NEXT_PUBLIC_TRANSLATION_API_KEY || "",
  };
}

/** Header với API key + Content-Type JSON cho các endpoint gửi body */
function getApiKeyJsonHeaders(): Record<string, string> {
  return {
    ...getApiKeyHeaders(),
    "Content-Type": "application/json",
  };
}

export interface I18nItem {
  key: string;    // dot-notation: "home.welcome"
  value: string;
  namespace?: string;
}

export interface I18nListResponse {
  success: boolean;
  locale: string;
  data: I18nItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface I18nNestedResponse {
  success: boolean;
  locale: string;
  count: number;
  data: Record<string, any>;
}

/**
 * Lấy tất cả keys theo locale (flat list, phân trang)
 * GET /i18n/:locale/list?page=1&limit=500&search=...
 */
export async function fetchI18nList(
  locale: string,
  page = 1,
  limit = 500,
  search = ""
): Promise<I18nListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.append("search", search);

  const url = buildApiUrl(`${BASE}/${locale}/list`) + `?${params}`;
  const res = await fetch(url, {
    method: "GET",
    headers: getApiKeyHeaders(),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Failed to fetch i18n list for locale ${locale}`);
  return res.json();
}

/**
 * Lấy toàn bộ translations dạng nested JSON
 * GET /i18n/:locale
 */
export async function fetchI18nNested(locale: string): Promise<I18nNestedResponse> {
  const url = buildApiUrl(`${BASE}/${locale}`);
  const res = await fetch(url, {
    method: "GET",
    headers: getCommonHeaders(),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Failed to fetch i18n for locale ${locale}`);
  return res.json();
}

/**
 * Upsert một key-value
 * PATCH /i18n/:locale  body: { key, value, namespace? }
 */
export async function upsertI18nKey(
  locale: string,
  key: string,
  value: string,
  namespace = "common"
): Promise<{ success: boolean; message: string }> {
  const url = buildApiUrl(`${BASE}/${locale}`);
  const res = await fetch(url, {
    method: "PATCH",
    headers: getApiKeyJsonHeaders(),
    body: JSON.stringify({ key, value, namespace }),
  });

  if (!res.ok) throw new Error(`Failed to upsert key ${key}`);
  return res.json();
}

/**
 * Xóa một key
 * DELETE /i18n/:locale/:key
 */
export async function deleteI18nKey(
  locale: string,
  key: string
): Promise<{ success: boolean; message: string }> {
  const encodedKey = encodeURIComponent(key);
  const url = buildApiUrl(`${BASE}/${locale}/${encodedKey}`);
  const res = await fetch(url, {
    method: "DELETE",
    headers: getApiKeyHeaders(),
  });

  if (!res.ok) throw new Error(`Failed to delete key ${key}`);
  return res.json();
}

/**
 * Bulk import từ nested JSON object
 * POST /i18n/:locale/bulk  body: nested JSON
 */
export async function bulkImportI18n(
  locale: string,
  nestedData: Record<string, any>
): Promise<{ success: boolean; data: any }> {
  const url = buildApiUrl(`${BASE}/${locale}/bulk`);
  const res = await fetch(url, {
    method: "POST",
    headers: getApiKeyJsonHeaders(),
    body: JSON.stringify(nestedData),
  });

  if (!res.ok) throw new Error(`Failed to bulk import for locale ${locale}`);
  return res.json();
}

/**
 * Export file .json
 * GET /i18n/:locale/export
 */
export function getExportUrl(locale: string): string {
  // Appends API key as query param for browser download
  const key = process.env.NEXT_PUBLIC_TRANSLATION_API_KEY || "";
  const base = buildApiUrl(`${BASE}/${locale}/export`);
  return key ? `${base}?x-api-key=${encodeURIComponent(key)}` : base;
}

/**
 * Convert flat list to nested object grouping by first segment (section)
 * "home.welcome" → sections["home"]["welcome"]
 */
export function flatListToSections(
  items: I18nItem[]
): Record<string, Record<string, string>> {
  const sections: Record<string, Record<string, string>> = {};

  for (const item of items) {
    const dotIdx = item.key.indexOf(".");
    let section: string;
    let subKey: string;

    if (dotIdx === -1) {
      // No dot → top-level key, put in "__root__" section
      section = "__root__";
      subKey = item.key;
    } else {
      section = item.key.slice(0, dotIdx);
      subKey = item.key.slice(dotIdx + 1);
    }

    if (!sections[section]) sections[section] = {};
    sections[section][subKey] = item.value;
  }

  return sections;
}

/**
 * Convert sections back to flat dot-notation keys
 * sections["home"]["welcome"] → { "home.welcome": value }
 */
export function sectionsToFlatKeys(
  sections: Record<string, Record<string, string>>,
  locale: string
): Array<{ key: string; value: string; section: string }> {
  const result: Array<{ key: string; value: string; section: string }> = [];

  for (const [section, keys] of Object.entries(sections)) {
    for (const [subKey, value] of Object.entries(keys)) {
      const fullKey = section === "__root__" ? subKey : `${section}.${subKey}`;
      result.push({ key: fullKey, value, section });
    }
  }

  return result;
}
