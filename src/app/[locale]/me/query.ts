import { QueryClient } from "@tanstack/react-query";

export const meQueryKey = ["me"] as const;

// Timeout helper
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timeout)
  );
}

export async function fetchMe() {
  try {
    // Gọi Next API để tận dụng cookie sessionToken (httpOnly)
    const res = await fetchWithTimeout(`/api/auth/me`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (res.status === 401) {
      // Thử silent refresh trước khi báo lỗi
      try {
        const refreshRes = await fetchWithTimeout("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }, 5000);

        if (refreshRes.ok) {
          // Retry lấy user sau khi refresh
          const retryRes = await fetchWithTimeout(`/api/auth/me`, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          }, 5000);

          if (retryRes.ok) {
            const retryData = await retryRes.json();
            if (retryData?.success === true) return retryData;
          }
        }
      } catch {
        // refresh failed silently
      }
      // Trả về "không đăng nhập" thay vì throw để tránh React Query set error
      return { success: true, user: null };
    }

    const contentType = res.headers.get("content-type") || "application/json";
    const data = contentType.includes("application/json")
      ? await res.json()
      : await res.text();

    // Chuẩn hoá format: ưu tiên data.success === true
    if (res.ok && data?.success === true) {
      return data;
    }

    // Không throw — trả về user null để không gây logout
    return { success: true, user: null };
  } catch (error) {
    // AbortError = timeout — return null user instead of hanging
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("[fetchMe] Request timed out after 8 seconds");
      return { success: true, user: null };
    }
    console.error("Error fetching user data:", error);
    // Trả về user null thay vì throw để tránh crash auth state
    return { success: true, user: null };
  }
}


export async function prefetchMe(qc: QueryClient) {
  try {
    await qc.prefetchQuery({ queryKey: meQueryKey, queryFn: fetchMe });
  } catch (error) {
    console.error("Error prefetching user data:", error);
  }
}
