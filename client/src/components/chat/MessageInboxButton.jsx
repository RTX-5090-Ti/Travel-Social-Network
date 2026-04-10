import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  MessageCircleMore,
  Search,
  Send,
} from "lucide-react";

import { followApi } from "../../api/follow.api";
import { useAuth } from "../../auth/useAuth";
import { useChat } from "../../chat/useChat";

const PANEL_WIDTH = 340;
const PANEL_GAP = 12;
const VIEWPORT_GAP = 16;
const RESULT_LIMIT = 200;

function buildPanelPosition(buttonRect) {
  if (!buttonRect) return null;

  const maxLeft = Math.max(
    VIEWPORT_GAP,
    window.innerWidth - PANEL_WIDTH - VIEWPORT_GAP,
  );
  const preferredLeft = buttonRect.right - PANEL_WIDTH;

  return {
    top: buttonRect.bottom + PANEL_GAP,
    left: Math.min(Math.max(preferredLeft, VIEWPORT_GAP), maxLeft),
    width: PANEL_WIDTH,
  };
}

function getAvatarUrl(person) {
  return (
    person?.avatarUrl ||
    person?.avatar ||
    person?.profile?.avatarUrl ||
    person?.profile?.avatar ||
    person?.participant?.avatarUrl ||
    ""
  );
}

function formatConversationTime(value) {
  if (!value) return "";

  const targetTime = new Date(value).getTime();
  if (Number.isNaN(targetTime)) return "";

  const diffMinutes = Math.round((targetTime - Date.now()) / (1000 * 60));
  const rtf = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 1) return "Vừa xong";
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ResultSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-white/70 bg-white px-3 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.03)] ring-1 ring-zinc-200/60">
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-11 w-11 animate-pulse rounded-full bg-zinc-200" />
        <div className="min-w-0 space-y-2">
          <div className="h-3.5 w-24 animate-pulse rounded-full bg-zinc-200" />
          <div className="h-3 w-32 animate-pulse rounded-full bg-zinc-100" />
        </div>
      </div>

      <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-100" />
    </div>
  );
}

