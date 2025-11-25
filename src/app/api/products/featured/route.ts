import { NextRequest } from "next/server";
import { envConfig } from "@/config";

/**
 * Public API route - No authentication required
 * Fetches featured products from backend
 * @route GET /api/products/featured
 * @access Public
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "8";

    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT ||
      `${envConfig.NEXT_PUBLIC_BACKEND_URL}/api/${envConfig.NEXT_PUBLIC_API_VERSION}`;

    const backendUrl = `${baseUrl}/products/featured?limit=${limit}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("❌ [Featured API] Backend error - status:", response.status);
      const errorText = await response.text().catch(() => "");
      console.error("❌ [Featured API] Error text:", errorText);
      return new Response(
        JSON.stringify({
          success: false,
          data: [],
          message: errorText || "Failed to fetch featured products",
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    // Normalize response format
    let products = [];
    if (data?.success && data?.data) {
      products = Array.isArray(data.data) ? data.data : [];
    } else if (Array.isArray(data)) {
      products = data;
    } else {
      console.warn("⚠️ [Featured API] Unexpected response format:", data);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: products,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [Featured API] Exception caught:", error);
    console.error("❌ [Featured API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(
      JSON.stringify({
        success: false,
        data: [],
        message: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

