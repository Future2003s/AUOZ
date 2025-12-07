import { NextRequest, NextResponse } from "next/server";
import { getAuthHeaderOrRefresh } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

/**
 * Upload story images to Cloudinary
 * @route POST /api/story/images
 * @access Private (Admin)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

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

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "File size too large. Maximum size is 10MB",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get authentication token
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
    backendFormData.append("image", file);

    // Forward to backend (using products/images endpoint as it's the same upload logic)
    const response = await fetch(`${baseUrl}/products/images`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
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
    console.error("Story image upload error:", error);
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

