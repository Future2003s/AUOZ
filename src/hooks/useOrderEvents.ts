"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

type OrderEventMessage = {
  type: "created" | "updated";
  id?: string | null;
  status?: string;
  at: number;
};

type UseOrderEventsOptions = {
  channel?: "user" | "admin";
};

export function useOrderEvents(
  enabled: boolean = true,
  options: UseOrderEventsOptions = { channel: "user" }
) {
  const queryClient = useQueryClient();
  const endpoint =
    options.channel === "admin"
      ? "/api/notifications/admin-sse"
      : "/api/notifications/sse";

  const handleOrderEvent = useCallback(
    (event: MessageEvent<string>) => {
      try {
        const data: OrderEventMessage = JSON.parse(event.data);
        console.debug("[useOrderEvents] Order event received:", data);

        // Invalidate orders queries to refresh data
        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) && query.queryKey[0] === "orders",
        });
      } catch (err) {
        console.warn("[useOrderEvents] Failed to parse order event:", err);
      }
    },
    [queryClient]
  );

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const source = new EventSource(endpoint);

    source.addEventListener("order", handleOrderEvent as EventListener);

    // Handle connection errors
    source.onerror = (error) => {
      console.error("[useOrderEvents] SSE connection error:", error);
      // Optionally reconnect after delay
    };

    return () => {
      source.removeEventListener("order", handleOrderEvent as EventListener);
      source.close();
    };
  }, [enabled, endpoint, handleOrderEvent]);
}

