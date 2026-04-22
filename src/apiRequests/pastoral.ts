import { http } from "@/lib/http";

export interface PastoralImage {
    _id?: string;
    titleVi: string;
    titleEn: string;
    descVi: string;
    descEn: string;
    url: string;
    category: 'landscape' | 'life' | 'nature';
    createdAt?: string;
    updatedAt?: string;
}

export interface PastoralListResponse {
    success: boolean;
    data: PastoralImage[];
    message: string;
}

export interface PastoralResponse {
    success: boolean;
    data: PastoralImage | null;
    message: string;
}

export const pastoralApi = {
    // Get all pastoral images
    getAll: async (params?: { category?: string }): Promise<PastoralListResponse> => {
        const queryParams = new URLSearchParams();
        if (params?.category) queryParams.append('category', params.category);

        const url = "/api/pastoral" + (queryParams.toString() ? `?${queryParams.toString()}` : '');

        return http.get(url, { baseUrl: "" });
    },

    // Create image (admin)
    create: async (data: Partial<PastoralImage>, token?: string): Promise<PastoralResponse> => {
        return http.post("/api/pastoral", data, {
            baseUrl: "",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
    },

    // Update image (admin)
    update: async (id: string, data: Partial<PastoralImage>, token?: string): Promise<PastoralResponse> => {
        return http.put(`/api/pastoral/${id}`, data, {
            baseUrl: "",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
    },

    // Delete image (admin)
    delete: async (id: string, token?: string): Promise<{ success: boolean; message: string }> => {
        return http.delete(`/api/pastoral/${id}`, {
            baseUrl: "",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
    },
};
