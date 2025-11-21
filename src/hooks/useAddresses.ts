"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Address = {
  _id?: string;
  id?: string;
  type: "home" | "work" | "other";
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
  provinceOld?: string;
  districtOld?: string;
  wardOld?: string;
  provinceNew?: string;
  wardNew?: string;
};

const addressesQueryKey = ["addresses"] as const;

async function fetchAddresses(): Promise<Address[]> {
  const res = await fetch("/api/users/addresses", {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch addresses");
  }

  const data = await res.json();
  return data?.data || data || [];
}

type UseAddressesOptions = {
  enabled?: boolean;
};

export function useAddresses(options?: UseAddressesOptions) {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: addressesQueryKey,
    queryFn: fetchAddresses,
    enabled,
  });
}

export function useAddAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressData: Omit<Address, "_id" | "id">) => {
      const res = await fetch("/api/users/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(addressData),
      });

      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ message: "Failed to add address" }));
        throw new Error(error.message || "Failed to add address");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressesQueryKey });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      addressId,
      addressData,
    }: {
      addressId: string;
      addressData: Partial<Address>;
    }) => {
      const res = await fetch(`/api/users/addresses/${addressId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(addressData),
      });

      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ message: "Failed to update address" }));
        throw new Error(error.message || "Failed to update address");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressesQueryKey });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId: string) => {
      const res = await fetch(`/api/users/addresses/${addressId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ message: "Failed to delete address" }));
        throw new Error(error.message || "Failed to delete address");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressesQueryKey });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId: string) => {
      const res = await fetch(`/api/users/addresses/${addressId}/default`, {
        method: "PUT",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ message: "Failed to set default address" }));
        throw new Error(error.message || "Failed to set default address");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressesQueryKey });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

