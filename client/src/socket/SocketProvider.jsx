import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

import { refreshAccessToken } from "../api/axios";
import { useAuth } from "../auth/useAuth";
import { SocketContext } from "./socket-context";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function SocketProvider({ children }) {
  const { user, bootstrapping } = useAuth();
  const socketRef = useRef(null);
  const refreshAttemptRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  const socketInstance = useMemo(() => {
    if (bootstrapping || !user?.id) {
      return null;
    }

    return io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }, [bootstrapping, user?.id]);

  useEffect(() => {
    if (!socketInstance) {
      socketRef.current = null;
      return undefined;
    }

    const socket = socketInstance;
    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = async (error) => {
      setIsConnected(false);

      const errorMessage = String(error?.message || "").toLowerCase();
      const isUnauthorized = errorMessage.includes("unauthorized");

      if (!isUnauthorized) {
        return;
      }

      if (!refreshAttemptRef.current) {
        refreshAttemptRef.current = refreshAccessToken().finally(() => {
          refreshAttemptRef.current = null;
        });
      }

      try {
        await refreshAttemptRef.current;
        // Thu ket noi lai sau khi refresh token thanh cong.
        if (socketRef.current === socket && !socket.connected) {
          socket.connect();
        }
      } catch {
        window.dispatchEvent(
          new CustomEvent("auth:expired", {
            detail: {
              message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
            },
          }),
        );
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      refreshAttemptRef.current = null;
    };
  }, [socketInstance]);

  const value = useMemo(
    () => ({
      socket: socketInstance,
      isConnected: Boolean(socketInstance && isConnected),
    }),
    [isConnected, socketInstance],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
