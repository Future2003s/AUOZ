import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { envConfig } from "@/config";

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

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

    const subscriptionData: PushSubscriptionData = await request.json();

    if (!subscriptionData.endpoint || !subscriptionData.keys) {
      return NextResponse.json(
        { success: false, message: "Invalid subscription data" },
        { status: 400 }
      );
    }

    // Send subscription to backend
    const backendUrl = `${envConfig.NEXT_PUBLIC_API_END_POINT}/notifications/push/subscribe`;
    
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || "Failed to save subscription" 
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: "Subscription saved successfully",
      data,
    });
  } catch (error) {
    console.error("[Push Subscribe API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
