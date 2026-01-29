import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { envConfig } from "@/config";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sessionToken")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { success: false, message: "Endpoint is required" },
        { status: 400 }
      );
    }

    // Remove subscription from backend
    const backendUrl = `${envConfig.NEXT_PUBLIC_API_END_POINT}/notifications/push/unsubscribe`;
    
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || "Failed to remove subscription" 
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: "Subscription removed successfully",
      data,
    });
  } catch (error) {
    console.error("[Push Unsubscribe API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
