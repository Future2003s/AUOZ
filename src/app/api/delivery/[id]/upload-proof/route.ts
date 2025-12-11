import { NextRequest } from "next/server";
import { envConfig } from "@/config";
import { cookies } from "next/headers";

async function ensureToken(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sessionToken")?.value;
  if (!token) {
    return null;
  }
  return token;
}

// #region agent log
const debugLog = (payload: {
  runId: string;
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, any>;
}) => {
  fetch("http://127.0.0.1:7242/ingest/432e8fdf-0ddd-4690-a25d-aebc1c16d609", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      timestamp: Date.now(),
      ...payload,
    }),
  }).catch(() => {});
};
// #endregion

async function forwardFormData(
  request: NextRequest,
  method: "POST" | "PUT",
  id: string
) {
  const token = await ensureToken(request);
  if (!token) {
    return new Response(
      JSON.stringify({ success: false, message: "Unauthorized" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  debugLog({
    runId: "pre-fix",
    hypothesisId: "A",
    location: "upload-proof/route.ts:forwardFormData:entry",
    message: "forwardFormData entry",
    data: { method, id, hasToken: !!token },
  });

  const formData = await request.formData();
  const baseUrl =
    envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
  const url = `${baseUrl}/delivery/${id}/upload-proof`;

  debugLog({
    runId: "pre-fix",
    hypothesisId: "B",
    location: "upload-proof/route.ts:forwardFormData:target",
    message: "Computed upstream URL",
    data: { baseUrl, url },
  });

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  debugLog({
    runId: "pre-fix",
    hypothesisId: "C",
    location: "upload-proof/route.ts:forwardFormData:response",
    message: "Upstream response",
    data: {
      status: response.status,
      ok: response.ok,
      keys: Object.keys(data || {}),
      message: (data as any)?.message,
      error: (data as any)?.error,
    },
  });

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return await forwardFormData(request, "POST", id);
  } catch (e) {
    console.error("Upload Proof API error:", e);
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return await forwardFormData(request, "PUT", id);
  } catch (e) {
    console.error("Upload Proof API error:", e);
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    debugLog({
      runId: "pre-fix",
      hypothesisId: "A",
      location: "upload-proof/route.ts:GET:entry",
      message: "GET upload-proof entry",
      data: { id },
    });
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const url = `${baseUrl}/delivery/${id}/upload-proof`;
    const token = await ensureToken(request);

    debugLog({
      runId: "pre-fix",
      hypothesisId: "B",
      location: "upload-proof/route.ts:GET:target",
      message: "Computed upstream URL",
      data: { baseUrl, url, hasToken: !!token },
    });

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json();

    debugLog({
      runId: "pre-fix",
      hypothesisId: "C",
      location: "upload-proof/route.ts:GET:response",
      message: "Upstream response",
    data: {
      status: response.status,
      ok: response.ok,
      keys: Object.keys(data || {}),
      message: (data as any)?.message,
      error: (data as any)?.error,
    },
    });

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Upload Proof API error:", e);
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
