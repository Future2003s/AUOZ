import { NextRequest, NextResponse } from "next/server";
import { getAuthHeaderOrRefresh } from "@/lib/next-api-auth";
import { envConfig } from "@/config";
import { SupportedLocales } from "@/i18n/configV2";

/**
 * Get all translations for a locale
 * @route GET /api/translations-v2/all?locale=vn
 * @access Public
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = (searchParams.get("locale") as SupportedLocales) || SupportedLocales.VIETNAMESE;

    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

    // Get all translations from BackEnd
    const response = await fetch(`${baseUrl}/translations-v2/all?locale=${locale}`, {
      method: "GET",
      headers: {
        Cookie: request.headers.get("Cookie") || "",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch translations from BackEnd");
    }

    const data = await response.json();

    if (!data.success || !data.data?.translations) {
      throw new Error("Invalid response from BackEnd");
    }

    return NextResponse.json({
      success: true,
      data: {
        translations: data.data.translations,
        language: locale,
        count: Object.keys(data.data.translations).length,
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

