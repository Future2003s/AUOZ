import { NextRequest, NextResponse } from "next/server";
import { getAuthHeaderOrRefresh } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

/**
 * Sync translations from BackEnd to FrontEnd JSON files
 * @route POST /api/translations/sync
 * @access Private (Admin)
 */
export async function POST(request: NextRequest) {
  try {
    const { authHeader, setCookie } = await getAuthHeaderOrRefresh(request);

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthenticated. Please login first.",
        },
        { status: 401 }
      );
    }

    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

    // Get all translations from BackEnd
    const response = await fetch(`${baseUrl}/translations/all`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Cookie: request.headers.get("Cookie") || "",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch translations from BackEnd");
    }

    const data = await response.json();

    if (!data.success || !data.data?.translations) {
      throw new Error("Invalid response from BackEnd");
    }

    const translations = data.data.translations;

    // Transform BackEnd format to FrontEnd JSON format
    const transformedTranslations: Record<string, any> = {
      vi: {},
      en: {},
      ja: {},
    };

    // Group translations by category and language
    for (const [key, translation] of Object.entries(translations) as any[]) {
      if (!translation || typeof translation !== "object") continue;

      const category = translation.category || "ui";
      const keys = key.split(".");
      let current: any = transformedTranslations.vi;
      let currentEn: any = transformedTranslations.en;
      let currentJa: any = transformedTranslations.ja;

      // Navigate/create nested structure
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k]) current[k] = {};
        if (!currentEn[k]) currentEn[k] = {};
        if (!currentJa[k]) currentJa[k] = {};
        current = current[k];
        currentEn = currentEn[k];
        currentJa = currentJa[k];
      }

      // Set the final value
      const finalKey = keys[keys.length - 1];
      if (translation.translations?.vi) {
        current[finalKey] = translation.translations.vi;
      }
      if (translation.translations?.en) {
        currentEn[finalKey] = translation.translations.en;
      }
      if (translation.translations?.ja) {
        currentJa[finalKey] = translation.translations.ja;
      }
    }

    const nextResponse = NextResponse.json({
      success: true,
      message: "Translations synced successfully",
      data: {
        translations: transformedTranslations,
        count: Object.keys(translations).length,
      },
    });

    if (setCookie) {
      nextResponse.headers.set("set-cookie", setCookie);
    }

    return nextResponse;
  } catch (error: any) {
    console.error("Translation sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * Get translations for a specific language
 * @route GET /api/translations/sync?lang=vi
 * @access Public
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "vi";

    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

    // Get all translations from BackEnd
    const response = await fetch(`${baseUrl}/translations/all?lang=${lang}`, {
      method: "GET",
      headers: {
        Cookie: request.headers.get("Cookie") || "",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch translations from BackEnd");
    }

    const data = await response.json();

    if (!data.success || !data.data?.translations) {
      throw new Error("Invalid response from BackEnd");
    }

    const translations = data.data.translations;

    // Transform to nested object structure
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

    return NextResponse.json({
      success: true,
      data: {
        translations: transformed,
        language: lang,
        count: Object.keys(translations).length,
      },
    });
  } catch (error: any) {
    console.error("Translation fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

