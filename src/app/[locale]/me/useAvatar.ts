"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { meQueryKey } from "./query";

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/users/avatar", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ message: "Failed to upload avatar" }));
        throw new Error(error.message || error.error || "Failed to upload avatar");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch user profile to get updated avatar
      queryClient.invalidateQueries({ queryKey: meQueryKey });
    },
  });
}

