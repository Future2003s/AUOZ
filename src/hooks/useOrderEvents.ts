"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

type OrderEventMessage = {
  type: "created" | "updated";
  id?: string | null;
  status?: string;
  at: number;
};

export function useOrderEvents(enabled: boolean = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const source = new EventSource("/api/notifications/sse");

    const handleOrderEvent = (event: MessageEvent<string>) => {
      try {
        const data: OrderEventMessage = JSON.parse(event.data);
        console.debug("[useOrderEvents] Order event received:", data);
      } catch (err) {
        console.warn("[useOrderEvents] Failed to parse order event:", err);
      }

      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === "orders",
      });
    };

    source.addEventListener("order", handleOrderEvent);

    return () => {
      source.removeEventListener("order", handleOrderEvent as EventListener);
      source.close();
    };
  }, [enabled, queryClient]);
}

