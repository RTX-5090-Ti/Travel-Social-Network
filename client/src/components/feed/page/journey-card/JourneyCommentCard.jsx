import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { SendIcon } from "../feed.icons";
import { formatFeedTime, getInitials } from "../feed.utils";
import CommentComposerActionButton from "./CommentComposerActionButton";
import CommentComposerAvatar from "./CommentComposerAvatar";
import LazyEmojiPicker from "../../../shared/LazyEmojiPicker";
import LazyGiphyGrid from "../../../shared/LazyGiphyGrid";
import {
  CommentCameraIcon,
  CommentSmileIcon,
  CommentStickerIcon,
} from "./CommentComposerIcons";

const REPLIES_PAGE_SIZE = 10;

function countReplyNodes(replies = []) {
  return replies.reduce(
    (total, reply) =>
      total +
      1 +
      countReplyNodes(Array.isArray(reply?.replies) ? reply.replies : []),
    0,
  );
}

function limitReplyTree(replies = [], limit = 0) {
  if (limit <= 0 || !replies.length) {
    return { items: [], used: 0 };
  }

  let used = 0;
  const items = [];

  for (const reply of replies) {
    if (used >= limit) break;

    used += 1;

    const childReplies = Array.isArray(reply?.replies) ? reply.replies : [];
    let nextReplies = [];

    if (childReplies.length && used < limit) {
      const limitedChildren = limitReplyTree(childReplies, limit - used);
      nextReplies = limitedChildren.items;
      used += limitedChildren.used;
    }

    items.push({
      ...reply,
      replies: nextReplies,
    });
  }

  return { items, used };
}

function getCommentId(comment) {
  if (!comment) return "";
  if (typeof comment?._id === "string") return comment._id;
  return comment?._id?.toString?.() || "";
}

function getCommentAuthor(comment) {
  return comment?.userId || comment?.user || null;
}

function isCommentAuthorUnavailable(comment) {
  return !!getCommentAuthor(comment)?.unavailable;
}

function getCommentAuthorName(comment) {
  return getCommentAuthor(comment)?.name?.trim?.() || "Traveler";
}

function getCommentAuthorId(comment) {
  const author = getCommentAuthor(comment);
  if (!author) return "";
  if (typeof author === "string") return author;
  return author?._id?.toString?.() || author?.id?.toString?.() || "";
}

function getCommentAvatar(comment) {
  const author = getCommentAuthor(comment);

  return (
    author?.avatarUrl ||
    author?.avatar ||
    author?.profile?.avatarUrl ||
    author?.profile?.avatar ||
    ""
  );
}

function getReplyToName(comment) {
  return (
    comment?.replyToUser?.name?.trim?.() ||
    comment?.replyToUserId?.name?.trim?.() ||
    ""
  );
}

function CommentHeartIcon({ filled = false }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[15px] w-[15px]">
        <path d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[15px] w-[15px]"
    >
      <path d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" />
    </svg>
  );
}

function treeContainsComment(comment, targetId) {
  if (!targetId) return false;
  if (getCommentId(comment) === targetId) return true;

  const replies = Array.isArray(comment?.replies) ? comment.replies : [];
  return replies.some((reply) => treeContainsComment(reply, targetId));
}

