"use client";
import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Tối ưu cho hiệu năng cao
            refetchOnWindowFocus: false, // Không refetch khi focus window
            refetchOnMount: false, // Không refetch khi mount lại
            refetchOnReconnect: false, // Không refetch khi reconnect
            // Tăng staleTime để giảm số lượng refetch và tăng tốc độ
            staleTime: 10 * 60 * 1000, // 10 phút - data vẫn fresh lâu hơn
            // Tăng cache time để giữ data lâu hơn trong memory
            gcTime: 30 * 60 * 1000, // 30 phút - giữ cache lâu hơn
            retry: 2, // Retry 2 lần cho reliability
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
            // Bật structural sharing để tối ưu re-renders
            structuralSharing: true,
          },
          mutations: {
            // Tối ưu mutations
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
