import { defaultLocale, locales, type Locale } from "./config";

/**
 * Server-side function to load translations
 * This can be used in Server Components or API routes
 */
export async function getTranslations(locale: Locale = defaultLocale) {
  try {
    // Try to load from static JSON file first (faster)
    const messages = await import(`./locales/${locale}.json`);
    return messages.default || {};
  } catch (error) {
    console.error(`Failed to load locale ${locale}:`, error);
    // Fallback to default locale
    if (locale !== defaultLocale) {
      try {
        const defaultMessages = await import(`./locales/${defaultLocale}.json`);
        return defaultMessages.default || {};
      } catch {
        return {};
      }
    }
    return {};
  }
}

/**
 * Server-side function to load translations from BackEnd
 * This fetches dynamic translations from the database
 */
export async function getTranslationsFromBackend(
  locale: Locale = defaultLocale
): Promise<Record<string, any>> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

    const response = await fetch(`${baseUrl}/translations/all?lang=${locale}`, {
      method: "GET",
      cache: "no-store", // Always fetch fresh translations
    });

    if (!response.ok) {
      console.warn(`Failed to fetch translations from BackEnd for ${locale}`);
      return {};
    }

    const data = await response.json();

    if (!data.success || !data.data?.translations) {
      return {};
    }

    const translations = data.data.translations;

    // Transform flat key-value to nested object structure
    const transformed: Record<string, any> = {};

    for (const [key, value] of Object.entries(translations) as any[]) {
      if (!value || typeof value !== "string") continue;

      const keys = key.split(".");
      let current: any = transformed;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k]) current[k] = {};
        current = current[k];
      }

      current[keys[keys.length - 1]] = value;
    }

    return transformed;
  } catch (error) {
    console.error(`Error fetching translations from BackEnd for ${locale}:`, error);
    return {};
  }
}

/**
 * Merge static JSON translations with dynamic BackEnd translations
 * BackEnd translations take priority
 */
export async function getMergedTranslations(
  locale: Locale = defaultLocale,
  useBackend: boolean = false
): Promise<Record<string, any>> {
  // Always load static translations as base
  const staticTranslations = await getTranslations(locale);

  if (!useBackend) {
    return staticTranslations;
  }

  // Merge with BackEnd translations
  const backendTranslations = await getTranslationsFromBackend(locale);

  // Deep merge function
  function deepMerge(target: any, source: any): any {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  function isObject(item: any): boolean {
    return item && typeof item === "object" && !Array.isArray(item);
  }

  return deepMerge(staticTranslations, backendTranslations);
}

