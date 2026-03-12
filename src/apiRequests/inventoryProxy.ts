/**
 * inventoryProxy.ts
 *
 * Wrapper gọi inventory API qua Next.js proxy route (/api/inventory/*).
 * Dùng cho Client Components để tránh vấn đề CORS & SameSite cookie
 * khi FE và BE deploy ở khác domain.
 *
 * Browser → /api/inventory (same-origin) → Next.js server → backend
 */

import type {
  InventoryItem,
  InventoryFilters,
  InventoryHistoryFilters,
  DefectiveReportFilters,
  CreateInventoryData,
  UpdateInventoryData,
  StockAdjustmentData,
  DefectiveReportData,
  ResolveDefectiveData,
  ReturnProductData,
  StatusChangeData,
  InventoryHistoryItem,
  InventoryStats,
  DefectiveReportItem,
} from "./inventory";

// ─── Base URL (relative, luôn same-origin với browser) ───────────────
const BASE = "/api/inventory";

// ─── HTTP helpers ─────────────────────────────────────────────────────

async function apiFetch<T>(
  url: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err: any = new Error(
      data?.message || data?.error || `HTTP ${res.status}`
    );
    err.statusCode = res.status;
    err.payload = data;
    throw err;
  }

  return data as T;
}

function buildQs(filters: Record<string, any>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

// ─── Pagination normalizer (same as inventory.ts) ─────────────────────
function normPagination(pagination?: any) {
  if (pagination && !pagination.totalPages && pagination.pages) {
    pagination.totalPages = pagination.pages;
  }
  return pagination;
}

// ═════════════════════════════════════════════════════════════════════
// CRUD
// ═════════════════════════════════════════════════════════════════════

export async function proxyGetInventories(filters?: InventoryFilters) {
  const url = `${BASE}${buildQs(filters || {})}`;
  const response = await apiFetch<{
    success: boolean;
    data: InventoryItem[];
    pagination: any;
  }>(url);
  normPagination(response.pagination);
  return response;
}

export async function proxyGetInventory(id: string) {
  return apiFetch<{ success: boolean; data: InventoryItem }>(`${BASE}/${id}`);
}

export async function proxyCreateInventory(data: CreateInventoryData) {
  return apiFetch<{ success: boolean; data: InventoryItem }>(BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function proxyUpdateInventory(
  id: string,
  data: UpdateInventoryData
) {
  return apiFetch<{ success: boolean; data: InventoryItem }>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function proxyDeleteInventory(id: string) {
  return apiFetch<{ success: boolean; data: null }>(`${BASE}/${id}`, {
    method: "DELETE",
  });
}

// ═════════════════════════════════════════════════════════════════════
// STOCK OPERATIONS
// ═════════════════════════════════════════════════════════════════════

export async function proxyAdjustStock(
  id: string,
  data: StockAdjustmentData
) {
  return apiFetch<{
    success: boolean;
    data: { inventory: InventoryItem; history: InventoryHistoryItem };
  }>(`${BASE}/${id}/adjust`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function proxyReportDefective(
  id: string,
  data: DefectiveReportData
) {
  return apiFetch<{
    success: boolean;
    data: {
      inventory: InventoryItem;
      report: DefectiveReportItem;
      history: InventoryHistoryItem;
    };
  }>(`${BASE}/${id}/defective`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function proxyReturnProduct(
  id: string,
  data: ReturnProductData
) {
  return apiFetch<{
    success: boolean;
    data: { inventory: InventoryItem; history: InventoryHistoryItem };
  }>(`${BASE}/${id}/return`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function proxyChangeStatus(
  id: string,
  data: StatusChangeData
) {
  return apiFetch<{
    success: boolean;
    data: { inventory: InventoryItem; history: InventoryHistoryItem };
  }>(`${BASE}/${id}/status-change`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ═════════════════════════════════════════════════════════════════════
// STATS & HISTORY
// ═════════════════════════════════════════════════════════════════════

export async function proxyGetInventoryStats() {
  return apiFetch<{ success: boolean; data: InventoryStats }>(
    `${BASE}/stats`
  );
}

export async function proxyGetInventoryHistory(
  filters?: InventoryHistoryFilters
) {
  const url = `${BASE}/history${buildQs(filters || {})}`;
  const response = await apiFetch<{
    success: boolean;
    data: InventoryHistoryItem[];
    pagination: any;
  }>(url);
  normPagination(response.pagination);
  return response;
}

// ═════════════════════════════════════════════════════════════════════
// DEFECTIVE REPORTS
// ═════════════════════════════════════════════════════════════════════

export async function proxyGetDefectiveReports(
  filters?: DefectiveReportFilters
) {
  const url = `${BASE}/defective-reports${buildQs(filters || {})}`;
  const response = await apiFetch<{
    success: boolean;
    data: DefectiveReportItem[];
    pagination: any;
  }>(url);
  normPagination(response.pagination);
  return response;
}

export async function proxyResolveDefective(
  reportId: string,
  data: ResolveDefectiveData
) {
  return apiFetch<{
    success: boolean;
    data: {
      inventory: InventoryItem;
      report: DefectiveReportItem;
      history: InventoryHistoryItem;
    };
  }>(`${BASE}/defective-reports/${reportId}/resolve`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
