import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { API_CONFIG } from "@/lib/api-config";

// This route proxies cart operations to the backend. Configure endpoints via env if needed.
// Supported templates (optional):
// - API_CART_GET_URL_TEMPLATE (e.g. /cart or /cart/me)
// - API_CART_ADD_URL_TEMPLATE (e.g. /cart/items)
// - API_CART_UPDATE_URL_TEMPLATE (e.g. /cart/items/{itemId})
// - API_CART_DELETE_URL_TEMPLATE (e.g. /cart/items/{itemId})

function buildCandidates(templateEnv: string | undefined, fallbacks: string[]) {
  const candidates: string[] = [];
  if (templateEnv && templateEnv.trim() !== "") candidates.push(templateEnv);
  for (const f of fallbacks) candidates.push(f);
  return candidates;
}

function buildSessionHeader(request: NextRequest): Record<string, string> {
  const sessionId = request.headers.get("x-session-id");
  if (sessionId && sessionId.trim() !== "") {
    return { "X-Session-Id": sessionId };
  }
  return {};
}

type JsonRecord = Record<string, unknown>;

const isJsonRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

async function readJsonBody(request: NextRequest): Promise<JsonRecord | null> {
  try {
    const payload = await request.json();
    return isJsonRecord(payload) ? payload : null;
  } catch {
    return null;
  }
}

const pickString = (source: JsonRecord | null, ...keys: string[]): string => {
  if (!source) return "";
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }
  return "";
};

const pickBoolean = (source: JsonRecord | null, key: string): boolean =>
  source?.[key] === true;

export async function GET(request: NextRequest) {
  const base = API_CONFIG.API_BASE_URL;
  const sessionHeader = buildSessionHeader(request);
  const headers: Record<string, string> = {
    ...sessionHeader,
  };
  const template = process.env.API_CART_GET_URL_TEMPLATE; // e.g., /cart or /cart/me
  const candidates = buildCandidates(template, [
    API_CONFIG.CART.GET,
    `${API_CONFIG.CART.GET}/me`,
  ]);
  const url = new URL(request.url);
  const qs = url.searchParams.toString();

  for (const path of candidates) {
    const backendUrl = `${base}${path.startsWith("/") ? path : `/${path}`}${
      qs ? `?${qs}` : ""
    }`;
    const res = await proxyJson(backendUrl, request, {
      method: "GET",
      requireAuth: false,
      headers,
    });
    if (res.status !== 404 && res.status !== 405) return res;
  }
  return new Response(JSON.stringify({ message: "Cart endpoint not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
  const base = API_CONFIG.API_BASE_URL;
  const sessionHeader = buildSessionHeader(request);
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    ...sessionHeader,
  };
  const template = process.env.API_CART_ADD_URL_TEMPLATE; // e.g., /cart/items
  const candidates = buildCandidates(template, [
    API_CONFIG.CART.ADD_ITEM,
    API_CONFIG.CART.GET,
  ]);
  const body = await readJsonBody(request);

  for (const path of candidates) {
    const backendUrl = `${base}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await proxyJson(backendUrl, request, {
      method: "POST",
      headers,
      body: JSON.stringify(body ?? {}),
      requireAuth: false,
    });
    if (res.status !== 404 && res.status !== 405) return res;
  }
  return new Response(
    JSON.stringify({ message: "Add to cart endpoint not found" }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function PUT(request: NextRequest) {
  const base = API_CONFIG.API_BASE_URL;
  const sessionHeader = buildSessionHeader(request);
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    ...sessionHeader,
  };
  const template = process.env.API_CART_UPDATE_URL_TEMPLATE; // e.g., /cart/items/{itemId}
  const body = await readJsonBody(request);

  const itemId = pickString(body, "itemId", "id");
  const productId = pickString(body, "productId", "product_id");
  const variantId = pickString(body, "variantId", "variant_id");

  const fallbackSet = new Set<string>();
  if (productId) {
    fallbackSet.add(
      API_CONFIG.CART.UPDATE_ITEM.replace(":productId", productId)
    );
    fallbackSet.add(
      `/cart/products/${productId}${variantId ? `?variantId=${variantId}` : ""}`
    );
  }
  if (itemId) {
    fallbackSet.add(
      API_CONFIG.CART.UPDATE_ITEM.replace(":productId", itemId)
    );
  }
  if (fallbackSet.size === 0) {
    fallbackSet.add(API_CONFIG.CART.GET);
  }

  const candidates = buildCandidates(
    template
      ? template.replace("{itemId}", itemId || productId || "")
      : undefined,
    Array.from(fallbackSet)
  );

  for (const path of candidates) {
    const backendUrl = `${base}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await proxyJson(backendUrl, request, {
      method: "PUT",
      headers,
      body: JSON.stringify(body ?? {}),
      requireAuth: false,
    });
    if (res.status !== 404 && res.status !== 405) return res;
  }
  return new Response(
    JSON.stringify({ message: "Update cart endpoint not found" }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function DELETE(request: NextRequest) {
  const base = API_CONFIG.API_BASE_URL;
  const sessionHeader = buildSessionHeader(request);
  const headers: Record<string, string> = {
    ...sessionHeader,
  };
  const template = process.env.API_CART_DELETE_URL_TEMPLATE; // e.g., /cart/items/{itemId}

  const body = await readJsonBody(request);

  const { searchParams } = new URL(request.url);
  const itemId = pickString(body, "itemId", "id") || searchParams.get("itemId") || "";
  const productId =
    pickString(body, "productId") || searchParams.get("productId") || "";
  const variantId =
    pickString(body, "variantId") || searchParams.get("variantId") || "";
  const clearAll =
    pickBoolean(body, "clearAll") ||
    searchParams.get("clear") === "true" ||
    searchParams.get("clearAll") === "true";

  const fallbackSet = new Set<string>();
  if (clearAll) {
    fallbackSet.add(API_CONFIG.CART.CLEAR);
  }
  if (itemId) {
    fallbackSet.add(API_CONFIG.CART.REMOVE_ITEM.replace(":productId", itemId));
  }
  if (productId) {
    fallbackSet.add(
      API_CONFIG.CART.REMOVE_ITEM.replace(":productId", productId)
    );
    fallbackSet.add(
      `/cart/products/${productId}${variantId ? `?variantId=${variantId}` : ""}`
    );
  }
  if (fallbackSet.size === 0) {
    fallbackSet.add(API_CONFIG.CART.GET);
  }

  const candidates = buildCandidates(
    template
      ? template.replace("{itemId}", itemId || productId || "")
      : undefined,
    Array.from(fallbackSet)
  );

  for (const path of candidates) {
    const backendUrl = `${base}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await proxyJson(backendUrl, request, {
      method: "DELETE",
      requireAuth: false,
      headers,
    });
    if (res.status !== 404 && res.status !== 405) return res;
  }
  return new Response(
    JSON.stringify({ message: "Delete cart item endpoint not found" }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
}
