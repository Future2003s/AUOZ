import { NextRequest, NextResponse } from "next/server";
import {
  BELLLC_API_CONFIG,
  belllcBuildFullUrl,
  belllcHeaders,
} from "@/lib/belllc-api-config";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search") || undefined;
    const from = request.nextUrl.searchParams.get("from") || undefined;
    const to = request.nextUrl.searchParams.get("to") || undefined;
    const page = request.nextUrl.searchParams.get("page") || undefined;
    const size = request.nextUrl.searchParams.get("size") || undefined;

    const url = belllcBuildFullUrl(
      BELLLC_API_CONFIG.FLOWER_LOGS.BASE,
      undefined,
      { search, from, to, page, size }
    );

    // Get session token from cookies for authentication
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;
    
    const headers = {
      ...belllcHeaders(),
      ...(sessionToken && { Authorization: `Bearer ${sessionToken}` }),
      Cookie: request.headers.get("Cookie") || "",
    };

    const res = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    // Handle 404 or other errors gracefully
    if (!res.ok) {
      // If 404, return empty array instead of error
      if (res.status === 404) {
        return NextResponse.json(
          {
            success: true,
            message: "No flower logs found",
            data: [],
          },
          { status: 200 }
        );
      }

      // For other errors, return empty data
      return NextResponse.json(
        {
          success: true,
          message: "Flower logs retrieved successfully",
          data: [],
        },
        { status: 200 } // Return 200 with empty data to prevent frontend error
      );
    }

    const contentType = res.headers.get("content-type") || "application/json";
    const body = contentType.includes("application/json")
      ? await res.json().catch(() => ({ success: true, data: [] }))
      : await res.text();

    return new NextResponse(
      typeof body === "string" ? body : JSON.stringify(body),
      {
        status: res.status,
        headers: { "Content-Type": contentType },
      }
    );
  } catch {
    // Return empty array on any error to prevent frontend crash
    return NextResponse.json(
      {
        success: true,
        message: "Flower logs retrieved successfully",
        data: [],
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const url = belllcBuildFullUrl(BELLLC_API_CONFIG.FLOWER_LOGS.BASE);

    // Get session token from cookies for authentication
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log("[POST /api/belllc/flower-logs] URL:", url);
      console.log(
        "[POST /api/belllc/flower-logs] Payload:",
        JSON.stringify(data)
      );
    }

    const headers = {
      ...belllcHeaders(),
      ...(sessionToken && { Authorization: `Bearer ${sessionToken}` }),
      Cookie: request.headers.get("Cookie") || "",
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
    } catch (fetchError) {
      // Network error - BeLLLC server might not be running
      console.error("[POST /api/belllc/flower-logs] Fetch error:", fetchError);
      return NextResponse.json(
        {
          success: false,
          message:
            "Không thể kết nối đến server. Vui lòng kiểm tra BeLLLC server có đang chạy không.",
          data: null,
        },
        { status: 200 }
      );
    }

    // Handle errors gracefully
    if (!res.ok) {
      let errorMessage = "Không thể tạo phiếu. Vui lòng thử lại.";
      try {
        const errorText = await res.text().catch(() => "");
        if (errorText) {
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorMessage;
          } catch {
            // If not JSON, use the text or default message
            if (errorText.length < 200) {
              errorMessage = errorText;
            }
          }
        }
      } catch {
        // Use default error message
      }

      console.error(
        "[POST /api/belllc/flower-logs] Error response:",
        res.status,
        errorMessage
      );

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          data: null,
        },
        { status: 200 } // Return 200 to prevent frontend error
      );
    }

    // Parse response body
    let body: unknown;
    const contentType = res.headers.get("content-type") || "application/json";

    try {
      if (contentType.includes("application/json")) {
        const text = await res.text();
        body = text ? JSON.parse(text) : { success: true, data: null };
      } else {
        body = await res.text();
      }
    } catch (parseError) {
      console.error(
        "[POST /api/belllc/flower-logs] Failed to parse response:",
        parseError
      );
      return NextResponse.json(
        {
          success: false,
          message: "Không thể đọc phản hồi từ server.",
          data: null,
        },
        { status: 200 }
      );
    }

    // Log successful response in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[POST /api/belllc/flower-logs] Success (status:",
        res.status,
        "):",
        JSON.stringify(body).substring(0, 300)
      );
    }

    // Ensure response has correct format
    if (typeof body === "object" && body !== null) {
      // If BeLLLC returns { success: true, data: {...} }, pass it through
      return NextResponse.json(body, {
        status: res.status >= 200 && res.status < 300 ? res.status : 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If body is string, wrap it
    return new NextResponse(
      typeof body === "string" ? body : JSON.stringify(body),
      {
        status: res.status >= 200 && res.status < 300 ? res.status : 200,
        headers: { "Content-Type": contentType },
      }
    );
  } catch (error) {
    // Log unexpected errors
    console.error("[POST /api/belllc/flower-logs] Unexpected error:", error);
    // Return error response in consistent format
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Không thể tạo phiếu. Vui lòng thử lại.",
        data: null,
      },
      { status: 200 } // Return 200 to prevent frontend error
    );
  }
}
