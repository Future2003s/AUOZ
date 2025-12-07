/**
 * Supported locales/countries
 * Based on Shopee-style locale codes
 */
export enum SupportedLocales {
    // Original languages
    VIETNAMESE = "vn",
    ENGLISH = "en",
    JAPANESE = "ja",
    
    // Additional locales
    ARABIC = "ar",        // Arabic
    BRAZIL = "br",        // Brazil (Portuguese)
    CHILE = "cl",         // Chile (Spanish)
    COLOMBIA = "co",      // Colombia (Spanish)
    INDONESIA = "id",     // Indonesia
    MEXICO = "mx",        // Mexico (Spanish)
    MALAYSIA = "my",      // Malaysia
    PHILIPPINES = "ph",   // Philippines
    POLAND = "pl",        // Poland
    SINGAPORE = "sg",     // Singapore
    THAILAND = "th"       // Thailand
}

/**
 * Map old locale codes to new locale codes
 */
export const localeMap: Record<string, SupportedLocales> = {
    vi: SupportedLocales.VIETNAMESE,
    en: SupportedLocales.ENGLISH,
    ja: SupportedLocales.JAPANESE,
    vn: SupportedLocales.VIETNAMESE,
    ar: SupportedLocales.ARABIC,
    br: SupportedLocales.BRAZIL,
    cl: SupportedLocales.CHILE,
    co: SupportedLocales.COLOMBIA,
    id: SupportedLocales.INDONESIA,
    mx: SupportedLocales.MEXICO,
    my: SupportedLocales.MALAYSIA,
    ph: SupportedLocales.PHILIPPINES,
    pl: SupportedLocales.POLAND,
    sg: SupportedLocales.SINGAPORE,
    th: SupportedLocales.THAILAND
};

/**
 * Default locale
 */
export const defaultLocale: SupportedLocales = SupportedLocales.VIETNAMESE;

/**
 * Check if locale is valid
 */
export function isValidLocale(locale: string | undefined): locale is SupportedLocales {
    return !!locale && Object.values(SupportedLocales).includes(locale as SupportedLocales);
}

/**
 * Parse translation key to extract components
 */
export interface ParsedTranslationKey {
    baseKey: string;
    locale: SupportedLocales | null;
    variant?: string;
}

/**
 * Parse key to extract baseKey, locale, and variant
 */
export function parseTranslationKey(key: string): ParsedTranslationKey {
    const locales = Object.values(SupportedLocales);
    const variants = ["short", "long"];
    
    // Try to find locale at the end
    for (const locale of locales) {
        const localeSuffix = `_${locale}`;
        if (key.endsWith(localeSuffix)) {
            const withoutLocale = key.slice(0, -localeSuffix.length);
            return {
                baseKey: withoutLocale,
                locale: locale as SupportedLocales
            };
        }
        
        // Try with variant
        for (const variant of variants) {
            const variantSuffix = `_${variant}_${locale}`;
            if (key.endsWith(variantSuffix)) {
                const withoutVariant = key.slice(0, -variantSuffix.length);
                return {
                    baseKey: withoutVariant,
                    locale: locale as SupportedLocales,
                    variant
                };
            }
        }
    }
    
    // No locale found, return as-is
    return {
        baseKey: key,
        locale: null
    };
}

/**
 * Build key from baseKey, locale, and variant
 */
export function buildTranslationKey(
    baseKey: string,
    locale: SupportedLocales,
    variant?: string
): string {
    if (variant) {
        return `${baseKey}_${variant}_${locale}`;
    }
    return `${baseKey}_${locale}`;
}

/**
 * Resolve translation key with locale fallback
 */
export function resolveTranslationKey(
    baseKey: string,
    locale: SupportedLocales,
    variant?: string,
    fallbackLocales: SupportedLocales[] = [SupportedLocales.VIETNAMESE, SupportedLocales.ENGLISH]
): string[] {
    const candidates: string[] = [];
    
    // Try exact match first
    if (variant) {
        candidates.push(buildTranslationKey(baseKey, locale, variant));
    }
    candidates.push(buildTranslationKey(baseKey, locale));
    
    // Try fallback locales
    for (const fallbackLocale of fallbackLocales) {
        if (fallbackLocale !== locale) {
            if (variant) {
                candidates.push(buildTranslationKey(baseKey, fallbackLocale, variant));
            }
            candidates.push(buildTranslationKey(baseKey, fallbackLocale));
        }
    }
    
    // Final fallback to base key
    candidates.push(baseKey);
    
    return candidates;
}

