import { http } from "@/lib/http";

export interface Activity {
  _id?: string;
  title: string;
  shortDescription?: string;
  content: string;
  imageUrl?: string;
  gallery?: string[];
  activityDate?: string;
  location?: string;
  published: boolean;
  order: number;
  tags?: string[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityResponse {
  success: boolean;
  data: Activity | null;
  message: string;
}

export interface ActivitiesListResponse {
  success: boolean;
  data: {
    activities: Activity[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message: string;
}

export const activityApi = {
  // Get all activities (public)
  getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<ActivitiesListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const url = `/api/activities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return http.get(url, { baseUrl: "" });
  },

  // Get activity by ID (public)
  getById: async (id: string): Promise<ActivityResponse> => {
    return http.get(`/api/activities/${id}`, { baseUrl: "" });
  },

  // Get all activities (admin)
  getAllAdmin: async (params?: { page?: number; limit?: number; search?: string; published?: string }, token?: string): Promise<ActivitiesListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.published !== undefined) queryParams.append('published', params.published);
    
    const url = `/api/activities/admin/all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return http.get(url, {
      baseUrl: "",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  },

  // Get activity by ID (admin)
  getByIdAdmin: async (id: string, token: string): Promise<ActivityResponse> => {
    return http.get(`/api/activities/admin/${id}`, {
      baseUrl: "",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Create activity (admin)
  create: async (data: Partial<Activity>, token: string): Promise<ActivityResponse> => {
    return http.post("/api/activities", data, {
      baseUrl: "",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Update activity (admin)
  update: async (id: string, data: Partial<Activity>, token: string): Promise<ActivityResponse> => {
    return http.put(`/api/activities/${id}`, data, {
      baseUrl: "",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Delete activity (admin)
  delete: async (id: string, token: string): Promise<{ success: boolean; message: string }> => {
    return http.delete(`/api/activities/${id}`, {
      baseUrl: "",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Toggle published status (admin)
  toggle: async (id: string, token: string): Promise<ActivityResponse> => {
    return http.patch(`/api/activities/${id}/toggle`, {}, {
      baseUrl: "",
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

