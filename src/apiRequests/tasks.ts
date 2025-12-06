import { http } from "@/lib/http";

// Helper to get token from cookies
const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "sessionToken") {
      return value;
    }
  }
  return null;
};

// Helper to create headers with auth
const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface Task {
  _id: string;
  id?: string;
  date: string;
  title: string;
  assignee: string;
  tag: string;
  status: "todo" | "pending" | "done";
  description?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskListResponse {
  success: boolean;
  data: Task[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TaskResponse {
  success: boolean;
  data: Task;
}

export interface CreateTaskPayload {
  date: string;
  title: string;
  assignee?: string;
  tag?: string;
  status?: "todo" | "pending" | "done";
  description?: string;
}

export interface UpdateTaskPayload {
  date?: string;
  title?: string;
  assignee?: string;
  tag?: string;
  status?: "todo" | "pending" | "done";
  description?: string;
}

export const tasksApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: "todo" | "pending" | "done";
    assignee?: string;
    tag?: string;
  }): Promise<TaskListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.date) searchParams.append("date", params.date);
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.assignee) searchParams.append("assignee", params.assignee);
    if (params?.tag) searchParams.append("tag", params.tag);
    const query = searchParams.toString();
    return http.get(`/api/tasks${query ? `?${query}` : ""}`, { 
      baseUrl: "",
      headers: getAuthHeaders(),
    });
  },
  
  getByDate: async (date: string): Promise<TaskListResponse> => {
    return http.get(`/api/tasks/date/${date}`, { 
      baseUrl: "",
      headers: getAuthHeaders(),
    });
  },
  
  getById: async (id: string): Promise<TaskResponse> => {
    return http.get(`/api/tasks/${id}`, { 
      baseUrl: "",
      headers: getAuthHeaders(),
    });
  },
  
  create: async (payload: CreateTaskPayload): Promise<TaskResponse> => {
    return http.post("/api/tasks", payload, { 
      baseUrl: "",
      headers: getAuthHeaders(),
    });
  },
  
  update: async (id: string, payload: UpdateTaskPayload): Promise<TaskResponse> => {
    return http.put(`/api/tasks/${id}`, payload, { 
      baseUrl: "",
      headers: getAuthHeaders(),
    });
  },
  
  toggleStatus: async (id: string): Promise<TaskResponse> => {
    return http.patch(`/api/tasks/${id}/toggle-status`, {}, { 
      baseUrl: "",
      headers: getAuthHeaders(),
    });
  },
  
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return http.delete(`/api/tasks/${id}`, { 
      baseUrl: "",
      headers: getAuthHeaders(),
    });
  },
};

