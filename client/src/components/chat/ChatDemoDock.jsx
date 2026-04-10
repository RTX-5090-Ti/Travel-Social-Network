import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
} from "framer-motion";
import { MessageCircleMore, Minimize2, SendHorizonal, X } from "lucide-react";
import { useLocation } from "react-router-dom";

import { useAuth } from "../../auth/useAuth";
import { useChat } from "../../chat/useChat";

const BUBBLE_SIZE = 48;
const PANEL_WIDTH = 360;
const PANEL_HEIGHT = 520;
const VIEWPORT_PADDING = 24;
const DRAG_THRESHOLD = 6;
const MAX_COMPOSER_HEIGHT = 112;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getBubbleBounds() {
  if (typeof window === "undefined") {
    return {
      minX: VIEWPORT_PADDING,
      minY: VIEWPORT_PADDING,
      maxX: VIEWPORT_PADDING,
      maxY: VIEWPORT_PADDING,
    };
  }

  return {
    minX: VIEWPORT_PADDING,
    minY: VIEWPORT_PADDING,
    maxX: Math.max(
      VIEWPORT_PADDING,
      window.innerWidth - BUBBLE_SIZE - VIEWPORT_PADDING,
    ),
    maxY: Math.max(
      VIEWPORT_PADDING,
      window.innerHeight - BUBBLE_SIZE - VIEWPORT_PADDING,
    ),
  };
}

function getInitialBubblePosition() {
  const bounds = getBubbleBounds();
  return {
    x: bounds.maxX,
    y: Math.max(bounds.minY, bounds.maxY - 100),
  };
}

function getPanelPosition(position) {
  if (typeof window === "undefined") {
    return {
      left: VIEWPORT_PADDING,
      top: VIEWPORT_PADDING,
    };
  }

  const bubbleCenterX = position.x + BUBBLE_SIZE / 2;
  const panelLeft =
    bubbleCenterX > window.innerWidth / 2
      ? position.x + BUBBLE_SIZE - PANEL_WIDTH
      : position.x;
  const panelTop = position.y - PANEL_HEIGHT + 12;

  return {
    left: clamp(
      panelLeft,
      VIEWPORT_PADDING,
      Math.max(
        VIEWPORT_PADDING,
        window.innerWidth - PANEL_WIDTH - VIEWPORT_PADDING,
      ),
    ),
    top: clamp(
      panelTop,
      VIEWPORT_PADDING,
      Math.max(
        VIEWPORT_PADDING,
        window.innerHeight - PANEL_HEIGHT - VIEWPORT_PADDING,
      ),
    ),
  };
}

function getMessageId(message) {
  return message?._id || message?.id || "";
}

function getAvatarUrl(contact) {
  return contact?.avatarUrl || contact?.avatar || "";
}

function formatMessageTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function ChatDemoDock() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const {
    isChatOpen,
    setIsChatOpen,
    activeConversation,
    activeMessages,
    sendMessage,
    sending,
  } = useChat();

  const [position, setPosition] = useState(getInitialBubblePosition);
  const [draftsByConversation, setDraftsByConversation] = useState({});

  const messagesContainerRef = useRef(null);
  const composerRef = useRef(null);
  const dragControls = useDragControls();
  const bubbleRef = useRef(null);
  const bubbleDragX = useMotionValue(0);
  const bubbleDragY = useMotionValue(0);
  const bubblePointerRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    dragging: false,
  });

  useEffect(() => {
    function handleResize() {
      const bounds = getBubbleBounds();
      setPosition((prev) => ({
        x: clamp(prev.x, bounds.minX, bounds.maxX),
        y: clamp(prev.y, bounds.minY, bounds.maxY),
      }));
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const panelPosition = useMemo(() => getPanelPosition(position), [position]);

  const bubbleDragConstraints = useMemo(() => {
    const bounds = getBubbleBounds();

    return {
      left: bounds.minX - position.x,
      right: bounds.maxX - position.x,
      top: bounds.minY - position.y,
      bottom: bounds.maxY - position.y,
    };
  }, [position]);

  const resetBubblePointer = () => {
    bubblePointerRef.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
      dragging: false,
    };
  };

  const handleBubblePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    bubblePointerRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };
  };

  useEffect(() => {
    function handleWindowPointerMove(event) {
      const gesture = bubblePointerRef.current;
      if (gesture.pointerId !== event.pointerId) return;

      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      const distance = Math.hypot(dx, dy);

      if (!gesture.dragging && distance >= DRAG_THRESHOLD) {
        bubblePointerRef.current.dragging = true;
        dragControls.start(event, { snapToCursor: false });
      }
    }

    function handleWindowPointerUp(event) {
      const gesture = bubblePointerRef.current;
      if (gesture.pointerId !== event.pointerId) return;

      const shouldOpen = !gesture.dragging;
      resetBubblePointer();

      if (shouldOpen) {
        setIsChatOpen(true);
      }
    }

    function handleWindowPointerCancel(event) {
      const gesture = bubblePointerRef.current;
      if (gesture.pointerId !== event.pointerId) return;
      resetBubblePointer();
    }

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerCancel);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerCancel);
    };
  }, [dragControls, setIsChatOpen]);

  const activeParticipant = activeConversation?.participant || null;
  const participantAvatar = getAvatarUrl(activeParticipant);
  const activeConversationId =
    activeConversation?._id || activeConversation?.id || "";
  const currentDraft = draftsByConversation[activeConversationId] || "";
  const currentUserId = user?.id || user?._id || "";
  const latestOwnMessage = [...activeMessages]
    .reverse()
    .find((message) => (message?.senderId || "") === currentUserId);
  const latestOwnMessageStatus = latestOwnMessage
    ? latestOwnMessage?.readAt
      ? "Đã xem"
      : "Đã gửi"
    : "";

  useEffect(() => {
    if (!isChatOpen) return;

    const frame = window.requestAnimationFrame(() => {
      const container = messagesContainerRef.current;
      if (!container) return;
      container.scrollTop = container.scrollHeight;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeConversationId, activeMessages, isChatOpen]);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;

    composer.style.height = "0px";
    const nextHeight = Math.min(composer.scrollHeight, MAX_COMPOSER_HEIGHT);
    composer.style.height = `${nextHeight}px`;
    composer.style.overflowY =
      composer.scrollHeight > MAX_COMPOSER_HEIGHT ? "auto" : "hidden";
  }, [activeConversationId, currentDraft]);

  async function handleSubmitMessage(event) {
    event.preventDefault();

    const conversationId = activeConversation?._id || activeConversation?.id || "";
    const draft = draftsByConversation[conversationId] || "";
    const trimmed = draft.trim();
    if (!trimmed) return;

    const result = await sendMessage(trimmed);
    if (result?.ok) {
      setDraftsByConversation((prev) => ({
        ...prev,
        [conversationId]: "",
      }));
    }
  }

  if (!isAuthenticated || location.pathname === "/login") {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] hidden lg:block">
      <AnimatePresence mode="wait">
        {isChatOpen ? (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed pointer-events-auto"
            style={{
              width: PANEL_WIDTH,
              left: panelPosition.left,
              top: panelPosition.top,
            }}
          >
            <div className="theme-chat-shell overflow-hidden rounded-[26px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,247,255,0.98),rgba(242,238,255,0.97))] shadow-[0_30px_80px_rgba(15,23,42,0.18)] ring-1 ring-zinc-200/70 backdrop-blur-xl">
              <div className="relative overflow-hidden border-b border-white/70 bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-4 pb-4 pt-3 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_30%)]" />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative">
                      {participantAvatar ? (
                        <img
                          src={participantAvatar}
                          alt={activeParticipant?.name || "Chat contact"}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-white/75"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/18 text-[16px] font-semibold text-white ring-2 ring-white/75">
                          {(activeParticipant?.name || "T").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold tracking-tight">
                        {activeParticipant?.name || "Tin nhắn mới"}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-white/80">
                        Hoạt động 7 phút trước
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsChatOpen(false)}
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/12 text-white/85 transition hover:bg-white/18"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="theme-chat-body bg-[linear-gradient(180deg,rgba(251,251,252,0.88),rgba(245,247,255,0.92))] px-4 py-4">
                <div
                  ref={messagesContainerRef}
                  className="chat-demo-scroll flex min-h-[320px] max-h-[320px] flex-col gap-3 overflow-y-auto pr-0.5"
                >
                  {activeMessages.length ? (
                    activeMessages.map((message) => {
                      const messageId = getMessageId(message);
                      const isOwnMessage =
                        (message?.senderId || "") === currentUserId;

                      return (
                        <div
                          key={messageId}
                          className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`flex max-w-[82%] flex-col ${
                              isOwnMessage ? "items-end" : "items-start"
                            }`}
                          >
                            <div
                              className={`rounded-[20px] px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)] ${
                                isOwnMessage
                                  ? "rounded-br-[8px] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white"
                                  : "rounded-bl-[8px] border border-white/80 bg-white text-zinc-700"
                              }`}
                            >
                              <p className="text-[13px] leading-6">
                                {message?.text || ""}
                              </p>
                              <p
                                className={`mt-2 text-[11px] ${
                                  isOwnMessage ? "text-white/70" : "text-zinc-400"
                                }`}
                              >
                                {formatMessageTime(message?.createdAt)}
                              </p>
                            </div>

                            {isOwnMessage &&
                            getMessageId(message) === getMessageId(latestOwnMessage) ? (
                              <p className="mt-1.5 px-1 text-[11px] font-medium text-zinc-400">
                                {latestOwnMessageStatus}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex min-h-[320px] items-center justify-center">
                      <div className="theme-card w-full rounded-[24px] border border-dashed border-zinc-200/90 bg-white/78 px-5 py-10 text-center shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(102,126,234,0.14),rgba(118,75,162,0.18))] text-[#667eea]">
                          <MessageCircleMore className="h-6 w-6" />
                        </div>
                        <p className="mt-4 text-[15px] font-semibold text-zinc-800">
                          Bắt đầu cuộc trò chuyện với{" "}
                          {activeParticipant?.name || "người này"}
                        </p>
                        <p className="mt-2 text-[13px] leading-6 text-zinc-500">
                          Tin nhắn sẽ xuất hiện ở đây khi mày bắt đầu nhắn với
                          người này.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="theme-chat-composer border-t border-zinc-200/70 bg-white/92 p-3">
                <form
                  onSubmit={handleSubmitMessage}
                  className="flex items-end gap-2 rounded-[22px] border border-zinc-200/80 bg-white px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
                >
                  <textarea
                    ref={composerRef}
                    value={currentDraft}
                    onChange={(event) =>
                      setDraftsByConversation((prev) => ({
                        ...prev,
                        [activeConversationId]: event.target.value,
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSubmitMessage(event);
                      }
                    }}
                    placeholder="Nhập tin nhắn ở đây..."
                    rows={1}
                    className="chat-demo-scroll max-h-28 min-h-[22px] flex-1 resize-none bg-transparent py-1 text-[14px] leading-6 text-zinc-700 outline-none placeholder:text-zinc-400"
                  />
                  <button
                    type="submit"
                    disabled={
                      !currentDraft.trim() || sending || !activeConversation
                    }
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-[0_10px_24px_rgba(102,126,234,0.22)] ${
                      !currentDraft.trim() || sending || !activeConversation
                        ? "cursor-not-allowed bg-zinc-300"
                        : "cursor-pointer bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)]"
                    }`}
                  >
                    <SendHorizonal className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            transition={{ type: "spring", stiffness: 520, damping: 36 }}
            ref={bubbleRef}
            key="chat-bubble"
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            dragElastic={0}
            dragConstraints={bubbleDragConstraints}
            onDragEnd={() => {
              const bounds = getBubbleBounds();
              const rect = bubbleRef.current?.getBoundingClientRect();

              if (!rect) {
                bubbleDragX.stop();
                bubbleDragY.stop();
                bubbleDragX.set(0);
                bubbleDragY.set(0);
                resetBubblePointer();
                return;
              }

              const visualLeft = clamp(rect.left, bounds.minX, bounds.maxX);
              const visualTop = clamp(rect.top, bounds.minY, bounds.maxY);
              const bubbleCenterX = visualLeft + BUBBLE_SIZE / 2;
              const snappedX =
                bubbleCenterX > window.innerWidth / 2
                  ? bounds.maxX
                  : bounds.minX;

              bubbleDragX.stop();
              bubbleDragY.stop();
              bubbleDragX.set(0);
              bubbleDragY.set(0);

              setPosition({
                x: snappedX,
                y: visualTop,
              });

              resetBubblePointer();
            }}
            onPointerDown={handleBubblePointerDown}
            onContextMenu={(event) => event.preventDefault()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsChatOpen(true);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Open chat"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="pointer-events-auto fixed group cursor-grab rounded-full text-white shadow-[0_20px_44px_rgba(102,126,234,0.30)] touch-none select-none active:cursor-grabbing"
            style={{
              width: BUBBLE_SIZE,
              height: BUBBLE_SIZE,
              left: position.x,
              top: position.y,
              x: bubbleDragX,
              y: bubbleDragY,
            }}
          >
            <span className="absolute inset-0 overflow-hidden rounded-full border border-white/80 bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] ring-1 ring-white/35">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.16),transparent_35%)]" />
              <span className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_65%)] opacity-0 transition duration-300 group-hover:opacity-100" />
            </span>

            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
              }}
              className="absolute -right-3 -top-3 z-20 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-white/85 bg-white text-[#667eea] opacity-0 shadow-[0_8px_18px_rgba(15,23,42,0.18)] transition duration-200 group-hover:opacity-100"
            >
              <X className="h-[11px] w-[11px]" strokeWidth={2.6} />
            </button>

            <span className="relative z-10 flex h-full w-full items-center justify-center">
              <MessageCircleMore className="h-[22px] w-[22px]" strokeWidth={2.2} />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
