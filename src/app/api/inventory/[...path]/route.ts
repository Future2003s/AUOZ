/**
 * Next.js API Proxy for Inventory routes
 *
 * Mục đích: Tránh vấn đề CORS & SameSite cookie khi FE và BE ở khác domain.
 * Browser gọi → /api/inventory/** (same-origin, luôn có cookie)
 * Next.js server → api.lalalycheee.vn/api/v1/inventory/** (server-to-server, gửi Bearer token)
 *
 * Routes được proxy:
 *   GET    /api/inventory          → backend /api/v1/inventory
 *   GET    /api/inventory/stats    → backend /api/v1/inventory/stats
 *   GET    /api/inventory/history  → backend /api/v1/inventory/history
 *   GET    /api/inventory/:id      → backend /api/v1/inventory/:id
 *   POST   /api/inventory          → backend /api/v1/inventory
 *   PUT    /api/inventory/:id      → backend /api/v1/inventory/:id
 *   DELETE /api/inventory/:id      → backend /api/v1/inventory/:id
 *   POST   /api/inventory/:id/adjust        → ...
 *   POST   /api/inventory/:id/defective     → ...
 *   POST   /api/inventory/:id/return        → ...
 *   POST   /api/inventory/:id/status-change → ...
 *   GET    /api/inventory/defective-reports → ...
 *   POST   /api/inventory/defective-reports/:id/resolve → ...
 */

import { NextRequest, NextResponse } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

// Resolve backend base URL once
function backendInventoryBase() {
  const base =
    envConfig.NEXT_PUBLIC_API_END_POINT ||
    `${envConfig.NEXT_PUBLIC_BACKEND_URL}/api/${envConfig.NEXT_PUBLIC_API_VERSION}`;
  return base.replace(/\/+$/, "") + "/inventory";
}

function buildBackendUrl(path: string[], searchParams: URLSearchParams): string {
  const suffix = path.length > 0 ? "/" + path.join("/") : "";
  const qs = searchParams.toString();
  return backendInventoryBase() + suffix + (qs ? "?" + qs : "");
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const p = await params;
  const url = buildBackendUrl(p.path, request.nextUrl.searchParams);
  return proxyJson(url, request, { method: "GET", requireAuth: true });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  let body: string | undefined;
  try {
    body = await request.text();
  } catch {
    body = undefined;
  }
  const p = await params;
  const url = buildBackendUrl(p.path, request.nextUrl.searchParams);
  return proxyJson(url, request, {
    method: "POST",
    requireAuth: true,
    body,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  let body: string | undefined;
  try {
    body = await request.text();
  } catch {
    body = undefined;
  }
  const p = await params;
  const url = buildBackendUrl(p.path, request.nextUrl.searchParams);
  return proxyJson(url, request, {
    method: "PUT",
    requireAuth: true,
    body,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  let body: string | undefined;
  try {
    body = await request.text();
  } catch {
    body = undefined;
  }
  const p = await params;
  const url = buildBackendUrl(p.path, request.nextUrl.searchParams);
  return proxyJson(url, request, {
    method: "PATCH",
    requireAuth: true,
    body,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const p = await params;
  const url = buildBackendUrl(p.path, request.nextUrl.searchParams);
  return proxyJson(url, request, { method: "DELETE", requireAuth: true });
}
