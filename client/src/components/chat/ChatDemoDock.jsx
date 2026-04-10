import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
} from "framer-motion";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { MessageCircleMore, Minimize2, SendHorizonal, X } from "lucide-react";
import { useLocation } from "react-router-dom";

import { useAuth } from "../../auth/useAuth";
import { useChat } from "../../chat/useChat";
import LazyEmojiPicker from "../shared/LazyEmojiPicker";
import LazyGiphyGrid from "../shared/LazyGiphyGrid";
import CommentComposerActionButton from "../feed/page/journey-card/CommentComposerActionButton";
import {
  CommentCameraIcon,
  CommentSmileIcon,
  CommentStickerIcon,
} from "../feed/page/journey-card/CommentComposerIcons";
import JourneyMediaLightbox from "../feed/page/journey-card/JourneyMediaLightbox";

const BUBBLE_SIZE = 48;
const PANEL_WIDTH = 360;
const PANEL_HEIGHT = 520;
const VIEWPORT_PADDING = 24;
const DRAG_THRESHOLD = 6;
const MAX_COMPOSER_HEIGHT = 112;
const MAX_CHAT_IMAGE_SIZE = 10 * 1024 * 1024;
const GIPHY_API_KEY = "1nkeWo3uBJD4LMdiMqEo8aHHkr4Lrxvq";
const gf = new GiphyFetch(GIPHY_API_KEY);

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

function getUserId(contact) {
  return contact?._id || contact?.id || "";
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

function formatLastSeenLabel(presence) {
  if (presence?.isOnline) return "Đang hoạt động";

  const lastSeenAt = presence?.lastSeenAt;
  if (!lastSeenAt) return "Hoạt động gần đây";

  const targetTime = new Date(lastSeenAt).getTime();
  if (Number.isNaN(targetTime)) return "Hoạt động gần đây";

  const diffMinutes = Math.max(
    0,
    Math.round((Date.now() - targetTime) / (1000 * 60)),
  );

  if (diffMinutes < 1) return "Vừa hoạt động";
  if (diffMinutes < 60) return `Hoạt động ${diffMinutes} phút trước`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `Hoạt động ${diffHours} giờ trước`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `Hoạt động ${diffDays} ngày trước`;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(lastSeenAt));
}

function ChatComposerToolbar({
  onToggleEmojiPicker,
  onToggleGifPicker,
  onPickImage,
  emojiPickerOpen = false,
  gifPickerOpen = false,
}) {
  return (
    <div className="mb-2.5 flex items-center gap-1.5 px-1">
      <CommentComposerActionButton
        ariaLabel="Emoji"
        onClick={onToggleEmojiPicker}
        className={
          emojiPickerOpen
            ? "bg-[linear-gradient(135deg,rgba(102,126,234,0.16),rgba(118,75,162,0.18))] text-violet-600 shadow-[0_10px_22px_rgba(102,126,234,0.12)]"
            : ""
        }
      >
        <CommentSmileIcon className="h-[21px] w-[21px]" />
      </CommentComposerActionButton>

      <CommentComposerActionButton ariaLabel="Camera" onClick={onPickImage}>
        <CommentCameraIcon className="h-[21px] w-[21px]" />
      </CommentComposerActionButton>

      <CommentComposerActionButton
        ariaLabel="GIF"
        onClick={onToggleGifPicker}
        className={
          gifPickerOpen
            ? "bg-[linear-gradient(135deg,rgba(102,126,234,0.16),rgba(118,75,162,0.18))] text-violet-600 shadow-[0_10px_22px_rgba(102,126,234,0.12)]"
            : ""
        }
      >
        <span className="text-[12px] font-bold tracking-[0.08em]">GIF</span>
      </CommentComposerActionButton>

      <CommentComposerActionButton ariaLabel="Sticker">
        <CommentStickerIcon className="h-[21px] w-[21px]" />
      </CommentComposerActionButton>
    </div>
  );
}

function getMessageImageMedia(message) {
  const imageUrl = message?.image?.url || "";
  if (!imageUrl) return null;

  return {
    type: "image",
    url: imageUrl,
  };
}

function isGifMessage(message) {
  return (message?.image?.mediaType || "") === "gif";
}

