import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { GiphyFetch } from "@giphy/js-fetch-api";

import {
  tripApi,
  getTripUnavailableMessage,
  isTripUnavailableError,
} from "../../../../api/trip.api";
import { useToast } from "../../../../toast/useToast";
import { useAuth } from "../../../../auth/useAuth";
import LazyEmojiPicker from "../../../shared/LazyEmojiPicker";
import LazyGiphyGrid from "../../../shared/LazyGiphyGrid";
import {
  getInitials,
  formatFeedTime,
  getPrivacyLabel,
  formatMilestoneTime,
} from "../feed.utils";
import { SendIcon } from "../feed.icons";
import CommentComposerActionButton from "./CommentComposerActionButton";
import CommentComposerAvatar from "./CommentComposerAvatar";
import {
  CommentSmileIcon,
  CommentCameraIcon,
  CommentStickerIcon,
} from "./CommentComposerIcons";
import JourneyCommentCard from "./JourneyCommentCard";
import JourneyMediaGrid from "./JourneyMediaGrid";
import JourneyMediaLightbox from "./JourneyMediaLightbox";
import JourneyMetaChip from "./JourneyMetaChip";
import JourneySectionTitle from "./JourneySectionTitle";
import { normalizeMediaItems } from "./journeyMedia.utils";

const MAX_COMMENT_IMAGE_SIZE = 10 * 1024 * 1024;
const GIPHY_API_KEY = "1nkeWo3uBJD4LMdiMqEo8aHHkr4Lrxvq";
const gf = new GiphyFetch(GIPHY_API_KEY);

function getUserAvatar(user) {
  return (
    user?.avatarUrl ||
    user?.avatar ||
    user?.profile?.avatarUrl ||
    user?.profile?.avatar ||
    ""
  );
}

