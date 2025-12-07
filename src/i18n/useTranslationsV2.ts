"use client";

import { useI18n } from "./I18nProvider";
import { SupportedLocales, parseTranslationKey, buildTranslationKey, resolveTranslationKey } from "./configV2";
import { useEffect, useState } from "react";
import { envConfig } from "@/config";

/**
 * Hook to use translations with V2 structure (locale in key name)
 * 
 * @example
 * const t = useTranslationsV2();
 * t("Label_selling_point_1") // Returns translation for current locale
 * t("Label_selling_point_1", "vn") // Returns translation for specific locale
 * t("Label_selling_point_1", "vn", "short") // Returns short variant
 */
export default function useTranslationsV2() {
    const { locale: currentLocale, messages } = useI18n();
    
    // Map old locale to new locale
    const localeMap: Record<string, SupportedLocales> = {
        vi: SupportedLocales.VIETNAMESE,
        en: SupportedLocales.ENGLISH,
        ja: SupportedLocales.JAPANESE
    };
    
    const targetLocale = localeMap[currentLocale] || SupportedLocales.VIETNAMESE;
    const [backendTranslations, setBackendTranslations] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    // Load translations from BackEnd if enabled
    useEffect(() => {
        const loadBackendTranslations = async () => {
            if (process.env.NEXT_PUBLIC_USE_BACKEND_TRANSLATIONS !== "true") {
                return;
            }

            try {
                setLoading(true);
                const baseUrl = envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
                const response = await fetch(`${baseUrl}/translations-v2/all?locale=${targetLocale}`, {
                    method: "GET",
                    cache: "no-store"
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data?.translations) {
                        setBackendTranslations(data.data.translations);
                    }
                }
            } catch (error) {
                console.error("Error loading backend translations:", error);
            } finally {
                setLoading(false);
            }
        };

        loadBackendTranslations();
    }, [targetLocale]);

    return (
        baseKey: string,
        locale?: SupportedLocales,
        variant?: string
    ): string => {
        if (!baseKey) return "";

        const useLocale = locale || targetLocale;
        const parsed = parseTranslationKey(baseKey);

        // If key already has locale, use it directly
        if (parsed.locale) {
            const fullKey = buildTranslationKey(parsed.baseKey, parsed.locale, parsed.variant || variant);
            
            // Try BackEnd translations first
            if (backendTranslations[fullKey]) {
                return backendTranslations[fullKey];
            }
            
            // Try static messages (nested structure)
            const segments = fullKey.split("_");
            let current: any = messages;
            for (const segment of segments) {
                if (!current || typeof current !== "object") {
                    break;
                }
                current = current[segment];
            }
            if (typeof current === "string") {
                return current;
            }
            
            return parsed.baseKey;
        }

        // Key without locale, build full key
        const fullKey = buildTranslationKey(baseKey, useLocale, variant);
        
        // Try BackEnd translations first
        if (backendTranslations[fullKey]) {
            return backendTranslations[fullKey];
        }

        // Try static messages (nested structure)
        const segments = fullKey.split("_");
        let current: any = messages;
        for (const segment of segments) {
            if (!current || typeof current !== "object") {
                break;
            }
            current = current[segment];
        }
        if (typeof current === "string") {
            return current;
        }

        // Fallback to base key
        return baseKey;
    };
}

