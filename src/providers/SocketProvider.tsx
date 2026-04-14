"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { envConfig } from "@/config";

// ─── Context ──────────────────────────────────────────────────────────────────
interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
});

export function useSocket() {
  return useContext(SocketContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────
const RECONNECT_TOAST_DELAY = 30_000; // Show "Đang kết nối lại..." after 30s offline

interface SocketProviderProps {
  children: React.ReactNode;
  /** Optional bearer token for authentication */
  token?: string | null;
  /** Whether to actively connect (e.g., only when user is logged in) */
  enabled?: boolean;
}

export function SocketProvider({
  children,
  token,
  enabled = true,
}: SocketProviderProps) {
  const socketRef = useRef<Socket | null>(null);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectToastIdRef = useRef<string | number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    const backendUrl =
      envConfig.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8081";

    const socket = io(backendUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
      ...(token ? { auth: { token } } : {}),
    });

    socketRef.current = socket;
    setSocketInstance(socket);

    socket.on("connect", () => {
      setConnected(true);

      // Clear disconnect timer
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }

      // Dismiss reconnecting toast if showing
      if (reconnectToastIdRef.current !== undefined) {
        toast.dismiss(reconnectToastIdRef.current);
        toast.success("Đã kết nối lại!", { duration: 2000 });
        reconnectToastIdRef.current = undefined;
      }
    });


    socket.on("connect_error", (err) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Socket] connect_error:", err.message);
      }
    });

    return () => {
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
      if (reconnectToastIdRef.current !== undefined) toast.dismiss(reconnectToastIdRef.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, token]);

  return (
    <SocketContext.Provider value={{ socket: socketInstance, connected }}>
      {children}
    </SocketContext.Provider>
  );
}
