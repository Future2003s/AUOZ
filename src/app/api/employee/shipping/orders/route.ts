import { NextRequest, NextResponse } from "next/server";
import { BELLLC_API_CONFIG } from "@/lib/belllc-api-config";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sessionToken")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";
    const status = searchParams.get("status");

    // Build query string - get orders that are not delivered yet
    const queryParams = new URLSearchParams();
    queryParams.append("page", page);
    queryParams.append("limit", limit);
    // Don't filter by status - we'll get all orders and filter on frontend
    // Or filter for specific statuses that need shipping
    if (status) {
      queryParams.append("status", status);
    }

    const url = `${BELLLC_API_CONFIG.API_BASE_URL}/orders/admin/all?${queryParams.toString()}`;
    
    console.log(`[Shipping Orders API] Calling backend: ${url}`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      return NextResponse.json(
        { success: false, message: "Invalid response from server" },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error(`[Shipping Orders API] Backend error: ${response.status}`, data);
      return NextResponse.json(
        data || { success: false, message: "Backend error" },
        { status: response.status }
      );
    }

    console.log(`[Shipping Orders API] Success, data length:`, Array.isArray(data?.data) ? data.data.length : "N/A");
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching shipping orders:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}

