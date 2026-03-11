import {
    ApiResponse,
    PurchaseRequisition,
    PurchaseOrder,
    GoodsReceipt,
    MatchResult,
    CreatePRFormValues,
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

// ─── Purchase Requisitions ────────────────────────────────────────────────────

export async function getPRs(params?: {
    page?: number;
    limit?: number;
    status?: string;
}): Promise<ApiResponse<PurchaseRequisition[]>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.status) qs.set("status", params.status);
    return fetchApi<PurchaseRequisition[]>(`/purchase/requisitions?${qs.toString()}`);
}

export async function createPR(body: CreatePRFormValues): Promise<ApiResponse<PurchaseRequisition>> {
    return fetchApi<PurchaseRequisition>("/purchase/requisitions", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function approvePR(
    id: string,
    approve: boolean,
    reason?: string
): Promise<ApiResponse<PurchaseRequisition>> {
    return fetchApi<PurchaseRequisition>(`/purchase/requisitions/${id}/approve`, {
        method: "PUT",
        body: JSON.stringify({ approve, reason }),
    });
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export async function getPOs(params?: {
    page?: number;
    limit?: number;
    status?: string;
    vendorId?: string;
}): Promise<ApiResponse<PurchaseOrder[]>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.status) qs.set("status", params.status);
    if (params?.vendorId) qs.set("vendorId", params.vendorId);
    return fetchApi<PurchaseOrder[]>(`/purchase/orders?${qs.toString()}`);
}

export async function getPO(id: string): Promise<ApiResponse<PurchaseOrder>> {
    return fetchApi<PurchaseOrder>(`/purchase/orders/${id}`);
}

export async function createPO(body: {
    vendorId: string;
    prId?: string;
    currency?: string;
    paymentTermsDays?: number;
    expectedDeliveryDate?: string;
    note?: string;
    lines: Array<{
        itemId: string;
        qty: number;
        unitPriceCents: number;
        uomId: string;
        promisedDate?: string;
    }>;
}): Promise<ApiResponse<PurchaseOrder>> {
    return fetchApi<PurchaseOrder>("/purchase/orders", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function approvePO(id: string): Promise<ApiResponse<PurchaseOrder>> {
    return fetchApi<PurchaseOrder>(`/purchase/orders/${id}/approve`, { method: "PUT" });
}

// ─── Goods Receipts ────────────────────────────────────────────────────────────

export async function getGRs(params?: {
    page?: number;
    limit?: number;
    poId?: string;
}): Promise<ApiResponse<GoodsReceipt[]>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.poId) qs.set("poId", params.poId);
    return fetchApi<GoodsReceipt[]>(`/purchase/receipts?${qs.toString()}`);
}

export async function receiveGoods(body: {
    poId: string;
    receivedDate?: string;
    note?: string;
    lines: Array<{
        poLineId: string;
        itemId: string;
        qtyReceived: number;
        qtyAccepted: number;
        qtyRejected: number;
        uomId: string;
        locationId: string;
        warehouseId: string;
        lotId?: string;
        unitCostCents: number;
        note?: string;
    }>;
}): Promise<ApiResponse<GoodsReceipt>> {
    return fetchApi<GoodsReceipt>("/purchase/receipts", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function threeWayMatch(body: {
    poId: string;
    grId: string;
    invoiceLines: Array<{ itemId: string; qty: number; unitPriceCents: number }>;
}): Promise<ApiResponse<MatchResult>> {
    return fetchApi<MatchResult>("/purchase/match", {
        method: "POST",
        body: JSON.stringify(body),
    });
}
