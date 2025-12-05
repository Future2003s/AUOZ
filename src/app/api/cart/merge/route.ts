import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { API_CONFIG } from "@/lib/api-config";

const MERGE_ENDPOINT = API_CONFIG.CART.MERGE;

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

export async function POST(request: NextRequest) {
  const base = API_CONFIG.API_BASE_URL;
  const backendUrl = `${base}${
    MERGE_ENDPOINT.startsWith("/") ? MERGE_ENDPOINT : `/${MERGE_ENDPOINT}`
  }`;

  const body = await readJsonBody(request);

  const sessionHeader = buildSessionHeader(request);
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    ...sessionHeader,
  };

  return proxyJson(backendUrl, request, {
    method: "POST",
    requireAuth: true,
    headers,
    body: JSON.stringify(body ?? {}),
  });
}

