/**
 * translationService.ts
 * Service layer tập trung mọi lời gọi API quản lý translation (i18n)
 * Kết nối tới backend route /api/v1/i18n/:locale
 *
 * Tất cả write operations đều gửi x-api-key header.
 * API key được đọc từ process.env.TRANSLATION_API_KEY (server-side only).
 */

/** Kiểu cho một entry trong danh sách phẳng */
export interface TranslationEntry {
    key: string;
    value: string;
    namespace?: string;
    updatedAt?: string;
}

/** Kết quả trả về của bulk import */
export interface BulkImportResult {
    total: number;
    inserted: number;
    modified: number;
    matched: number;
}

/** Kết quả trả về của listTranslationKeys (phân trang) */
export interface ListTranslationsResult {
    data: TranslationEntry[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Lấy base URL của API
 * Ưu tiên NEXT_PUBLIC_API_END_POINT (đã tồn tại trong project)
 */
function getApiBase(): string {
    return (
        process.env.NEXT_PUBLIC_API_END_POINT ??
        "http://localhost:8081/api/v1"
    );
}

/**
 * Lấy API key để gửi trong header x-api-key
 * Trong môi trường server: đọc từ TRANSLATION_API_KEY
 * Trong môi trường client: đọc từ NEXT_PUBLIC_TRANSLATION_API_KEY
 */
function getApiKey(): string {
    // Server-side (Server Component, API Route)
    if (typeof process !== "undefined") {
        return (
            process.env.TRANSLATION_API_KEY ??
            process.env.NEXT_PUBLIC_TRANSLATION_API_KEY ??
            ""
        );
    }
    return "";
}

/**
 * Headers chung cho các request cần authentication
 */
function authHeaders(): HeadersInit {
    return {
        "Content-Type": "application/json",
        "x-api-key": getApiKey()
    };
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Lấy tất cả translations của một locale dưới dạng nested JSON
 * Dùng cho next-intl getRequestConfig
 *
 * @param locale - "vi" | "en" | "ja"
 * @param revalidate - cache revalidate tính bằng giây (mặc định 60)
 * @returns Nested JSON object phù hợp next-intl
 */
export async function getTranslations(
    locale: string,
    revalidate = 60
): Promise<Record<string, unknown>> {
    const url = `${getApiBase()}/i18n/${locale}`;

    const response = await fetch(url, {
        method: "GET",
        next: { revalidate }
    } as RequestInit);

    if (!response.ok) {
        throw new Error(`getTranslations failed: HTTP ${response.status} for locale "${locale}"`);
    }

    const json = (await response.json()) as { success: boolean; data: Record<string, unknown> };
    return json.data ?? {};
}

/**
 * Lấy danh sách translations dạng phân trang cho Admin UI
 *
 * @param locale - "vi" | "en" | "ja"
 * @param page - trang hiện tại (1-indexed)
 * @param limit - số items mỗi trang
 * @param search - từ khóa tìm kiếm (key hoặc value)
 */
export async function listTranslations(
    locale: string,
    page = 1,
    limit = 50,
    search = ""
): Promise<ListTranslationsResult> {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search ? { search } : {})
    });

    const url = `${getApiBase()}/i18n/${locale}/list?${params.toString()}`;

    const response = await fetch(url, {
        method: "GET",
        headers: { "x-api-key": getApiKey() }
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`listTranslations failed: HTTP ${response.status} — ${text}`);
    }

    const json = (await response.json()) as {
        success: boolean;
        data: TranslationEntry[];
        pagination: ListTranslationsResult["pagination"];
    };

    return { data: json.data ?? [], pagination: json.pagination };
}

/**
 * Upsert (tạo mới hoặc cập nhật) một key-value
 *
 * @param locale - "vi" | "en" | "ja"
 * @param key - dot-notation key, ví dụ "home.title"
 * @param value - giá trị bản dịch
 * @param namespace - namespace (mặc định "common")
 */
export async function updateTranslationKey(
    locale: string,
    key: string,
    value: string,
    namespace = "common"
): Promise<void> {
    const url = `${getApiBase()}/i18n/${locale}`;

    const response = await fetch(url, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ key, value, namespace })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`updateTranslationKey failed: HTTP ${response.status} — ${text}`);
    }
}

/**
 * Xóa một key
 *
 * @param locale - "vi" | "en" | "ja"
 * @param key - dot-notation key, ví dụ "home.title"
 */
export async function deleteTranslationKey(locale: string, key: string): Promise<void> {
    // Encode key để tránh lỗi URL khi key chứa dấu "/"
    const encodedKey = encodeURIComponent(key);
    const url = `${getApiBase()}/i18n/${locale}/${encodedKey}`;

    const response = await fetch(url, {
        method: "DELETE",
        headers: authHeaders()
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`deleteTranslationKey failed: HTTP ${response.status} — ${text}`);
    }
}

/**
 * Bulk import từ nested JSON object
 *
 * @param locale - "vi" | "en" | "ja"
 * @param nestedJSON - object JSON lồng nhau (giống cấu trúc file en.json)
 * @returns Kết quả bulk import
 */
export async function bulkImport(
    locale: string,
    nestedJSON: Record<string, unknown>
): Promise<BulkImportResult> {
    const url = `${getApiBase()}/i18n/${locale}/bulk`;

    const response = await fetch(url, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(nestedJSON)
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`bulkImport failed: HTTP ${response.status} — ${text}`);
    }

    const json = (await response.json()) as { success: boolean; data: BulkImportResult };
    return json.data;
}

/**
 * Export toàn bộ translations của một locale dưới dạng blob JSON
 * Dùng để trigger download file .json trong browser
 *
 * @param locale - "vi" | "en" | "ja"
 * @returns Blob của file JSON
 */
export async function exportTranslationsAsBlob(locale: string): Promise<Blob> {
    const url = `${getApiBase()}/i18n/${locale}/export`;

    const response = await fetch(url, {
        method: "GET",
        headers: { "x-api-key": getApiKey() }
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`exportTranslations failed: HTTP ${response.status} — ${text}`);
    }

    return response.blob();
}
