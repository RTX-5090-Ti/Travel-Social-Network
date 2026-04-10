import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

import { chatApi } from "../api/chat.api";
import { useAuth } from "../auth/useAuth";
import { ChatContext } from "./chat-context";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getConversationId(conversation) {
  return conversation?._id || conversation?.id || "";
}

function getMessageId(message) {
  return message?._id || message?.id || "";
}

function getUserId(user) {
  return user?._id || user?.id || "";
}

function mergePresenceUsers(existing, incomingUsers = [], onlineUserIds = []) {
  const onlineSet = new Set(onlineUserIds || []);
  const next = { ...existing };

  incomingUsers.forEach((user) => {
    const userId = getUserId(user);
    if (!userId) return;

    next[userId] = {
      ...(next[userId] || {}),
      lastSeenAt: user?.lastSeenAt || next[userId]?.lastSeenAt || null,
      isOnline: onlineSet.has(userId),
    };
  });

  return next;
}

function mergeConversationList(existing, incoming) {
  const nextMap = new Map(
    existing.map((conversation) => [getConversationId(conversation), conversation]),
  );

  incoming.forEach((conversation) => {
    const conversationId = getConversationId(conversation);
    if (!conversationId) return;

    const previous = nextMap.get(conversationId) || {};
    nextMap.set(conversationId, {
      ...previous,
      ...conversation,
      participant: {
        ...(previous.participant || {}),
        ...(conversation.participant || {}),
      },
    });
  });

  return [...nextMap.values()].sort((left, right) => {
    const leftTime = new Date(
      left?.lastMessageAt || left?.updatedAt || left?.createdAt || 0,
    ).getTime();
    const rightTime = new Date(
      right?.lastMessageAt || right?.updatedAt || right?.createdAt || 0,
    ).getTime();

    return rightTime - leftTime;
  });
}

function mergeMessageList(existing, incoming) {
  const nextMap = new Map(existing.map((message) => [getMessageId(message), message]));

  incoming.forEach((message) => {
    const messageId = getMessageId(message);
    if (!messageId) return;
    nextMap.set(messageId, {
      ...(nextMap.get(messageId) || {}),
      ...message,
    });
  });

  return [...nextMap.values()].sort((left, right) => {
    const leftTime = new Date(left?.createdAt || 0).getTime();
    const rightTime = new Date(right?.createdAt || 0).getTime();
    return leftTime - rightTime;
  });
}

function applyReadReceiptToMessages(existing, payload) {
  if (!Array.isArray(existing) || !existing.length) return existing;

  const messageIdSet = new Set(
    (Array.isArray(payload?.messageIds) ? payload.messageIds : []).filter(Boolean),
  );
  const readAt = payload?.readAt || null;
  const readerId = payload?.readerId || "";

  if (!messageIdSet.size || !readAt) {
    return existing;
  }

  return existing.map((message) => {
    const messageId = getMessageId(message);
    if (!messageIdSet.has(messageId)) {
      return message;
    }

    if ((message?.recipientId || "") !== readerId) {
      return message;
    }

    return {
      ...message,
      readAt,
    };
  });
}

