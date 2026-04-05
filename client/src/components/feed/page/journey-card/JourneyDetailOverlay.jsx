import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

import { tripApi } from "../../../../api/trip.api";
import { useAuth } from "../../../../auth/useAuth";
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

function getUserAvatar(user) {
  return (
    user?.avatarUrl ||
    user?.avatar ||
    user?.profile?.avatarUrl ||
    user?.profile?.avatar ||
    ""
  );
}

export default function JourneyDetailOverlay({
  trip,
  detail,
  detailLoading,
  detailError,
  commentCount,
  onCommentCreated,
  onClose,
}) {
  const ownerName = trip.ownerId?.name || "Traveler";
  const initials = getInitials(ownerName);
  const ownerAvatar = getUserAvatar(trip.ownerId);
  const privacyLabel = getPrivacyLabel(trip.privacy);
  const caption = trip.caption?.trim() || "";

  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [commentItems, setCommentItems] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentsCursor, setCommentsCursor] = useState(null);
  const [commentsHasMore, setCommentsHasMore] = useState(false);
  const [commentsLoadingMore, setCommentsLoadingMore] = useState(false);
  const commentTextareaRef = useRef(null);
  const commentListEndRef = useRef(null);
  const shouldScrollToNewestCommentRef = useRef(false);
  const shouldShowCommentsDivider = commentCount > 0;

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

  function resizeCommentTextarea() {
    const node = commentTextareaRef.current;
    if (!node) return;

    node.style.height = "auto";

    const nextHeight = Math.min(node.scrollHeight, 200);
    node.style.height = `${nextHeight}px`;
    node.style.overflowY = node.scrollHeight > 200 ? "auto" : "hidden";
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
    let ignore = false;

    async function loadComments() {
      if (!trip?._id) return;

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
  }, [trip?._id]);

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
      setCommentsError(
        err?.response?.data?.message || "Không tải thêm comment được.",
      );
    } finally {
      setCommentsLoadingMore(false);
    }
  }

  async function handleSubmitComment(e) {
    e.preventDefault();

    const content = commentText.trim();
    if (!content || commentSubmitting || !trip?._id) return;

    try {
      setCommentSubmitting(true);
      setCommentsError("");

      const res = await tripApi.createComment(trip._id, { content });
      const createdComment = res.data?.comment;

      if (!createdComment) {
        throw new Error("Missing created comment");
      }

      shouldScrollToNewestCommentRef.current = true;
      setCommentItems((prev) => [...prev, createdComment]);
      setCommentText("");
      onCommentCreated?.(createdComment);
    } catch (err) {
      setCommentsError(
        err?.response?.data?.message || "Gửi comment thất bại. Thử lại nhé.",
      );
    } finally {
      setCommentSubmitting(false);
    }
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[120] flex min-h-screen items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label="Close overlay"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-zinc-950/45 backdrop-blur-[6px] cursor-pointer"
      />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.985 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-[1] flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,#ffffff,#fbfbff)] shadow-[0_30px_80px_rgba(15,23,42,0.28)]"
      >
        <div className="px-5 py-4 border-b border-zinc-100 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center min-w-0 gap-3">
              {ownerAvatar ? (
                <img
                  src={ownerAvatar}
                  alt={ownerName}
                  className="h-12 w-12 rounded-full object-cover shadow-[0_10px_24px_rgba(102,126,234,0.18)] ring-1 ring-white/70"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(102,126,234,0.35)]">
                  {initials}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-[16px] font-semibold text-zinc-900">
                  {ownerName}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-zinc-400">
                  <span>{formatFeedTime(trip.createdAt)}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-300" />
                  <span className="capitalize">{privacyLabel}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="inline-flex items-center justify-center transition bg-white border cursor-pointer h-11 w-11 rounded-2xl border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 rounded-[24px] border border-zinc-200/80 bg-[linear-gradient(180deg,#ffffff,#fafafb)] px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[24px] font-semibold tracking-tight text-zinc-900">
                {trip.title}
              </h3>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-[12px] font-semibold text-violet-600">
                Journey
              </span>
              <JourneyMetaChip text={privacyLabel} tone="soft" />
            </div>

            {caption ? (
              <p className="mt-3 whitespace-pre-line text-[14px] leading-7 text-zinc-600">
                {caption}
              </p>
            ) : (
              <p className="mt-3 text-[14px] italic leading-7 text-zinc-400">
                Chưa có phần intro cho journey này.
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 px-5 py-5 overflow-y-auto sm:px-6 sm:py-6">
          {detailLoading ? (
            <div className="rounded-[24px] border border-zinc-200 bg-[linear-gradient(180deg,#fafafa,#ffffff)] p-5">
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
                <section className="mb-6 rounded-[26px] border border-zinc-200 bg-[linear-gradient(180deg,#fdfdff,#f7f9ff)] p-5">
                  <JourneySectionTitle
                    eyebrow="Trip overview"
                    title="General highlights"
                    description="Những ghi chú tổng quát cho cả chuyến đi."
                  />

                  <div className="mt-4 space-y-4">
                    {detail.generalItems.map((item, index) => (
                      <div
                        key={getSafeListKey(item, index, "general-item")}
                        className="rounded-[22px] border border-white/80 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
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
                    ))}
                  </div>
                </section>
              ) : null}

              <section>
                <JourneySectionTitle
                  eyebrow=""
                  title="Journey timeline"
                  description="Toàn bộ hành trình được chia theo từng cột mốc để người xem dễ theo dõi hơn."
                />

                {detail.milestones?.length > 0 ? (
                  <div className="mt-5 space-y-5">
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
                              <div className="rounded-[20px] border border-dashed border-zinc-200 bg-zinc-50 px-4 py-4 text-sm italic text-zinc-400">
                                Milestone này chưa có nội dung chi tiết.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50 px-5 py-5 text-sm text-zinc-500">
                    Journey này chưa có milestone chi tiết.
                  </div>
                )}
              </section>

              <section
              // className={`${detail?.milestones?.length > 0 ? "pl-14" : ""}`}
              >
                {shouldShowCommentsDivider ? (
                  <>
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
                            {commentsLoadingMore
                              ? "Loading..."
                              : "Load older comments"}
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
                            />
                          ))}
                          <div ref={commentListEndRef} />
                        </div>
                      ) : (
                        <div ref={commentListEndRef} />
                      )}
                    </section>
                  </>
                ) : null}
              </section>
            </>
          ) : null}
        </div>

        <form
          onSubmit={handleSubmitComment}
          className="shrink-0 border-t border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,248,255,0.98))] px-4 py-4 backdrop-blur sm:px-6 sm:py-5"
        >
          <div className="flex items-end gap-3">
            <CommentComposerAvatar
              src={currentUserAvatar}
              initials={currentUserInitials}
              name={currentUserName}
            />

            <div className="min-w-0 flex-1 rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(244,247,255,0.95),rgba(250,247,255,0.96))] px-4 py-3 shadow-[0_14px_34px_rgba(99,102,241,0.10)] ring-1 ring-zinc-200/70 backdrop-blur transition-[box-shadow,border-color,background,transform] duration-200 focus-within:border-[rgba(167,139,250,0.55)] focus-within:bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(242,245,255,0.98),rgba(248,243,255,0.98))] focus-within:shadow-[0_18px_40px_rgba(124,58,237,0.16),0_0_0_4px_rgba(167,139,250,0.10)] focus-within:ring-[rgba(167,139,250,0.30)]">
              <textarea
                ref={commentTextareaRef}
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  requestAnimationFrame(() => {
                    resizeCommentTextarea();
                  });
                }}
                rows={1}
                placeholder="Write a comment..."
                className="max-h-[200px] min-h-[40px] w-full resize-none overflow-y-hidden border-0 bg-transparent text-[15px] leading-6 text-zinc-700 outline-none transition-[height] duration-150 ease-out placeholder:text-zinc-400/90 [scrollbar-width:thin]"
                style={{ height: "40px" }}
              />

              <div className="flex items-center justify-between gap-3 mt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <CommentComposerActionButton ariaLabel="Emoji">
                    <CommentSmileIcon className="h-[22px] w-[22px]" />
                  </CommentComposerActionButton>

                  <CommentComposerActionButton ariaLabel="Camera">
                    <CommentCameraIcon className="h-[22px] w-[22px]" />
                  </CommentComposerActionButton>

                  <CommentComposerActionButton ariaLabel="GIF">
                    <span className="text-[13px] font-bold tracking-[0.08em]">
                      GIF
                    </span>
                  </CommentComposerActionButton>

                  <CommentComposerActionButton ariaLabel="Sticker">
                    <CommentStickerIcon className="h-[22px] w-[22px]" />
                  </CommentComposerActionButton>
                </div>

                <button
                  type="submit"
                  disabled={!commentText.trim() || commentSubmitting}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition ${
                    commentText.trim()
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
      </motion.div>
    </motion.div>,
    document.body,
  );
}
