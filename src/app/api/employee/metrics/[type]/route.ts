import { NextRequest, NextResponse } from "next/server";
import { BELLLC_API_CONFIG } from "@/lib/belllc-api-config";

const METRICS_TYPES = [
  "incomplete-invoices",
  "undelivered-orders",
  "unpaid-orders",
  "not-in-debt",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> | { type: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 13+ compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { type } = resolvedParams;

    console.log(`[Employee Metrics API] Fetching type: ${type}`);

    if (!METRICS_TYPES.includes(type)) {
      console.error(`[Employee Metrics API] Invalid type: ${type}`);
      return NextResponse.json(
        { success: false, message: "Invalid metrics type" },
        { status: 400 }
      );
    }

    const token = request.cookies.get("sessionToken")?.value;

    if (!token) {
      console.error("[Employee Metrics API] No sessionToken cookie found");
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";

    const url = `${BELLLC_API_CONFIG.API_BASE_URL}/employee/metrics/${type}?page=${page}&limit=${limit}`;
    
    console.log(`[Employee Metrics API] Calling backend: ${url}`);
    
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
      console.error(`[Employee Metrics API] Backend error: ${response.status}`, data);
      return NextResponse.json(
        data || { success: false, message: "Backend error" },
        { status: response.status }
      );
    }

    console.log(`[Employee Metrics API] Success, data length:`, Array.isArray(data?.data) ? data.data.length : "N/A");
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching employee metrics:`, error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}