export function ChatProvider({ children }) {
  const { user, bootstrapping } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isChatDockVisible, setIsChatDockVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [openingConversationId, setOpeningConversationId] = useState("");
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [presenceByUserId, setPresenceByUserId] = useState({});

  const socketRef = useRef(null);
  const openConversationRequestRef = useRef(0);
  const loadedMessagesRef = useRef(new Set());
  const markingReadRef = useRef(new Set());
  const conversationsRef = useRef([]);
  const activeConversationIdRef = useRef("");
  const isChatOpenRef = useRef(false);
  const onlineUserIdsRef = useRef([]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  useEffect(() => {
    onlineUserIdsRef.current = onlineUserIds;
  }, [onlineUserIds]);

  const resetChat = useCallback(() => {
    setConversations([]);
    setUnreadCount(0);
    setIsChatDockVisible(false);
    setIsChatOpen(false);
    setActiveConversationId("");
    setOpeningConversationId("");
    setMessagesByConversation({});
    setLoadingConversations(false);
    setLoadingMessages(false);
    setSending(false);
    setOnlineUserIds([]);
    setPresenceByUserId({});
    loadedMessagesRef.current = new Set();
    markingReadRef.current = new Set();
  }, []);

  const refreshConversations = useCallback(async () => {
    if (!user?.id) {
      resetChat();
      return [];
    }

    try {
      setLoadingConversations(true);
      const res = await chatApi.listConversations();
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      const nextUnreadCount = Number(res.data?.meta?.unreadCount || 0);

      setConversations(items);
      setPresenceByUserId((prev) =>
        mergePresenceUsers(
          prev,
          items.map((item) => item?.participant).filter(Boolean),
          onlineUserIdsRef.current,
        ),
      );
      setUnreadCount(Number.isFinite(nextUnreadCount) ? nextUnreadCount : 0);
      return items;
    } catch {
      return [];
    } finally {
      setLoadingConversations(false);
    }
  }, [resetChat, user?.id]);

  const loadConversationMessages = useCallback(async (conversationId) => {
    if (!conversationId) return [];

    try {
      setLoadingMessages(true);
      const res = await chatApi.getMessages(conversationId, { limit: 60 });
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      const conversation = res.data?.conversation;

      if (conversation) {
        setConversations((prev) => mergeConversationList(prev, [conversation]));
        setPresenceByUserId((prev) =>
          mergePresenceUsers(
            prev,
            [conversation?.participant].filter(Boolean),
            onlineUserIdsRef.current,
          ),
        );
      }

      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: mergeMessageList(prev[conversationId] || [], items),
      }));
      loadedMessagesRef.current = new Set([
        ...loadedMessagesRef.current,
        conversationId,
      ]);

      return items;
    } catch {
      return [];
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const markConversationRead = useCallback(
    async (conversationId, options = {}) => {
      if (!conversationId || !user?.id || markingReadRef.current.has(conversationId)) {
        return;
      }

      const shouldForce = !!options?.force;

      const targetConversation = conversationsRef.current.find(
        (conversation) => getConversationId(conversation) === conversationId,
      );

      if (
        !shouldForce &&
        (!targetConversation || Number(targetConversation.unreadCount || 0) <= 0)
      ) {
        return;
      }

      markingReadRef.current = new Set([
        ...markingReadRef.current,
        conversationId,
      ]);

      try {
        const res = await chatApi.markConversationRead(conversationId);
        const conversation = res.data?.conversation;
        const nextUnreadCount = Number(res.data?.unreadCount);

        if (conversation) {
          setConversations((prev) => mergeConversationList(prev, [conversation]));
        } else {
          setConversations((prev) =>
            prev.map((item) =>
              getConversationId(item) === conversationId
                ? { ...item, unreadCount: 0 }
                : item,
            ),
          );
        }

        if (Number.isFinite(nextUnreadCount)) {
          setUnreadCount(nextUnreadCount);
        }
      } catch {
        // De sau.
      } finally {
        const nextSet = new Set(markingReadRef.current);
        nextSet.delete(conversationId);
        markingReadRef.current = nextSet;
      }
    },
    [user?.id],
  );

  const openConversation = useCallback(
    async (conversationOrId) => {
      const conversationId =
        typeof conversationOrId === "string"
          ? conversationOrId
          : getConversationId(conversationOrId);

      if (!conversationId) return null;

      const requestId = openConversationRequestRef.current + 1;
      openConversationRequestRef.current = requestId;

      if (typeof conversationOrId === "object" && conversationOrId) {
        setConversations((prev) => mergeConversationList(prev, [conversationOrId]));
        setPresenceByUserId((prev) =>
          mergePresenceUsers(
            prev,
            [conversationOrId?.participant].filter(Boolean),
            onlineUserIdsRef.current,
          ),
        );
      }

      setOpeningConversationId(conversationId);
      setActiveConversationId(conversationId);
      setIsChatDockVisible(true);
      setIsChatOpen(true);

      try {
        if (!loadedMessagesRef.current.has(conversationId)) {
          await loadConversationMessages(conversationId);
        }

        await markConversationRead(conversationId, { force: true });
      } finally {
        if (openConversationRequestRef.current === requestId) {
          setOpeningConversationId((current) =>
            current === conversationId ? "" : current,
          );
        }
      }
      return conversationId;
    },
    [loadConversationMessages, markConversationRead],
  );

  const openConversationWithUser = useCallback(
    async (person) => {
      const userId = person?._id || person?.id || "";
      if (!userId) return null;

      try {
        const res = await chatApi.openDirectConversation(userId);
        const conversation = res.data?.conversation;
        if (!conversation) return null;

        setConversations((prev) => mergeConversationList(prev, [conversation]));
        setPresenceByUserId((prev) =>
          mergePresenceUsers(
            prev,
            [conversation?.participant, person].filter(Boolean),
            onlineUserIdsRef.current,
          ),
        );
        await openConversation(conversation);
        return conversation;
      } catch {
        return null;
      }
    },
    [openConversation],
  );

  const sendMessage = useCallback(
    async (text) => {
      const conversationId = activeConversationId;
      const trimmedText = typeof text === "string" ? text.trim() : "";

      if (!conversationId || !trimmedText) {
        return { ok: false };
      }

      try {
        setSending(true);
        const res = await chatApi.sendMessage(conversationId, { text: trimmedText });
        const conversation = res.data?.conversation;
        const message = res.data?.message;
        const nextUnreadCount = Number(res.data?.unreadCount);

        if (conversation) {
          setConversations((prev) => mergeConversationList(prev, [conversation]));
          setPresenceByUserId((prev) =>
            mergePresenceUsers(
              prev,
              [conversation?.participant].filter(Boolean),
              onlineUserIdsRef.current,
            ),
          );
        }

        if (message) {
          setMessagesByConversation((prev) => ({
            ...prev,
            [conversationId]: mergeMessageList(prev[conversationId] || [], [message]),
          }));
        }

        if (Number.isFinite(nextUnreadCount)) {
          setUnreadCount(nextUnreadCount);
        }

        return { ok: true, message, conversation };
      } catch (err) {
        return {
          ok: false,
          error:
            err?.response?.data?.message || "Không gửi được tin nhắn lúc này.",
        };
      } finally {
        setSending(false);
      }
    },
    [activeConversationId],
  );

  const sendImageMessage = useCallback(
    async ({ file, text = "" } = {}) => {
      const conversationId = activeConversationId;
      const trimmedText = typeof text === "string" ? text.trim() : "";

      if (!conversationId || !file) {
        return { ok: false };
      }

      try {
        setSending(true);

        const formData = new FormData();
        formData.append("image", file);
        if (trimmedText) {
          formData.append("text", trimmedText);
        }

        const res = await chatApi.sendImageMessage(conversationId, formData);
        const conversation = res.data?.conversation;
        const message = res.data?.message;
        const nextUnreadCount = Number(res.data?.unreadCount);

        if (conversation) {
          setConversations((prev) => mergeConversationList(prev, [conversation]));
          setPresenceByUserId((prev) =>
            mergePresenceUsers(
              prev,
              [conversation?.participant].filter(Boolean),
              onlineUserIdsRef.current,
            ),
          );
        }

        if (message) {
          setMessagesByConversation((prev) => ({
            ...prev,
            [conversationId]: mergeMessageList(prev[conversationId] || [], [message]),
          }));
        }

        if (Number.isFinite(nextUnreadCount)) {
          setUnreadCount(nextUnreadCount);
        }

        return { ok: true, message, conversation };
      } catch (err) {
        return {
          ok: false,
          error:
            err?.response?.data?.message || "Không tải ảnh lên được lúc này.",
        };
      } finally {
        setSending(false);
      }
    },
    [activeConversationId],
  );

  const sendGifMessage = useCallback(
    async ({ gifUrl, width = null, height = null, text = "" } = {}) => {
      const conversationId = activeConversationId;
      const trimmedText = typeof text === "string" ? text.trim() : "";

      if (!conversationId || !gifUrl) {
        return { ok: false };
      }

      try {
        setSending(true);
        const res = await chatApi.sendGifMessage(conversationId, {
          gifUrl,
          width,
          height,
          text: trimmedText,
        });
        const conversation = res.data?.conversation;
        const message = res.data?.message;
        const nextUnreadCount = Number(res.data?.unreadCount);

        if (conversation) {
          setConversations((prev) => mergeConversationList(prev, [conversation]));
          setPresenceByUserId((prev) =>
            mergePresenceUsers(
              prev,
              [conversation?.participant].filter(Boolean),
              onlineUserIdsRef.current,
            ),
          );
        }

        if (message) {
          setMessagesByConversation((prev) => ({
            ...prev,
            [conversationId]: mergeMessageList(prev[conversationId] || [], [message]),
          }));
        }

        if (Number.isFinite(nextUnreadCount)) {
          setUnreadCount(nextUnreadCount);
        }

        return { ok: true, message, conversation };
      } catch (err) {
        return {
          ok: false,
          error:
            err?.response?.data?.message || "Không gửi GIF được lúc này.",
        };
      } finally {
        setSending(false);
      }
    },
    [activeConversationId],
  );

  const deleteSelectedConversations = useCallback(
    async (conversationIds = []) => {
      const normalizedIds = [
        ...new Set(
          (Array.isArray(conversationIds) ? conversationIds : [])
            .map((item) => (typeof item === "string" ? item : ""))
            .filter(Boolean),
        ),
      ];

      if (!normalizedIds.length) {
        return { ok: false, deletedIds: [] };
      }

      try {
        const res = await chatApi.deleteSelectedConversations(normalizedIds);
        const deletedIds = Array.isArray(res.data?.deletedIds)
          ? res.data.deletedIds.filter(Boolean)
          : [];
        const nextUnreadCount = Number(res.data?.unreadCount);

        if (deletedIds.length) {
          const deletedIdSet = new Set(deletedIds);

          setConversations((prev) =>
            prev.filter(
              (conversation) => !deletedIdSet.has(getConversationId(conversation)),
            ),
          );
          setMessagesByConversation((prev) => {
            const next = { ...prev };
            deletedIds.forEach((conversationId) => {
              delete next[conversationId];
            });
            return next;
          });

          const nextLoadedSet = new Set(loadedMessagesRef.current);
          deletedIds.forEach((conversationId) => {
            nextLoadedSet.delete(conversationId);
          });
          loadedMessagesRef.current = nextLoadedSet;

          if (deletedIdSet.has(activeConversationIdRef.current)) {
            setActiveConversationId("");
            setIsChatOpen(false);
            setIsChatDockVisible(false);
          }
        }

        if (Number.isFinite(nextUnreadCount)) {
          setUnreadCount(nextUnreadCount);
        }

        return { ok: true, deletedIds };
      } catch (err) {
        return {
          ok: false,
          deletedIds: [],
          error:
            err?.response?.data?.message || "Không xoá đoạn chat được lúc này.",
        };
      }
    },
    [],
  );

  useEffect(() => {
    if (bootstrapping) return undefined;

    if (!user?.id) {
      resetChat();
      return undefined;
    }

    refreshConversations();

    const handleVisibilityOrFocus = () => {
      if (document.hidden) return;
      refreshConversations();
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [bootstrapping, refreshConversations, resetChat, user?.id]);

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

    socket.on("chat:conversation:update", async (payload) => {
      const conversation = payload?.conversation;
      const message = payload?.message;
      const conversationId = getConversationId(conversation);
      const nextUnreadCount = Number(payload?.unreadCount);

      if (conversation) {
        setConversations((prev) => mergeConversationList(prev, [conversation]));
        setPresenceByUserId((prev) =>
          mergePresenceUsers(
            prev,
            [conversation?.participant].filter(Boolean),
            onlineUserIdsRef.current,
          ),
        );
      }

      if (conversationId && message) {
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: mergeMessageList(prev[conversationId] || [], [message]),
        }));
      }

      if (Number.isFinite(nextUnreadCount)) {
        setUnreadCount(nextUnreadCount);
      }

      if (
        conversationId &&
        isChatOpenRef.current &&
        activeConversationIdRef.current === conversationId &&
        message?.senderId &&
        message.senderId !== user.id
      ) {
        await markConversationRead(conversationId, { force: true });
      }
    });

    socket.on("chat:messages:read", (payload) => {
      const conversationId = payload?.conversationId || "";
      if (!conversationId) return;

      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: applyReadReceiptToMessages(
          prev[conversationId] || [],
          payload,
        ),
      }));
    });

    socket.on("presence:snapshot", (payload) => {
      const nextOnlineUserIds = Array.isArray(payload?.onlineUserIds)
        ? payload.onlineUserIds.filter(Boolean)
        : [];

      setOnlineUserIds(nextOnlineUserIds);
      setPresenceByUserId((prev) => {
        const onlineSet = new Set(nextOnlineUserIds);
        const next = { ...prev };

        Object.keys(next).forEach((userId) => {
          next[userId] = {
            ...(next[userId] || {}),
            isOnline: onlineSet.has(userId),
          };
        });

        return next;
      });
    });

    socket.on("presence:update", (payload) => {
      const targetUserId = payload?.userId || "";
      if (!targetUserId) return;

      setOnlineUserIds((prev) => {
        const nextSet = new Set(prev);
        if (payload?.isOnline) {
          nextSet.add(targetUserId);
        } else {
          nextSet.delete(targetUserId);
        }
        return [...nextSet];
      });

      setPresenceByUserId((prev) => ({
        ...prev,
        [targetUserId]: {
          ...(prev[targetUserId] || {}),
          isOnline: !!payload?.isOnline,
          lastSeenAt:
            payload?.lastSeenAt || prev[targetUserId]?.lastSeenAt || null,
        },
      }));
    });

    socket.on("connect", () => {
      refreshConversations();
    });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [
    bootstrapping,
    markConversationRead,
    refreshConversations,
    user?.id,
  ]);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => getConversationId(conversation) === activeConversationId,
      ) || null,
    [activeConversationId, conversations],
  );

  const activeMessages = useMemo(
    () => messagesByConversation[activeConversationId] || [],
    [activeConversationId, messagesByConversation],
  );

  const value = useMemo(
    () => ({
      conversations,
      unreadCount,
      isChatDockVisible,
      isChatOpen,
      activeConversationId,
      openingConversationId,
      activeConversation,
      activeMessages,
      loadingConversations,
      loadingMessages,
      sending,
      onlineUserIds,
      presenceByUserId,
      refreshConversations,
      openConversation,
      openConversationWithUser,
      loadConversationMessages,
      markConversationRead,
      sendMessage,
      sendImageMessage,
      sendGifMessage,
      deleteSelectedConversations,
      setIsChatDockVisible,
      setIsChatOpen,
    }),
    [
      activeConversation,
      activeConversationId,
      activeMessages,
      conversations,
      isChatDockVisible,
      isChatOpen,
      loadingConversations,
      loadingMessages,
      markConversationRead,
      openingConversationId,
      onlineUserIds,
      openConversation,
      openConversationWithUser,
      presenceByUserId,
      loadConversationMessages,
      refreshConversations,
      sendMessage,
      sendImageMessage,
      sendGifMessage,
      deleteSelectedConversations,
      sending,
      unreadCount,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
