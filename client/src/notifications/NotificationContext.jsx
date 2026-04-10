import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { notificationApi } from "../api/notification.api";
import { useAuth } from "../auth/useAuth";
import { useSocket } from "../socket/useSocket";
import { NotificationContext } from "./notification-context";

export function NotificationProvider({ children }) {
  const { user, bootstrapping } = useAuth();
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);

  const initializedRef = useRef(false);
  const seenIdsRef = useRef(new Set());
  const requestIdRef = useRef(0);
  const loadMoreRequestIdRef = useRef(0);

  const resetNotifications = useCallback(() => {
    initializedRef.current = false;
    seenIdsRef.current = new Set();
    requestIdRef.current += 1;
    loadMoreRequestIdRef.current += 1;
    setNotifications([]);
    setUnreadCount(0);
    setLoading(false);
    setLoadingMore(false);
    setHasMore(false);
    setNextCursor(null);
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
        const pageHasMore = !!res.data?.page?.hasMore;
        const pageNextCursor = res.data?.page?.nextCursor || null;

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
        setHasMore(pageHasMore);
        setNextCursor(pageNextCursor);
        return items;
      } catch {
        return [];
      } finally {
        if (requestId === requestIdRef.current && !silent) {
          setLoading(false);
        }
      }
    },
    [resetNotifications, user?.id],
  );

  const loadMoreNotifications = useCallback(async () => {
    if (!user?.id || loading || loadingMore || !hasMore || !nextCursor) {
      return [];
    }

    const requestId = ++loadMoreRequestIdRef.current;

    try {
      setLoadingMore(true);

      const res = await notificationApi.list({
        limit: 10,
        cursor: nextCursor,
      });

      if (requestId !== loadMoreRequestIdRef.current) {
        return [];
      }

      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      const pageHasMore = !!res.data?.page?.hasMore;
      const pageNextCursor = res.data?.page?.nextCursor || null;

      if (items.length) {
        seenIdsRef.current = new Set([
          ...seenIdsRef.current,
          ...items.map((item) => item?._id || item?.id).filter(Boolean),
        ]);
      }

      setNotifications((prev) => {
        const nextMap = new Map();

        [...prev, ...items].forEach((item) => {
          const itemId = item?._id || item?.id;
          if (!itemId) return;
          nextMap.set(itemId, item);
        });

        return [...nextMap.values()];
      });
      setHasMore(pageHasMore);
      setNextCursor(pageNextCursor);
      return items;
    } catch {
      return [];
    } finally {
      if (requestId === loadMoreRequestIdRef.current) {
        setLoadingMore(false);
      }
    }
  }, [hasMore, loading, loadingMore, nextCursor, user?.id]);

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
      // De sau.
    }
  }, [unreadCount, user?.id]);

  const markNotificationRead = useCallback(
    async (notificationId) => {
      if (!user?.id || !notificationId) {
        return { ok: false };
      }

      const targetId =
        typeof notificationId === "string" ? notificationId.trim() : "";
      if (!targetId) {
        return { ok: false };
      }

      const currentItem = notifications.find((item) => {
        const itemId = item?._id || item?.id;
        return itemId === targetId;
      });

      if (currentItem?.read) {
        return {
          ok: true,
          item: currentItem,
          unreadCount,
        };
      }

      try {
        const res = await notificationApi.markRead(targetId);
        const nextItem = res.data?.item;
        const nextUnreadCount = Number(res.data?.unreadCount);

        if (nextItem) {
          setNotifications((prev) =>
            prev.map((item) => {
              const itemId = item?._id || item?.id;
              return itemId === targetId ? { ...item, ...nextItem } : item;
            }),
          );
        } else {
          setNotifications((prev) =>
            prev.map((item) => {
              const itemId = item?._id || item?.id;
              return itemId === targetId
                ? {
                    ...item,
                    read: true,
                    readAt: item?.readAt || new Date().toISOString(),
                  }
                : item;
            }),
          );
        }

        if (Number.isFinite(nextUnreadCount)) {
          setUnreadCount(nextUnreadCount);
        } else {
          setUnreadCount((prev) => Math.max(prev - 1, 0));
        }

        return {
          ok: !!res.data?.ok,
          item: nextItem,
          unreadCount: Number.isFinite(nextUnreadCount)
            ? nextUnreadCount
            : Math.max(unreadCount - 1, 0),
        };
      } catch {
        return { ok: false };
      }
    },
    [notifications, unreadCount, user?.id],
  );

  const deleteSelectedNotifications = useCallback(
    async (notificationIds = []) => {
      if (!user?.id) {
        return { ok: false, deletedIds: [], deletedCount: 0 };
      }

      const normalizedIds = [
        ...new Set(
          notificationIds.filter((id) => typeof id === "string" && id.trim()),
        ),
      ];

      if (!normalizedIds.length) {
        return { ok: true, deletedIds: [], deletedCount: 0 };
      }

      try {
        const res = await notificationApi.deleteSelected(normalizedIds);
        const deletedIds = Array.isArray(res.data?.deletedIds)
          ? res.data.deletedIds
          : [];
        const nextUnreadCount = Number(res.data?.unreadCount);

        if (deletedIds.length) {
          const deletedSet = new Set(deletedIds);

          seenIdsRef.current = new Set(
            [...seenIdsRef.current].filter((id) => !deletedSet.has(id)),
          );

          setNotifications((prev) =>
            prev.filter((item) => {
              const itemId = item?._id || item?.id;
              return !deletedSet.has(itemId);
            }),
          );
        }

        if (Number.isFinite(nextUnreadCount)) {
          setUnreadCount(nextUnreadCount);
        }

        return {
          ok: !!res.data?.ok,
          deletedIds,
          deletedCount: Number(res.data?.deletedCount || deletedIds.length || 0),
        };
      } catch {
        return { ok: false, deletedIds: [], deletedCount: 0 };
      }
    },
    [user?.id],
  );

  const deleteAllNotifications = useCallback(async () => {
    if (!user?.id) {
      return { ok: false, deletedCount: 0 };
    }

    try {
      const res = await notificationApi.deleteAll();

      seenIdsRef.current = new Set();
      setNotifications([]);
      setUnreadCount(Number(res.data?.unreadCount || 0));
      setHasMore(false);
      setNextCursor(null);

      return {
        ok: !!res.data?.ok,
        deletedCount: Number(res.data?.deletedCount || 0),
      };
    } catch {
      return { ok: false, deletedCount: 0 };
    }
  }, [user?.id]);

  useEffect(() => {
    if (bootstrapping) return undefined;

    if (!user?.id) {
      resetNotifications();
      return undefined;
    }

    refreshNotifications({ silent: false });

    const handleVisibilityOrFocus = () => {
      if (document.hidden) return;
      refreshNotifications({ silent: true });
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityOrFocus,
      );
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [bootstrapping, refreshNotifications, resetNotifications, user?.id]);

  useEffect(() => {
    if (bootstrapping || !user?.id || !socket) {
      return undefined;
    }

    const handleNotificationNew = (payload) => {
      const notification = payload?.notification;
      const notificationId = notification?._id || notification?.id;

      if (notificationId) {
        seenIdsRef.current = new Set([...seenIdsRef.current, notificationId]);
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

          return nextItems;
        });
      }

      if (Number.isFinite(payload?.unreadCount)) {
        setUnreadCount(Number(payload.unreadCount));
      } else {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleConnect = () => {
      refreshNotifications({ silent: true });
    };

    socket.on("notification:new", handleNotificationNew);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("notification:new", handleNotificationNew);
      socket.off("connect", handleConnect);
    };
  }, [bootstrapping, refreshNotifications, socket, user?.id]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      loadingMore,
      hasMore,
      nextCursor,
      refreshNotifications,
      loadMoreNotifications,
      markNotificationRead,
      markAllAsRead,
      deleteSelectedNotifications,
      deleteAllNotifications,
    }),
    [
      deleteAllNotifications,
      deleteSelectedNotifications,
      hasMore,
      loading,
      loadingMore,
      loadMoreNotifications,
      markNotificationRead,
      markAllAsRead,
      nextCursor,
      notifications,
      refreshNotifications,
      unreadCount,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
