/**
 * request.ts — i18n
 * Cung cấp các hàm load translations cho next-intl:
 * 1. getTranslationsFromApi()  — Fetch từ backend /api/v1/i18n/:locale (chính)
 * 2. getTranslationsFromLocal() — Đọc từ file JSON local (fallback)
 * 3. getMergedTranslations()   — Merge hai nguồn: API override JSON
 *
 * Dùng cho getRequestConfig của next-intl (xem src/i18n.ts).
 */
import { defaultLocale, locales, type Locale } from "./config";

// ─── Local JSON fallback ──────────────────────────────────────────────────────

/**
 * Đọc translations từ file JSON local (fallback khi API lỗi)
 * @param locale - locale cần load
 */
export async function getTranslationsFromLocal(
    locale: Locale = defaultLocale
): Promise<Record<string, unknown>> {
    try {
        const messages = await import(`./locales/${locale}.json`);
        return (messages.default ?? {}) as Record<string, unknown>;
    } catch (error) {
        console.error(`[i18n] Không đọc được file JSON local cho locale "${locale}":`, error);

        // Fallback về default locale
        if (locale !== defaultLocale) {
            try {
                const defaultMessages = await import(`./locales/${defaultLocale}.json`);
                return (defaultMessages.default ?? {}) as Record<string, unknown>;
            } catch {
                return {};
            }
        }

        return {};
    }
}

// ─── API fetch ────────────────────────────────────────────────────────────────

/**
 * Fetch translations từ backend API với ISR revalidate 60 giây
 * Endpoint: GET {NEXT_PUBLIC_API_END_POINT}/i18n/:locale
 *
 * @param locale - locale cần load
 * @returns Nested JSON object phù hợp next-intl
 */
export async function getTranslationsFromApi(
    locale: Locale = defaultLocale
): Promise<Record<string, unknown>> {
    const baseUrl =
        process.env.NEXT_PUBLIC_API_END_POINT ?? "http://localhost:8081/api/v1";

    try {
        const response = await fetch(`${baseUrl}/i18n/${locale}`, {
            method: "GET",
            next: { revalidate: 60 } // ISR: cache 60 giây, tự động revalidate
        } as RequestInit);

        if (!response.ok) {
            console.warn(
                `[i18n] API trả về ${response.status} cho locale "${locale}" — dùng JSON local`
            );
            return {};
        }

        const json = (await response.json()) as {
            success: boolean;
            data: Record<string, unknown>;
        };

        if (!json.success || !json.data) {
            console.warn(`[i18n] API response không hợp lệ cho locale "${locale}"`);
            return {};
        }

        return json.data;
    } catch (error) {
        console.error(
            `[i18n] Lỗi khi fetch translations từ API cho locale "${locale}":`,
            error
        );
        return {};
    }
}

// ─── Deep merge ───────────────────────────────────────────────────────────────

function isObject(item: unknown): item is Record<string, unknown> {
    return item !== null && typeof item === "object" && !Array.isArray(item);
}

function deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
): Record<string, unknown> {
    const output = { ...target };

    if (isObject(target) && isObject(source)) {
        for (const key of Object.keys(source)) {
            if (isObject(source[key]) && isObject(target[key])) {
                output[key] = deepMerge(
                    target[key] as Record<string, unknown>,
                    source[key] as Record<string, unknown>
                );
            } else {
                output[key] = source[key];
            }
        }
    }

    return output;
}

// ─── Primary entry point ──────────────────────────────────────────────────────

/**
 * Load translations cho next-intl getRequestConfig
 *
 * Chiến lược:
 * 1. Luôn load file JSON local làm base (nhanh, offline-safe)
 * 2. Cố gắng fetch từ API (dynamic, từ MongoDB)
 * 3. Nếu API thành công → merge, API keys override JSON keys
 * 4. Nếu API thất bại → dùng JSON local thuần
 *
 * @param locale - Locale cần load
 * @param useApi - Có fetch từ API không (mặc định true)
 */
export async function getMergedTranslations(
    locale: Locale = defaultLocale,
    useApi = true
): Promise<Record<string, unknown>> {
    // Bước 1: Load JSON local (base)
    const localTranslations = await getTranslationsFromLocal(locale);

    if (!useApi) {
        return localTranslations;
    }

    // Bước 2: Fetch từ API
    const apiTranslations = await getTranslationsFromApi(locale);

    // Bước 3: Nếu API trả về rỗng, dùng JSON local
    if (Object.keys(apiTranslations).length === 0) {
        return localTranslations;
    }

    // Bước 4: Merge — API override JSON local
    return deepMerge(localTranslations, apiTranslations);
}

// ─── Legacy compat ────────────────────────────────────────────────────────────
// Giữ lại hàm getTranslations cũ để không breaking code cũ

/**
 * @deprecated Dùng getMergedTranslations() thay thế
 */
export async function getTranslations(
    locale: Locale = defaultLocale
): Promise<Record<string, unknown>> {
    return getTranslationsFromLocal(locale);
}

/**
 * @deprecated Dùng getTranslationsFromApi() thay thế
 */
export async function getTranslationsFromBackend(
    locale: Locale = defaultLocale
): Promise<Record<string, unknown>> {
    return getTranslationsFromApi(locale);
}

// ─── Validate locale ──────────────────────────────────────────────────────────

/**
 * Kiểm tra locale có hợp lệ không
 */
export function isValidLocale(locale: string | undefined): locale is Locale {
    return !!locale && (locales as readonly string[]).includes(locale);
}
