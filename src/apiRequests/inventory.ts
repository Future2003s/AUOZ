import { http } from "@/lib/http";
import { envConfig } from "@/config";

const BASE_URL = `${envConfig.NEXT_PUBLIC_API_END_POINT}/inventory`;

// ─── Types ───────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  defectiveQty: number;
  returnedQty: number;
  damagedQty: number;
  pendingCheckQty: number;
  soldQty: number;
  totalStock: number;
  unit: string;
  netWeight: number;
  minStock: number;
  price: number;
  location: string;
  category: string;
  productId?: string;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryTransactionType =
  | "import"
  | "export"
  | "defective"
  | "adjust"
  | "return"
  | "damaged"
  | "status_change"
  | "destroy";

export interface InventoryHistoryItem {
  id: string;
  inventoryId: string;
  itemName: string;
  type: InventoryTransactionType;
  amount: number;
  unit: string;
  partner?: string;
  reason?: string;
  images?: string[];
  fromStatus?: string;
  toStatus?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

export interface InventoryStats {
  totalJars: number;
  totalNormal: number;
  totalDefective: number;
  totalPendingCheck: number;
  totalReturned: number;
  totalDamaged: number;
  totalSold: number;
  totalValue: number;
  totalWeightKg: number;
  lowStock: number;
  pendingReports: number;
  inspectingReports: number;
  byLocation: Record<
    string,
    {
      normal: number;
      defective: number;
      damaged: number;
      returned: number;
      total: number;
    }
  >;
}

export type DefectiveSeverity = "low" | "medium" | "high" | "critical";
export type DefectiveReportStatus = "pending" | "inspecting" | "resolved" | "destroyed";
export type DefectiveResolution = "repaired" | "destroyed" | "returned_to_supplier";

export interface DefectiveReportItem {
  id: string;
  inventoryId: string | { id: string; name: string; location: string };
  productId?: string;
  quantity: number;
  reason: string;
  images: string[];
  severity: DefectiveSeverity;
  status: DefectiveReportStatus;
  resolution?: DefectiveResolution;
  resolutionNote?: string;
  resolvedQuantity?: number;
  reportedBy?: { firstName: string; lastName: string; email: string };
  resolvedBy?: { firstName: string; lastName: string; email: string };
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Request data types ──────────────────────────────────────────────

export interface CreateInventoryData {
  name: string;
  quantity: number;
  unit?: string;
  netWeight?: number;
  minStock?: number;
  price: number;
  location?: string;
  category?: string;
  productId?: string;
}

export interface UpdateInventoryData extends Partial<CreateInventoryData> { }

export interface StockAdjustmentData {
  type: "import" | "export";
  amount: number;
  partner?: string;
  reason?: string;
}

export interface DefectiveReportData {
  quantity: number;
  reason: string;
  images?: string[];
  severity?: DefectiveSeverity;
}

export interface ResolveDefectiveData {
  resolution: DefectiveResolution;
  resolvedQuantity: number;
  resolutionNote?: string;
}

export interface ReturnProductData {
  quantity: number;
  reason: string;
}

export interface StatusChangeData {
  quantity: number;
  fromStatus: string;
  toStatus: string;
  reason?: string;
}

// ─── Filter types ────────────────────────────────────────────────────

export interface InventoryFilters {
  search?: string;
  location?: string;
  category?: string;
  lowStock?: boolean;
  premium?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface InventoryHistoryFilters {
  inventoryId?: string;
  type?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface DefectiveReportFilters {
  inventoryId?: string;
  status?: string;
  severity?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

// ─── Pagination response ─────────────────────────────────────────────

interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  pages?: number;
}

function normalizePagination(pagination?: PaginationResponse) {
  if (pagination && !pagination.totalPages && pagination.pages) {
    pagination.totalPages = pagination.pages;
  }
  return pagination;
}

function buildParams(filters: Record<string, any>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  }
  const str = params.toString();
  return str ? `?${str}` : "";
}

// ═════════════════════════════════════════════════════════════════════
// CRUD
// ═════════════════════════════════════════════════════════════════════

export async function getInventories(filters?: InventoryFilters) {
  const url = `${BASE_URL}${buildParams(filters || {})}`;
  const response = await http.get<{
    success: boolean;
    data: InventoryItem[];
    pagination: PaginationResponse;
  }>(url);
  normalizePagination(response.pagination);
  return response;
}

export async function getInventory(id: string) {
  return http.get<{ success: boolean; data: InventoryItem }>(`${BASE_URL}/${id}`);
}

export async function createInventory(data: CreateInventoryData) {
  return http.post<{ success: boolean; data: InventoryItem }>(BASE_URL, data);
}

export async function updateInventory(id: string, data: UpdateInventoryData) {
  return http.put<{ success: boolean; data: InventoryItem }>(`${BASE_URL}/${id}`, data);
}

export async function deleteInventory(id: string) {
  return http.delete<{ success: boolean; data: null }>(`${BASE_URL}/${id}`);
}

// ═════════════════════════════════════════════════════════════════════
// STOCK OPERATIONS
// ═════════════════════════════════════════════════════════════════════

export async function adjustStock(id: string, data: StockAdjustmentData) {
  return http.post<{
    success: boolean;
    data: { inventory: InventoryItem; history: InventoryHistoryItem };
  }>(`${BASE_URL}/${id}/adjust`, data);
}

export async function reportDefective(id: string, data: DefectiveReportData) {
  return http.post<{
    success: boolean;
    data: {
      inventory: InventoryItem;
      report: DefectiveReportItem;
      history: InventoryHistoryItem;
    };
  }>(`${BASE_URL}/${id}/defective`, data);
}

export async function returnProduct(id: string, data: ReturnProductData) {
  return http.post<{
    success: boolean;
    data: { inventory: InventoryItem; history: InventoryHistoryItem };
  }>(`${BASE_URL}/${id}/return`, data);
}

export async function changeStatus(id: string, data: StatusChangeData) {
  return http.post<{
    success: boolean;
    data: { inventory: InventoryItem; history: InventoryHistoryItem };
  }>(`${BASE_URL}/${id}/status-change`, data);
}

// ═════════════════════════════════════════════════════════════════════
// STATS & HISTORY
// ═════════════════════════════════════════════════════════════════════

export async function getInventoryStats() {
  return http.get<{ success: boolean; data: InventoryStats }>(`${BASE_URL}/stats`);
}

export async function getInventoryHistory(filters?: InventoryHistoryFilters) {
  const url = `${BASE_URL}/history${buildParams(filters || {})}`;
  const response = await http.get<{
    success: boolean;
    data: InventoryHistoryItem[];
    pagination: PaginationResponse;
  }>(url);
  normalizePagination(response.pagination);
  return response;
}

// ═════════════════════════════════════════════════════════════════════
// DEFECTIVE REPORTS
// ═════════════════════════════════════════════════════════════════════

export async function getDefectiveReports(filters?: DefectiveReportFilters) {
  const url = `${BASE_URL}/defective-reports${buildParams(filters || {})}`;
  const response = await http.get<{
    success: boolean;
    data: DefectiveReportItem[];
    pagination: PaginationResponse;
  }>(url);
  normalizePagination(response.pagination);
  return response;
}

export async function resolveDefective(reportId: string, data: ResolveDefectiveData) {
  return http.post<{
    success: boolean;
    data: {
      inventory: InventoryItem;
      report: DefectiveReportItem;
      history: InventoryHistoryItem;
    };
  }>(`${BASE_URL}/defective-reports/${reportId}/resolve`, data);
}
