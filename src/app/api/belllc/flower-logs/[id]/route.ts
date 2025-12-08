import { NextRequest, NextResponse } from "next/server";
import {
  BELLLC_API_CONFIG,
  belllcBuildFullUrl,
  belllcHeaders,
} from "@/lib/belllc-api-config";
import { cookies } from "next/headers";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = belllcBuildFullUrl(BELLLC_API_CONFIG.FLOWER_LOGS.BY_ID, { id });
    
    // Get session token from cookies for authentication
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;
    
    const headers = {
      ...belllcHeaders(),
      ...(sessionToken && { Authorization: `Bearer ${sessionToken}` }),
      Cookie: request.headers.get("Cookie") || "",
    };
    
    const res = await fetch(url, { method: "GET", headers, cache: "no-store" });
    const ct = res.headers.get("content-type") || "application/json";
    const body = ct.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();
    return new NextResponse(typeof body === "string" ? body : JSON.stringify(body), { status: res.status, headers: { "Content-Type": ct } });
  } catch (e) {
    return NextResponse.json({ message: "BeLLLC get failed", error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const url = belllcBuildFullUrl(BELLLC_API_CONFIG.FLOWER_LOGS.BY_ID, { id });
    
    // Get session token from cookies for authentication
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;
    
    const headers = {
      ...belllcHeaders(),
      ...(sessionToken && { Authorization: `Bearer ${sessionToken}` }),
      Cookie: request.headers.get("Cookie") || "",
    };
    
    let res: Response;
    try {
      res = await fetch(url, { 
        method: "PUT", 
        headers, 
        body: JSON.stringify(data) 
      });
    } catch (fetchError) {
      console.error("[PUT /api/belllc/flower-logs/:id] Fetch error:", fetchError);
      return NextResponse.json(
        {
          success: false,
          message: "Không thể kết nối đến server.",
          data: null,
        },
        { status: 200 }
      );
    }
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      let errorMessage = "Không thể cập nhật phiếu.";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        if (errorText.length < 200) {
          errorMessage = errorText;
        }
      }
      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          data: null,
        },
        { status: 200 }
      );
    }
    
    const ct = res.headers.get("content-type") || "application/json";
    const body = ct.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();
    return new NextResponse(typeof body === "string" ? body : JSON.stringify(body), { status: res.status, headers: { "Content-Type": ct } });
  } catch (e) {
    console.error("[PUT /api/belllc/flower-logs/:id] Error:", e);
    return NextResponse.json(
      { 
        success: false,
        message: "Không thể cập nhật phiếu. Vui lòng thử lại.",
        data: null,
      }, 
      { status: 200 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = belllcBuildFullUrl(BELLLC_API_CONFIG.FLOWER_LOGS.BY_ID, { id });
    
    // Get session token from cookies for authentication
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;
    
    const headers = {
      ...belllcHeaders(),
      ...(sessionToken && { Authorization: `Bearer ${sessionToken}` }),
      Cookie: request.headers.get("Cookie") || "",
    };
    
    let res: Response;
    try {
      res = await fetch(url, { 
        method: "DELETE", 
        headers
      });
    } catch (fetchError) {
      console.error("[DELETE /api/belllc/flower-logs/:id] Fetch error:", fetchError);
      return NextResponse.json(
        {
          success: false,
          message: "Không thể kết nối đến server.",
          data: null,
        },
        { status: 200 }
      );
    }
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      let errorMessage = "Không thể xóa phiếu.";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        if (errorText.length < 200) {
          errorMessage = errorText;
        }
      }
      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          data: null,
        },
        { status: 200 }
      );
    }
    
    const ct = res.headers.get("content-type") || "application/json";
    const body = ct.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();
    return new NextResponse(typeof body === "string" ? body : JSON.stringify(body), { status: res.status, headers: { "Content-Type": ct } });
  } catch (e) {
    console.error("[DELETE /api/belllc/flower-logs/:id] Error:", e);
    return NextResponse.json(
      { 
        success: false,
        message: "Không thể xóa phiếu. Vui lòng thử lại.",
        data: null,
      }, 
      { status: 200 }
    );
  }
}

