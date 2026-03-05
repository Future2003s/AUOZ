"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchMe, meQueryKey } from "./query";

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,   // 5 minutes — match useAuth
    gcTime: 10 * 60 * 1000,     // 10 minutes — match useAuth
    retry: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
  });
}

