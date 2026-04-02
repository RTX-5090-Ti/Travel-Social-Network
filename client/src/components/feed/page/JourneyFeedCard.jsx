import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { tripApi } from "../../../api/trip.api";
import {
  getInitials,
  formatFeedTime,
  getPrivacyLabel,
  countJourneyMedia,
} from "./feed.utils";
import {
  DotsIcon,
  HeartIcon,
  CommentIcon,
  ShareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PhotoIcon,
} from "./feed.icons";
import PreviewMediaSlide from "./journey-card/PreviewMediaSlide";
import JourneyMetaChip from "./journey-card/JourneyMetaChip";
import JourneyDetailOverlay from "./journey-card/JourneyDetailOverlay";

function getUserAvatar(user) {
  return (
    user?.avatarUrl ||
    user?.avatar ||
    user?.profile?.avatarUrl ||
    user?.profile?.avatar ||
    ""
  );
}

export default function JourneyFeedCard({
  trip,
  forceOpen = false,
  overlayOnly = false,
  onForceOpenClose,
  onPreviewUser,
}) {
  const ownerName = trip.ownerId?.name || "Traveler";
  const initials = getInitials(ownerName);
  const ownerAvatar = getUserAvatar(trip.ownerId);
  const caption = trip.caption?.trim() || "";
  const [commentCount, setCommentCount] = useState(trip.counts?.comments ?? 0);

  const [liked, setLiked] = useState(!!trip.hearted);
  const [likeCount, setLikeCount] = useState(trip.counts?.reactions ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const cardRef = useRef(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);

  const [expanded, setExpanded] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detail, setDetail] = useState(null);

  const [previewIndex, setPreviewIndex] = useState(0);
  const [previousPreviewIndex, setPreviousPreviewIndex] = useState(null);
  const [previewDirection, setPreviewDirection] = useState(1);

  const previewItems = useMemo(() => {
    const rawItems = trip.feedPreview?.previewMedia?.length
      ? trip.feedPreview.previewMedia
      : trip.coverUrl
        ? [{ url: trip.coverUrl, type: "image" }]
        : [];

    const seen = new Set();

    return rawItems
      .map((item, idx) => ({
        ...item,
        type: item?.type === "video" ? "video" : "image",
        url: typeof item?.url === "string" ? item.url.trim() : "",
        __safeKey:
          typeof item?.url === "string" && item.url.trim()
            ? `${trip._id}-${item.url.trim()}-${idx}`
            : `${trip._id}-fallback-${idx}`,
      }))
      .filter((item) => {
        if (!item.url) return false;
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      });
  }, [trip._id, trip.feedPreview?.previewMedia, trip.coverUrl]);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsNearViewport(true);
      return;
    }

    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        setIsNearViewport(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: "40% 0px 40% 0px",
      },
    );

    preloadObserver.observe(node);

    return () => {
      preloadObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsInViewport(true);
      return;
    }

    const autoplayObserver = new IntersectionObserver(
      ([entry]) => {
        const visibleEnough =
          entry.isIntersecting && entry.intersectionRatio >= 0.6;

        setIsInViewport(visibleEnough);
      },
      {
        root: null,
        threshold: [0, 0.25, 0.6, 0.85],
        rootMargin: "0px 0px -8% 0px",
      },
    );

    autoplayObserver.observe(node);

    return () => {
      autoplayObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    setLiked(!!trip.hearted);
  }, [trip._id, trip.hearted]);

  const previewCaption =
    caption.length > 170 ? `${caption.slice(0, 170).trim()}...` : caption;

  const milestoneCount =
    trip.feedPreview?.milestoneCount ?? detail?.milestones?.length ?? null;

  const mediaCount =
    trip.feedPreview?.mediaCount ??
    trip.feedPreview?.imageCount ??
    (detail ? countJourneyMedia(detail) : previewItems.length);
  const privacyLabel = getPrivacyLabel(trip.privacy);
  const shouldPlayActiveMedia =
    !expanded && isNearViewport && isInViewport && previewItems.length > 0;

  const shouldAutoplayPreview =
    shouldPlayActiveMedia && previewItems.length > 1;

  useEffect(() => {
    if (!shouldAutoplayPreview) return;

    const timer = setTimeout(() => {
      setPreviewDirection(1);
      setPreviewIndex((prev) => {
        setPreviousPreviewIndex(prev);
        return (prev + 1) % previewItems.length;
      });
    }, 4500);

    return () => clearTimeout(timer);
  }, [shouldAutoplayPreview, previewItems.length, previewIndex]);

  useEffect(() => {
    if (shouldAutoplayPreview) return;
    setPreviousPreviewIndex(null);
  }, [shouldAutoplayPreview]);

  useEffect(() => {
    setPreviewIndex(0);
    setPreviousPreviewIndex(null);
    setPreviewDirection(1);
  }, [trip._id, previewItems.length]);

  useEffect(() => {
    if (!isNearViewport) return;
    if (!previewItems.length) return;

    const activeItem = previewItems[previewIndex] ?? null;
    const nextItem =
      previewItems.length > 1
        ? previewItems[(previewIndex + 1) % previewItems.length]
        : null;

    [activeItem, nextItem]
      .filter((item) => item?.url && item.type === "image")
      .forEach((item) => {
        const img = new Image();
        img.decoding = "async";
        img.src = item.url;
      });
  }, [isNearViewport, previewItems, previewIndex]);

  useEffect(() => {
    if (!forceOpen || !trip?._id) return;

    let cancelled = false;

    // Mở overlay ngay lập tức
    setExpanded(true);

    // Nếu đã có detail rồi thì không fetch lại
    if (detail || detailLoading) return;

    async function openForcedDetail() {
      try {
        setDetailLoading(true);
        setDetailError("");

        const res = await tripApi.getDetail(trip._id);
        if (cancelled) return;

        setDetail(res.data);
      } catch (e) {
        if (cancelled) return;

        setDetailError(
          e?.response?.data?.message || "Không tải được chi tiết journey.",
        );
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    }

    openForcedDetail();

    return () => {
      cancelled = true;
    };
  }, [forceOpen, trip?._id]);

  async function handleToggleLike() {
    if (likeLoading || !trip?._id) return;

    const prevLiked = liked;
    const prevCount = likeCount;

    const optimisticLiked = !prevLiked;
    const optimisticCount = Math.max(0, prevCount + (optimisticLiked ? 1 : -1));

    setLiked(optimisticLiked);
    setLikeCount(optimisticCount);
    setLikeLoading(true);

    try {
      const res = await tripApi.toggleReaction(trip._id);

      setLiked(!!res.data?.hearted);
      setLikeCount(
        typeof res.data?.count === "number" ? res.data.count : optimisticCount,
      );
    } catch (err) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      console.error("Toggle like failed:", err);
    } finally {
      setLikeLoading(false);
    }
  }

  useEffect(() => {
    setLikeCount(trip.counts?.reactions ?? 0);
  }, [trip._id, trip.counts?.reactions]);

  useEffect(() => {
    setCommentCount(trip.counts?.comments ?? 0);
  }, [trip._id, trip.counts?.comments]);

  async function handleToggleShow() {
    if (!trip?._id) return;

    if (expanded) {
      setExpanded(false);
      return;
    }

    // Mở box trước
    setExpanded(true);

    // Nếu đã có detail hoặc đang load thì thôi
    if (detail || detailLoading) return;

    try {
      setDetailLoading(true);
      setDetailError("");

      const res = await tripApi.getDetail(trip._id);
      setDetail(res.data);
    } catch (e) {
      setDetailError(
        e?.response?.data?.message || "Không tải được chi tiết journey.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  // const activePreview = previewItems[previewIndex];

  return (
    <>
      <AnimatePresence>
        {expanded ? (
          <JourneyDetailOverlay
            key={`journey-overlay-${trip._id}`}
            trip={trip}
            detail={detail}
            detailLoading={detailLoading}
            detailError={detailError}
            commentCount={commentCount}
            onCommentCreated={() => {
              setCommentCount((prev) => prev + 1);
            }}
            onClose={() => {
              setExpanded(false);
              onForceOpenClose?.();
            }}
          />
        ) : null}
      </AnimatePresence>

      {!overlayOnly ? (
        <article
          ref={cardRef}
          className="overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_18px_50px_rgba(17,24,39,0.06)] ring-1 ring-zinc-200/60"
        >
          <div className="px-5 pt-5 sm:px-6 sm:pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center min-w-0 gap-3">
                <div className="relative">
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
                </div>

                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onPreviewUser?.(trip.ownerId)}
                    className="block max-w-full cursor-pointer truncate text-left text-[16px] font-semibold text-zinc-900 transition hover:text-[#5b6ee1] cursor-pointer"
                  >
                    {ownerName}
                  </button>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-zinc-400">
                    <span>{formatFeedTime(trip.createdAt)}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-300" />
                    <span className="capitalize">{privacyLabel}</span>
                  </div>
                </div>
              </div>

              <button className="inline-flex items-center justify-center w-10 h-10 transition rounded-full cursor-pointer text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                <DotsIcon className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>

          <div className="px-5 pt-5 sm:px-6">
            <div className="group relative h-[260px] overflow-hidden rounded-[24px] bg-zinc-100 sm:h-[340px]">
              {previewItems.length > 0 ? (
                <>
                  {previewItems.map((item, idx) => {
                    const isActive = idx === previewIndex;
                    const isPrevious =
                      shouldAutoplayPreview &&
                      previousPreviewIndex !== null &&
                      idx === previousPreviewIndex;

                    let animateProps = isActive
                      ? {
                          opacity: 1,
                          x: "0%",
                          scale: 1,
                        }
                      : {
                          opacity: 0,
                          x: "0%",
                          scale: 1,
                        };

                    let transitionProps = { duration: 0 };

                    if (shouldAutoplayPreview && isActive) {
                      animateProps = {
                        opacity: 1,
                        x: "0%",
                        scale: 1,
                      };
                      transitionProps = {
                        duration: 0.42,
                        ease: [0.22, 1, 0.36, 1],
                      };
                    } else if (shouldAutoplayPreview && isPrevious) {
                      animateProps = {
                        opacity: 0,
                        x: previewDirection === 1 ? "-10%" : "6%",
                        scale: 1.02,
                      };
                      transitionProps = {
                        duration: 0.42,
                        ease: [0.22, 1, 0.36, 1],
                      };
                    }

                    return (
                      <PreviewMediaSlide
                        key={item.__safeKey}
                        item={item}
                        tripTitle={trip.title}
                        isActive={isActive}
                        isPrevious={isPrevious}
                        shouldPlay={shouldPlayActiveMedia}
                        animateProps={animateProps}
                        transitionProps={transitionProps}
                      />
                    );
                  })}
                </>
              ) : trip.coverUrl ? (
                <img
                  src={trip.coverUrl}
                  alt={trip.title}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#eef2ff,#f8fafc)] text-zinc-400">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto shadow-sm rounded-2xl bg-white/80">
                      <PhotoIcon className="w-6 h-6" />
                    </div>
                    <p className="mt-3 text-sm font-medium">No media yet</p>
                  </div>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 pointer-events-none h-28 bg-gradient-to-t from-black/35 via-black/8 to-transparent" />

              <div className="absolute flex flex-wrap gap-2 left-4 top-4">
                <JourneyMetaChip text={privacyLabel} tone="blue" />
                {milestoneCount ? (
                  <JourneyMetaChip
                    text={`${milestoneCount} milestone${milestoneCount > 1 ? "s" : ""}`}
                    tone="white"
                  />
                ) : null}
                {mediaCount ? (
                  <JourneyMetaChip text={`${mediaCount} media`} tone="white" />
                ) : null}
              </div>

              {previewItems.length > 1 && !expanded ? (
                <div className="absolute bottom-4 right-4 rounded-full bg-black/40 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur">
                  {previewIndex + 1} / {previewItems.length}
                </div>
              ) : null}
            </div>
          </div>

          <div className="px-5 pt-5 pb-5 sm:px-6 sm:pb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-[22px] font-semibold tracking-tight text-zinc-900">
                    {trip.title}
                  </h4>
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-[12px] font-semibold text-violet-600">
                    Journey
                  </span>
                </div>

                {caption ? (
                  <p className="mt-3 text-[14px] leading-7 text-zinc-600 whitespace-pre-line">
                    {expanded ? caption : previewCaption}
                  </p>
                ) : (
                  <p className="mt-3 text-[14px] italic leading-7 text-zinc-400">
                    Chưa có phần intro cho journey này.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              <JourneyMetaChip
                text={`${likeCount} ${likeCount === 1 ? "like" : "likes"}`}
                tone="soft"
              />
              <JourneyMetaChip
                text={`${commentCount} ${commentCount === 1 ? "comment" : "comments"}`}
                tone="soft"
              />
              {milestoneCount ? (
                <JourneyMetaChip
                  text={`${milestoneCount} stops in journey`}
                  tone="soft"
                />
              ) : null}
              {mediaCount ? (
                <JourneyMetaChip text={`${mediaCount} media`} tone="soft" />
              ) : null}
            </div>

            <div className="flex flex-col gap-3 pt-5 mt-6 border-t border-zinc-100 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid grid-cols-3 gap-2 pt-2 mt-3 border-zinc-200/80">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  disabled={likeLoading}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl text-[15px] font-medium transition active:scale-[0.98] ${
                    liked
                      ? "bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                  } ${likeLoading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                >
                  <HeartIcon
                    filled={liked}
                    className={`h-[20px] w-[20px] transition ${
                      liked ? "scale-110" : ""
                    }`}
                  />
                  <span>{liked ? "Liked" : "Like"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleShow}
                  disabled={detailLoading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl text-[15px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 active:scale-[0.98] px-10 cursor-pointer"
                >
                  <CommentIcon className="h-[20px] w-[20px]" />
                  <span>Comment</span>
                </button>

                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl text-[15px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 active:scale-[0.98] cursor-pointer"
                >
                  <ShareIcon className="h-[20px] w-[20px]" />
                  <span>Share</span>
                </button>
              </div>

              <button
                onClick={handleToggleShow}
                disabled={detailLoading}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(102,126,234,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(102,126,234,0.38)]"
              >
                {expanded ? (
                  <>
                    <ChevronUpIcon className="w-4 h-4" />
                    Hide journey
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="w-4 h-4" />
                    Show journey
                  </>
                )}
              </button>
            </div>
          </div>
        </article>
      ) : null}
    </>
  );
}
