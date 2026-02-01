"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { envConfig } from "@/config";

interface OrderNotification {
  orderId: string;
  orderNumber?: string;
  total: number;
  itemCount: number;
  userId: string;
  timestamp: string;
  isGuest?: boolean;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  orderNotifications: OrderNotification[];
  clearNotifications: () => void;
  joinEmployeeRoom: () => void;
  leaveEmployeeRoom: () => void;
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState<OrderNotification[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Get backend URL from config
    const backendUrl = envConfig.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8081";
    
    // Initialize socket connection
    const socketInstance = io(backendUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // Connection event handlers
    socketInstance.on("connect", () => {
      console.log("[Socket.IO] Connected:", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("[Socket.IO] Disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[Socket.IO] Connection error:", error);
      setIsConnected(false);
    });

    // Listen for new order notifications
    socketInstance.on("order:new", (notification: OrderNotification) => {
      console.log("[Socket.IO] New order notification:", notification);
      setOrderNotifications((prev) => [notification, ...prev]);
    });

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const joinEmployeeRoom = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("join:employee");
      console.log("[Socket.IO] Joined employee room");
    }
  }, [isConnected]);

  const leaveEmployeeRoom = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("leave:employee");
      console.log("[Socket.IO] Left employee room");
    }
  }, [isConnected]);

  const clearNotifications = useCallback(() => {
    setOrderNotifications([]);
  }, []);

  return {
    socket,
    isConnected,
    orderNotifications,
    clearNotifications,
    joinEmployeeRoom,
    leaveEmployeeRoom,
  };
}

