"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Tối ưu QueryClient cho server nhỏ
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      // Tăng staleTime để giảm API calls
      staleTime: 5 * 60 * 1000, // 5 phút
      // Giảm cache time để tiết kiệm memory
      gcTime: 10 * 60 * 1000, // 10 phút
      retry: 1, // Chỉ retry 1 lần
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Chỉ hiển thị devtools trong development */}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
