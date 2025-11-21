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

    console.log("🔵 [Featured API] Frontend API route called");
    console.log("🔵 [Featured API] Base URL:", baseUrl);
    console.log("🔵 [Featured API] Backend URL:", backendUrl);
    console.log("🔵 [Featured API] Limit:", limit);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    console.log("🔵 [Featured API] Response status:", response.status, response.ok);

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
    console.log("🔵 [Featured API] Backend response data:", {
      hasSuccess: !!data?.success,
      hasData: !!data?.data,
      dataIsArray: Array.isArray(data?.data),
      dataLength: data?.data?.length || 0,
      rawData: data,
    });

    // Normalize response format
    let products = [];
    if (data?.success && data?.data) {
      products = Array.isArray(data.data) ? data.data : [];
      console.log("✅ [Featured API] Using data.data array, length:", products.length);
    } else if (Array.isArray(data)) {
      products = data;
      console.log("✅ [Featured API] Using data as array, length:", products.length);
    } else {
      console.warn("⚠️ [Featured API] Unexpected response format:", data);
    }

    console.log("✅ [Featured API] Final products count:", products.length);

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

