import {
  ComplaintSettings,
  ComplaintRequest,
  ComplaintStatus,
} from "@/types/complaints";
import { http } from "@/lib/http";

export interface ComplaintResponse<T = any> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ComplaintRequestPayload {
  fullName: string;
  orderCode: string;
  email: string;
  phone?: string;
  title: string;
  description: string;
}

export interface ComplaintRequestUpdatePayload {
  status?: ComplaintStatus;
  adminNotes?: string;
}

export const complaintApi = {
  getSettings: async (): Promise<ComplaintResponse<ComplaintSettings>> => {
    return http.get("/api/complaints", { baseUrl: "" });
  },
  updateSettings: async (
    data: ComplaintSettings,
    token?: string
  ): Promise<ComplaintResponse<ComplaintSettings>> => {
    return http.put("/api/complaints", data, {
      baseUrl: "",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  },
  submitRequest: async (
    payload: ComplaintRequestPayload
  ): Promise<ComplaintResponse<ComplaintRequest>> => {
    return http.post("/api/complaints/requests", payload, { baseUrl: "" });
  },
  getRequests: async (
    params: { status?: ComplaintStatus | "all"; search?: string; page?: number } = {},
    token?: string
  ): Promise<ComplaintResponse<ComplaintRequest[]>> => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== "all") {
      searchParams.append("status", params.status);
    }
    if (params.search) {
      searchParams.append("search", params.search);
    }
    if (params.page) {
      searchParams.append("page", String(params.page));
    }
    const query = searchParams.toString();
    return http.get(
      `/api/complaints/requests${query ? `?${query}` : ""}`,
      {
        baseUrl: "",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
  },
  updateRequest: async (
    id: string,
    payload: ComplaintRequestUpdatePayload,
    token?: string
  ): Promise<ComplaintResponse<ComplaintRequest>> => {
    return http.patch(`/api/complaints/requests/${id}`, payload, {
      baseUrl: "",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  },
};
