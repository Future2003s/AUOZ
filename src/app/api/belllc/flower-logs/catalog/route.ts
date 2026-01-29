import { NextRequest, NextResponse } from "next/server";
import {
  BELLLC_API_CONFIG,
  belllcBuildFullUrl,
  belllcHeaders,
} from "@/lib/belllc-api-config";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const url = belllcBuildFullUrl(BELLLC_API_CONFIG.FLOWER_LOGS.CATALOG);

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    const headers = {
      ...belllcHeaders(),
      ...(sessionToken && { Authorization: `Bearer ${sessionToken}` }),
      Cookie: request.headers.get("Cookie") || "",
    };

    const res = await fetch(url, { method: "GET", headers, cache: "no-store" });
    const contentType = res.headers.get("content-type") || "application/json";
    const body = contentType.includes("application/json")
      ? await res.json().catch(() => ({ success: true, data: null }))
      : await res.text();

    return new NextResponse(typeof body === "string" ? body : JSON.stringify(body), {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: "BeLLLC catalog get failed", error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json();
    const url = belllcBuildFullUrl(BELLLC_API_CONFIG.FLOWER_LOGS.CATALOG);

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    const headers = {
      ...belllcHeaders(),
      ...(sessionToken && { Authorization: `Bearer ${sessionToken}` }),
      Cookie: request.headers.get("Cookie") || "",
    };

    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get("content-type") || "application/json";
    const body = contentType.includes("application/json")
      ? await res.json().catch(() => ({ success: false, data: null }))
      : await res.text();

    return new NextResponse(typeof body === "string" ? body : JSON.stringify(body), {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: "BeLLLC catalog update failed", error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}

