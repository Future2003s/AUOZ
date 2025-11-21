import { NextRequest } from "next/server";
import { envConfig } from "@/config";
import { cookies } from "next/headers";

const backendBase = `${envConfig.NEXT_PUBLIC_BACKEND_URL}/api/${envConfig.NEXT_PUBLIC_API_VERSION}`;

async function buildAuthHeaders(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sessionToken")?.value;
  const authHeader = request.headers.get("authorization");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (authHeader) {
    headers.Authorization = authHeader;
  }

  return headers;
}

function buildUrl(id: string) {
  return `${backendBase}/vouchers/${id}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    const headers = await buildAuthHeaders(request);
    const res = await fetch(buildUrl(id), {
      headers,
      cache: "no-store",
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Voucher GET proxy error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Không thể lấy voucher",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    const body = await request.json();
    const headers = await buildAuthHeaders(request);
    const res = await fetch(buildUrl(id), {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Voucher PUT proxy error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Không thể cập nhật voucher",
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
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    const headers = await buildAuthHeaders(request);
    const res = await fetch(buildUrl(id), {
      method: "DELETE",
      headers,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Voucher DELETE proxy error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Không thể xóa voucher",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

