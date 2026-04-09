import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { tripApi } from "../../api/trip.api";
import { useNotifications } from "../../notifications/useNotifications";
import { useTripOverlay } from "../../trip-overlay/useTripOverlay";

const PANEL_WIDTH = 340;
const PANEL_GAP = 12;
const VIEWPORT_GAP = 16;
const COLLAPSED_VISIBLE_COUNT = 6;

function formatNotificationTime(value) {
  if (!value) return "Vừa xong";

  const targetTime = new Date(value).getTime();
  if (Number.isNaN(targetTime)) return "Vừa xong";

  const diffMs = targetTime - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  const rtf = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 1) return "Vừa xong";
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, "day");

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

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

async function buildNotificationOpenTarget(item) {
  const actorId = item?.actor?._id || item?.actor?.id || "";
  const tripId = item?.tripId || item?.payload?.tripId || "";
  let focusCommentId = item?.payload?.focusCommentId || item?.commentId || "";
  let threadCommentId =
    item?.payload?.threadCommentId || focusCommentId || "";

  if (item?.type === "follow" && actorId) {
    return {
      kind: "route",
      pathname: `/profile/${actorId}`,
      state: {},
    };
  }

  if (
    tripId &&
    (!focusCommentId || item?.type === "trip_like" || threadCommentId)
  ) {
    return {
      kind: "tripOverlay",
      target: {
        tripId,
        focusCommentId,
        threadCommentId,
        nonce: `${Date.now()}-${tripId}-${focusCommentId || "trip"}`,
      },
    };
  }

  if (focusCommentId && item?.type !== "follow") {
    try {
      const res = await tripApi.getCommentContext(focusCommentId);

      focusCommentId = res.data?.focusCommentId || focusCommentId;
      threadCommentId =
        res.data?.threadCommentId || threadCommentId || focusCommentId;

      return {
        kind: "tripOverlay",
        target: {
          tripId: res.data?.tripId || tripId,
          focusCommentId,
          threadCommentId,
          nonce: `${Date.now()}-${res.data?.tripId || tripId}-${focusCommentId}`,
        },
      };
    } catch {
      // Fall through to payload-based navigation.
    }
  }

  if (tripId) {
    return {
      kind: "tripOverlay",
      target: {
        tripId,
        focusCommentId,
        threadCommentId,
        nonce: `${Date.now()}-${tripId}-${focusCommentId || "trip"}`,
      },
    };
  }

  return null;
}

