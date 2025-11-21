import { http } from "@/lib/http";

export interface Advertisement {
  _id?: string;
  enabled: boolean;
  title?: string;
  content: string;
  imageUrl?: string;
  link?: string;
  linkText?: string;
  delayTime: number;
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  showCloseButton: boolean;
  closeOnClickOutside: boolean;
  closeOnEscape: boolean;
  autoCloseTime?: number;
  priority: number;
  startDate?: string;
  endDate?: string;
  targetAudience?: {
    roles?: string[];
    locales?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface AdvertisementResponse {
  success: boolean;
  data: Advertisement | null;
  message: string;
}

export interface AdvertisementsListResponse {
  success: boolean;
  data: {
    advertisements: Advertisement[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message: string;
}

export const advertisementApi = {
  // Get active advertisement (public)
  getActive: async (): Promise<AdvertisementResponse> => {
    // Use frontend API route to avoid CORS/auth issues
    return http.get("/api/advertisements/active", { baseUrl: "" });
  },

  // Get all advertisements (admin)
  getAll: async (params?: { page?: number; limit?: number }, token?: string): Promise<AdvertisementsListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `/advertisements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return http.get(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  },

  // Get advertisement by ID (admin)
  getById: async (id: string, token: string): Promise<AdvertisementResponse> => {
    return http.get(`/advertisements/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Create advertisement (admin)
  create: async (data: Partial<Advertisement>, token: string): Promise<AdvertisementResponse> => {
    return http.post("/advertisements", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Update advertisement (admin)
  update: async (id: string, data: Partial<Advertisement>, token: string): Promise<AdvertisementResponse> => {
    return http.put(`/advertisements/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Delete advertisement (admin)
  delete: async (id: string, token: string): Promise<{ success: boolean; message: string }> => {
    return http.delete(`/advertisements/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Toggle advertisement enabled status (admin)
  toggle: async (id: string, token: string): Promise<AdvertisementResponse> => {
    return http.patch(`/advertisements/${id}/toggle`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

