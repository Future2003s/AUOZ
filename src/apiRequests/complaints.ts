import { ComplaintSettings } from "@/types/complaints";
import { http } from "@/lib/http";

export interface ComplaintResponse {
  success: boolean;
  data: ComplaintSettings;
}

export const complaintApi = {
  getSettings: async (): Promise<ComplaintResponse> => {
    return http.get("/api/complaints", { baseUrl: "" });
  },
  updateSettings: async (data: ComplaintSettings, token?: string): Promise<ComplaintResponse> => {
    return http.put("/api/complaints", data, {
      baseUrl: "",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  },
};


