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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const socketRef = useRef(null);
  const loadedMessagesRef = useRef(new Set());
  const markingReadRef = useRef(new Set());
  const conversationsRef = useRef([]);
  const activeConversationIdRef = useRef("");
  const isChatOpenRef = useRef(false);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  const resetChat = useCallback(() => {
    setConversations([]);
    setUnreadCount(0);
    setIsChatOpen(false);
    setActiveConversationId("");
    setMessagesByConversation({});
    setLoadingConversations(false);
    setLoadingMessages(false);
    setSending(false);
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
    async (conversationId) => {
      if (!conversationId || !user?.id || markingReadRef.current.has(conversationId)) {
        return;
      }

      const targetConversation = conversationsRef.current.find(
        (conversation) => getConversationId(conversation) === conversationId,
      );

      if (!targetConversation || Number(targetConversation.unreadCount || 0) <= 0) {
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

      if (typeof conversationOrId === "object" && conversationOrId) {
        setConversations((prev) => mergeConversationList(prev, [conversationOrId]));
      }

      setActiveConversationId(conversationId);
      setIsChatOpen(true);

      if (!loadedMessagesRef.current.has(conversationId)) {
        await loadConversationMessages(conversationId);
      }

      await markConversationRead(conversationId);
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
      } catch {
        return { ok: false };
      } finally {
        setSending(false);
      }
    },
    [activeConversationId],
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
        await markConversationRead(conversationId);
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
      isChatOpen,
      activeConversationId,
      activeConversation,
      activeMessages,
      loadingConversations,
      loadingMessages,
      sending,
      refreshConversations,
      openConversation,
      openConversationWithUser,
      loadConversationMessages,
      markConversationRead,
      sendMessage,
      setIsChatOpen,
    }),
    [
      activeConversation,
      activeConversationId,
      activeMessages,
      conversations,
      isChatOpen,
      loadingConversations,
      loadingMessages,
      markConversationRead,
      openConversation,
      openConversationWithUser,
      loadConversationMessages,
      refreshConversations,
      sendMessage,
      sending,
      unreadCount,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
