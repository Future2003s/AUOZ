import { NextRequest, NextResponse } from "next/server";
import { getAuthHeaderOrRefresh } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    const { authHeader, setCookie } = await getAuthHeaderOrRefresh(request);
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const backendFormData = new FormData();
    backendFormData.append("image", file);

    const response = await fetch(`${baseUrl}/products/images`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        Cookie: request.headers.get("Cookie") || "",
      },
      body: backendFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: errorText || "Upload failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const imageUrl =
      data?.data?.url ||
      data?.data?.secure_url ||
      data?.data?.imageUrl ||
      data?.url ||
      data?.imageUrl;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "No image URL in response" },
        { status: 500 }
      );
    }

    const nextResponse = NextResponse.json({
      success: true,
      data: { url: imageUrl },
    });

    if (setCookie) {
      nextResponse.headers.set("Set-Cookie", setCookie);
    }

    return nextResponse;
  } catch (error: any) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

