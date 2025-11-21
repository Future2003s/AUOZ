import { NextRequest } from "next/server";
import { envConfig } from "@/config";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("🟢 [Create Product API] Request body:", JSON.stringify(body, null, 2));

    // Get auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("sessionToken")?.value;

    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT ||
      `${envConfig.NEXT_PUBLIC_BACKEND_URL}/api/${envConfig.NEXT_PUBLIC_API_VERSION}`;
    const backendUrl = `${baseUrl}/products`;
    
    console.log("🟢 [Create Product API] Backend URL:", backendUrl);
    console.log("🟢 [Create Product API] Has token:", !!token);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    console.log("🟢 [Create Product API] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [Create Product API] Error response:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText, error: errorText };
      }

      return new Response(JSON.stringify({
        success: false,
        error: errorData.message || errorData.error || "Failed to create product",
        details: errorData,
      }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("✅ [Create Product API] Success response:", data);
    
    return new Response(JSON.stringify({
      success: true,
      data: data.data || data,
      message: data.message || "Product created successfully",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("❌ [Create Product API] Exception:", e);
    return new Response(JSON.stringify({ 
      success: false,
      message: "Internal Error",
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
