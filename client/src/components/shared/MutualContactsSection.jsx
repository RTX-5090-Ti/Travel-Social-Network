import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { followApi } from "../../api/follow.api";
import { useChat } from "../../chat/useChat";

const SIDEBAR_LIMIT = 10;
const MODAL_LIMIT = 200;
const SIDEBAR_SOURCE_LIMIT = 200;

function getAvatarUrl(person) {
  return (
    person?.avatarUrl ||
    person?.avatar ||
    person?.profile?.avatarUrl ||
    person?.profile?.avatar ||
    ""
  );
}

function getUserId(person) {
  return person?._id || person?.id || "";
}

function ContactCardSkeleton({ compact = false }) {
  return (
    <div
      className={`theme-card flex items-center justify-between gap-3 rounded-[18px] bg-white px-3 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.03)] ring-1 ring-zinc-200/60 ${
        compact ? "" : "border border-white/70"
      }`}
    >
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

function ContactRow({ person, compact = false }) {
  const { t } = useTranslation();
  const { openConversationWithUser, onlineUserIds, presenceByUserId } = useChat();
  const avatarUrl = getAvatarUrl(person);
  const userId = getUserId(person);
  const presence = presenceByUserId[userId] || {};
  const isOnline = onlineUserIds.includes(userId) || presence.isOnline;

  const handleOpenChat = () => {
    void openConversationWithUser(person);
  };

  return (
    <div
      className={`theme-card flex items-center justify-between gap-3 rounded-[18px] bg-white px-3 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.03)] ring-1 ring-zinc-200/60 ${
        compact ? "" : "border border-white/70"
      }`}
    >
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
          <span
            className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
              isOnline ? "bg-emerald-400" : "bg-zinc-400"
            }`}
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium text-zinc-800">
            {person?.name || "Traveler"}
          </p>
          <p className="truncate text-[12px] text-zinc-400">
            {person?.email || t("sidebar.emailUnavailable")}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleOpenChat}
        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}

function EmptyState({ boxed = false }) {
  const { t } = useTranslation();

  return (
    <div
      className={`theme-card rounded-[18px] bg-white px-4 py-5 text-center text-[13px] text-zinc-400 shadow-[0_8px_20px_rgba(15,23,42,0.03)] ring-1 ring-zinc-200/60 ${
        boxed ? "border border-white/70" : ""
      }`}
    >
      {t("mutual.empty")}
    </div>
  );
}

export default function MutualContactsSection() {
  const { t } = useTranslation();
  const { onlineUserIds, presenceByUserId } = useChat();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allItems, setAllItems] = useState([]);
  const [allLoading, setAllLoading] = useState(false);

  const onlineUserIdSet = useMemo(
    () => new Set((onlineUserIds || []).filter(Boolean)),
    [onlineUserIds],
  );

  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => {
      const leftId = getUserId(left);
      const rightId = getUserId(right);
      const leftOnline =
        (leftId && onlineUserIdSet.has(leftId)) ||
        presenceByUserId[leftId]?.isOnline
          ? 1
          : 0;
      const rightOnline =
        (rightId && onlineUserIdSet.has(rightId)) ||
        presenceByUserId[rightId]?.isOnline
          ? 1
          : 0;

      if (leftOnline !== rightOnline) {
        return rightOnline - leftOnline;
      }

      return 0;
    });
  }, [items, onlineUserIdSet, presenceByUserId]);

  const visibleItems = useMemo(
    () => sortedItems.slice(0, SIDEBAR_LIMIT),
    [sortedItems],
  );

  const loadMutuals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await followApi.listMutuals({ limit: SIDEBAR_SOURCE_LIMIT });
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllMutuals = useCallback(async () => {
    try {
      setAllLoading(true);
      const res = await followApi.listMutuals({ limit: MODAL_LIMIT });
      setAllItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch {
      setAllItems([]);
    } finally {
      setAllLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMutuals();
  }, [loadMutuals]);

  useEffect(() => {
    if (!isModalOpen) return undefined;

    void loadAllMutuals();

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isModalOpen, loadAllMutuals]);

  const modal = createPortal(
    <AnimatePresence>
      {isModalOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-zinc-950/28 px-4 py-8 backdrop-blur-[4px]"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.985 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="theme-popover flex max-h-[80vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(246,247,255,0.96),rgba(243,238,255,0.95))] shadow-[0_30px_80px_rgba(15,23,42,0.22)] ring-1 ring-zinc-200/70"
          >
            <div className="flex items-center justify-between border-b border-zinc-200/70 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  {t("mutual.title")}
                </p>
                <h4 className="mt-1 text-[20px] font-semibold text-zinc-900">
                  {t("mutual.subtitle")}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="theme-card inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-200/80 bg-white/80 text-zinc-500 shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-4">
              <div className="space-y-3">
                {allLoading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <ContactCardSkeleton
                      key={`all-mutual-skeleton-${index}`}
                      compact
                    />
                  ))
                ) : allItems.length ? (
                  [...allItems]
                    .sort((left, right) => {
                      const leftId = getUserId(left);
                      const rightId = getUserId(right);
                      const leftOnline =
                        (leftId && onlineUserIdSet.has(leftId)) ||
                        presenceByUserId[leftId]?.isOnline
                          ? 1
                          : 0;
                      const rightOnline =
                        (rightId && onlineUserIdSet.has(rightId)) ||
                        presenceByUserId[rightId]?.isOnline
                          ? 1
                          : 0;
                      return rightOnline - leftOnline;
                    })
                    .map((person) => (
                      <motion.div
                        key={`all-${person?._id || person?.id}`}
                        layout
                        transition={{
                          duration: 0.24,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <ContactRow person={person} compact />
                      </motion.div>
                    ))
                ) : (
                  <EmptyState boxed />
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );

  return (
    <>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-zinc-900">
            {t("mutual.title")}
          </h3>
          <motion.button
            type="button"
            onClick={() => setIsModalOpen(true)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="theme-secondary-button group inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-[13px] font-medium text-[#4f7cff] transition-colors hover:bg-blue-50/80 hover:text-[#3f6fff]"
          >
            <span>{t("mutual.viewAll")}</span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </motion.button>
        </div>

        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <ContactCardSkeleton key={`mutual-skeleton-${index}`} />
            ))
          ) : visibleItems.length ? (
            visibleItems.map((person) => (
              <motion.div
                key={person?._id || person?.id}
                layout
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <ContactRow person={person} />
              </motion.div>
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {modal}
    </>
  );
}