function ChatMediaPreview({
  previewUrl,
  onRemove,
  onOpen,
  uploading = false,
  clickable = true,
}) {
  return (
    <div className="mb-2 rounded-[18px] border border-zinc-200/80 bg-white/90 p-2 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
      <div className="relative inline-flex overflow-hidden rounded-[14px] border border-zinc-200/80 bg-zinc-50">
        {clickable ? (
          <button
            type="button"
            onClick={onOpen}
            className="cursor-pointer transition hover:opacity-95"
          >
            <img
              src={previewUrl}
              alt="Chat media preview"
              className="h-[92px] w-[92px] object-cover"
            />
          </button>
        ) : (
          <img
            src={previewUrl}
            alt="Chat media preview"
            className="h-[92px] w-[92px] object-cover"
          />
        )}

        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/42 backdrop-blur-[1px]">
            <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-violet-200 border-t-violet-500 bg-white/78 shadow-[0_8px_18px_rgba(15,23,42,0.12)]" />
          </div>
        ) : null}

        <button
          type="button"
          aria-label="Remove media"
          onClick={onRemove}
          disabled={uploading}
          className={`absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-950/72 text-white shadow-[0_8px_18px_rgba(15,23,42,0.18)] transition hover:scale-105 hover:bg-zinc-950/84 ${
            uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }`}
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default function ChatDemoDock() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const {
    isChatDockVisible,
    isChatOpen,
    setIsChatDockVisible,
    setIsChatOpen,
    activeConversation,
    openingConversationId,
    activeMessages,
    markConversationRead,
    presenceByUserId,
    sendGifMessage,
    sendImageMessage,
    sendMessage,
    sending,
  } = useChat();

  const [position, setPosition] = useState(getInitialBubblePosition);
  const [draftsByConversation, setDraftsByConversation] = useState({});
  const [imageDraftsByConversation, setImageDraftsByConversation] = useState({});
  const [gifDraftsByConversation, setGifDraftsByConversation] = useState({});
  const [chatErrorsByConversation, setChatErrorsByConversation] = useState({});
  const [lightboxMedia, setLightboxMedia] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [gifQuery, setGifQuery] = useState("");

  const messagesContainerRef = useRef(null);
  const composerRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const gifPickerRef = useRef(null);
  const imageDraftsRef = useRef({});
  const gifDraftsRef = useRef({});
  const composerSelectionRef = useRef({
    start: 0,
    end: 0,
  });
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
        setIsChatDockVisible(true);
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
  }, [dragControls, setIsChatDockVisible, setIsChatOpen]);

  const activeParticipant = activeConversation?.participant || null;
  const participantAvatar = getAvatarUrl(activeParticipant);
  const activeParticipantPresence = {
    lastSeenAt: activeParticipant?.lastSeenAt || null,
    ...(presenceByUserId[getUserId(activeParticipant)] || {}),
  };
  const activeConversationId =
    activeConversation?._id || activeConversation?.id || "";
  const isSwitchingConversation =
    !!openingConversationId && openingConversationId === activeConversationId;
  const currentDraft = draftsByConversation[activeConversationId] || "";
  const currentImageDraft = imageDraftsByConversation[activeConversationId] || null;
  const currentGifDraft = gifDraftsByConversation[activeConversationId] || null;
  const currentChatError = chatErrorsByConversation[activeConversationId] || "";
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
    imageDraftsRef.current = imageDraftsByConversation;
  }, [imageDraftsByConversation]);

  useEffect(() => {
    gifDraftsRef.current = gifDraftsByConversation;
  }, [gifDraftsByConversation]);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;

    composer.style.height = "0px";
    const nextHeight = Math.min(composer.scrollHeight, MAX_COMPOSER_HEIGHT);
    composer.style.height = `${nextHeight}px`;
    composer.style.overflowY =
      composer.scrollHeight > MAX_COMPOSER_HEIGHT ? "auto" : "hidden";
  }, [activeConversationId, currentDraft]);

  useEffect(() => {
    return () => {
      Object.values(imageDraftsRef.current).forEach((item) => {
        if (item?.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      Object.values(gifDraftsRef.current).forEach((item) => {
        if (item?.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!emojiPickerOpen && !gifPickerOpen) return undefined;

    function handlePointerDown(event) {
      const target = event.target;
      if (emojiPickerRef.current?.contains(target)) return;
      if (gifPickerRef.current?.contains(target)) return;
      setEmojiPickerOpen(false);
      setGifPickerOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [emojiPickerOpen, gifPickerOpen]);

  function openLightbox(media, index = 0) {
    const safeItems = Array.isArray(media) ? media.filter(Boolean) : [];
    if (!safeItems.length) return;

    const safeIndex = Math.min(Math.max(index, 0), safeItems.length - 1);
    setLightboxMedia(safeItems);
    setLightboxIndex(safeIndex);
  }

  function closeLightbox() {
    setLightboxMedia([]);
    setLightboxIndex(0);
  }

  function removeImageDraft(conversationId = activeConversationId) {
    setImageDraftsByConversation((prev) => {
      const next = { ...prev };
      if (next[conversationId]?.previewUrl) {
        URL.revokeObjectURL(next[conversationId].previewUrl);
      }
      delete next[conversationId];
      return next;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeGifDraft(conversationId = activeConversationId) {
    setGifDraftsByConversation((prev) => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
  }

  function handlePickImageClick() {
    if (activeConversationId) {
      setChatErrorsByConversation((prev) => ({
        ...prev,
        [activeConversationId]: "",
      }));
    }
    fileInputRef.current?.click();
  }

  function handleToggleEmojiPicker() {
    if (!activeConversationId || isSwitchingConversation) return;

    setChatErrorsByConversation((prev) => ({
      ...prev,
      [activeConversationId]: "",
    }));
    setEmojiPickerOpen((prev) => !prev);
    setGifPickerOpen(false);
    composerRef.current?.focus();
  }

  function handleToggleGifPicker() {
    if (!activeConversationId || isSwitchingConversation) return;

    setChatErrorsByConversation((prev) => ({
      ...prev,
      [activeConversationId]: "",
    }));
    setGifPickerOpen((prev) => !prev);
    setEmojiPickerOpen(false);
  }

  function handleComposerSelect(event) {
    composerSelectionRef.current = {
      start: event.target.selectionStart ?? 0,
      end: event.target.selectionEnd ?? 0,
    };
  }

  function handleEmojiSelect(emojiData) {
    if (!activeConversationId) return;

    const emoji = emojiData?.emoji || "";
    if (!emoji) return;

    const textarea = composerRef.current;
    const currentValue = draftsByConversation[activeConversationId] || "";
    const selectionStart =
      textarea?.selectionStart ?? composerSelectionRef.current.start ?? currentValue.length;
    const selectionEnd =
      textarea?.selectionEnd ?? composerSelectionRef.current.end ?? selectionStart;

    const nextValue =
      currentValue.slice(0, selectionStart) +
      emoji +
      currentValue.slice(selectionEnd);
    const nextCaretPosition = selectionStart + emoji.length;

    setDraftsByConversation((prev) => ({
      ...prev,
      [activeConversationId]: nextValue,
    }));

    composerSelectionRef.current = {
      start: nextCaretPosition,
      end: nextCaretPosition,
    };

    window.requestAnimationFrame(() => {
      const nextTextarea = composerRef.current;
      if (!nextTextarea) return;
      nextTextarea.focus();
      nextTextarea.setSelectionRange(nextCaretPosition, nextCaretPosition);
    });
  }

  function handleImageInputChange(event) {
    const file = event.target.files?.[0];
    if (!file || !activeConversationId) return;

    if (!file.type?.startsWith("image/")) {
      setChatErrorsByConversation((prev) => ({
        ...prev,
        [activeConversationId]: "Chỉ được chọn file ảnh.",
      }));
      event.target.value = "";
      return;
    }

    if (file.size > MAX_CHAT_IMAGE_SIZE) {
      setChatErrorsByConversation((prev) => ({
        ...prev,
        [activeConversationId]: "Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB.",
      }));
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setChatErrorsByConversation((prev) => ({
      ...prev,
      [activeConversationId]: "",
    }));

    setImageDraftsByConversation((prev) => {
      const next = { ...prev };
      if (next[activeConversationId]?.previewUrl) {
        URL.revokeObjectURL(next[activeConversationId].previewUrl);
      }

      next[activeConversationId] = {
        file,
        previewUrl,
      };

      return next;
    });
    removeGifDraft(activeConversationId);
    setGifPickerOpen(false);
  }

  function fetchGifs(offset) {
    if (gifQuery.trim()) {
      return gf.search(gifQuery.trim(), {
        offset,
        limit: 12,
        rating: "pg-13",
      });
    }

    return gf.trending({
      offset,
      limit: 12,
      rating: "pg-13",
    });
  }

  function handleSelectGif(gif) {
    if (!activeConversationId || !gif?.images) return;

    const previewUrl =
      gif.images.fixed_width?.url ||
      gif.images.preview_gif?.url ||
      gif.images.original?.url ||
      "";
    const gifUrl =
      gif.images.original?.url || gif.images.fixed_width?.url || previewUrl;

    if (!gifUrl || !previewUrl) return;

    setGifDraftsByConversation((prev) => ({
      ...prev,
      [activeConversationId]: {
        gifUrl,
        previewUrl,
        width:
          Number(gif.images.original?.width || gif.images.fixed_width?.width) || null,
        height:
          Number(gif.images.original?.height || gif.images.fixed_width?.height) ||
          null,
      },
    }));

    removeImageDraft(activeConversationId);
    setGifPickerOpen(false);
  }

  async function handleSubmitMessage(event) {
    event.preventDefault();

    const conversationId =
      activeConversation?._id || activeConversation?.id || "";
    const draft = draftsByConversation[conversationId] || "";
    const trimmed = draft.trim();
    const imageDraft = imageDraftsByConversation[conversationId] || null;
    const gifDraft = gifDraftsByConversation[conversationId] || null;

    if (!trimmed && !imageDraft?.file && !gifDraft?.gifUrl) return;

    setChatErrorsByConversation((prev) => ({
      ...prev,
      [conversationId]: "",
    }));

    const result = imageDraft?.file
      ? await sendImageMessage({
          file: imageDraft.file,
          text: trimmed,
        })
      : gifDraft?.gifUrl
        ? await sendGifMessage({
            gifUrl: gifDraft.gifUrl,
            width: gifDraft.width,
            height: gifDraft.height,
            text: trimmed,
          })
        : await sendMessage(trimmed);

    if (result?.ok) {
      setDraftsByConversation((prev) => ({
        ...prev,
        [conversationId]: "",
      }));
      setEmojiPickerOpen(false);
      setGifPickerOpen(false);
      removeImageDraft(conversationId);
      removeGifDraft(conversationId);
    } else if (conversationId) {
      setChatErrorsByConversation((prev) => ({
        ...prev,
        [conversationId]: result?.error || "Không gửi được lúc này.",
      }));
    }
  }

  async function handleComposerFocus() {
    if (!activeConversationId || isSwitchingConversation) return;
    await markConversationRead(activeConversationId, { force: true });
  }

  if (!isAuthenticated || location.pathname === "/login") {
    return null;
  }

  if (!isChatDockVisible && !isChatOpen) {
    return null;
  }

  const lightbox = lightboxMedia.length
    ? createPortal(
        <div className="fixed inset-0 z-[10020]">
          <JourneyMediaLightbox
            media={lightboxMedia}
            currentIndex={lightboxIndex}
            tripTitle={activeParticipant?.name || "Chat image"}
            onClose={closeLightbox}
            onPrev={() =>
              setLightboxIndex((prev) =>
                lightboxMedia.length
                  ? (prev - 1 + lightboxMedia.length) % lightboxMedia.length
                  : 0,
              )
            }
            onNext={() =>
              setLightboxIndex((prev) =>
                lightboxMedia.length ? (prev + 1) % lightboxMedia.length : 0,
              )
            }
          />
        </div>,
        document.body,
      )
    : null;

  return (
    <>
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
              <div className="relative overflow-hidden border-b border-white/70 bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-4 pb-2 pt-2 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_30%)]" />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center min-w-0 gap-3">
                    <div className="relative">
                      {participantAvatar ? (
                        <img
                          src={participantAvatar}
                          alt={activeParticipant?.name || "Chat contact"}
                          className="object-cover w-12 h-12 rounded-full ring-2 ring-white/75"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/18 text-[16px] font-semibold text-white ring-2 ring-white/75">
                          {(activeParticipant?.name || "T")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                          activeParticipantPresence?.isOnline
                            ? "bg-emerald-400"
                            : "bg-zinc-400"
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold tracking-tight">
                        {activeParticipant?.name || "Tin nhắn mới"}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-white/80">
                        {formatLastSeenLabel(activeParticipantPresence)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsChatOpen(false)}
                      className="inline-flex items-center justify-center transition rounded-full cursor-pointer h-9 w-9 bg-white/12 text-white/85 hover:bg-white/18"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="theme-chat-body bg-[linear-gradient(180deg,rgba(251,251,252,0.88),rgba(245,247,255,0.92))] pl-2 py-4">
                <div
                  ref={messagesContainerRef}
                  className="chat-demo-scroll flex min-h-[360px] max-h-[320px] flex-col gap-3 overflow-y-auto pr-0.5"
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
                              {message?.image?.url ? (
                                isGifMessage(message) ? (
                                  <div
                                    className={`overflow-hidden rounded-[16px] border ${
                                      message?.text ? "mt-3" : "mt-0"
                                    } ${
                                      isOwnMessage
                                        ? "border-white/20"
                                        : "border-zinc-200/80"
                                    }`}
                                  >
                                    <img
                                      src={message.image.url}
                                      alt="Chat GIF"
                                      className="h-[140px] w-[140px] object-cover"
                                    />
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const media = getMessageImageMedia(message);
                                      if (media) {
                                        openLightbox([media], 0);
                                      }
                                    }}
                                    className={`block cursor-pointer overflow-hidden rounded-[16px] border ${
                                      message?.text ? "mt-3" : "mt-0"
                                    } ${
                                      isOwnMessage
                                        ? "border-white/20"
                                        : "border-zinc-200/80"
                                    }`}
                                  >
                                    <img
                                      src={message.image.url}
                                      alt="Chat attachment"
                                      className="h-[140px] w-[140px] object-cover transition hover:scale-[1.02]"
                                    />
                                  </button>
                                )
                              ) : null}
                              <p
                                className={`mt-2 text-[11px] ${
                                  isOwnMessage
                                    ? "text-white/70"
                                    : "text-zinc-400"
                                }`}
                              >
                                {formatMessageTime(message?.createdAt)}
                              </p>
                            </div>

                            {isOwnMessage &&
                            getMessageId(message) ===
                              getMessageId(latestOwnMessage) ? (
                              <p className="mt-1.5 px-1 text-[11px] font-medium text-zinc-400">
                                {latestOwnMessageStatus}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  ) : isSwitchingConversation ? (
                    <div className="flex min-h-[320px] items-center justify-center">
                      <div className="theme-card w-full rounded-[24px] border border-dashed border-zinc-200/90 bg-white/78 px-5 py-10 text-center shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
                        <div className="w-10 h-10 mx-auto border-2 rounded-full animate-spin border-violet-200 border-t-violet-500" />
                        <p className="mt-4 text-[14px] font-medium text-zinc-700">
                          Đang mở cuộc trò chuyện...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[320px] items-center justify-center">
                      <div className="theme-card w-full rounded-[24px] border border-dashed border-zinc-200/90 bg-white/78 px-5 py-10 text-center shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(102,126,234,0.14),rgba(118,75,162,0.18))] text-[#667eea]">
                          <MessageCircleMore className="w-6 h-6" />
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

              <div className="p-3 border-t theme-chat-composer border-zinc-200/70 bg-white/92">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageInputChange}
                  className="hidden"
                />

                <div className="relative">
                  <ChatComposerToolbar
                    emojiPickerOpen={emojiPickerOpen}
                    gifPickerOpen={gifPickerOpen}
                    onToggleEmojiPicker={handleToggleEmojiPicker}
                    onToggleGifPicker={handleToggleGifPicker}
                    onPickImage={handlePickImageClick}
                  />

                  <AnimatePresence>
                    {emojiPickerOpen ? (
                      <motion.div
                        ref={emojiPickerRef}
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute bottom-[calc(100%+8px)] left-0 z-20 overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-zinc-200/80"
                      >
                        <LazyEmojiPicker
                          onEmojiClick={handleEmojiSelect}
                          lazyLoadEmojis
                          previewConfig={{ showPreview: false }}
                          searchDisabled={false}
                          skinTonesDisabled
                          width={320}
                          height={380}
                          fallbackWidth={320}
                          fallbackHeight={380}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <AnimatePresence>
                    {gifPickerOpen ? (
                      <motion.div
                        ref={gifPickerRef}
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute bottom-[calc(100%+8px)] left-0 z-20 overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-zinc-200/80"
                      >
                        <div className="border-b border-zinc-200/70 px-3 py-3">
                          <input
                            type="text"
                            value={gifQuery}
                            onChange={(event) => setGifQuery(event.target.value)}
                            placeholder="Tìm GIF trên Giphy..."
                            className="w-full rounded-[14px] border border-zinc-200/80 bg-white px-3 py-2 text-[13px] text-zinc-700 outline-none placeholder:text-zinc-400"
                          />
                        </div>
                        <div className="h-[320px] w-[320px] overflow-y-auto px-2 py-2">
                          <LazyGiphyGrid
                            width={296}
                            columns={2}
                            gutter={8}
                            fetchGifs={fetchGifs}
                            key={gifQuery.trim() || "trending"}
                            onGifClick={(gif, event) => {
                              event.preventDefault();
                              handleSelectGif(gif);
                            }}
                            hideAttribution
                            noLink
                            fallbackWidth={296}
                            fallbackHeight={320}
                          />
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                {currentImageDraft?.previewUrl ? (
                  <ChatMediaPreview
                    previewUrl={currentImageDraft.previewUrl}
                    uploading={sending && !!currentImageDraft?.file}
                    onRemove={() => removeImageDraft(activeConversationId)}
                    onOpen={() =>
                      openLightbox(
                        [{ type: "image", url: currentImageDraft.previewUrl }],
                        0,
                      )
                    }
                  />
                ) : null}

                {!currentImageDraft?.previewUrl && currentGifDraft?.previewUrl ? (
                  <ChatMediaPreview
                    previewUrl={currentGifDraft.previewUrl}
                    uploading={sending && !!currentGifDraft?.gifUrl}
                    clickable={false}
                    onRemove={() => removeGifDraft(activeConversationId)}
                  />
                ) : null}

                {currentChatError ? (
                  <div className="mb-2 rounded-[16px] border border-rose-200 bg-rose-50/90 px-3 py-2 text-[12px] font-medium text-rose-600 shadow-[0_8px_18px_rgba(244,63,94,0.08)]">
                    {currentChatError}
                  </div>
                ) : null}

                <form
                  onSubmit={handleSubmitMessage}
                  className="flex items-end gap-2 rounded-[22px] border border-zinc-200/80 bg-white px-3 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
                >
                  <textarea
                    ref={composerRef}
                    value={currentDraft}
                    onFocus={() => {
                      void handleComposerFocus();
                    }}
                    onClick={() => {
                      void handleComposerFocus();
                    }}
                    onSelect={handleComposerSelect}
                    onChange={(event) => {
                      setChatErrorsByConversation((prev) => ({
                        ...prev,
                        [activeConversationId]: "",
                      }));
                      composerSelectionRef.current = {
                        start: event.target.selectionStart ?? event.target.value.length,
                        end: event.target.selectionEnd ?? event.target.value.length,
                      };
                      setDraftsByConversation((prev) => ({
                        ...prev,
                        [activeConversationId]: event.target.value,
                      }));
                    }}
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
                      (!currentDraft.trim() &&
                        !currentImageDraft?.file &&
                        !currentGifDraft?.gifUrl) ||
                      sending ||
                      !activeConversation ||
                      isSwitchingConversation
                    }
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-[0_10px_24px_rgba(102,126,234,0.22)] ${
                      (!currentDraft.trim() &&
                        !currentImageDraft?.file &&
                        !currentGifDraft?.gifUrl) ||
                      sending ||
                      !activeConversation ||
                      isSwitchingConversation
                        ? "cursor-not-allowed bg-zinc-300"
                        : "cursor-pointer bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)]"
                    }`}
                  >
                    <SendHorizonal className="w-4 h-4" />
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
                setIsChatDockVisible(false);
                setIsChatOpen(false);
              }}
              className="absolute -right-3 -top-3 z-20 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-white/85 bg-white text-[#667eea] opacity-0 shadow-[0_8px_18px_rgba(15,23,42,0.18)] transition duration-200 group-hover:opacity-100"
            >
              <X className="h-[11px] w-[11px]" strokeWidth={2.6} />
            </button>

            <span className="relative z-10 flex items-center justify-center w-full h-full">
              <MessageCircleMore
                className="h-[22px] w-[22px]"
                strokeWidth={2.2}
              />
            </span>
          </motion.div>
          )}
        </AnimatePresence>
      </div>

      {lightbox}
    </>
  );
}
