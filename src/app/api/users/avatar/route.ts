import { NextRequest, NextResponse } from "next/server";
import { getAuthHeaderOrRefresh } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "No file provided",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "Invalid file type. Only images are allowed (JPEG, PNG, GIF, WebP)",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "File size too large. Maximum size is 5MB",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get authentication token from cookie or header
    const { authHeader, setCookie } = await getAuthHeaderOrRefresh(request);
    
    if (!authHeader) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "Unauthenticated. Please login first.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

    // Create new FormData for backend
    const backendFormData = new FormData();
    backendFormData.append("avatar", file);

    // Forward to backend with proper authentication
    const response = await fetch(`${baseUrl}/users/avatar`, {
      method: "POST",
      headers: {
        // Don't set Content-Type, let fetch set it with boundary for FormData
        Authorization: authHeader,
        // Forward cookies for session
        Cookie: request.headers.get("Cookie") || "",
      },
      body: backendFormData,
    });

    const contentType = response.headers.get("content-type") || "application/json";
    let data;
    try {
      if (contentType.includes("application/json")) {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } else {
        data = await response.text();
      }
    } catch (error) {
      console.error("JSON parse error:", error);
      data = { success: false, error: "Invalid response from server" };
    }

    const nextResponse = new NextResponse(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });

    // Set new cookie if token was refreshed
    if (setCookie) {
      nextResponse.headers.set("set-cookie", setCookie);
    }

    return nextResponse;
  } catch (error) {
    console.error("Avatar upload error:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

