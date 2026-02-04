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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append("page", page);
    queryParams.append("limit", limit);
    if (status) queryParams.append("status", status);
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);
    queryParams.append("sort", sort);
    queryParams.append("order", order);

    const url = `${BELLLC_API_CONFIG.API_BASE_URL}/orders/admin/all?${queryParams.toString()}`;
    
    console.log(`[Employee Orders API] Calling backend: ${url}`);
    
    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    let response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error("Request timeout: Backend server không phản hồi trong 10 giây");
      }
      throw fetchError;
    }

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
      console.error(`Backend error: ${response.status}`, data);
      return NextResponse.json(
        data || { success: false, message: "Backend error" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching employee orders:", error);
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Không thể kết nối đến backend server. Vui lòng kiểm tra xem backend có đang chạy không.",
          error: "Network error"
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Internal server error",
        error: error instanceof Error ? error.stack : "Unknown error"
      },
      { status: 500 }
    );
  }
}

