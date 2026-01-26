import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config";

const API_BASE = envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

export async function GET(req: NextRequest) {
  try {
    const backendUrl = `${API_BASE}/employee/nav-usage`;

    const res = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[Employee Nav Usage] GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch employee nav usage" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const backendUrl = `${API_BASE}/employee/nav-usage`;

    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[Employee Nav Usage] POST error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to record employee nav usage" },
      { status: 500 }
    );
  }
}

