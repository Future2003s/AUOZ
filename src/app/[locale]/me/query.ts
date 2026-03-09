import { QueryClient } from "@tanstack/react-query";

export const meQueryKey = ["me"] as const;

// ─── Fetch current user — calls /api/auth/me which handles refresh ──
export async function fetchMe() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      // Return null user instead of throwing — prevents React Query error state
      return { success: true, user: null };
    }

    const data = await res.json();
    if (data?.success === true) {
      return data;
    }

    return { success: true, user: null };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("[fetchMe] Request timed out");
    }
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
