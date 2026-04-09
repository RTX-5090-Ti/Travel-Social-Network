import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { notificationApi } from "../api/notification.api";
import { useAuth } from "../auth/useAuth";
import { useToast } from "../toast/useToast";
import { NotificationContext } from "./notification-context";

const POLL_INTERVAL_MS = 15000;
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function NotificationProvider({ children }) {
  const { user, bootstrapping } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const initializedRef = useRef(false);
  const seenIdsRef = useRef(new Set());
  const requestIdRef = useRef(0);
  const socketRef = useRef(null);

  const resetNotifications = useCallback(() => {
    initializedRef.current = false;
    seenIdsRef.current = new Set();
    requestIdRef.current += 1;
    setNotifications([]);
    setUnreadCount(0);
    setLoading(false);
  }, []);

  const refreshNotifications = useCallback(
    async ({ silent = false } = {}) => {
      if (!user?.id) {
        resetNotifications();
        return [];
      }

      const requestId = ++requestIdRef.current;

      try {
        if (!silent) {
          setLoading(true);
        }

        const res = await notificationApi.list({ limit: 10 });
        if (requestId !== requestIdRef.current) {
          return [];
        }

        const items = Array.isArray(res.data?.items) ? res.data.items : [];
        const nextUnreadCount = Number(res.data?.meta?.unreadCount || 0);

        if (!initializedRef.current) {
          initializedRef.current = true;
          seenIdsRef.current = new Set(
            items.map((item) => item?._id || item?.id).filter(Boolean),
          );
        } else {
          const incomingIds = [];

          items.forEach((item) => {
            const itemId = item?._id || item?.id;
            if (!itemId || seenIdsRef.current.has(itemId)) return;

            incomingIds.push(itemId);
            if (!item?.read && item?.message) {
              showToast(item.message, "info");
            }
          });

          if (incomingIds.length) {
            seenIdsRef.current = new Set([
              ...seenIdsRef.current,
              ...incomingIds,
            ]);
          }
        }

        setNotifications(items);
        setUnreadCount(nextUnreadCount);
        return items;
      } catch {
        return [];
      } finally {
        if (requestId === requestIdRef.current && !silent) {
          setLoading(false);
        }
      }
    },
    [resetNotifications, showToast, user?.id],
  );

  const markAllAsRead = useCallback(async () => {
    if (!user?.id || unreadCount <= 0) {
      return;
    }

    try {
      await notificationApi.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          read: true,
          readAt: item?.readAt || new Date().toISOString(),
        })),
      );
    } catch {
      // de sau
    }
  }, [unreadCount, user?.id]);

  useEffect(() => {
    if (bootstrapping || !user?.id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("notification:new", (payload) => {
      const notification = payload?.notification;
      const notificationId = notification?._id || notification?.id;

      if (notificationId) {
        seenIdsRef.current = new Set([...seenIdsRef.current, notificationId]);
      }

      if (notification?.message && !notification?.read) {
        showToast(notification.message, "info");
      }

      if (notification) {
        setNotifications((prev) => {
          const nextItems = [
            notification,
            ...prev.filter((item) => {
              const itemId = item?._id || item?.id;
              return itemId !== notificationId;
            }),
          ];

          return nextItems.slice(0, 10);
        });
      }

      if (Number.isFinite(payload?.unreadCount)) {
        setUnreadCount(Number(payload.unreadCount));
      } else {
        setUnreadCount((prev) => prev + 1);
      }
    });

    socket.on("connect_error", () => {
      // giữ polling fallback
    });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [bootstrapping, showToast, user?.id]);

  useEffect(() => {
    if (bootstrapping) return undefined;

    if (!user?.id) {
      resetNotifications();
      return undefined;
    }

    refreshNotifications({ silent: false });

    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      refreshNotifications({ silent: true });
    }, POLL_INTERVAL_MS);

    const handleVisibilityOrFocus = () => {
      refreshNotifications({ silent: true });
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityOrFocus,
      );
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [bootstrapping, refreshNotifications, resetNotifications, user?.id]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      refreshNotifications,
      markAllAsRead,
    }),
    [loading, markAllAsRead, notifications, refreshNotifications, unreadCount],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
