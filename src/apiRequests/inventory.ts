import { http } from "@/lib/http";
import { envConfig } from "@/config";

const BASE_URL = `${envConfig.NEXT_PUBLIC_API_END_POINT}/inventory`;

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  netWeight: number;
  minStock: number;
  price: number;
  location: string;
  category: string;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryHistoryItem {
  id: string;
  inventoryId: string;
  itemName: string;
  type: "import" | "export";
  amount: number;
  unit: string;
  partner?: string;
  createdAt: string;
}

export interface InventoryStats {
  totalJars: number;
  totalValue: number;
  totalWeightKg: string;
  lowStock: number;
}

export interface CreateInventoryData {
  name: string;
  quantity: number;
  unit?: string;
  netWeight?: number;
  minStock?: number;
  price: number;
  location?: string;
  category?: string;
}

export interface UpdateInventoryData extends Partial<CreateInventoryData> {}

export interface StockAdjustmentData {
  type: "import" | "export";
  amount: number;
  partner?: string;
}

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
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

// Get all inventories
export async function getInventories(filters?: InventoryFilters) {
  const params = new URLSearchParams();
  
  if (filters?.search) params.append("search", filters.search);
  if (filters?.location) params.append("location", filters.location);
  if (filters?.category) params.append("category", filters.category);
  if (filters?.lowStock) params.append("lowStock", "true");
  if (filters?.premium) params.append("premium", "true");
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.sort) params.append("sort", filters.sort);
  if (filters?.order) params.append("order", filters.order);

  const url = `${BASE_URL}${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await http.get<{
    success: boolean;
    data: InventoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages?: number;
      pages?: number; // Backend may return 'pages' instead
    };
  }>(url);
  
  // Normalize pagination: use totalPages if available, otherwise use pages
  if (response.pagination && !response.pagination.totalPages && response.pagination.pages) {
    response.pagination.totalPages = response.pagination.pages;
  }

  return response;
}

// Get single inventory
export async function getInventory(id: string) {
  const response = await http.get<{
    success: boolean;
    data: InventoryItem;
  }>(`${BASE_URL}/${id}`);

  return response;
}

// Create inventory
export async function createInventory(data: CreateInventoryData) {
  const response = await http.post<{
    success: boolean;
    data: InventoryItem;
  }>(BASE_URL, data);

  return response;
}

// Update inventory
export async function updateInventory(id: string, data: UpdateInventoryData) {
  const response = await http.put<{
    success: boolean;
    data: InventoryItem;
  }>(`${BASE_URL}/${id}`, data);

  return response;
}

// Delete inventory
export async function deleteInventory(id: string) {
  const response = await http.delete<{
    success: boolean;
    data: null;
  }>(`${BASE_URL}/${id}`);

  return response;
}

// Adjust stock
export async function adjustStock(id: string, data: StockAdjustmentData) {
  const response = await http.post<{
    success: boolean;
    data: {
      inventory: InventoryItem;
      history: InventoryHistoryItem;
    };
  }>(`${BASE_URL}/${id}/adjust`, data);

  return response;
}

// Get inventory stats
export async function getInventoryStats() {
  const response = await http.get<{
    success: boolean;
    data: InventoryStats;
  }>(`${BASE_URL}/stats`);

  return response;
}

// Get inventory history
export async function getInventoryHistory(filters?: InventoryHistoryFilters) {
  const params = new URLSearchParams();
  
  if (filters?.inventoryId) params.append("inventoryId", filters.inventoryId);
  if (filters?.type) params.append("type", filters.type);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.sort) params.append("sort", filters.sort);
  if (filters?.order) params.append("order", filters.order);

  const url = `${BASE_URL}/history${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await http.get<{
    success: boolean;
    data: InventoryHistoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages?: number;
      pages?: number; // Backend may return 'pages' instead
    };
  }>(url);
  
  // Normalize pagination: use totalPages if available, otherwise use pages
  if (response.pagination && !response.pagination.totalPages && response.pagination.pages) {
    response.pagination.totalPages = response.pagination.pages;
  }

  return response;
}