function SearchUserRow({ person, onSend }) {
  const avatarUrl = getAvatarUrl(person);

  return (
    <div className="theme-card flex items-center justify-between gap-3 rounded-[18px] border border-white/70 bg-white px-3 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.03)] ring-1 ring-zinc-200/60 transition hover:-translate-y-[1px] hover:shadow-[0_12px_26px_rgba(15,23,42,0.06)]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={person?.name || "Traveler"}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-[15px] font-semibold text-white">
              {(person?.name || "T").charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium text-zinc-800">
            {person?.name || "Traveler"}
          </p>
          <p className="truncate text-[12px] text-zinc-400">
            {person?.email || "Email unavailable"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSend?.(person)}
        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}

function ConversationRow({ conversation, currentUserId, onOpen }) {
  const participant = conversation?.participant || {};
  const avatarUrl = getAvatarUrl(participant);
  const unreadCount = Number(conversation?.unreadCount || 0);
  const isOwnLastMessage =
    (conversation?.lastMessageSenderId || "") === currentUserId;

  return (
    <button
      type="button"
      onClick={() => onOpen?.(conversation)}
      className={`theme-card flex w-full items-center gap-3 rounded-[18px] border px-3 py-3 text-left shadow-[0_8px_20px_rgba(15,23,42,0.03)] ring-1 ring-zinc-200/60 transition hover:-translate-y-[1px] hover:shadow-[0_12px_26px_rgba(15,23,42,0.06)] cursor-pointer ${
        unreadCount > 0
          ? "border-violet-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,241,255,0.98))]"
          : "border-white/70 bg-white"
      }`}
    >
      <div className="relative shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={participant?.name || "Traveler"}
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-[15px] font-semibold text-white">
            {(participant?.name || "T").charAt(0).toUpperCase()}
          </div>
        )}
        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-[14px] font-medium text-zinc-800">
            {participant?.name || "Traveler"}
          </p>
          <span className="shrink-0 text-[11px] font-medium text-zinc-400">
            {formatConversationTime(conversation?.lastMessageAt)}
          </span>
        </div>
        <p
          className={`mt-1 truncate text-[12px] ${
            unreadCount > 0 ? "font-medium text-zinc-700" : "text-zinc-400"
          }`}
        >
          {conversation?.lastMessageText
            ? `${isOwnLastMessage ? "Bạn: " : ""}${conversation.lastMessageText}`
            : "Bắt đầu cuộc trò chuyện"}
        </p>
      </div>

      {unreadCount > 0 ? (
        <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 py-[2px] text-[10px] font-semibold leading-none text-white shadow-[0_8px_18px_rgba(244,63,94,0.28)]">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
}

export default function MessageInboxButton() {
  const { user } = useAuth();
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const {
    conversations,
    unreadCount,
    loadingConversations,
    openConversation,
    openConversationWithUser,
    refreshConversations,
  } = useChat();

  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState(null);
  const [query, setQuery] = useState("");
  const [candidateItems, setCandidateItems] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  function syncPanelPosition(targetRect) {
    const buttonRect = targetRect || rootRef.current?.getBoundingClientRect();
    const nextStyle = buildPanelPosition(buttonRect);
    if (nextStyle) {
      setPanelStyle(nextStyle);
    }
  }

  useEffect(() => {
    if (!open || !searchMode) return undefined;

    let cancelled = false;

    async function loadCandidates() {
      try {
        setSearchLoading(true);
        const res = await followApi.listMutuals({ limit: RESULT_LIMIT });
        if (cancelled) return;
        setCandidateItems(Array.isArray(res.data?.items) ? res.data.items : []);
      } catch {
        if (!cancelled) {
          setCandidateItems([]);
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }

    void loadCandidates();

    return () => {
      cancelled = true;
    };
  }, [open, searchMode]);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      const target = event.target;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
      setSearchMode(false);
      setQuery("");
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        if (searchMode) {
          setSearchMode(false);
          setQuery("");
          return;
        }

        setOpen(false);
      }
    }

    function handleViewportChange() {
      syncPanelPosition();
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, searchMode]);

  useEffect(() => {
    if (!open || searchMode) return;
    refreshConversations();
  }, [open, refreshConversations, searchMode]);

  const filteredCandidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return candidateItems;

    return candidateItems.filter((person) => {
      const name = person?.name?.toLowerCase() || "";
      const email = person?.email?.toLowerCase() || "";
      return (
        name.includes(normalizedQuery) || email.includes(normalizedQuery)
      );
    });
  }, [candidateItems, query]);

  function handleToggleOpen() {
    const nextOpen = !open;

    if (nextOpen) {
      const targetRect = rootRef.current?.getBoundingClientRect();
      syncPanelPosition(targetRect);
      setOpen(true);
      return;
    }

    setOpen(false);
    setSearchMode(false);
    setQuery("");
  }

  async function handleOpenConversation(conversation) {
    await openConversation(conversation);
    setOpen(false);
    setSearchMode(false);
    setQuery("");
  }

  async function handleOpenConversationWithUser(person) {
    await openConversationWithUser(person);
    setOpen(false);
    setSearchMode(false);
    setQuery("");
  }

  const panel = createPortal(
    <AnimatePresence>
      {open && panelStyle ? (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -10, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.985 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="theme-popover fixed z-[9999] overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,247,255,0.95),rgba(243,238,255,0.94))] shadow-[0_26px_70px_rgba(15,23,42,0.18)] ring-1 ring-zinc-200/70 backdrop-blur-xl"
          style={panelStyle}
        >
          <div className="border-b border-zinc-200/70 px-4 py-4">
            <h4 className="text-[18px] font-semibold text-zinc-900">
              Tin nhắn
            </h4>

            <div className="mt-3 flex items-center gap-2">
              {searchMode ? (
                <motion.button
                  type="button"
                  aria-label="Quay lại"
                  onClick={() => {
                    setSearchMode(false);
                    setQuery("");
                  }}
                  whileHover={{ x: -1, y: -1, scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  className="theme-card inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-zinc-200/80 bg-white/90 text-zinc-500 shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700"
                >
                  <motion.span
                    initial={false}
                    whileHover={{ x: -1 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="inline-flex"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </motion.span>
                </motion.button>
              ) : null}

              <div className="theme-card flex flex-1 items-center gap-2 rounded-[18px] border border-zinc-200/80 bg-white/90 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                <Search className="h-4 w-4 shrink-0 text-zinc-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => {
                    if (!searchMode) {
                      setSearchMode(true);
                    }
                    setQuery(event.target.value);
                  }}
                  onFocus={() => setSearchMode(true)}
                  placeholder="Tìm người để nhắn tin..."
                  className="w-full bg-transparent text-[14px] text-zinc-700 outline-none placeholder:text-zinc-400"
                />
              </div>
            </div>
          </div>

          <div className="h-[420px] px-3 py-3">
            <div
              className={`h-full ${searchMode ? "overflow-y-auto" : conversations.length ? "overflow-y-auto" : "flex items-center justify-center"}`}
            >
              {!searchMode ? (
                loadingConversations ? (
                  <div className="w-full space-y-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <ResultSkeleton key={`conversation-skeleton-${index}`} />
                    ))}
                  </div>
                ) : conversations.length ? (
                  <div className="w-full space-y-2">
                    {conversations.map((conversation) => (
                      <ConversationRow
                        key={conversation?._id || conversation?.id}
                        conversation={conversation}
                        currentUserId={user?.id || user?._id || ""}
                        onOpen={handleOpenConversation}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="theme-card w-full rounded-[22px] border border-dashed border-zinc-200 bg-white/70 px-4 py-8 text-center text-sm text-zinc-500">
                    Chưa có tin nhắn nào.
                  </div>
                )
              ) : searchLoading ? (
                <div className="w-full space-y-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <ResultSkeleton key={`message-result-skeleton-${index}`} />
                  ))}
                </div>
              ) : filteredCandidates.length ? (
                <div className="w-full space-y-2">
                  {filteredCandidates.map((person) => (
                    <SearchUserRow
                      key={person?._id || person?.id || person?.email}
                      person={person}
                      onSend={handleOpenConversationWithUser}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="theme-card w-full rounded-[22px] border border-dashed border-zinc-200 bg-white/70 px-4 py-8 text-center text-sm text-zinc-500">
                    Không tìm thấy người phù hợp để nhắn tin.
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );

  return (
    <>
      <div ref={rootRef} className="relative z-[80]">
        <button
          type="button"
          aria-label="Messages"
          onClick={handleToggleOpen}
          className={`group relative inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white shadow-[0_12px_28px_rgba(108,92,231,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(79,124,255,0.28)] ${
            open ? "ring-4 ring-violet-200/70" : ""
          }`}
        >
          <MessageCircleMore
            className="h-[22px] w-[22px] transition duration-200 group-hover:scale-105"
            strokeWidth={2.2}
          />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 py-[2px] text-[10px] font-semibold leading-none text-white shadow-[0_8px_18px_rgba(244,63,94,0.32)]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
      </div>

      {panel}
    </>
  );
}