function NotificationItem({
  item,
  selectable = false,
  selected = false,
  onToggleSelect,
  onActivate,
}) {
  const itemId = item?._id || item?.id || item?.createdAt;
  const actorName = item?.actor?.name || "Traveler";
  const avatarUrl = item?.actor?.avatarUrl || "";
  const fallbackMessage = `${actorName} đã tương tác với bạn.`;
  const message = item?.message || fallbackMessage;
  const hasActorPrefix = actorName && message.startsWith(actorName);
  const messageSuffix = hasActorPrefix
    ? message.slice(actorName.length).trimStart()
    : message;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-start gap-3 rounded-[20px] border px-3 py-3 transition ${
        item?.read
          ? "border-white/70 bg-white/75 hover:bg-white"
          : "border-violet-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,241,255,0.98))] shadow-[0_10px_22px_rgba(124,58,237,0.08)]"
      }`}
    >
      <AnimatePresence initial={false}>
        {selectable ? (
          <motion.button
            type="button"
            aria-label={selected ? "Bỏ chọn thông báo" : "Chọn thông báo"}
            onClick={() => onToggleSelect?.(itemId)}
            initial={{ opacity: 0, x: -6, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -6, scale: 0.9 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`mt-2 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition cursor-pointer ${
              selected
                ? "border-violet-500 bg-violet-500 shadow-[0_0_0_4px_rgba(139,92,246,0.12)]"
                : "border-zinc-300 bg-white hover:border-violet-300"
            }`}
          >
            <AnimatePresence initial={false}>
              {selected ? (
                <motion.span
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className="h-2 w-2 rounded-[2px] bg-white"
                />
              ) : null}
            </AnimatePresence>
          </motion.button>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => onActivate?.(item)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left cursor-pointer transition duration-200 hover:translate-x-[2px]"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={actorName}
            className="h-11 w-11 rounded-full object-cover ring-2 ring-white/80 shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
          />
        ) : (
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-sm font-semibold text-white shadow-[0_10px_20px_rgba(102,126,234,0.20)]">
            {(actorName || "T").charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[14px] leading-6 text-zinc-700">
            {hasActorPrefix ? (
              <>
                <span className="font-semibold text-zinc-900">{actorName}</span>{" "}
                {messageSuffix}
              </>
            ) : (
              message
            )}
          </p>
          <p className="mt-1 text-[12px] font-medium text-zinc-400">
            {formatNotificationTime(item?.createdAt)}
          </p>
        </div>

        {!item?.read ? (
          <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500 shadow-[0_0_0_4px_rgba(139,92,246,0.12)]" />
        ) : null}
      </button>
    </motion.div>
  );
}

function DeleteActions({
  selectedCount = 0,
  deletingSelected = false,
  onDeleteSelected,
  deletingAll = false,
  onDeleteAll,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-2 gap-2"
    >
      <button
        type="button"
        onClick={onDeleteSelected}
        disabled={selectedCount <= 0 || deletingSelected}
        className={`rounded-[16px] border px-3 py-2.5 text-[12px] font-semibold shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition ${
          selectedCount > 0 && !deletingSelected
            ? "border-zinc-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,244,245,0.98))] text-zinc-600 hover:-translate-y-[1px] hover:bg-white cursor-pointer"
            : "border-zinc-200/70 bg-zinc-100/90 text-zinc-400 cursor-not-allowed"
        }`}
      >
        {deletingSelected
          ? "Đang xoá..."
          : selectedCount > 0
            ? `Xoá đã chọn (${selectedCount})`
            : "Xoá đã chọn"}
      </button>

      <button
        type="button"
        onClick={onDeleteAll}
        disabled={deletingAll}
        className={`rounded-[16px] border px-3 py-2.5 text-[12px] font-semibold shadow-[0_8px_18px_rgba(244,63,94,0.08)] transition ${
          deletingAll
            ? "border-rose-200/70 bg-rose-100/90 text-rose-300 cursor-not-allowed"
            : "border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,241,242,0.98))] text-rose-600 hover:-translate-y-[1px] hover:bg-white cursor-pointer"
        }`}
      >
        {deletingAll ? "Đang xoá..." : "Xoá tất cả"}
      </button>
    </motion.div>
  );
}

export default function NotificationBellButton() {
  const navigate = useNavigate();
  const { openTripOverlay } = useTripOverlay();
  const {
    notifications,
    unreadCount,
    hasMore,
    loadingMore,
    loadMoreNotifications,
    markAllAsRead,
    deleteSelectedNotifications,
    deleteAllNotifications,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showDeleteActions, setShowDeleteActions] = useState(false);
  const [panelStyle, setPanelStyle] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const scrollRef = useRef(null);
  const loadMoreRef = useRef(null);
  const markReadFrameRef = useRef(0);

  const hasNotifications = notifications.length > 0;
  const canExpand = notifications.length > COLLAPSED_VISIBLE_COUNT || hasMore;
  const previewItems = useMemo(
    () => notifications.slice(0, COLLAPSED_VISIBLE_COUNT),
    [notifications],
  );

  function syncPanelPosition(targetRect) {
    const buttonRect = targetRect || rootRef.current?.getBoundingClientRect();
    const nextStyle = buildPanelPosition(buttonRect);
    if (nextStyle) {
      setPanelStyle(nextStyle);
    }
  }

  function closePanel() {
    setOpen(false);
    setExpanded(false);
    setShowDeleteActions(false);
    setSelectedIds([]);
    setDeletingSelected(false);
    setDeletingAll(false);
  }

  function handleToggleSelect(notificationId) {
    if (!notificationId || deletingSelected || deletingAll) return;

    setSelectedIds((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId],
    );
  }

  async function handleDeleteSelected() {
    if (!selectedIds.length || deletingSelected || deletingAll) return;

    setDeletingSelected(true);

    try {
      const result = await deleteSelectedNotifications(selectedIds);

      if (result?.ok) {
        const deletedIds = Array.isArray(result.deletedIds)
          ? result.deletedIds
          : [];

        setSelectedIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
      }
    } finally {
      setDeletingSelected(false);
    }
  }

  async function handleDeleteAll() {
    if (deletingAll || deletingSelected || !notifications.length) return;

    setDeletingAll(true);

    try {
      const result = await deleteAllNotifications();

      if (result?.ok) {
        setSelectedIds([]);
        setShowDeleteActions(false);
        setExpanded(false);
      }
    } finally {
      setDeletingAll(false);
    }
  }

  useEffect(() => {
    if (!selectedIds.length) return;

    const visibleIds = new Set(
      notifications.map((item) => item?._id || item?.id || item?.createdAt),
    );

    setSelectedIds((prev) => prev.filter((id) => visibleIds.has(id)));
  }, [notifications, selectedIds.length]);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      const target = event.target;

      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;

      closePanel();
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        closePanel();
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
  }, [open]);

  useEffect(() => {
    if (!open || unreadCount <= 0) return undefined;

    markReadFrameRef.current = window.requestAnimationFrame(() => {
      void markAllAsRead();
    });

    return () => {
      if (markReadFrameRef.current) {
        window.cancelAnimationFrame(markReadFrameRef.current);
        markReadFrameRef.current = 0;
      }
    };
  }, [markAllAsRead, open, unreadCount]);

  useEffect(() => {
    if (!open || !expanded || !hasMore || loadingMore) return undefined;

    const targetNode = loadMoreRef.current;
    const rootNode = scrollRef.current;

    if (
      !targetNode ||
      !rootNode ||
      typeof IntersectionObserver === "undefined"
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        void loadMoreNotifications();
      },
      {
        root: rootNode,
        rootMargin: "0px 0px 180px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(targetNode);

    return () => observer.disconnect();
  }, [expanded, hasMore, loadMoreNotifications, loadingMore, open]);

  function handleToggleOpen() {
    const nextOpen = !open;

    if (nextOpen) {
      const targetRect = rootRef.current?.getBoundingClientRect();
      syncPanelPosition(targetRect);
      setOpen(true);
      return;
    }

    closePanel();
  }

  async function handleActivateNotification(item) {
    if (showDeleteActions || deletingSelected || deletingAll) {
      return;
    }

    const openTarget = await buildNotificationOpenTarget(item);
    if (!openTarget) {
      closePanel();
      return;
    }

    closePanel();

    if (openTarget.kind === "tripOverlay") {
      openTripOverlay(openTarget.target);
      return;
    }

    navigate(openTarget.pathname, {
      state: openTarget.state,
    });
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
          className="fixed z-[9999] overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,247,255,0.95),rgba(243,238,255,0.94))] shadow-[0_26px_70px_rgba(15,23,42,0.18)] ring-1 ring-zinc-200/70 backdrop-blur-xl"
          style={panelStyle}
        >
          <div className="border-b border-zinc-200/70 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-[18px] font-semibold text-zinc-900">
                Thông báo
              </h4>

              <button
                type="button"
                aria-label="Xóa thông báo"
                title="Xóa thông báo"
                onClick={() => {
                  setShowDeleteActions((prev) => !prev);
                  setSelectedIds([]);
                }}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/80 bg-white/80 text-zinc-500 shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition hover:-translate-y-[1px] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 cursor-pointer ${
                  showDeleteActions
                    ? "border-rose-200 bg-rose-50 text-rose-500"
                    : ""
                }`}
              >
                <Trash2 className="h-4 w-4" strokeWidth={2.1} />
              </button>
            </div>
          </div>

          {!hasNotifications ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-3 py-3"
            >
              <div className="rounded-[22px] border border-dashed border-zinc-200 bg-white/70 px-4 py-8 text-center text-sm text-zinc-500">
                Chưa có thông báo nào.
              </div>
            </motion.div>
          ) : expanded ? (
            <>
              <motion.div
                ref={scrollRef}
                layout
                className="max-h-[560px] overflow-y-auto px-3 py-3"
              >
                <motion.div layout className="space-y-2">
                  {notifications.map((item) => (
                    <NotificationItem
                      key={item?._id || item?.id || item?.createdAt}
                      item={item}
                      selectable={showDeleteActions}
                      selected={selectedIds.includes(
                        item?._id || item?.id || item?.createdAt,
                      )}
                      onToggleSelect={handleToggleSelect}
                      onActivate={handleActivateNotification}
                    />
                  ))}
                </motion.div>

                {loadingMore ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center py-3"
                  >
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-500" />
                  </motion.div>
                ) : null}

                {hasMore ? <div ref={loadMoreRef} className="h-4 w-full" /> : null}
              </motion.div>

              <AnimatePresence>
                {showDeleteActions ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    className="border-t border-zinc-200/70 px-3 py-3"
                  >
                    <DeleteActions
                      selectedCount={selectedIds.length}
                      deletingSelected={deletingSelected}
                      onDeleteSelected={handleDeleteSelected}
                      deletingAll={deletingAll}
                      onDeleteAll={handleDeleteAll}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </>
          ) : (
            <motion.div layout className="px-3 py-3">
              <motion.div layout className="space-y-2">
                {previewItems.map((item) => (
                  <NotificationItem
                    key={item?._id || item?.id || item?.createdAt}
                    item={item}
                    selectable={showDeleteActions}
                    selected={selectedIds.includes(
                      item?._id || item?.id || item?.createdAt,
                    )}
                    onToggleSelect={handleToggleSelect}
                    onActivate={handleActivateNotification}
                  />
                ))}
              </motion.div>

              {(showDeleteActions || canExpand) ? (
                <div className="pt-3">
                  <AnimatePresence>
                    {showDeleteActions ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{
                          duration: 0.16,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className={canExpand ? "mb-3" : ""}
                      >
                        <DeleteActions
                          selectedCount={selectedIds.length}
                          deletingSelected={deletingSelected}
                          onDeleteSelected={handleDeleteSelected}
                          deletingAll={deletingAll}
                          onDeleteAll={handleDeleteAll}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {canExpand ? (
                    <button
                      type="button"
                      onClick={() => setExpanded(true)}
                      className="w-full rounded-[18px] border border-violet-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,241,255,0.98))] px-4 py-3 text-[13px] font-semibold text-violet-600 shadow-[0_10px_22px_rgba(124,58,237,0.08)] transition hover:-translate-y-[1px] hover:bg-white cursor-pointer"
                    >
                      Xem thông báo trước đó
                    </button>
                  ) : null}
                </div>
              ) : null}
            </motion.div>
          )}
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
          aria-label="Notifications"
          onClick={handleToggleOpen}
          className={`group relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white shadow-[0_12px_28px_rgba(108,92,231,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(79,124,255,0.28)] cursor-pointer ${
            open ? "ring-4 ring-violet-200/70" : ""
          }`}
        >
          <Bell
            className="h-[22px] w-[22px] transition duration-200 group-hover:scale-105"
            strokeWidth={2.2}
          />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 py-[2px] text-[10px] font-semibold leading-none text-white shadow-[0_8px_18px_rgba(255,255,255,0.35)]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
      </div>

      {panel}
    </>
  );
}
