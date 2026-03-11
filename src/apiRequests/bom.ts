import {
    ApiResponse,
    BomHeader,
    BomNode,
    MaterialRequirement,
    PaginationMeta,
} from "@/types/erp";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081/api/v1";

async function fetchApi<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
        credentials: "include",
    });

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ errors: res.statusText }));
        throw Object.assign(new Error(errorBody?.errors ?? "API error"), {
            status: res.status,
            body: errorBody,
        });
    }

    return res.json() as Promise<ApiResponse<T>>;
}

/** GET /api/v1/boms */
export async function getBoms(params?: {
    page?: number;
    limit?: number;
    status?: string;
    productId?: string;
}): Promise<ApiResponse<BomHeader[]> & { meta: PaginationMeta }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.status) qs.set("status", params.status);
    if (params?.productId) qs.set("productId", params.productId);
    return fetchApi<BomHeader[]>(`/boms?${qs.toString()}`) as Promise<ApiResponse<BomHeader[]> & { meta: PaginationMeta }>;
}

/** GET /api/v1/boms/:id  */
export async function getBom(id: string): Promise<ApiResponse<BomHeader & { lines: unknown[] }>> {
    return fetchApi<BomHeader & { lines: unknown[] }>(`/boms/${id}`);
}

/** POST /api/v1/boms */
export async function createBom(body: {
    productId: string;
    description?: string;
    outputQty?: number;
    outputUomId: string;
    effectivityStart?: string;
    effectivityEnd?: string;
    lines: Array<{
        componentId: string;
        qty: number;
        uomId: string;
        scrapBps?: number;
        note?: string;
    }>;
}): Promise<ApiResponse<BomHeader>> {
    return fetchApi<BomHeader>("/boms", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

/** PUT /api/v1/boms/:id/status */
export async function changeBomStatus(
    id: string,
    status: string,
    reason?: string
): Promise<ApiResponse<BomHeader>> {
    return fetchApi<BomHeader>(`/boms/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, reason }),
    });
}

/** GET /api/v1/boms/:id/tree */
export async function getBomTree(id: string, qty?: number): Promise<ApiResponse<BomNode[]>> {
    const qs = qty ? `?qty=${qty}` : "";
    return fetchApi<BomNode[]>(`/boms/${id}/tree${qs}`);
}

/** GET /api/v1/boms/:id/explosion */
export async function getBomExplosion(
    id: string,
    qty?: number
): Promise<ApiResponse<MaterialRequirement[]>> {
    const qs = qty ? `?qty=${qty}` : "";
    return fetchApi<MaterialRequirement[]>(`/boms/${id}/explosion${qs}`);
}

/** GET /api/v1/items/:itemId/where-used */
export async function getWhereUsed(itemId: string): Promise<ApiResponse<BomHeader[]>> {
    return fetchApi<BomHeader[]>(`/stock/items/${itemId}/where-used`);
}
