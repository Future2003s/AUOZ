import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { envConfig } from "@/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image MIME types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sessionToken")?.value;

    if (!token) {
      console.error("[Upload] No token found");
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const incomingForm = await request.formData();
    const file = incomingForm.get("file") as File | null;

    if (!file) {
      console.error("[Upload] No file in form data");
      return NextResponse.json(
        {
          success: false,
          message: "No file provided",
        },
        { status: 400 }
      );
    }

    // Client-side validations before forwarding to backend
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error("[Upload] Invalid file type:", file.type);
      return NextResponse.json(
        {
          success: false,
          message: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      console.error("[Upload] File too large:", file.size);
      return NextResponse.json(
        {
          success: false,
          message: `File size cannot exceed ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    console.log("[Upload] Forwarding file to backend:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Backend (Express) accepts field name "image" (and sometimes "file").
    // Use "image" to stay compatible with stricter multer configs.
    const backendForm = new FormData();
    backendForm.append("image", file);

    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const url = `${baseUrl}/uploads`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: backendForm,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