function CommentBubble({
  comment,
  highlighted = false,
  showConnector = false,
  onReply,
  onToggleLike,
  currentUserId = "",
  onEdit,
  onDelete,
  editing = false,
  editText = "",
  editSubmitting = false,
  currentUserAvatar = "",
  currentUserInitials = "Y",
  currentUserName = "You",
  onEditTextChange,
  onEditCancel,
  onEditSubmit,
}) {
  const authorName = getCommentAuthorName(comment);
  const authorId = getCommentAuthorId(comment);
  const initials = getInitials(authorName);
  const authorAvatar = getCommentAvatar(comment);
  const authorUnavailable = isCommentAuthorUnavailable(comment);
  const replyToName = getReplyToName(comment);
  const content =
    typeof comment?.content === "string" ? comment.content.trim() : "";
  const commentId = getCommentId(comment);
  const liked = !!comment?.liked;
  const likeCount = Math.max(0, Number(comment?.likeCount || 0));
  const isOwnComment =
    Boolean(currentUserId) && Boolean(authorId) && currentUserId === authorId;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRootRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(event) {
      const target = event.target;
      if (menuRootRef.current?.contains(target)) return;
      setMenuOpen(false);
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <div
      data-comment-anchor-id={commentId || undefined}
      className={`relative flex items-start gap-3 rounded-[24px] transition-all duration-500 ${
        highlighted
          ? "animate-[pulse_0.85s_ease-in-out_3] bg-[linear-gradient(135deg,rgba(255,251,235,0.72),rgba(255,247,205,0.58))] shadow-[0_10px_24px_rgba(245,158,11,0.08)] ring-1 ring-amber-200/55"
          : ""
      }`}
    >
      {showConnector ? (
        <span className="absolute left-[-24px] top-5 h-px w-5 rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-300" />
      ) : null}

      {authorAvatar && !authorUnavailable ? (
        <img
          src={authorAvatar}
          alt={authorName}
          className="h-8.5 w-8.5 shrink-0 rounded-full object-cover ring-1 ring-white/70"
        />
      ) : authorUnavailable ? (
        <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#d4d4d8,#a1a1aa)] text-white ring-1 ring-white/70">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4.5 w-4.5 opacity-95"
            aria-hidden="true"
          >
            <path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" />
          </svg>
        </div>
      ) : (
        <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#8b5cf6_55%,#764ba2_100%)] text-[10px] font-semibold text-white">
          {initials}
        </div>
      )}

      <div className="flex-1 min-w-0 group/comment">
        <div className="relative inline-block max-w-full">
          <div className="inline-block max-w-full rounded-[19px] border border-zinc-200/90 bg-[linear-gradient(180deg,#faf7ff,#f1ebff)] px-3 py-2 shadow-[0_8px_18px_rgba(76,29,149,0.08)] ring-1 ring-white/70">
            <p className="text-[13px] font-semibold leading-[1.15rem] text-zinc-900">
              {authorName}
            </p>

            <p className="mt-0.5 whitespace-pre-line break-words text-[13px] leading-[1.35rem] text-zinc-800">
              {replyToName ? (
                <span className="mr-1 font-semibold text-zinc-800">
                  {replyToName}
                </span>
              ) : null}
              {content}
            </p>

            {comment?.image?.url ? (
              comment?.image?.mediaType === "gif" ? (
                <div
                  className={`overflow-hidden rounded-[14px] border border-zinc-200/80 ${
                    content ? "mt-2.5" : "mt-1.5"
                  }`}
                >
                  <img
                    src={comment.image.url}
                    alt="Comment GIF"
                    className="h-[170px] w-[170px] object-cover"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onOpenMedia?.(
                      [
                        {
                          type: "image",
                          url: comment.image.url,
                        },
                      ],
                      0,
                    )
                  }
                  className={`block cursor-pointer overflow-hidden rounded-[14px] border border-zinc-200/80 ${
                    content ? "mt-2.5" : "mt-1.5"
                  }`}
                >
                  <img
                    src={comment.image.url}
                    alt="Comment attachment"
                    className="h-[170px] w-[170px] object-cover transition hover:scale-[1.02]"
                  />
                </button>
              )
            ) : null}
          </div>

          {isOwnComment ? (
            <div
              ref={menuRootRef}
              className="absolute left-full top-1/2 ml-2 -translate-y-1/2"
            >
              <button
                type="button"
                aria-label="Comment actions"
                onClick={() => setMenuOpen((prev) => !prev)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,241,255,0.96))] text-[#8b5cf6] shadow-[0_8px_18px_rgba(76,29,149,0.08)] ring-1 ring-zinc-200/70 transition duration-200 hover:scale-[1.04] hover:border-violet-200 hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(243,232,255,0.98))] hover:text-[#7c3aed] hover:shadow-[0_12px_24px_rgba(124,58,237,0.14)] ${
                  menuOpen
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0 group-hover/comment:pointer-events-auto group-hover/comment:opacity-100"
                } cursor-pointer`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-[18px] w-[18px]"
                  aria-hidden="true"
                >
                  <circle cx="5" cy="12" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="19" cy="12" r="1.8" />
                </svg>
              </button>

              {menuOpen ? (
                <div className="absolute left-full top-1/2 ml-2 w-36 -translate-y-1/2 overflow-hidden rounded-[18px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,242,255,0.98))] p-1.5 shadow-[0_18px_40px_rgba(76,29,149,0.16)] ring-1 ring-zinc-200/70">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit?.(comment);
                    }}
                    className="flex w-full cursor-pointer items-center rounded-[14px] px-3 py-2 text-left text-[13px] font-semibold text-zinc-700 transition hover:bg-white/80 hover:text-[#7c3aed]"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete?.(comment);
                    }}
                    className="flex w-full cursor-pointer items-center rounded-[14px] px-3 py-2 text-left text-[13px] font-semibold text-rose-500 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    Xoá
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-3 pl-2.5 text-[11px] font-semibold text-zinc-500">
          <span>{formatFeedTime(comment?.createdAt)}</span>

          <button
            type="button"
            onClick={() => onToggleLike?.(comment)}
            className={`transition cursor-pointer hover:text-zinc-700 ${
              liked ? "text-rose-500 hover:text-rose-600" : ""
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <CommentHeartIcon filled={liked} />
              {likeCount ? <span>{likeCount}</span> : null}
            </span>
          </button>

          {onReply ? (
            <button
              type="button"
              onClick={onReply}
              className="transition cursor-pointer hover:text-zinc-700"
            >
              Reply
            </button>
          ) : null}
        </div>

        {editing ? (
          <form onSubmit={onEditSubmit} className="mt-3 pl-2.5">
            <div className="flex items-end gap-3">
              <CommentComposerAvatar
                src={currentUserAvatar}
                initials={currentUserInitials}
                name={currentUserName}
              />

              <div className="min-w-0 flex-1 rounded-[21px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(244,247,255,0.95),rgba(250,247,255,0.96))] px-3 py-1.5 shadow-[0_8px_18px_rgba(99,102,241,0.08)] ring-1 ring-zinc-200/70">
                <textarea
                  value={editText}
                  onChange={(event) =>
                    onEditTextChange?.(event.target.value)
                  }
                  rows={1}
                  placeholder="Edit your comment..."
                  className="min-h-[28px] w-full resize-none overflow-y-hidden border-0 bg-transparent text-[12px] leading-5 text-zinc-700 outline-none placeholder:text-zinc-400"
                />

                <div className="mt-1 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={onEditCancel}
                    className="text-[11px] font-semibold text-zinc-400 transition hover:text-zinc-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!editText.trim() || editSubmitting}
                    className={`inline-flex h-8.5 w-8.5 items-center justify-center rounded-full transition ${
                      editText.trim()
                        ? "cursor-pointer bg-[linear-gradient(135deg,#667eea_0%,#8b5cf6_48%,#7c3aed_100%)] text-white shadow-[0_12px_24px_rgba(124,58,237,0.22)] hover:-translate-y-0.5"
                        : "cursor-not-allowed bg-white/80 text-zinc-300 ring-1 ring-zinc-200/80"
                    }`}
                  >
                    {editSubmitting ? (
                      <span className="h-[13px] w-[13px] animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                    ) : (
                      <SendIcon className="h-[14px] w-[14px]" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}

function CommentThread({
  comment,
  highlightedCommentId = "",
  depth = 0,
  forceExpanded = false,
  expandedByAncestor = false,
  expandedReplyThreads = {},
  visibleReplyCounts = {},
  activeReplyId = "",
  replyText = "",
  replySubmitting = false,
  replyTargetName = "",
  replyImageDraft = null,
  replyGifDraft = null,
  replyEmojiPickerOpen = false,
  replyGifPickerOpen = false,
  replyGifQuery = "",
  currentUserId = "",
  currentUserAvatar = "",
  currentUserInitials = "Y",
  currentUserName = "You",
  onReplyToggle,
  onToggleLike,
  likingCommentId = "",
  loadingReplyThreads = {},
  onExpandReplies,
  onLoadMoreReplies,
  onEdit,
  onDelete,
  editingCommentId = "",
  editingText = "",
  editSubmitting = false,
  onReplyTextChange,
  onReplySubmit,
  onReplyTextSelect,
  onEditTextChange,
  onEditCancel,
  onEditSubmit,
  onOpenMedia,
  onReplyPickImage,
  onReplyImageChange,
  onReplyImageRemove,
  onReplyGifRemove,
  onReplyToggleEmojiPicker,
  onReplyEmojiSelect,
  onReplyToggleGifPicker,
  onReplyGifQueryChange,
  onReplyFetchGifs,
  onReplySelectGif,
  replyTextareaRef,
  replyImageInputRef,
  replyEmojiPickerRef,
  replyGifPickerRef,
}) {
  const rawReplies = Array.isArray(comment?.replies) ? comment.replies : [];
  const commentId = getCommentId(comment);
  const childDepth = Math.min(depth + 1, 2);
  const totalReplies = Math.max(
    Number.isFinite(comment?.replyCount)
      ? Number(comment.replyCount)
      : countReplyNodes(rawReplies),
    countReplyNodes(rawReplies),
  );
  const hasReplies = totalReplies > 0;
  const isActivePath = treeContainsComment(comment, activeReplyId);
  const isExpanded = !!expandedReplyThreads[commentId];
  const repliesLoading = !!loadingReplyThreads[commentId];
  const visibleRepliesCount =
    visibleReplyCounts[commentId] || REPLIES_PAGE_SIZE;
  const expandDescendants = isExpanded || forceExpanded;
  const repliesExpanded = expandDescendants || isActivePath;
  const replyingHere = activeReplyId === commentId;
  const editingHere = editingCommentId === commentId;
  const likeSubmitting = likingCommentId === commentId;
  const shouldIndentChildren = depth < 2;
  const childWrapperClass = shouldIndentChildren
    ? "relative ml-[18px] mt-3 pl-8"
    : "relative mt-3";
  const isHighlighted = highlightedCommentId === commentId;

  const limitedReplies = expandedByAncestor
    ? { items: rawReplies, used: countReplyNodes(rawReplies) }
    : limitReplyTree(rawReplies, visibleRepliesCount);
  const visibleReplies = repliesExpanded ? limitedReplies.items : [];
  const remainingReplies = expandedByAncestor
    ? 0
    : Math.max(totalReplies - limitedReplies.used, 0);
  const replyToggleLabel =
    totalReplies === 1
      ? "Xem 1 phản hồi"
      : `Xem tất cả ${totalReplies} phản hồi`;

  return (
    <div className="rounded-[24px] bg-transparent" data-comment-id={commentId || undefined}>
      <CommentBubble
        comment={comment}
        highlighted={isHighlighted}
        showConnector={depth > 0}
        onReply={() => onReplyToggle?.(comment)}
        onToggleLike={likeSubmitting ? null : onToggleLike}
        currentUserId={currentUserId}
        onEdit={onEdit}
        onDelete={onDelete}
        editing={editingHere}
        editText={editingText}
        editSubmitting={editSubmitting}
        currentUserAvatar={currentUserAvatar}
        currentUserInitials={currentUserInitials}
        currentUserName={currentUserName}
        onEditTextChange={onEditTextChange}
        onEditCancel={onEditCancel}
        onEditSubmit={onEditSubmit}
      />

      {hasReplies || replyingHere ? (
        <div className={childWrapperClass}>
          {shouldIndentChildren ? (
            <span className="absolute top-0 left-0 w-px rounded-full bottom-2 bg-gradient-to-b from-violet-300 via-fuchsia-300 to-transparent" />
          ) : null}

          {replyingHere ? (
            <form onSubmit={onReplySubmit} className="mt-3 mb-4">
              <input
                ref={replyImageInputRef}
                type="file"
                accept="image/*"
                onChange={onReplyImageChange}
                className="hidden"
              />
              <div className="relative">
                <span className="absolute left-[-24px] top-5 h-px w-5 rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-300" />
                <div className="flex items-end gap-3">
                  <CommentComposerAvatar
                    src={currentUserAvatar}
                    initials={currentUserInitials}
                    name={currentUserName}
                  />

                  <div className="min-w-0 flex-1 rounded-[21px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(244,247,255,0.95),rgba(250,247,255,0.96))] px-3 py-1.5 shadow-[0_8px_18px_rgba(99,102,241,0.08)] ring-1 ring-zinc-200/70">
                    {(replyImageDraft?.previewUrl || replyGifDraft?.previewUrl) ? (
                      <div className="mb-2 rounded-[16px] border border-zinc-200/80 bg-white/90 p-2 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
                        <div className="relative inline-flex overflow-hidden rounded-[12px] border border-zinc-200/80 bg-zinc-50">
                          <img
                            src={replyImageDraft?.previewUrl || replyGifDraft?.previewUrl}
                            alt="Reply media preview"
                            className="h-[84px] w-[84px] object-cover"
                          />
                          <button
                            type="button"
                            aria-label="Remove reply media"
                            onClick={() => {
                              if (replyImageDraft?.previewUrl) {
                                onReplyImageRemove?.();
                              } else {
                                onReplyGifRemove?.();
                              }
                            }}
                            disabled={replySubmitting}
                            className={`absolute right-1.5 top-1.5 inline-flex h-5.5 w-5.5 items-center justify-center rounded-full bg-zinc-950/72 text-white shadow-[0_8px_18px_rgba(15,23,42,0.18)] transition ${
                              replySubmitting
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer hover:scale-105 hover:bg-zinc-950/84"
                            }`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
                              <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : null}

                      <textarea
                        ref={replyTextareaRef}
                        value={replyText}
                        onChange={(event) => {
                          onReplyTextChange?.(event.target.value);
                          onReplyTextSelect?.(event);
                        }}
                        onSelect={onReplyTextSelect}
                      rows={1}
                      placeholder={
                        replyTargetName
                          ? `Reply to ${replyTargetName}...`
                          : "Write a reply..."
                      }
                      className="min-h-[28px] w-full resize-none overflow-y-hidden border-0 bg-transparent text-[12px] leading-5 text-zinc-700 outline-none placeholder:text-zinc-400"
                    />

                    <div className="mb-1.5 mt-1 flex flex-wrap items-center gap-1.5">
                      <div className="relative">
                        <CommentComposerActionButton
                          ariaLabel="Reply emoji"
                          onClick={onReplyToggleEmojiPicker}
                          className={
                            replyEmojiPickerOpen
                              ? "bg-[linear-gradient(135deg,rgba(102,126,234,0.16),rgba(118,75,162,0.18))] text-violet-600 shadow-[0_10px_22px_rgba(102,126,234,0.12)]"
                              : ""
                          }
                        >
                          <CommentSmileIcon className="h-[19px] w-[19px]" />
                        </CommentComposerActionButton>

                        <AnimatePresence>
                          {replyEmojiPickerOpen ? (
                            <motion.div
                              ref={replyEmojiPickerRef}
                              initial={{ opacity: 0, y: 8, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.98 }}
                              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                              className="absolute bottom-[calc(100%+8px)] left-0 z-20 overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-zinc-200/80"
                            >
                              <LazyEmojiPicker
                                onEmojiClick={onReplyEmojiSelect}
                                lazyLoadEmojis
                                previewConfig={{ showPreview: false }}
                                searchDisabled={false}
                                skinTonesDisabled
                                width={300}
                                height={360}
                                fallbackWidth={300}
                                fallbackHeight={360}
                              />
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>

                      <CommentComposerActionButton ariaLabel="Reply camera" onClick={onReplyPickImage}>
                        <CommentCameraIcon className="h-[19px] w-[19px]" />
                      </CommentComposerActionButton>

                      <div className="relative">
                        <CommentComposerActionButton
                          ariaLabel="Reply GIF"
                          onClick={onReplyToggleGifPicker}
                          className={
                            replyGifPickerOpen
                              ? "bg-[linear-gradient(135deg,rgba(102,126,234,0.16),rgba(118,75,162,0.18))] text-violet-600 shadow-[0_10px_22px_rgba(102,126,234,0.12)]"
                              : ""
                          }
                        >
                          <span className="text-[11px] font-bold tracking-[0.08em]">GIF</span>
                        </CommentComposerActionButton>

                        <AnimatePresence>
                          {replyGifPickerOpen ? (
                            <motion.div
                              ref={replyGifPickerRef}
                              initial={{ opacity: 0, y: 8, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.98 }}
                              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                              className="absolute bottom-[calc(100%+8px)] left-0 z-20 overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-zinc-200/80"
                            >
                              <div className="border-b border-zinc-200/70 px-3 py-3">
                                <input
                                  type="text"
                                  value={replyGifQuery}
                                  onChange={(event) => onReplyGifQueryChange?.(event.target.value)}
                                  placeholder="Tìm GIF trên Giphy..."
                                  className="w-full rounded-[14px] border border-zinc-200/80 bg-white px-3 py-2 text-[13px] text-zinc-700 outline-none placeholder:text-zinc-400"
                                />
                              </div>
                              <div className="h-[300px] w-[300px] overflow-y-auto px-2 py-2">
                                <LazyGiphyGrid
                                  width={276}
                                  columns={2}
                                  gutter={8}
                                  fetchGifs={onReplyFetchGifs}
                                  key={replyGifQuery.trim() || `reply-trending-${commentId}`}
                                  onGifClick={(gif, event) => {
                                    event.preventDefault();
                                    onReplySelectGif?.(gif);
                                  }}
                                  noLink
                                  hideAttribution
                                  fallbackWidth={276}
                                  fallbackHeight={300}
                                />
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>

                      <CommentComposerActionButton ariaLabel="Reply sticker">
                        <CommentStickerIcon className="h-[19px] w-[19px]" />
                      </CommentComposerActionButton>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onReplyToggle?.(comment)}
                        className="text-[11px] font-semibold text-zinc-400 transition hover:text-zinc-700"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={
                          (!replyText.trim() &&
                            !replyImageDraft?.previewUrl &&
                            !replyGifDraft?.previewUrl) ||
                          replySubmitting
                        }
                        className={`inline-flex h-8.5 w-8.5 items-center justify-center rounded-full transition ${
                          replyText.trim() ||
                          replyImageDraft?.previewUrl ||
                          replyGifDraft?.previewUrl
                            ? "cursor-pointer bg-[linear-gradient(135deg,#667eea_0%,#8b5cf6_48%,#7c3aed_100%)] text-white shadow-[0_12px_24px_rgba(124,58,237,0.22)] hover:-translate-y-0.5"
                            : "cursor-not-allowed bg-white/80 text-zinc-300 ring-1 ring-zinc-200/80"
                        }`}
                      >
                        {replySubmitting ? (
                          <span className="h-[13px] w-[13px] animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                        ) : (
                          <SendIcon className="h-[14px] w-[14px]" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          ) : null}

          {hasReplies ? (
            <div className={repliesExpanded ? "space-y-3" : ""}>
              {!repliesExpanded && !expandedByAncestor ? (
                <button
                  type="button"
                  onClick={() => onExpandReplies?.(commentId)}
                  className="group relative inline-flex cursor-pointer items-center gap-3 pl-1 text-[14px] font-semibold text-violet-500 transition hover:text-violet-700"
                >
                  <span className="absolute left-[-24px] top-1/2 h-px w-5 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-300" />
                  <span>{replyToggleLabel}</span>
                </button>
              ) : null}

              {repliesExpanded ? (
                <div className="space-y-3">
                  {repliesLoading ? (
                    <div className="flex items-center gap-2 pl-1 text-violet-500">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-violet-500" />
                    </div>
                  ) : null}

                  {visibleReplies.map((reply, index) => (
                    <CommentThread
                      key={getCommentId(reply) || `reply-${index}`}
                      comment={reply}
                      highlightedCommentId={highlightedCommentId}
                      depth={childDepth}
                      forceExpanded={expandDescendants}
                      expandedByAncestor={repliesExpanded}
                      expandedReplyThreads={expandedReplyThreads}
                      visibleReplyCounts={visibleReplyCounts}
                      activeReplyId={activeReplyId}
                      replyText={replyText}
                      replySubmitting={replySubmitting}
                      replyTargetName={replyTargetName}
                      replyImageDraft={replyImageDraft}
                      replyGifDraft={replyGifDraft}
                      replyEmojiPickerOpen={replyEmojiPickerOpen}
                      replyGifPickerOpen={replyGifPickerOpen}
                      replyGifQuery={replyGifQuery}
                      currentUserId={currentUserId}
                      currentUserAvatar={currentUserAvatar}
                      currentUserInitials={currentUserInitials}
                      currentUserName={currentUserName}
                      onReplyToggle={onReplyToggle}
                      onToggleLike={onToggleLike}
                      likingCommentId={likingCommentId}
                      loadingReplyThreads={loadingReplyThreads}
                      onExpandReplies={onExpandReplies}
                      onLoadMoreReplies={onLoadMoreReplies}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      editingCommentId={editingCommentId}
                      editingText={editingText}
                      editSubmitting={editSubmitting}
                      onReplyTextChange={onReplyTextChange}
                      onReplySubmit={onReplySubmit}
                      onReplyTextSelect={onReplyTextSelect}
                      onEditTextChange={onEditTextChange}
                      onEditCancel={onEditCancel}
                      onEditSubmit={onEditSubmit}
                      onOpenMedia={onOpenMedia}
                      onReplyPickImage={onReplyPickImage}
                      onReplyImageChange={onReplyImageChange}
                      onReplyImageRemove={onReplyImageRemove}
                      onReplyGifRemove={onReplyGifRemove}
                      onReplyToggleEmojiPicker={onReplyToggleEmojiPicker}
                      onReplyEmojiSelect={onReplyEmojiSelect}
                      onReplyToggleGifPicker={onReplyToggleGifPicker}
                      onReplyGifQueryChange={onReplyGifQueryChange}
                      onReplyFetchGifs={onReplyFetchGifs}
                      onReplySelectGif={onReplySelectGif}
                      replyTextareaRef={replyTextareaRef}
                      replyImageInputRef={replyImageInputRef}
                      replyEmojiPickerRef={replyEmojiPickerRef}
                      replyGifPickerRef={replyGifPickerRef}
                    />
                  ))}

                  {remainingReplies > 0 &&
                  !expandedByAncestor &&
                  !repliesLoading ? (
                    <button
                      type="button"
                      onClick={() =>
                        onLoadMoreReplies?.(commentId, totalReplies)
                      }
                      className="relative inline-flex cursor-pointer items-center gap-2 pl-1 text-[13px] font-semibold text-violet-500 transition hover:text-violet-700"
                    >
                      <span className="absolute left-[-24px] top-1/2 h-px w-5 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-300" />
                      <span>
                        Xem thêm {Math.min(REPLIES_PAGE_SIZE, remainingReplies)}{" "}
                        phản hồi
                      </span>
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function JourneyCommentCard(props) {
  return <CommentThread {...props} depth={0} />;
}
