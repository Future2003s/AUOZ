// Use Next.js API routes to proxy requests with cookie authentication

export interface EmployeeMetrics {
  incompleteInvoices: number;
  undeliveredOrders: number;
  unpaidOrders: number;
  notInDebt: number;
}

export interface EmployeeMetricsResponse {
  success: boolean;
  message?: string;
  data: EmployeeMetrics;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const employeeApiRequest = {
  // Get employee metrics
  getMetrics: async (): Promise<EmployeeMetricsResponse> => {
    const response = await fetch("/api/employee/metrics", {
      credentials: "include",
      cache: "no-store",
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.message || errorData?.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return response.json();
  },

  // Get incomplete invoices
  getIncompleteInvoices: async (
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    
    const url = `/api/employee/metrics/incomplete-invoices${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    
    const response = await fetch(url, {
      credentials: "include",
      cache: "no-store",
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.message || errorData?.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return response.json();
  },

  // Get undelivered orders
  getUndeliveredOrders: async (
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    
    const url = `/api/employee/metrics/undelivered-orders${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    
    console.log("[Employee API] Fetching undelivered orders from:", url);
    
    const response = await fetch(url, {
      credentials: "include",
      cache: "no-store",
    });
    
    console.log("[Employee API] Response status:", response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Employee API] Error response:", errorData);
      const errorMessage = errorData?.message || errorData?.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log("[Employee API] Success response:", {
      success: data.success,
      dataLength: Array.isArray(data.data) ? data.data.length : "not array",
      pagination: data.pagination,
    });
    
    return data;
  },

  // Get unpaid orders
  getUnpaidOrders: async (
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    
    const url = `/api/employee/metrics/unpaid-orders${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    
    const response = await fetch(url, {
      credentials: "include",
      cache: "no-store",
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.message || errorData?.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return response.json();
  },

  // Get orders not in debt
  getOrdersNotInDebt: async (
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    
    const url = `/api/employee/metrics/not-in-debt${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    
    const response = await fetch(url, {
      credentials: "include",
      cache: "no-store",
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.message || errorData?.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return response.json();
  },
};

