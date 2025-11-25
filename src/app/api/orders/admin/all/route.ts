import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

export async function GET(request: NextRequest) {
  try {

    // Sử dụng envConfig thay vì process.env trực tiếp
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

    const url = new URL(`${baseUrl}/orders/admin/all`);

    // Copy và chuyển đổi search params
    // Backend dùng 'page' và 'limit', frontend có thể gửi 'page' và 'size'
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";
    const size = searchParams.get("size") || "10";
    
    // Chuyển 'size' thành 'limit' cho backend
    url.searchParams.set("page", page);
    url.searchParams.set("limit", size);
    
    // Copy các params khác nếu có
    for (const [key, value] of searchParams.entries()) {
      if (key !== "size") {
        // Đã xử lý size ở trên, bỏ qua để tránh duplicate
        if (key !== "page") {
          url.searchParams.set(key, value);
        }
      }
    }

    const response = await proxyJson(url.toString(), request, {
      method: "GET",
      requireAuth: true,
    });

    return response;
  } catch (e) {
    console.error("Admin Orders API error:", e);
    return new Response(
      JSON.stringify({
        message: "Internal Error",
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
