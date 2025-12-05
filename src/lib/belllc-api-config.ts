export const BELLLC_ENV = {
  NEXT_PUBLIC_BELLLC_API_ENDPOINT:
    (process.env.NEXT_PUBLIC_BELLLC_API_ENDPOINT || "").trim() || undefined,
  NEXT_PUBLIC_BELLLC_BACKEND_URL:
    (process.env.NEXT_PUBLIC_BELLLC_BACKEND_URL || "").trim() || undefined,
  NEXT_PUBLIC_BELLLC_API_VERSION: (
    process.env.NEXT_PUBLIC_BELLLC_API_VERSION || "v1"
  ).trim(),
  BELLLC_API_KEY: (process.env.BELLLC_API_KEY || "").trim() || undefined,
};

function normalize(u?: string | null) {
  if (!u) return undefined;
  const t = u.trim();
  if (t === "") return undefined;
  return t.replace(/\/+$/, "");
}

const endpoint = normalize(BELLLC_ENV.NEXT_PUBLIC_BELLLC_API_ENDPOINT);
const backend = normalize(BELLLC_ENV.NEXT_PUBLIC_BELLLC_BACKEND_URL);
let version = BELLLC_ENV.NEXT_PUBLIC_BELLLC_API_VERSION || "v1";
let backendUrl = backend;
let apiBase: string | undefined = endpoint;

if (!apiBase) {
  // Construct from backend + version if endpoint not provided
  backendUrl = backendUrl || "http://localhost:8081"; // dedicated default for BeLLLC
  apiBase = `${backendUrl}/api/${version}`;
} else {
  if (apiBase.includes("/api/")) {
    // derive backend and version if endpoint includes /api/
    const [origin, after] = apiBase.split("/api/");
    backendUrl = normalize(origin) || backendUrl || "http://localhost:8081";
    const seg = after.split("/")[0];
    if (seg) version = seg;
  } else {
    backendUrl = apiBase;
    apiBase = `${backendUrl}/api/${version}`;
  }
}

export const BELLLC_API_CONFIG = {
  BACKEND_BASE_URL: backendUrl!,
  API_VERSION: version,
  get API_BASE_URL() {
    return apiBase!;
  },
  FLOWER_LOGS: {
    BASE: "/flower-logs",
    BY_ID: "/flower-logs/:id",
    STATS: "/flower-logs/stats",
  },
};

export function belllcBuildUrl(
  endpoint: string,
  params?: Record<string, string | number>
) {
  let url = `${BELLLC_API_CONFIG.API_BASE_URL}${endpoint}`;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      url = url.replace(`:${k}`, String(v));
    });
  }
  return url;
}

export function belllcBuildFullUrl(
  endpoint: string,
  pathParams?: Record<string, string | number>,
  queryParams?: Record<string, unknown>
) {
  const base = belllcBuildUrl(endpoint, pathParams);
  if (!queryParams) return base;
  const sp = new URLSearchParams();
  Object.entries(queryParams).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach((it) => sp.append(k, String(it)));
    else sp.append(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export function belllcHeaders(extra?: Record<string, string>) {
  return {
    "Content-Type": "application/json",
    ...(BELLLC_ENV.BELLLC_API_KEY
      ? { "X-API-Key": BELLLC_ENV.BELLLC_API_KEY }
      : {}),
    ...(extra || {}),
  } as Record<string, string>;
}
