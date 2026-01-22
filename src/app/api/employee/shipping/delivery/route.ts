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
    const search = searchParams.get("search");
    const buyerName = searchParams.get("buyerName");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const isShipped = searchParams.get("isShipped");

    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append("page", page);
    queryParams.append("limit", limit);
    if (status) queryParams.append("status", status);
    if (search) queryParams.append("search", search);
    if (buyerName) queryParams.append("buyerName", buyerName);
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);
    if (isShipped !== null && isShipped !== undefined && isShipped !== "") {
      queryParams.append("isShipped", isShipped);
    }

    const url = `${BELLLC_API_CONFIG.API_BASE_URL}/delivery?${queryParams.toString()}`;
    
    console.log(`[Shipping Delivery API] Calling backend: ${url}`);
    
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
      console.error(`[Shipping Delivery API] Backend error: ${response.status}`, data);
      return NextResponse.json(
        data || { success: false, message: "Backend error" },
        { status: response.status }
      );
    }

    console.log(`[Shipping Delivery API] Success, data length:`, Array.isArray(data?.data) ? data.data.length : "N/A");
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching delivery orders:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}

