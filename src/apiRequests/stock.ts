import {
    ApiResponse,
    StockSummary,
    StockLedgerEntry,
    FIFOValuation,
    ErpWarehouse,
    ErpLocation,
    LowStockAlert,
    RecordMovementFormValues,
} from "@/types/erp";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081/api/v1";

async function fetchApi<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
        credentials: "include",
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ errors: res.statusText }));
        throw Object.assign(new Error(body?.errors ?? "API error"), { status: res.status, body });
    }
    return res.json() as Promise<ApiResponse<T>>;
}

/** POST /api/v1/stock/movements — record a stock movement */
export async function recordMovement(
    body: RecordMovementFormValues
): Promise<ApiResponse<StockLedgerEntry>> {
    return fetchApi<StockLedgerEntry>("/stock/movements", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

/** GET /api/v1/stock/movements?itemId=... */
export async function getMovements(params: {
    itemId: string;
    locationId?: string;
    page?: number;
    limit?: number;
}): Promise<ApiResponse<StockLedgerEntry[]>> {
    const qs = new URLSearchParams({ itemId: params.itemId });
    if (params.locationId) qs.set("locationId", params.locationId);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return fetchApi<StockLedgerEntry[]>(`/stock/movements?${qs.toString()}`);
}

/** GET /api/v1/stock/items/:id/stock */
export async function getItemStock(itemId: string): Promise<ApiResponse<StockSummary>> {
    return fetchApi<StockSummary>(`/stock/items/${itemId}/stock`);
}

/** GET /api/v1/stock/items/:id/fifo-value */
export async function getFIFOValue(itemId: string): Promise<ApiResponse<FIFOValuation>> {
    return fetchApi<FIFOValuation>(`/stock/items/${itemId}/fifo-value`);
}

/** GET /api/v1/stock/warehouses */
export async function getWarehouses(isActive?: boolean): Promise<ApiResponse<ErpWarehouse[]>> {
    const qs = isActive !== undefined ? `?isActive=${isActive}` : "";
    return fetchApi<ErpWarehouse[]>(`/stock/warehouses${qs}`);
}

/** GET /api/v1/stock/warehouses/:id/locations */
export async function getLocations(warehouseId: string): Promise<ApiResponse<ErpLocation[]>> {
    return fetchApi<ErpLocation[]>(`/stock/warehouses/${warehouseId}/locations`);
}

/** GET /api/v1/stock/low-stock */
export async function getLowStock(): Promise<ApiResponse<LowStockAlert[]>> {
    return fetchApi<LowStockAlert[]>("/stock/low-stock");
}
