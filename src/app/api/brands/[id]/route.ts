import { NextRequest } from "next/server";
import { envConfig } from "@/config";
import { cookies } from "next/headers";

// Build backend base safely (handles both unified and legacy config)
const apiBase =
  envConfig.NEXT_PUBLIC_API_END_POINT ||
  `${envConfig.NEXT_PUBLIC_BACKEND_URL}/api/${envConfig.NEXT_PUBLIC_API_VERSION}`;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const backendUrl = `${apiBase}/brands/${id}`;

    // Try both cookies() and request cookies, and accept Authorization header pass-through
    const cookieStore = await cookies();
    const tokenFromCookies = cookieStore.get("sessionToken")?.value;
    const tokenFromRequest = request.cookies.get("sessionToken")?.value;
    const authHeader = request.headers.get("authorization");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (tokenFromRequest || tokenFromCookies) {
      headers.Authorization = `Bearer ${tokenFromRequest || tokenFromCookies}`;
    } else if (authHeader) {
      headers.Authorization = authHeader;
    }

    const res = await fetch(backendUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error("Update brand API error - status:", res.status);
      const errorText = await res.text();
      console.error("Error response:", errorText);

      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to update brand",
          error: errorText,
        }),
        {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Update brand API error:", e);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Error",
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const backendUrl = `${apiBase}/brands/${id}`;

    const cookieStore = await cookies();
    const tokenFromCookies = cookieStore.get("sessionToken")?.value;
    const tokenFromRequest = request.cookies.get("sessionToken")?.value;
    const authHeader = request.headers.get("authorization");

    const headers: Record<string, string> = {};
    if (tokenFromRequest || tokenFromCookies) {
      headers.Authorization = `Bearer ${tokenFromRequest || tokenFromCookies}`;
    } else if (authHeader) {
      headers.Authorization = authHeader;
    }

    const res = await fetch(backendUrl, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) {
      console.error("Delete brand API error - status:", res.status);
      const errorText = await res.text();
      console.error("Error response:", errorText);

      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to delete brand",
          error: errorText,
        }),
        {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Delete brand API error:", e);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Error",
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
