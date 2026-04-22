import { http } from "@/lib/http";

export interface PromoWidget {
    _id?: string;
    title: string;
    description?: string;
    imageUrl?: string;
    link?: string;
    position: 'left_ad' | 'right_upcoming' | 'right_story';
    isActive: boolean;
    badgeText?: string;
    metadata?: any;
    createdAt?: string;
    updatedAt?: string;
}

export interface PromoWidgetListResponse {
    success: boolean;
    data: PromoWidget[];
    message: string;
}

export interface PromoWidgetResponse {
    success: boolean;
    data: PromoWidget;
    message: string;
}

export const promoWidgetApi = {
    // Get all widgets
    getAll: async (params?: { position?: string; isActive?: boolean }): Promise<PromoWidgetListResponse> => {
        const queryParams = new URLSearchParams();
        if (params?.position) queryParams.append('position', params.position);
        if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

        const url = "/api/promo-widgets" + (queryParams.toString() ? `?${queryParams.toString()}` : '');
        return http.get(url, { baseUrl: "" });
    },

    // Create (admin)
    create: async (data: Partial<PromoWidget>): Promise<PromoWidgetResponse> => {
        return http.post("/api/promo-widgets", data, { baseUrl: "" });
    },

    // Update (admin)
    update: async (id: string, data: Partial<PromoWidget>): Promise<PromoWidgetResponse> => {
        return http.put(`/api/promo-widgets/${id}`, data, { baseUrl: "" });
    },

    // Toggle active (admin)
    toggleActive: async (id: string): Promise<PromoWidgetResponse> => {
        return http.patch(`/api/promo-widgets/${id}/toggle-active`, {}, { baseUrl: "" });
    },

    // Delete (admin)
    delete: async (id: string): Promise<{ success: boolean; message: string }> => {
        return http.delete(`/api/promo-widgets/${id}`, { baseUrl: "" });
    },
};
