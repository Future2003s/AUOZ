"use client";
import { useQuery } from "@tanstack/react-query";

type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

type OrderProductInfo = {
  _id?: string;
  name?: string;
  slug?: string;
  sku?: string;
  salePrice?: number;
  price?: number;
  images?: Array<{ url: string; alt?: string }>;
};

type OrderItem = {
  product?: OrderProductInfo;
  name?: string;
  quantity: number;
  price?: number;
  subtotal?: number;
  image?: string;
};

type Order = {
  _id: string;
  id?: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  cancelledAt?: string;
};

const ordersQueryKey = ["orders"] as const;

async function fetchOrders(status?: OrderStatus): Promise<Order[]> {
  const url = new URL("/api/orders", window.location.origin);
  if (status && status !== "all") {
    url.searchParams.set("status", status);
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch orders");
  }

  const data = await res.json();
  // Handle paginated response
  if (data?.data && Array.isArray(data.data)) {
    return data.data;
  }
  if (Array.isArray(data)) {
    return data;
  }
  return [];
}

type UseOrdersOptions = {
  enabled?: boolean;
  refetchIntervalMs?: number;
};

export function useOrders(status?: OrderStatus, options?: UseOrdersOptions) {
  const { enabled = true, refetchIntervalMs = 15000 } = options || {};
  const normalizedStatus = status || "all";

  return useQuery({
    queryKey: [...ordersQueryKey, normalizedStatus],
    queryFn: () => fetchOrders(normalizedStatus === "all" ? undefined : normalizedStatus),
    enabled,
    refetchOnWindowFocus: enabled,
    refetchInterval: enabled ? refetchIntervalMs : false,
  });
}