function CommentMediaDraftPreview({
  previewUrl,
  uploading = false,
  clickable = true,
  onRemove,
  onOpen,
}) {
  return (
    <div className="mb-3 rounded-[18px] border border-zinc-200/80 bg-white/90 p-2 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
      <div className="relative inline-flex overflow-hidden rounded-[14px] border border-zinc-200/80 bg-zinc-50">
        {clickable ? (
          <button
            type="button"
            onClick={onOpen}
            className="cursor-pointer transition hover:opacity-95"
          >
            <img
              src={previewUrl}
              alt="Comment media preview"
              className="h-[96px] w-[96px] object-cover"
            />
          </button>
        ) : (
          <img
            src={previewUrl}
            alt="Comment media preview"
            className="h-[96px] w-[96px] object-cover"
          />
        )}

        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/42 backdrop-blur-[1px]">
            <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-violet-200 border-t-violet-500 bg-white/78 shadow-[0_8px_18px_rgba(15,23,42,0.12)]" />
          </div>
        ) : null}

        <button
          type="button"
          aria-label="Remove comment media"
          onClick={onRemove}
          disabled={uploading}
          className={`absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-950/72 text-white shadow-[0_8px_18px_rgba(15,23,42,0.18)] transition hover:scale-105 hover:bg-zinc-950/84 ${
            uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function countReplyNodes(replies = []) {
  return replies.reduce(
    (total, reply) =>
      total +
      1 +
      countReplyNodes(Array.isArray(reply?.replies) ? reply.replies : []),
    0,
  );
}

function countReplyNodesUntilTarget(replies = [], targetCommentId = "") {
  if (!targetCommentId || !replies.length) {
    return { found: false, used: 0 };
  }

  let used = 0;

  for (const reply of replies) {
    used += 1;

    const replyId =
      typeof reply?._id === "string"
        ? reply._id
        : reply?._id?.toString?.() || "";

    if (replyId === targetCommentId) {
      return { found: true, used };
    }

    const childReplies = Array.isArray(reply?.replies) ? reply.replies : [];
    if (!childReplies.length) {
      continue;
    }

    const nestedResult = countReplyNodesUntilTarget(
      childReplies,
      targetCommentId,
    );
    if (nestedResult.found) {
      return {
        found: true,
        used: used + nestedResult.used,
      };
    }

    used += countReplyNodes(childReplies);
  }

  return { found: false, used };
}

export default function JourneyDetailOverlay({
  trip,
  detail,
  detailLoading,
  detailError,
  targetCommentId = "",
  targetThreadCommentId = "",
  commentCount: _commentCount,
  onCommentCreated,
  onCommentDeleted,
  onClose,
}) {
  const ownerName = trip.ownerId?.name || "Traveler";
  const initials = getInitials(ownerName);
  const ownerAvatar = getUserAvatar(trip.ownerId);
  const privacyLabel = getPrivacyLabel(trip.privacy);
  const caption = trip.caption?.trim() || "";

  const { user } = useAuth();
  const { showToast } = useToast();
  const currentUserId = user?._id?.toString?.() || user?.id?.toString?.() || "";
  const [commentText, setCommentText] = useState("");
  const [commentImageDraft, setCommentImageDraft] = useState(null);
  const [commentGifDraft, setCommentGifDraft] = useState(null);
  const [commentItems, setCommentItems] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyImageDraft, setReplyImageDraft] = useState(null);
  const [replyGifDraft, setReplyGifDraft] = useState(null);
  const [replySubmittingCommentId, setReplySubmittingCommentId] = useState("");
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingText, setEditingText] = useState("");
  const [editSubmittingCommentId, setEditSubmittingCommentId] = useState("");
  const [likingCommentId, setLikingCommentId] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState("");
  const [deleteConfirmComment, setDeleteConfirmComment] = useState(null);
  const [expandedReplyThreads, setExpandedReplyThreads] = useState({});
  const [visibleReplyCounts, setVisibleReplyCounts] = useState({});
  const [loadingReplyThreads, setLoadingReplyThreads] = useState({});
  const [commentsCursor, setCommentsCursor] = useState(null);
  const [commentsHasMore, setCommentsHasMore] = useState(false);
  const [commentsLoadingMore, setCommentsLoadingMore] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState("");
  const [commentEmojiPickerOpen, setCommentEmojiPickerOpen] = useState(false);
  const [commentGifPickerOpen, setCommentGifPickerOpen] = useState(false);
  const [commentGifQuery, setCommentGifQuery] = useState("");
  const [replyEmojiPickerOpen, setReplyEmojiPickerOpen] = useState(false);
  const [replyGifPickerOpen, setReplyGifPickerOpen] = useState(false);
  const [replyGifQuery, setReplyGifQuery] = useState("");
  const commentTextareaRef = useRef(null);
  const commentImageInputRef = useRef(null);
  const replyTextareaRef = useRef(null);
  const replyImageInputRef = useRef(null);
  const commentListEndRef = useRef(null);
  const overlayContentRef = useRef(null);
  const shouldScrollToNewestCommentRef = useRef(false);
  const commentsCursorRef = useRef(null);
  const commentsHasMoreRef = useRef(false);
  const focusRequestKeyRef = useRef("");
  const highlightTimeoutRef = useRef(0);
  const loadingReplyThreadsRef = useRef({});
  const hydratedReplyThreadsRef = useRef(new Set());
  const onCloseRef = useRef(onClose);
  const showToastRef = useRef(showToast);
  const commentEmojiPickerRef = useRef(null);
  const commentGifPickerRef = useRef(null);
  const commentSelectionRef = useRef({ start: 0, end: 0 });
  const replyEmojiPickerRef = useRef(null);
  const replyGifPickerRef = useRef(null);
  const replySelectionRef = useRef({ start: 0, end: 0 });

  const currentUserName =
    user?.name || user?.fullName || user?.username || "You";

  const currentUserInitials = getInitials(currentUserName);

  const currentUserAvatar =
    user?.avatarUrl ||
    user?.avatar ||
    user?.profile?.avatarUrl ||
    user?.profile?.avatar ||
    "";
  const [lightboxMedia, setLightboxMedia] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    commentsCursorRef.current = commentsCursor;
    commentsHasMoreRef.current = commentsHasMore;
  }, [commentsCursor, commentsHasMore]);

  useEffect(() => {
    loadingReplyThreadsRef.current = loadingReplyThreads;
  }, [loadingReplyThreads]);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    return () => {
      if (commentImageDraft?.previewUrl) {
        URL.revokeObjectURL(commentImageDraft.previewUrl);
      }
    };
  }, [commentImageDraft]);

  useEffect(() => {
    return () => {
      if (replyImageDraft?.previewUrl) {
        URL.revokeObjectURL(replyImageDraft.previewUrl);
      }
    };
  }, [replyImageDraft]);

  useEffect(() => {
    if (
      !commentEmojiPickerOpen &&
      !commentGifPickerOpen &&
      !replyEmojiPickerOpen &&
      !replyGifPickerOpen
    ) {
      return undefined;
    }

    function handlePointerDown(event) {
      const target = event.target;
      if (commentEmojiPickerRef.current?.contains(target)) return;
      if (commentGifPickerRef.current?.contains(target)) return;
      if (replyEmojiPickerRef.current?.contains(target)) return;
      if (replyGifPickerRef.current?.contains(target)) return;
      setCommentEmojiPickerOpen(false);
      setCommentGifPickerOpen(false);
      setReplyEmojiPickerOpen(false);
      setReplyGifPickerOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [
    commentEmojiPickerOpen,
    commentGifPickerOpen,
    replyEmojiPickerOpen,
    replyGifPickerOpen,
  ]);

  function resizeCommentTextarea() {
    const node = commentTextareaRef.current;
    if (!node) return;

    node.style.height = "auto";

    const nextHeight = Math.min(node.scrollHeight, 200);
    node.style.height = `${nextHeight}px`;
    node.style.overflowY = node.scrollHeight > 200 ? "auto" : "hidden";
  }

  function clearCommentImageDraft() {
    setCommentImageDraft((prev) => {
      if (prev?.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return null;
    });

    if (commentImageInputRef.current) {
      commentImageInputRef.current.value = "";
    }
  }

  function clearCommentGifDraft() {
    setCommentGifDraft(null);
  }

  function clearReplyImageDraft() {
    setReplyImageDraft((prev) => {
      if (prev?.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return null;
    });

    if (replyImageInputRef.current) {
      replyImageInputRef.current.value = "";
    }
  }

  function clearReplyGifDraft() {
    setReplyGifDraft(null);
  }

  function handleCommentComposerSelect(event) {
    commentSelectionRef.current = {
      start: event.target.selectionStart ?? 0,
      end: event.target.selectionEnd ?? 0,
    };
  }

  function handleReplyComposerSelect(event) {
    replySelectionRef.current = {
      start: event.target.selectionStart ?? 0,
      end: event.target.selectionEnd ?? 0,
    };
  }

  function handleToggleCommentEmojiPicker() {
    setCommentEmojiPickerOpen((prev) => !prev);
    setCommentGifPickerOpen(false);
    commentTextareaRef.current?.focus();
  }

  function handleToggleCommentGifPicker() {
    setCommentGifPickerOpen((prev) => !prev);
    setCommentEmojiPickerOpen(false);
  }

  function handleToggleReplyEmojiPicker() {
    setReplyEmojiPickerOpen((prev) => !prev);
    setReplyGifPickerOpen(false);
    replyTextareaRef.current?.focus();
  }

  function handleToggleReplyGifPicker() {
    setReplyGifPickerOpen((prev) => !prev);
    setReplyEmojiPickerOpen(false);
  }

  function handleCommentEmojiSelect(emojiData) {
    const emoji = emojiData?.emoji || "";
    if (!emoji) return;

    const textarea = commentTextareaRef.current;
    const currentValue = commentText || "";
    const selectionStart =
      textarea?.selectionStart ??
      commentSelectionRef.current.start ??
      currentValue.length;
    const selectionEnd =
      textarea?.selectionEnd ?? commentSelectionRef.current.end ?? selectionStart;
    const nextValue =
      currentValue.slice(0, selectionStart) +
      emoji +
      currentValue.slice(selectionEnd);
    const nextCaretPosition = selectionStart + emoji.length;

    setCommentText(nextValue);
    commentSelectionRef.current = {
      start: nextCaretPosition,
      end: nextCaretPosition,
    };

    window.requestAnimationFrame(() => {
      resizeCommentTextarea();
      const nextTextarea = commentTextareaRef.current;
      if (!nextTextarea) return;
      nextTextarea.focus();
      nextTextarea.setSelectionRange(nextCaretPosition, nextCaretPosition);
    });
  }

  function handleReplyEmojiSelect(emojiData) {
    const emoji = emojiData?.emoji || "";
    if (!emoji) return;

    const textarea = replyTextareaRef.current;
    const currentValue = replyText || "";
    const selectionStart =
      textarea?.selectionStart ??
      replySelectionRef.current.start ??
      currentValue.length;
    const selectionEnd =
      textarea?.selectionEnd ?? replySelectionRef.current.end ?? selectionStart;
    const nextValue =
      currentValue.slice(0, selectionStart) +
      emoji +
      currentValue.slice(selectionEnd);
    const nextCaretPosition = selectionStart + emoji.length;

    setReplyText(nextValue);
    replySelectionRef.current = {
      start: nextCaretPosition,
      end: nextCaretPosition,
    };

    window.requestAnimationFrame(() => {
      const nextTextarea = replyTextareaRef.current;
      if (!nextTextarea) return;
      nextTextarea.focus();
      nextTextarea.setSelectionRange(nextCaretPosition, nextCaretPosition);
    });
  }

  function fetchCommentGifs(offset) {
    if (commentGifQuery.trim()) {
      return gf.search(commentGifQuery.trim(), {
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

  function fetchReplyGifs(offset) {
    if (replyGifQuery.trim()) {
      return gf.search(replyGifQuery.trim(), {
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

  function handleSelectCommentGif(gif) {
    if (!gif?.images) return;

    const previewUrl =
      gif.images.fixed_width?.url ||
      gif.images.preview_gif?.url ||
      gif.images.original?.url ||
      "";
    const gifUrl =
      gif.images.original?.url || gif.images.fixed_width?.url || previewUrl;

    if (!gifUrl || !previewUrl) return;

    setCommentGifDraft({
      gifUrl,
      previewUrl,
      width:
        Number(gif.images.original?.width || gif.images.fixed_width?.width) || null,
      height:
        Number(gif.images.original?.height || gif.images.fixed_width?.height) ||
        null,
    });
    clearCommentImageDraft();
    setCommentGifPickerOpen(false);
  }

  function handleSelectReplyGif(gif) {
    if (!gif?.images) return;

    const previewUrl =
      gif.images.fixed_width?.url ||
      gif.images.preview_gif?.url ||
      gif.images.original?.url ||
      "";
    const gifUrl =
      gif.images.original?.url || gif.images.fixed_width?.url || previewUrl;

    if (!gifUrl || !previewUrl) return;

    setReplyGifDraft({
      gifUrl,
      previewUrl,
      width:
        Number(gif.images.original?.width || gif.images.fixed_width?.width) || null,
      height:
        Number(gif.images.original?.height || gif.images.fixed_width?.height) ||
        null,
    });
    clearReplyImageDraft();
    setReplyGifPickerOpen(false);
  }

  function handlePickCommentImage() {
    commentImageInputRef.current?.click();
  }

  function handlePickReplyImage() {
    replyImageInputRef.current?.click();
  }

  function handleCommentImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setCommentsError("Chỉ được chọn file ảnh cho comment.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_COMMENT_IMAGE_SIZE) {
      setCommentsError("Ảnh comment quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB.");
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setCommentsError("");
    clearCommentGifDraft();
    setCommentImageDraft((prev) => {
      if (prev?.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return { file, previewUrl };
    });
  }

  function handleReplyImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setCommentsError("Chỉ được chọn file ảnh cho reply.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_COMMENT_IMAGE_SIZE) {
      setCommentsError("Ảnh reply quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB.");
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setCommentsError("");
    clearReplyGifDraft();
    setReplyImageDraft((prev) => {
      if (prev?.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return { file, previewUrl };
    });
  }

  function openLightbox(media, index = 0) {
    const safeItems = normalizeMediaItems(media);
    if (!safeItems.length) return;

    const safeIndex = Math.min(Math.max(index, 0), safeItems.length - 1);
    setLightboxMedia(safeItems);
    setLightboxIndex(safeIndex);
  }

  function closeLightbox() {
    setLightboxMedia([]);
    setLightboxIndex(0);
  }

  const showPrevLightboxItem = useCallback(() => {
    setLightboxIndex((prev) =>
      lightboxMedia.length
        ? (prev - 1 + lightboxMedia.length) % lightboxMedia.length
        : 0,
    );
  }, [lightboxMedia.length]);

  const showNextLightboxItem = useCallback(() => {
    setLightboxIndex((prev) =>
      lightboxMedia.length ? (prev + 1) % lightboxMedia.length : 0,
    );
  }, [lightboxMedia.length]);

  const handleTripUnavailable = useCallback((error) => {
    setCommentsError("");
    showToastRef.current?.(
      getTripUnavailableMessage(error, "Không tải được comment lúc này."),
      "warning",
    );
    onCloseRef.current?.();
  }, []);

  function getSafeListKey(item, index, prefix = "item") {
    const rawId =
      typeof item?._id === "string" ? item._id.trim() : item?._id?.toString?.();

    if (rawId) return `${prefix}-${rawId}`;

    const publicId =
      typeof item?.publicId === "string" ? item.publicId.trim() : "";
    if (publicId) return `${prefix}-${publicId}`;

    const url = typeof item?.url === "string" ? item.url.trim() : "";
    if (url) return `${prefix}-${url}-${index}`;

    const createdAt =
      typeof item?.createdAt === "string" ? item.createdAt.trim() : "";
    if (createdAt) return `${prefix}-${createdAt}-${index}`;

    const content =
      typeof item?.content === "string" ? item.content.trim() : "";
    if (content) return `${prefix}-${content.slice(0, 24)}-${index}`;

    return `${prefix}-fallback-${index}`;
  }

  useEffect(() => {
    resizeCommentTextarea();
  }, [commentText]);

  useEffect(() => {
    setReplyingToCommentId("");
    setReplyTarget(null);
    setReplyText("");
    setReplySubmittingCommentId("");
    setEditingCommentId("");
    setEditingText("");
    setEditSubmittingCommentId("");
    setLikingCommentId("");
    setDeletingCommentId("");
    setDeleteConfirmComment(null);
    setExpandedReplyThreads({});
    setVisibleReplyCounts({});
    setLoadingReplyThreads({});
    loadingReplyThreadsRef.current = {};
    hydratedReplyThreadsRef.current = new Set();
    setHighlightedCommentId("");
    focusRequestKeyRef.current = "";
  }, [trip?._id]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = 0;
      }
    };
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        if (lightboxMedia.length) {
          closeLightbox();
          return;
        }

        onClose();
        return;
      }

      if (!lightboxMedia.length) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        showPrevLightboxItem();
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        showNextLightboxItem();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    lightboxMedia.length,
    onClose,
    showNextLightboxItem,
    showPrevLightboxItem,
  ]);

  useEffect(() => {
    if (!trip?._id || !detail || detailLoading || detailError) return;

    let ignore = false;

    async function loadComments() {
      try {
        setCommentsLoading(true);
        setCommentsError("");

        const res = await tripApi.listComments(trip._id, { limit: 20 });

        if (ignore) return;

        const initialComments = Array.isArray(res.data?.comments)
          ? res.data.comments
          : [];

        setCommentItems(initialComments);
        setCommentsCursor(res.data?.page?.nextCursor || null);
        setCommentsHasMore(!!res.data?.page?.hasMore);
      } catch (err) {
        if (ignore) return;

        if (isTripUnavailableError(err)) {
          handleTripUnavailable(err);
          return;
        }

        setCommentsError(
          err?.response?.data?.message || "Không tải được comment lúc này.",
        );
      } finally {
        if (!ignore) setCommentsLoading(false);
      }
    }

    loadComments();

    return () => {
      ignore = true;
    };
  }, [trip?._id, detail, detailLoading, detailError, handleTripUnavailable]);

  useEffect(() => {
    if (!targetCommentId) {
      focusRequestKeyRef.current = "";
    }
  }, [targetCommentId, targetThreadCommentId]);

  useEffect(() => {
    if (!shouldScrollToNewestCommentRef.current) return;

    shouldScrollToNewestCommentRef.current = false;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        commentListEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });
    });
  }, [commentItems.length]);

  async function handleLoadMoreComments() {
    if (
      !trip?._id ||
      !commentsHasMore ||
      !commentsCursor ||
      commentsLoadingMore
    ) {
      return;
    }

    try {
      setCommentsLoadingMore(true);
      setCommentsError("");

      const res = await tripApi.listComments(trip._id, {
        limit: 20,
        cursor: commentsCursor,
      });

      const olderComments = Array.isArray(res.data?.comments)
        ? res.data.comments
        : [];

      setCommentItems((prev) => [...olderComments, ...prev]);
      setCommentsCursor(res.data?.page?.nextCursor || null);
      setCommentsHasMore(!!res.data?.page?.hasMore);
    } catch (err) {
      if (isTripUnavailableError(err)) {
        handleTripUnavailable(err);
        return;
      }

      setCommentsError(
        err?.response?.data?.message || "Không tải thêm comment được.",
      );
    } finally {
      setCommentsLoadingMore(false);
    }
  }

  function scrollToComment(targetId) {
    if (!targetId) return false;

    const escapedId =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(targetId)
        : targetId.replace(/["\\]/g, "\\$&");

    const targetNode = overlayContentRef.current?.querySelector(
      `[data-comment-anchor-id="${escapedId}"]`,
    );

    if (!targetNode) return false;

    targetNode.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    return true;
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (
      !trip?._id ||
      !detail ||
      detailLoading ||
      detailError ||
      commentsLoading ||
      !targetCommentId
    ) {
      return undefined;
    }

    const requestKey = [
      trip._id,
      targetCommentId,
      targetThreadCommentId || targetCommentId,
    ].join(":");

    if (focusRequestKeyRef.current === requestKey) {
      return undefined;
    }

    let cancelled = false;

    async function focusTargetComment() {
      const threadId = targetThreadCommentId || targetCommentId;
      let workingItems = commentItems;
      let threadComment = findCommentInTree(workingItems, threadId);
      let pageLoads = 0;

      while (
        !threadComment &&
        commentsHasMoreRef.current &&
        commentsCursorRef.current &&
        pageLoads < 6 &&
        !cancelled
      ) {
        try {
          const res = await tripApi.listComments(trip._id, {
            limit: 20,
            cursor: commentsCursorRef.current,
          });

          if (cancelled) return;

          const olderComments = Array.isArray(res.data?.comments)
            ? res.data.comments
            : [];

          if (!olderComments.length) {
            commentsCursorRef.current = null;
            commentsHasMoreRef.current = false;
            setCommentsCursor(null);
            setCommentsHasMore(false);
            break;
          }

          workingItems = [...olderComments, ...workingItems];
          threadComment = findCommentInTree(workingItems, threadId);

          const nextCursor = res.data?.page?.nextCursor || null;
          const nextHasMore = !!res.data?.page?.hasMore;

          commentsCursorRef.current = nextCursor;
          commentsHasMoreRef.current = nextHasMore;
          setCommentsCursor(nextCursor);
          setCommentsHasMore(nextHasMore);
          setCommentItems((prev) => [...olderComments, ...prev]);

          pageLoads += 1;
        } catch {
          break;
        }
      }

      if (cancelled) return;

      if (threadId && threadId !== targetCommentId && threadComment) {
        setExpandedReplyThreads((prev) => ({
          ...prev,
          [threadId]: true,
        }));

        await new Promise((resolve) => {
          window.requestAnimationFrame(() => resolve());
        });

        const replyLoadResult = await loadRepliesForComment(threadId, {
          force: true,
        });

        if (replyLoadResult?.ok) {
          workingItems = replaceRepliesInTree(
            workingItems,
            threadId,
            Array.isArray(replyLoadResult.nextReplies)
              ? replyLoadResult.nextReplies
              : [],
          );
          threadComment = findCommentInTree(workingItems, threadId);
        }

        const requiredVisibleReplies = Math.max(
          10,
          countReplyNodesUntilTarget(
            Array.isArray(threadComment?.replies) ? threadComment.replies : [],
            targetCommentId,
          ).used || 0,
        );

        setVisibleReplyCounts((prev) => ({
          ...prev,
          [threadId]: Math.max(prev[threadId] || 0, requiredVisibleReplies),
        }));
      }

      if (cancelled) return;

      let attempts = 0;
      const maxAttempts = 6;

      function attemptScroll() {
        if (cancelled) return;
        attempts += 1;

        const didScroll = scrollToComment(targetCommentId);
        if (didScroll) {
          if (highlightTimeoutRef.current) {
            window.clearTimeout(highlightTimeoutRef.current);
          }

          setHighlightedCommentId(targetCommentId);
          highlightTimeoutRef.current = window.setTimeout(() => {
            setHighlightedCommentId((prev) =>
              prev === targetCommentId ? "" : prev,
            );
          }, 3200);
          focusRequestKeyRef.current = requestKey;
          return;
        }

        if (attempts >= maxAttempts) {
          return;
        }

        window.requestAnimationFrame(attemptScroll);
      }

      window.requestAnimationFrame(attemptScroll);
    }

    focusTargetComment();

    return () => {
      cancelled = true;
    };
  }, [
    commentItems,
    commentsLoading,
    detail,
    detailError,
    detailLoading,
    targetCommentId,
    targetThreadCommentId,
    trip?._id,
  ]);
  /* eslint-enable react-hooks/exhaustive-deps */

  async function handleSubmitComment(e) {
    e.preventDefault();

    const content = commentText.trim();
    if (
      (!content && !commentImageDraft?.file && !commentGifDraft?.gifUrl) ||
      commentSubmitting ||
      !trip?._id
    ) {
      return;
    }

    try {
      setCommentSubmitting(true);
      setCommentsError("");

      const res = commentImageDraft?.file
        ? await (() => {
            const formData = new FormData();
            formData.append("image", commentImageDraft.file);
            if (content) {
              formData.append("content", content);
            }
            return tripApi.createCommentImage(trip._id, formData);
          })()
        : commentGifDraft?.gifUrl
          ? await tripApi.createCommentGif(trip._id, {
              content,
              gifUrl: commentGifDraft.gifUrl,
              width: commentGifDraft.width,
              height: commentGifDraft.height,
            })
          : await tripApi.createComment(trip._id, { content });
      const createdComment = res.data?.comment;

      if (!createdComment) {
        throw new Error("Missing created comment");
      }

      shouldScrollToNewestCommentRef.current = true;
      setCommentItems((prev) => [...prev, createdComment]);
      setCommentText("");
      setCommentEmojiPickerOpen(false);
      setCommentGifPickerOpen(false);
      clearCommentImageDraft();
      clearCommentGifDraft();
      onCommentCreated?.(createdComment);
    } catch (err) {
      if (isTripUnavailableError(err)) {
        handleTripUnavailable(err);
        return;
      }

      setCommentsError(
        err?.response?.data?.message || "Gửi comment thất bại. Thử lại nhé.",
      );
    } finally {
      setCommentSubmitting(false);
    }
  }

  function getCommentId(comment) {
    if (!comment) return "";
    if (typeof comment?._id === "string") return comment._id;
    return comment?._id?.toString?.() || "";
  }

  function getCommentAuthor(comment) {
    return comment?.userId || comment?.user || null;
  }

  function getCommentAuthorId(comment) {
    const author = getCommentAuthor(comment);
    if (!author) return "";
    if (typeof author === "string") return author;
    return author?._id?.toString?.() || author?.id?.toString?.() || "";
  }

  function getCommentAuthorName(comment) {
    return getCommentAuthor(comment)?.name?.trim?.() || "";
  }

  function findCommentInTree(items, targetCommentId) {
    for (const comment of items) {
      if (getCommentId(comment) === targetCommentId) {
        return comment;
      }

      const childReplies = Array.isArray(comment?.replies)
        ? comment.replies
        : [];
      if (!childReplies.length) continue;

      const nestedComment = findCommentInTree(childReplies, targetCommentId);
      if (nestedComment) {
        return nestedComment;
      }
    }

    return null;
  }

  function areRepliesLoaded(comment) {
    if (!comment) return false;

    const replyCount = Math.max(0, Number(comment?.replyCount || 0));
    const replies = Array.isArray(comment?.replies) ? comment.replies : [];

    return replyCount === 0 || replies.length > 0;
  }

  function replaceRepliesInTree(items, targetCommentId, nextReplies) {
    let didChange = false;

    const mappedItems = items.map((comment) => {
      const commentId = getCommentId(comment);

      if (commentId === targetCommentId) {
        didChange = true;
        return {
          ...comment,
          replies: nextReplies,
          replyCount: Math.max(
            Number(comment?.replyCount || 0),
            countReplyNodes(nextReplies),
          ),
        };
      }

      const childReplies = Array.isArray(comment?.replies)
        ? comment.replies
        : [];
      if (!childReplies.length) {
        return comment;
      }

      const updatedReplies = replaceRepliesInTree(
        childReplies,
        targetCommentId,
        nextReplies,
      );

      if (updatedReplies === childReplies) {
        return comment;
      }

      didChange = true;
      return {
        ...comment,
        replies: updatedReplies,
      };
    });

    return didChange ? mappedItems : items;
  }

  async function loadRepliesForComment(commentId, { force = false } = {}) {
    if (!commentId || loadingReplyThreadsRef.current[commentId]) {
      return { ok: false, nextReplies: [] };
    }

    const targetComment = findCommentInTree(commentItems, commentId);
    if (!targetComment && !force) {
      return { ok: false, nextReplies: [] };
    }

    if (
      hydratedReplyThreadsRef.current.has(commentId) ||
      (!force && targetComment && areRepliesLoaded(targetComment))
    ) {
      return {
        ok: true,
        nextReplies: Array.isArray(targetComment?.replies)
          ? targetComment.replies
          : [],
      };
    }

    try {
      loadingReplyThreadsRef.current = {
        ...loadingReplyThreadsRef.current,
        [commentId]: true,
      };
      setLoadingReplyThreads((prev) => ({
        ...prev,
        [commentId]: true,
      }));
      setCommentsError("");

      const res = await tripApi.listCommentReplies(commentId);
      const nextReplies = Array.isArray(res.data?.replies)
        ? res.data.replies
        : [];

      setCommentItems((prev) =>
        replaceRepliesInTree(prev, commentId, nextReplies),
      );
      hydratedReplyThreadsRef.current.add(commentId);

      return {
        ok: true,
        nextReplies,
      };
    } catch (err) {
      if (isTripUnavailableError(err)) {
        handleTripUnavailable(err);
        return { ok: false, nextReplies: [] };
      }

      setCommentsError(
        err?.response?.data?.message || "Không tải phản hồi được lúc này.",
      );
      return { ok: false, nextReplies: [] };
    } finally {
      const nextLoadingMap = { ...loadingReplyThreadsRef.current };
      delete nextLoadingMap[commentId];
      loadingReplyThreadsRef.current = nextLoadingMap;

      setLoadingReplyThreads((prev) => {
        if (!prev[commentId]) return prev;
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
    }
  }

  async function handleExpandReplies(commentId) {
    if (!commentId) return;

    setExpandedReplyThreads((prev) => {
      if (prev[commentId]) return prev;
      return {
        ...prev,
        [commentId]: true,
      };
    });

    setVisibleReplyCounts((prev) => ({
      ...prev,
      [commentId]: Math.max(prev[commentId] || 0, 10),
    }));

    await loadRepliesForComment(commentId);
  }

  async function handleLoadMoreReplies(commentId, totalReplies = 0) {
    if (!commentId) return;

    setExpandedReplyThreads((prev) => ({
      ...prev,
      [commentId]: true,
    }));

    setVisibleReplyCounts((prev) => ({
      ...prev,
      [commentId]: Math.min((prev[commentId] || 10) + 10, totalReplies || 10),
    }));

    await loadRepliesForComment(commentId);
  }

  function appendReplyToTree(items, parentCommentId, createdReply) {
    let didChange = false;

    const nextItems = items.map((comment) => {
      const currentId = getCommentId(comment);

      if (currentId === parentCommentId) {
        didChange = true;
        const nextReplies = Array.isArray(comment?.replies)
          ? [...comment.replies, createdReply]
          : [createdReply];

        return {
          ...comment,
          replies: nextReplies,
          replyCount: Number(comment?.replyCount || 0) + 1,
        };
      }

      const existingReplies = Array.isArray(comment?.replies)
        ? comment.replies
        : [];
      if (!existingReplies.length) {
        return comment;
      }

      const nextReplies = appendReplyToTree(
        existingReplies,
        parentCommentId,
        createdReply,
      );

      if (nextReplies === existingReplies) {
        return comment;
      }

      didChange = true;

      return {
        ...comment,
        replies: nextReplies,
        replyCount: Number(comment?.replyCount || 0) + 1,
      };
    });

    return didChange ? nextItems : items;
  }

  function updateCommentInTree(items, updatedComment) {
    const updatedCommentId = getCommentId(updatedComment);
    let didChange = false;

    const nextItems = items.map((comment) => {
      const currentId = getCommentId(comment);

      if (currentId === updatedCommentId) {
        didChange = true;
        return {
          ...comment,
          ...updatedComment,
          replies: Array.isArray(comment?.replies) ? comment.replies : [],
          replyCount: Number.isFinite(comment?.replyCount)
            ? comment.replyCount
            : Array.isArray(comment?.replies)
              ? comment.replies.length
              : 0,
        };
      }

      const existingReplies = Array.isArray(comment?.replies)
        ? comment.replies
        : [];
      if (!existingReplies.length) {
        return comment;
      }

      const nextReplies = updateCommentInTree(existingReplies, updatedComment);

      if (nextReplies === existingReplies) {
        return comment;
      }

      didChange = true;

      return {
        ...comment,
        replies: nextReplies,
      };
    });

    return didChange ? nextItems : items;
  }

  function removeCommentFromTree(items, targetCommentId) {
    let removedCount = 0;

    function walk(list) {
      const nextItems = [];

      list.forEach((comment) => {
        const commentId = getCommentId(comment);
        const childReplies = Array.isArray(comment?.replies)
          ? comment.replies
          : [];

        if (commentId === targetCommentId) {
          removedCount += 1 + countReplyNodes(childReplies);
          return;
        }

        const nextReplies = childReplies.length
          ? walk(childReplies)
          : childReplies;

        nextItems.push({
          ...comment,
          replies: nextReplies,
          replyCount: countReplyNodes(nextReplies),
        });
      });

      return nextItems;
    }

    return {
      items: walk(items),
      removedCount,
    };
  }

  function updateCommentLikeInTree(
    items,
    targetCommentId,
    nextLiked,
    nextCount,
  ) {
    let didChange = false;

    const nextItems = items.map((comment) => {
      const commentId = getCommentId(comment);

      if (commentId === targetCommentId) {
        didChange = true;
        return {
          ...comment,
          liked: nextLiked,
          likeCount: Math.max(0, Number(nextCount || 0)),
        };
      }

      const childReplies = Array.isArray(comment?.replies)
        ? comment.replies
        : [];
      if (!childReplies.length) {
        return comment;
      }

      const nextReplies = updateCommentLikeInTree(
        childReplies,
        targetCommentId,
        nextLiked,
        nextCount,
      );

      if (nextReplies === childReplies) {
        return comment;
      }

      didChange = true;
      return {
        ...comment,
        replies: nextReplies,
      };
    });

    return didChange ? nextItems : items;
  }

  function handleToggleReply(targetComment = null) {
    const commentId = getCommentId(targetComment);
    if (!commentId) return;

    const nextTarget = {
      userId: getCommentAuthorId(targetComment),
      name: getCommentAuthorName(targetComment),
    };

    const isSameTarget =
      replyingToCommentId === commentId &&
      (replyTarget?.userId || "") === (nextTarget?.userId || "");

    if (isSameTarget) {
      setReplyingToCommentId("");
      setReplyTarget(null);
      setReplyText("");
      clearReplyImageDraft();
      clearReplyGifDraft();
      setReplyEmojiPickerOpen(false);
      setReplyGifPickerOpen(false);
      return;
    }

    setReplyingToCommentId(commentId);
    setReplyTarget(nextTarget);
    setReplyText("");
    clearReplyImageDraft();
    clearReplyGifDraft();
    setReplyEmojiPickerOpen(false);
    setReplyGifPickerOpen(false);
    setEditingCommentId("");
    setEditingText("");
  }

  function handleStartEditing(targetComment = null) {
    const commentId = getCommentId(targetComment);
    if (!commentId) return;

    const nextContent =
      typeof targetComment?.content === "string" ? targetComment.content : "";

    setEditingCommentId(commentId);
    setEditingText(nextContent);
    setReplyingToCommentId("");
    setReplyTarget(null);
    setReplyText("");
    clearReplyImageDraft();
    clearReplyGifDraft();
    setReplyEmojiPickerOpen(false);
    setReplyGifPickerOpen(false);
  }

  function handleCancelEditing() {
    setEditingCommentId("");
    setEditingText("");
  }

  function handleRequestDelete(targetComment = null) {
    const commentId = getCommentId(targetComment);
    if (!commentId) return;

    setReplyingToCommentId("");
    setReplyTarget(null);
    setReplyText("");
    clearReplyImageDraft();
    clearReplyGifDraft();
    setReplyEmojiPickerOpen(false);
    setReplyGifPickerOpen(false);
    setEditingCommentId("");
    setEditingText("");
    setDeleteConfirmComment(targetComment);
  }

  function handleCancelDelete() {
    if (deletingCommentId) return;
    setDeleteConfirmComment(null);
  }

  async function handleToggleCommentLike(targetComment = null) {
    const commentId = getCommentId(targetComment);
    if (!commentId || likingCommentId) {
      return;
    }

    try {
      setLikingCommentId(commentId);
      setCommentsError("");

      const res = await tripApi.toggleCommentReaction(commentId);
      const nextLiked = !!res.data?.liked;
      const nextCount = Math.max(0, Number(res.data?.count || 0));

      setCommentItems((prev) =>
        updateCommentLikeInTree(prev, commentId, nextLiked, nextCount),
      );
    } catch (err) {
      if (isTripUnavailableError(err)) {
        handleTripUnavailable(err);
        return;
      }

      const nextMessage =
        err?.response?.data?.message ||
        "Cập nhật lượt thích bình luận thất bại.";

      setCommentsError(nextMessage);
      showToastRef.current?.(nextMessage, "error");
    } finally {
      setLikingCommentId("");
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();

    const commentId = editingCommentId;
    const content = editingText.trim();

    if (!commentId || !content || editSubmittingCommentId) {
      return;
    }

    try {
      setEditSubmittingCommentId(commentId);
      setCommentsError("");

      const res = await tripApi.updateComment(commentId, { content });
      const updatedComment = res.data?.comment;

      if (!updatedComment) {
        throw new Error("Missing updated comment");
      }

      setCommentItems((prev) => updateCommentInTree(prev, updatedComment));
      setEditingCommentId("");
      setEditingText("");
      showToast("Đã cập nhật bình luận.", "success");
    } catch (err) {
      if (isTripUnavailableError(err)) {
        handleTripUnavailable(err);
        return;
      }

      const nextMessage =
        err?.response?.data?.message ||
        "Cập nhật bình luận thất bại. Thử lại nhé.";

      setCommentsError(nextMessage);
      showToast(nextMessage, "error");
    } finally {
      setEditSubmittingCommentId("");
    }
  }

  async function handleSubmitReply(commentId) {
    const content = replyText.trim();

    if (
      (!content && !replyImageDraft?.file && !replyGifDraft?.gifUrl) ||
      !trip?._id ||
      !commentId ||
      replySubmittingCommentId
    ) {
      return;
    }

    try {
      setReplySubmittingCommentId(commentId);
      setCommentsError("");

      const res = replyImageDraft?.file
        ? await (() => {
            const formData = new FormData();
            formData.append("image", replyImageDraft.file);
            formData.append("parentCommentId", commentId);
            if (content) {
              formData.append("content", content);
            }
            return tripApi.createCommentImage(trip._id, formData);
          })()
        : replyGifDraft?.gifUrl
          ? await tripApi.createCommentGif(trip._id, {
              content,
              parentCommentId: commentId,
              gifUrl: replyGifDraft.gifUrl,
              width: replyGifDraft.width,
              height: replyGifDraft.height,
            })
          : await tripApi.createComment(trip._id, {
              content,
              parentCommentId: commentId,
            });

      const createdReply = res.data?.comment;

      if (!createdReply) {
        throw new Error("Missing created reply");
      }

      const targetComment = findCommentInTree(commentItems, commentId);
      const shouldRefreshReplies =
        !targetComment || areRepliesLoaded(targetComment);

      if (shouldRefreshReplies) {
        setCommentItems((prev) =>
          appendReplyToTree(prev, commentId, createdReply),
        );
      } else {
        await loadRepliesForComment(commentId, { force: true });
      }

      setExpandedReplyThreads((prev) => ({
        ...prev,
        [commentId]: true,
      }));
      setVisibleReplyCounts((prev) => ({
        ...prev,
        [commentId]: Math.max(prev[commentId] || 0, 10),
      }));

      setReplyText("");
      setReplyingToCommentId("");
      setReplyTarget(null);
      clearReplyImageDraft();
      clearReplyGifDraft();
      setReplyEmojiPickerOpen(false);
      setReplyGifPickerOpen(false);
      onCommentCreated?.(createdReply);
    } catch (err) {
      if (isTripUnavailableError(err)) {
        handleTripUnavailable(err);
        return;
      }

      setCommentsError(
        err?.response?.data?.message || "Gửi reply thất bại. Thử lại nhé.",
      );
    } finally {
      setReplySubmittingCommentId("");
    }
  }

  async function handleConfirmDelete() {
    const commentId = getCommentId(deleteConfirmComment);
    if (!commentId || deletingCommentId) {
      return;
    }

    try {
      setDeletingCommentId(commentId);
      setCommentsError("");

      const res = await tripApi.deleteComment(commentId);
      const deletedCommentId = res.data?.deletedCommentId || commentId;
      const deletedCount = Number(res.data?.deletedCount || 0);

      setCommentItems((prev) => {
        const nextState = removeCommentFromTree(prev, deletedCommentId);

        if (nextState.removedCount > 0) {
          return nextState.items;
        }

        return prev;
      });

      setExpandedReplyThreads((prev) => {
        if (!Object.keys(prev).length) return prev;
        const next = { ...prev };
        delete next[deletedCommentId];
        return next;
      });

      setVisibleReplyCounts((prev) => {
        if (!Object.keys(prev).length) return prev;
        const next = { ...prev };
        delete next[deletedCommentId];
        return next;
      });

      setLoadingReplyThreads((prev) => {
        if (!Object.keys(prev).length) return prev;
        const next = { ...prev };
        delete next[deletedCommentId];
        return next;
      });

      if (replyingToCommentId && replyingToCommentId === deletedCommentId) {
        setReplyingToCommentId("");
        setReplyTarget(null);
        setReplyText("");
      }

      if (editingCommentId && editingCommentId === deletedCommentId) {
        setEditingCommentId("");
        setEditingText("");
      }

      setDeleteConfirmComment(null);
      onCommentDeleted?.(deletedCount || 1);
      showToastRef.current?.(
        deletedCount > 1
          ? "Đã xoá bình luận và các phản hồi."
          : "Đã xoá bình luận.",
        "success",
      );
    } catch (err) {
      if (isTripUnavailableError(err)) {
        handleTripUnavailable(err);
        return;
      }

      const nextMessage =
        err?.response?.data?.message || "Xoá bình luận thất bại. Thử lại nhé.";

      setCommentsError(nextMessage);
      showToastRef.current?.(nextMessage, "error");
    } finally {
      setDeletingCommentId("");
    }
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[120] flex min-h-screen items-stretch justify-center p-0 sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label="Close overlay"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-pointer bg-transparent sm:bg-zinc-950/45 sm:backdrop-blur-[6px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.985 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-[1] flex h-screen max-h-screen w-full max-w-none flex-col overflow-hidden rounded-none border-0 bg-[linear-gradient(180deg,#ffffff,#fbfbff)] shadow-none sm:h-auto sm:max-h-[95vh] sm:max-w-5xl sm:rounded-[32px] sm:border sm:border-white/70 sm:shadow-[0_30px_80px_rgba(15,23,42,0.28)]"
      >
        <div className="px-4 py-3 border-b border-zinc-100 sm:px-6 sm:py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center min-w-0 gap-3">
              {ownerAvatar ? (
                <img
                  src={ownerAvatar}
                  alt={ownerName}
                  className="h-10 w-10 rounded-full object-cover shadow-[0_8px_18px_rgba(102,126,234,0.16)] ring-1 ring-white/70 sm:h-12 sm:w-12 sm:shadow-[0_10px_24px_rgba(102,126,234,0.18)]"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(102,126,234,0.28)] sm:h-12 sm:w-12 sm:text-sm sm:shadow-[0_10px_24px_rgba(102,126,234,0.35)]">
                  {initials}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-zinc-900 sm:text-[16px]">
                  {ownerName}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-zinc-400 sm:gap-2 sm:text-[13px]">
                  <span>{formatFeedTime(trip.createdAt)}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-300" />
                  <span className="capitalize">{privacyLabel}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[18px] border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900 sm:h-11 sm:w-11 sm:rounded-2xl"
            >
              ✕
            </button>
          </div>

          <div className="theme-card mt-3 rounded-[20px] border border-zinc-200/80 bg-[linear-gradient(180deg,#ffffff,#fafafb)] px-3.5 py-3 sm:mt-4 sm:rounded-[24px] sm:px-5 sm:py-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[20px] font-semibold tracking-tight text-zinc-900 sm:text-[24px]">
                {trip.title}
              </h3>
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-600 sm:px-3 sm:text-[12px]">
                Journey
              </span>
              <JourneyMetaChip text={privacyLabel} tone="soft" />
            </div>

            {caption ? (
              <p className="mt-2.5 whitespace-pre-line text-[13px] leading-6 text-zinc-600 sm:mt-3 sm:text-[14px] sm:leading-7">
                {caption}
              </p>
            ) : (
              <p className="mt-2.5 text-[13px] italic leading-6 text-zinc-400 sm:mt-3 sm:text-[14px] sm:leading-7">
                Chưa có phần intro cho journey này.
              </p>
            )}
          </div>
        </div>

        <div
          ref={overlayContentRef}
          className="flex-1 min-h-0 px-4 py-4 overflow-y-auto sm:px-6 sm:py-6"
        >
          {detailLoading ? (
            <div className="theme-card rounded-[20px] border border-zinc-200 bg-[linear-gradient(180deg,#fafafa,#ffffff)] p-4 sm:rounded-[24px] sm:p-5">
              <div className="space-y-3 animate-pulse">
                <div className="w-40 h-4 rounded bg-zinc-200" />
                <div className="h-24 rounded-2xl bg-zinc-100" />
                <div className="h-24 rounded-2xl bg-zinc-100" />
              </div>
            </div>
          ) : null}

          {detailError ? (
            <div className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {detailError}
            </div>
          ) : null}

          {detail ? (
            <>
              {detail.generalItems?.length > 0 ? (
                <section className="mb-5 rounded-[22px] border border-zinc-200 bg-[linear-gradient(180deg,#fdfdff,#f7f9ff)] p-4 sm:mb-5 sm:rounded-[26px] sm:p-5">
                  <JourneySectionTitle
                    eyebrow="Trip overview"
                    title="General highlights"
                    description="Những ghi chú tổng quát cho cả chuyến đi."
                  />

                  <div className="mt-3.5 space-y-3.5 sm:mt-4 sm:space-y-4">
                    {detail.generalItems.map((item, index) => (
                      <div
                        key={getSafeListKey(item, index, "general-item")}
                        className="rounded-[18px] border border-white/80 bg-white p-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.04)] sm:rounded-[22px] sm:p-4"
                      >
                        {item.content ? (
                          <p className="whitespace-pre-line text-[13px] leading-6 text-zinc-700 sm:text-[14px] sm:leading-7">
                            {item.content}
                          </p>
                        ) : null}

                        {item.media?.length > 0 ? (
                          <div className="mt-3.5 sm:mt-4">
                            <JourneyMediaGrid
                              media={item.media}
                              onOpenLightbox={openLightbox}
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <section>
                <JourneySectionTitle
                  eyebrow=""
                  title="Journey timeline"
                  description=""
                />

                {detail.milestones?.length > 0 ? (
                  <div className="mt-3.5 space-y-4 sm:mt-4 sm:space-y-5">
                    {detail.milestones.map((milestone, index) => (
                      <div
                        key={getSafeListKey(milestone, index, "milestone")}
                        className="relative pl-14"
                      >
                        {index !== detail.milestones.length - 1 ? (
                          <span className="absolute bottom-[-22px] left-[22px] top-12 w-[2px] rounded-full bg-gradient-to-b from-[#667eea] via-[#8b5cf6] to-transparent" />
                        ) : null}

                        <div className="absolute left-0 top-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(102,126,234,0.26)]">
                          {index + 1}
                        </div>

                        <div className="rounded-[26px] border border-zinc-200 bg-[linear-gradient(180deg,#ffffff,#fafafb)] p-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[12px] font-semibold text-[#4f7cff]">
                                Milestone {index + 1}
                              </div>

                              <h5 className="mt-3 text-[18px] font-semibold text-zinc-900">
                                {milestone.title}
                              </h5>

                              {milestone.time ? (
                                <p className="mt-2 text-sm text-zinc-400">
                                  {formatMilestoneTime(milestone.time)}
                                </p>
                              ) : null}
                            </div>

                            <div className="px-3 py-1 text-xs font-semibold rounded-full bg-zinc-100 text-zinc-500">
                              {milestone.items?.length || 0} item
                              {(milestone.items?.length || 0) > 1 ? "s" : ""}
                            </div>
                          </div>

                          <div className="mt-4 space-y-4">
                            {milestone.items?.length > 0 ? (
                              milestone.items.map((item, itemIndex) => (
                                <div
                                  key={getSafeListKey(
                                    item,
                                    itemIndex,
                                    `milestone-item-${index}`,
                                  )}
                                  className="rounded-[22px] border border-zinc-200 bg-white p-4"
                                >
                                  {item.content ? (
                                    <p className="whitespace-pre-line text-[14px] leading-7 text-zinc-700">
                                      {item.content}
                                    </p>
                                  ) : null}

                                  {item.media?.length > 0 ? (
                                    <div className="mt-4">
                                      <JourneyMediaGrid
                                        media={item.media}
                                        onOpenLightbox={openLightbox}
                                      />
                                    </div>
                                  ) : null}
                                </div>
                              ))
                            ) : (
                              <div className="theme-card rounded-[20px] border border-dashed border-zinc-200 bg-zinc-50 px-4 py-4 text-sm italic text-zinc-400">
                                Milestone này chưa có nội dung chi tiết.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="theme-card mt-5 rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50 px-5 py-5 text-sm text-zinc-500">
                    Journey này chưa có milestone chi tiết.
                  </div>
                )}
              </section>

              <section
              // className={`${detail?.milestones?.length > 0 ? "pl-14" : ""}`}
              >
                <div className="flex items-center gap-3 mt-6 mb-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-200/90 to-zinc-200/20" />

                  <span className="shrink-0 rounded-full border border-violet-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(245,241,255,0.96))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-500 shadow-[0_6px_16px_rgba(124,58,237,0.08)]">
                    Comments
                  </span>

                  <div className="flex-1 h-px bg-gradient-to-l from-transparent via-zinc-200/90 to-zinc-200/20" />
                </div>

                <section
                  className={`${detail?.milestones?.length > 0 ? "pl-14" : ""}`}
                >
                  {commentsHasMore ? (
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={handleLoadMoreComments}
                        disabled={commentsLoadingMore}
                        className="inline-flex items-center px-4 py-2 text-sm font-semibold transition bg-white border rounded-full cursor-pointer border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-60"
                      >
                        {commentsLoadingMore ? (
                          <span className="inline-flex items-center justify-center">
                            <span className="w-4 h-4 border-2 rounded-full animate-spin border-zinc-300 border-t-zinc-600" />
                          </span>
                        ) : (
                          "Load older comments"
                        )}
                      </button>
                    </div>
                  ) : null}

                  {commentsError ? (
                    <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {commentsError}
                    </div>
                  ) : null}

                  {commentsLoading ? (
                    <div className="space-y-3">
                      {[0, 1].map((item) => (
                        <div key={item} className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full animate-pulse bg-zinc-200" />
                          <div className="flex-1 min-w-0">
                            <div className="rounded-[22px] bg-[#f0f2f5] px-4 py-3">
                              <div className="h-3 rounded w-28 animate-pulse bg-zinc-200" />
                              <div className="w-3/4 h-3 mt-2 rounded animate-pulse bg-zinc-200" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : commentItems.length ? (
                    <div className="space-y-3">
                      {commentItems.map((comment, index) => (
                        <JourneyCommentCard
                          key={getSafeListKey(comment, index, "comment")}
                          comment={comment}
                          highlightedCommentId={highlightedCommentId}
                          expandedReplyThreads={expandedReplyThreads}
                          visibleReplyCounts={visibleReplyCounts}
                          activeReplyId={replyingToCommentId}
                          replyText={replyText}
                          replyImageDraft={replyImageDraft}
                          replyGifDraft={replyGifDraft}
                          replyEmojiPickerOpen={replyEmojiPickerOpen}
                          replyGifPickerOpen={replyGifPickerOpen}
                          replyGifQuery={replyGifQuery}
                          replySubmitting={!!replySubmittingCommentId}
                          replyTargetName={replyTarget?.name || ""}
                          currentUserId={currentUserId}
                          currentUserAvatar={currentUserAvatar}
                          currentUserInitials={currentUserInitials}
                          currentUserName={currentUserName}
                          onReplyToggle={handleToggleReply}
                          onToggleLike={handleToggleCommentLike}
                          likingCommentId={likingCommentId}
                          loadingReplyThreads={loadingReplyThreads}
                          onExpandReplies={handleExpandReplies}
                          onLoadMoreReplies={handleLoadMoreReplies}
                          onEdit={handleStartEditing}
                          onDelete={handleRequestDelete}
                          editingCommentId={editingCommentId}
                          editingText={editingText}
                          editSubmitting={
                            !!editingCommentId &&
                            editSubmittingCommentId === editingCommentId
                          }
                          onReplyTextChange={setReplyText}
                          onReplyTextSelect={handleReplyComposerSelect}
                          onReplySubmit={(event) => {
                            event.preventDefault();
                            handleSubmitReply(replyingToCommentId);
                          }}
                          onReplyPickImage={handlePickReplyImage}
                          onReplyImageChange={handleReplyImageChange}
                          onReplyImageRemove={clearReplyImageDraft}
                          onReplyGifRemove={clearReplyGifDraft}
                          onReplyToggleEmojiPicker={handleToggleReplyEmojiPicker}
                          onReplyEmojiSelect={handleReplyEmojiSelect}
                          onReplyToggleGifPicker={handleToggleReplyGifPicker}
                          onReplyGifQueryChange={setReplyGifQuery}
                          onReplyFetchGifs={fetchReplyGifs}
                          onReplySelectGif={handleSelectReplyGif}
                          replyTextareaRef={replyTextareaRef}
                          replyImageInputRef={replyImageInputRef}
                          replyEmojiPickerRef={replyEmojiPickerRef}
                          replyGifPickerRef={replyGifPickerRef}
                          onEditTextChange={setEditingText}
                          onEditCancel={handleCancelEditing}
                          onEditSubmit={handleEditSubmit}
                          onOpenMedia={openLightbox}
                        />
                      ))}
                      <div ref={commentListEndRef} />
                    </div>
                  ) : (
                    <div className="theme-card rounded-[20px] border border-dashed border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-400">
                      Chưa có comment nào. Hãy là người đầu tiên bắt đầu cuộc
                      trò chuyện.
                      <div ref={commentListEndRef} />
                    </div>
                  )}
                </section>
              </section>
            </>
          ) : null}
        </div>

        <form
          onSubmit={handleSubmitComment}
          className="theme-comment-panel shrink-0 border-t border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,248,255,0.98))] px-4 py-4 backdrop-blur sm:px-6 sm:py-5"
        >
          <input
            ref={commentImageInputRef}
            type="file"
            accept="image/*"
            onChange={handleCommentImageChange}
            className="hidden"
          />
          <div className="flex items-end gap-3">
            <CommentComposerAvatar
              src={currentUserAvatar}
              initials={currentUserInitials}
              name={currentUserName}
            />

            <div className="theme-card min-w-0 flex-1 rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(244,247,255,0.95),rgba(250,247,255,0.96))] px-4 py-3 shadow-[0_14px_34px_rgba(99,102,241,0.10)] ring-1 ring-zinc-200/70 backdrop-blur transition-[box-shadow,border-color,background,transform] duration-200 focus-within:border-[rgba(167,139,250,0.55)] focus-within:bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(242,245,255,0.98),rgba(248,243,255,0.98))] focus-within:shadow-[0_18px_40px_rgba(124,58,237,0.16),0_0_0_4px_rgba(167,139,250,0.10)] focus-within:ring-[rgba(167,139,250,0.30)]">
              <textarea
                ref={commentTextareaRef}
                value={commentText}
                onSelect={handleCommentComposerSelect}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  commentSelectionRef.current = {
                    start: e.target.selectionStart ?? e.target.value.length,
                    end: e.target.selectionEnd ?? e.target.value.length,
                  };
                  requestAnimationFrame(() => {
                    resizeCommentTextarea();
                  });
                }}
                rows={1}
                placeholder="Write a comment..."
                className="max-h-[200px] min-h-[40px] w-full resize-none overflow-y-hidden border-0 bg-transparent text-[15px] leading-6 text-zinc-700 outline-none transition-[height] duration-150 ease-out placeholder:text-zinc-400/90 [scrollbar-width:thin]"
                style={{ height: "40px" }}
              />

              {commentImageDraft?.previewUrl ? (
                <CommentMediaDraftPreview
                  previewUrl={commentImageDraft.previewUrl}
                  uploading={commentSubmitting}
                  onRemove={clearCommentImageDraft}
                  onOpen={() =>
                    openLightbox([{ type: "image", url: commentImageDraft.previewUrl }], 0)
                  }
                />
              ) : null}

              {!commentImageDraft?.previewUrl && commentGifDraft?.previewUrl ? (
                <CommentMediaDraftPreview
                  previewUrl={commentGifDraft.previewUrl}
                  uploading={commentSubmitting}
                  clickable={false}
                  onRemove={clearCommentGifDraft}
                />
              ) : null}

              <div className="flex items-center justify-between gap-3 mt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="relative">
                    <CommentComposerActionButton
                      ariaLabel="Emoji"
                      onClick={handleToggleCommentEmojiPicker}
                      className={
                        commentEmojiPickerOpen
                          ? "bg-[linear-gradient(135deg,rgba(102,126,234,0.16),rgba(118,75,162,0.18))] text-violet-600 shadow-[0_10px_22px_rgba(102,126,234,0.12)]"
                          : ""
                      }
                    >
                    <CommentSmileIcon className="h-[22px] w-[22px]" />
                    </CommentComposerActionButton>

                    <AnimatePresence>
                      {commentEmojiPickerOpen ? (
                        <motion.div
                          ref={commentEmojiPickerRef}
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute bottom-[calc(100%+8px)] left-0 z-20 overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-zinc-200/80"
                        >
                          <LazyEmojiPicker
                            onEmojiClick={handleCommentEmojiSelect}
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
                  </div>

                  <CommentComposerActionButton ariaLabel="Camera" onClick={handlePickCommentImage}>
                    <CommentCameraIcon className="h-[22px] w-[22px]" />
                  </CommentComposerActionButton>

                  <div className="relative">
                    <CommentComposerActionButton
                      ariaLabel="GIF"
                      onClick={handleToggleCommentGifPicker}
                      className={
                        commentGifPickerOpen
                          ? "bg-[linear-gradient(135deg,rgba(102,126,234,0.16),rgba(118,75,162,0.18))] text-violet-600 shadow-[0_10px_22px_rgba(102,126,234,0.12)]"
                          : ""
                      }
                    >
                    <span className="text-[13px] font-bold tracking-[0.08em]">
                      GIF
                    </span>
                    </CommentComposerActionButton>

                    <AnimatePresence>
                      {commentGifPickerOpen ? (
                        <motion.div
                          ref={commentGifPickerRef}
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute bottom-[calc(100%+8px)] left-0 z-20 overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-zinc-200/80"
                        >
                          <div className="border-b border-zinc-200/70 px-3 py-3">
                            <input
                              type="text"
                              value={commentGifQuery}
                              onChange={(event) => setCommentGifQuery(event.target.value)}
                              placeholder="Tìm GIF trên Giphy..."
                              className="w-full rounded-[14px] border border-zinc-200/80 bg-white px-3 py-2 text-[13px] text-zinc-700 outline-none placeholder:text-zinc-400"
                            />
                          </div>
                          <div className="h-[320px] w-[320px] overflow-y-auto px-2 py-2">
                            <LazyGiphyGrid
                              width={296}
                              columns={2}
                              gutter={8}
                              fetchGifs={fetchCommentGifs}
                              key={commentGifQuery.trim() || "trending-comments"}
                              onGifClick={(gif, event) => {
                                event.preventDefault();
                                handleSelectCommentGif(gif);
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

                  <CommentComposerActionButton ariaLabel="Sticker">
                    <CommentStickerIcon className="h-[22px] w-[22px]" />
                  </CommentComposerActionButton>
                </div>

                <button
                  type="submit"
                  disabled={
                    (!commentText.trim() &&
                      !commentImageDraft?.file &&
                      !commentGifDraft?.gifUrl) ||
                    commentSubmitting
                  }
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition ${
                    commentText.trim() ||
                    commentImageDraft?.file ||
                    commentGifDraft?.gifUrl
                      ? "cursor-pointer bg-[linear-gradient(135deg,#667eea_0%,#8b5cf6_48%,#7c3aed_100%)] text-white shadow-[0_14px_28px_rgba(124,58,237,0.28)] hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(124,58,237,0.35)]"
                      : "cursor-not-allowed bg-white/80 text-zinc-300 ring-1 ring-zinc-200/80"
                  }`}
                >
                  {commentSubmitting ? (
                    <span className="h-[17px] w-[17px] animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                  ) : (
                    <SendIcon className="h-[17px] w-[17px]" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        <AnimatePresence>
          {lightboxMedia.length ? (
            <JourneyMediaLightbox
              media={lightboxMedia}
              currentIndex={lightboxIndex}
              tripTitle={trip.title}
              onClose={closeLightbox}
              onPrev={showPrevLightboxItem}
              onNext={showNextLightboxItem}
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {deleteConfirmComment ? (
            <motion.div
              className="absolute inset-0 z-[3] flex items-center justify-center bg-zinc-950/20 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="theme-popover mx-4 w-full max-w-sm rounded-[26px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,245,255,0.98))] p-5 shadow-[0_24px_56px_rgba(76,29,149,0.18)]"
              >
                <p className="text-[18px] font-semibold text-zinc-900">
                  Xoá bình luận?
                </p>
                <p className="mt-2 text-[14px] leading-6 text-zinc-600">
                  Bình luận này sẽ bị xoá khỏi cuộc trò chuyện.
                  {Array.isArray(deleteConfirmComment?.replies) &&
                  deleteConfirmComment.replies.length
                    ? " Các phản hồi bên trong cũng sẽ bị xoá theo."
                    : ""}
                </p>

                <div className="flex items-center justify-end gap-3 mt-5">
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    disabled={!!deletingCommentId}
                    className="inline-flex cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-[13px] font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Huỷ
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={!!deletingCommentId}
                    className="inline-flex min-w-[112px] cursor-pointer items-center justify-center rounded-full bg-[linear-gradient(135deg,#fb7185_0%,#f43f5e_55%,#e11d48_100%)] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_14px_28px_rgba(244,63,94,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {deletingCommentId ? (
                      <span className="h-[14px] w-[14px] animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                    ) : (
                      "Xoá"
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
