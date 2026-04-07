import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";

import {
  tripApi,
  getTripUnavailableMessage,
  isTripUnavailableError,
} from "../../../api/trip.api";
import { useToast } from "../../../toast/useToast";
import { useAuth } from "../../../auth/useAuth";
import {
  getInitials,
  formatFeedTime,
  getPrivacyLabel,
  countJourneyMedia,
} from "./feed.utils";
import {
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
import JourneyCardActionsMenu from "./journey-card/JourneyCardActionsMenu";
import JourneyAudienceModal from "./journey-card/JourneyAudienceModal";
import ShareJourneyModal from "../ShareJourneyModal";

function getUserAvatar(user) {
  return (
    user?.avatarUrl ||
    user?.avatar ||
    user?.profile?.avatarUrl ||
    user?.profile?.avatar ||
    ""
  );
}

function getEntityId(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return value?._id || value?.id || "";
}

function hasEmbeddedDetail(trip) {
  return Boolean(
    (Array.isArray(trip?.generalItems) && trip.generalItems.length > 0) ||
    (Array.isArray(trip?.milestones) && trip.milestones.length > 0),
  );
}

function PinBadgeIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m15 4 5 5" />
      <path d="m11.5 7.5 5 5" />
      <path d="m14 2 8 8-3 3-3-1-7 7-1.5-1.5 7-7-1-3Z" />
      <path d="M4 20h6" />
    </svg>
  );
}

export default function JourneyFeedCard({
  trip,
  forceOpen = false,
  overlayOnly = false,
  surface = "feed",
  isPinnedOverride,
  onForceOpenClose,
  onPreviewUser,
  onTripTrashed,
  onTripSavedChange,
  onTripUpdated,
  onTripHidden,
}) {
  const { user, setUser, bootstrapping } = useAuth();
  const { showToast } = useToast();

  const viewerUserId = getEntityId(user);
  const ownerUserId = getEntityId(trip?.ownerId);
  const isOwnerTrip =
    !bootstrapping &&
    Boolean(viewerUserId) &&
    Boolean(ownerUserId) &&
    viewerUserId === ownerUserId;

  const authPinnedTripId = getEntityId(user?.pinnedTripId);
  const tripId = getEntityId(trip);
  const derivedPinned = isOwnerTrip && authPinnedTripId === tripId;

  const isPinned =
    typeof isPinnedOverride === "boolean" ? isPinnedOverride : derivedPinned;

  const ownerName = trip.ownerId?.name || "Traveler";
  const initials = getInitials(ownerName);
  const ownerAvatar = getUserAvatar(trip.ownerId);
  const caption = trip.caption?.trim() || "";
  const [commentCount, setCommentCount] = useState(trip.counts?.comments ?? 0);

  const [liked, setLiked] = useState(!!trip.hearted);
  const [likeCount, setLikeCount] = useState(trip.counts?.reactions ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [saved, setSaved] = useState(!!trip.saved);
  const [saveLoading, setSaveLoading] = useState(false);
  const [hideLoading, setHideLoading] = useState(false);
  const cardRef = useRef(null);
  const detailRequestIdRef = useRef(0);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);

  const [expanded, setExpanded] = useState(false);
  const [forceOpenDismissed, setForceOpenDismissed] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detail, setDetail] = useState(() =>
    hasEmbeddedDetail(trip) ? trip : null,
  );

  const [audienceModalOpen, setAudienceModalOpen] = useState(false);
  const [displayPrivacy, setDisplayPrivacy] = useState(
    trip.privacy || "public",
  );
  const [audienceDraft, setAudienceDraft] = useState(trip.privacy || "public");
  const [audienceSaving, setAudienceSaving] = useState(false);

  const [pinSaving, setPinSaving] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editTripDetail, setEditTripDetail] = useState(null);

  const [previewIndex, setPreviewIndex] = useState(0);
  const [previousPreviewIndex, setPreviousPreviewIndex] = useState(null);
  const [previewDirection, setPreviewDirection] = useState(1);

  const closeOverlayWithUnavailableToast = useCallback(
    (error) => {
      setDetail(null);
      setDetailError("");
      setExpanded(false);
      showToast(getTripUnavailableMessage(error), "warning");
    },
    [showToast],
  );

  useEffect(() => {
    setDetailLoading(false);

    if (hasEmbeddedDetail(trip)) {
      setDetail(trip);
      setDetailError("");
      return;
    }

    setDetail(null);
  }, [trip]);

  useEffect(() => {
    const nextPrivacy = trip.privacy || "public";
    setDisplayPrivacy(nextPrivacy);
    setAudienceDraft(nextPrivacy);
    setAudienceModalOpen(false);
  }, [trip._id, trip.privacy]);

  useEffect(() => {
    detailRequestIdRef.current += 1;
  }, [trip._id]);

  useEffect(() => {
    if (!forceOpen) {
      setForceOpenDismissed(false);
    }
  }, [forceOpen]);

  useEffect(() => {
    setForceOpenDismissed(false);
  }, [trip._id]);

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

  useEffect(() => {
    setSaved(!!trip.saved);
  }, [trip._id, trip.saved]);

  const previewCaption =
    caption.length > 170 ? `${caption.slice(0, 170).trim()}...` : caption;

  const milestoneCount =
    trip.feedPreview?.milestoneCount ?? detail?.milestones?.length ?? null;

  const mediaCount =
    trip.feedPreview?.mediaCount ??
    trip.feedPreview?.imageCount ??
    (detail ? countJourneyMedia(detail) : previewItems.length);
  const privacyLabel = getPrivacyLabel(displayPrivacy);
  const shouldPlayActiveMedia =
    !expanded && isNearViewport && isInViewport && previewItems.length > 0;

  const shouldAutoplayPreview =
    shouldPlayActiveMedia && previewItems.length > 1;

  const displayTrip = useMemo(
    () => ({
      ...trip,
      privacy: displayPrivacy || "public",
    }),
    [displayPrivacy, trip],
  );

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
    if (!forceOpen || forceOpenDismissed || !trip?._id) return;

    const currentTripId = trip._id;
    const requestId = ++detailRequestIdRef.current;

    setExpanded(true);

    if (hasEmbeddedDetail(trip)) {
      setDetail(trip);
      setDetailError("");
      return;
    }

    if (detail || detailLoading) return;

    async function openForcedDetail() {
      try {
        setDetailLoading(true);
        setDetailError("");

        const res = await tripApi.getDetail(currentTripId);
        if (detailRequestIdRef.current !== requestId) return;

        setDetail(res.data);
      } catch (e) {
        if (detailRequestIdRef.current !== requestId) return;

        if (isTripUnavailableError(e)) {
          closeOverlayWithUnavailableToast(e);
          onForceOpenClose?.();
          return;
        }

        setDetailError(
          e?.response?.data?.message ||
            "Không tải được chi tiết journey.",
        );
      } finally {
        if (detailRequestIdRef.current === requestId) {
          setDetailLoading(false);
        }
      }
    }

    openForcedDetail();
  }, [
    closeOverlayWithUnavailableToast,
    detail,
    detailLoading,
    forceOpen,
    forceOpenDismissed,
    onForceOpenClose,
    trip,
  ]);

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
    } catch (error) {
      setLiked(prevLiked);
      setLikeCount(prevCount);

      if (isTripUnavailableError(error)) {
        showToast(getTripUnavailableMessage(error), "warning");
        return;
      }

      showToast("Không cập nhật lượt tim được.", "error");
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
      setForceOpenDismissed(true);
      onForceOpenClose?.();
      return;
    }

    setForceOpenDismissed(false);
    setExpanded(true);

    if (hasEmbeddedDetail(trip)) {
      setDetail(trip);
      setDetailError("");
      return;
    }

    if (detail || detailLoading) return;

    const currentTripId = trip._id;
    const requestId = ++detailRequestIdRef.current;

    try {
      setDetailLoading(true);
      setDetailError("");

      const res = await tripApi.getDetail(currentTripId);
      if (detailRequestIdRef.current !== requestId) return;

      setDetail(res.data);
    } catch (error) {
      if (detailRequestIdRef.current !== requestId) return;

      if (isTripUnavailableError(error)) {
        closeOverlayWithUnavailableToast(error);
        return;
      }

      setDetailError(
        error?.response?.data?.message ||
          "Không tải được chi tiết journey.",
      );
    } finally {
      if (detailRequestIdRef.current === requestId) {
        setDetailLoading(false);
      }
    }
  }

  async function handlePinTrip() {
    if (!isOwnerTrip || !tripId || pinSaving) return;

    try {
      setPinSaving(true);

      if (isPinned) {
        await tripApi.unpinTrip(tripId);

        setUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pinnedTripId: null,
          };
        });

        showToast(
          surface === "profile"
            ? "Đã gỡ ghim bài viết khỏi profile."
            : "Đã gỡ bài ghim khỏi profile của bạn.",
          "success",
        );
        return;
      }

      const res = await tripApi.pinTrip(tripId);

      const nextPinnedTripId = res.data?.pinnedTripId || tripId;
      const replacedTripId = res.data?.replacedTripId || null;

      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pinnedTripId: nextPinnedTripId,
        };
      });

      if (surface === "profile") {
        showToast(
          replacedTripId
            ? "Đã thay bài ghim trong profile."
            : "Đã ghim bài viết lên đầu profile.",
          "success",
        );
      } else {
        showToast(
          replacedTripId
            ? "Đã thay bài ghim trong profile của bạn."
            : "Đã ghim trong profile của bạn.",
          "success",
        );
      }
    } catch (error) {
      const status = Number(error?.response?.status || 0);

      if (status === 404) {
        showToast("Journey này không còn khả dụng.", "warning");
        return;
      }

      showToast(
        error?.response?.data?.message ||
          "Không cập nhật trạng thái ghim được.",
        "error",
      );
    } finally {
      setPinSaving(false);
    }
  }

  async function handleSaveTrip() {
    if (!tripId || saveLoading) return;

    const prevSaved = saved;
    const nextSaved = !prevSaved;

    try {
      setSaveLoading(true);
      setSaved(nextSaved);

      const res = nextSaved
        ? await tripApi.saveTrip(tripId)
        : await tripApi.unsaveTrip(tripId);

      setSaved(!!res.data?.saved);
      onTripSavedChange?.(tripId, !!res.data?.saved, trip);

      showToast(
        res.data?.saved
          ? "Đã lưu journey vào kho lưu trữ."
          : "Đã gỡ journey khỏi danh sách đã lưu.",
        "success",
      );
    } catch (error) {
      setSaved(prevSaved);

      if (isTripUnavailableError(error)) {
        showToast(getTripUnavailableMessage(error), "warning");
        return;
      }

      showToast(
        error?.response?.data?.message ||
          (nextSaved
            ? "Không lưu journey được."
            : "Không gỡ journey khỏi danh sách đã lưu được."),
        "error",
      );
    } finally {
      setSaveLoading(false);
    }
  }

  function handleEditTrip() {
    if (!isOwnerTrip || !tripId || editLoading) return;

    const embeddedDetail = (() => {
      if (detail?.trip || Array.isArray(detail?.milestones)) return detail;

      if (hasEmbeddedDetail(trip)) {
        return {
          trip,
          generalItems: Array.isArray(trip?.generalItems) ? trip.generalItems : [],
          milestones: Array.isArray(trip?.milestones) ? trip.milestones : [],
        };
      }

      return null;
    })();

    async function openEditor() {
      try {
        setEditLoading(true);

        if (embeddedDetail) {
          setEditTripDetail(embeddedDetail);
          setEditModalOpen(true);
          return;
        }

        const res = await tripApi.getDetail(tripId);
        setEditTripDetail(res.data);
        setDetail(res.data);
        setEditModalOpen(true);
      } catch (error) {
        if (isTripUnavailableError(error)) {
          showToast(getTripUnavailableMessage(error), "warning");
          return;
        }

        showToast(
          error?.response?.data?.message || "Không tải được dữ liệu để chỉnh sửa.",
          "error",
        );
      } finally {
        setEditLoading(false);
      }
    }

    openEditor();
  }

  function handleEditAudience() {
    if (!isOwnerTrip) return;

    setAudienceDraft(displayPrivacy || "public");
    setAudienceModalOpen(true);
  }

  async function handleConfirmAudience() {
    if (!isOwnerTrip || !trip?._id || audienceSaving) return;

    const nextPrivacy = audienceDraft || "public";
    const prevPrivacy = displayPrivacy || "public";

    if (nextPrivacy === prevPrivacy) {
      setAudienceModalOpen(false);
      return;
    }

    try {
      setAudienceSaving(true);

      const res = await tripApi.updatePrivacy(trip._id, {
        privacy: nextPrivacy,
      });

      const savedPrivacy = res.data?.trip?.privacy || nextPrivacy;

      setDisplayPrivacy(savedPrivacy);
      setAudienceDraft(savedPrivacy);
      setAudienceModalOpen(false);

      setDetail((prev) => {
        if (!prev) return prev;

        if (prev?.trip) {
          return {
            ...prev,
            trip: {
              ...prev.trip,
              privacy: savedPrivacy,
            },
          };
        }

        return {
          ...prev,
          privacy: savedPrivacy,
        };
      });

      showToast(
        `Đã cập nhật đối tượng hiển thị sang ${getPrivacyLabel(savedPrivacy)}.`,
        "success",
      );
    } catch (error) {
      const status = Number(error?.response?.status || 0);

      if (status === 404) {
        setAudienceModalOpen(false);
        showToast("Journey này không còn khả dụng.", "warning");
        return;
      }

      showToast(
        error?.response?.data?.message ||
          "Không cập nhật đối tượng hiển thị được.",
        "error",
      );
    } finally {
      setAudienceSaving(false);
    }
  }

  async function handleMoveTripToTrash() {
    if (!isOwnerTrip || !tripId) return;

    try {
      const res = await tripApi.moveToTrash(tripId);

      if (isPinned) {
        setUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pinnedTripId: null,
          };
        });
      }

      setExpanded(false);

      showToast("Đã chuyển journey vào thùng rác.", "success");
      onTripTrashed?.(tripId, res.data?.trip || null);
    } catch (error) {
      const status = Number(error?.response?.status || 0);

      if (status === 404) {
        showToast("Journey này không còn khả dụng.", "warning");
        return;
      }

      showToast(
        error?.response?.data?.message ||
          "Không chuyển journey vào thùng rác được.",
        "error",
      );
    }
  }

  function handleReportTrip() {
    if (isOwnerTrip) return;

    showToast(
      "Menu báo cáo bài viết đã có, bước tiếp theo mới nối luồng report thật.",
      "warning",
    );
  }

  function handleHideTrip() {
    if (isOwnerTrip) return;

    if (!tripId || hideLoading) return;

    async function hideTripFromFeed() {
      try {
        setHideLoading(true);

        const res = await tripApi.hideTrip(tripId);

        showToast("Đã ẩn journey khỏi feed của bạn trong 7 ngày.", "success");
        onTripHidden?.(tripId, res.data || null);
      } catch (error) {
        if (isTripUnavailableError(error)) {
          showToast(getTripUnavailableMessage(error), "warning");
          return;
        }

        showToast(
          error?.response?.data?.message || "Không ẩn journey khỏi feed được.",
          "error",
        );
      } finally {
        setHideLoading(false);
      }
    }

    hideTripFromFeed();
  }

  function handleEditCompleted() {
    setEditModalOpen(false);
    setExpanded(false);
    onForceOpenClose?.();
    onTripUpdated?.(tripId);
  }

  // const activePreview = previewItems[previewIndex];

  return (
    <>
      <ShareJourneyModal
        open={editModalOpen}
        onClose={() => {
          if (!editLoading) {
            setEditModalOpen(false);
          }
        }}
        mode="edit"
        tripId={tripId}
        initialTripDetail={editTripDetail}
        onUpdated={handleEditCompleted}
      />

      {isOwnerTrip ? (
        <JourneyAudienceModal
          open={audienceModalOpen}
          value={audienceDraft}
          onChange={setAudienceDraft}
          onClose={() => {
            if (!audienceSaving) {
              setAudienceModalOpen(false);
            }
          }}
          onConfirm={handleConfirmAudience}
          isSaving={audienceSaving}
        />
      ) : null}

      <AnimatePresence>
        {expanded ? (
          <JourneyDetailOverlay
            key={`journey-overlay-${trip._id}`}
            trip={displayTrip}
            detail={detail}
            detailLoading={detailLoading}
            detailError={detailError}
            commentCount={commentCount}
            onCommentCreated={() => {
              setCommentCount((prev) => prev + 1);
            }}
            onClose={() => {
              setExpanded(false);
              setForceOpenDismissed(true);
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
                    className="block max-w-full cursor-pointer truncate text-left text-[16px] font-semibold text-zinc-900 transition hover:text-[#5b6ee1] "
                  >
                    {ownerName}
                  </button>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-zinc-400">
                    <span>{formatFeedTime(trip.createdAt)}</span>

                    {isPinned ? (
                      <>
                        <span className="w-1 h-1 rounded-full bg-zinc-300" />
                        <span className="inline-flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,rgba(238,242,255,0.98),rgba(245,240,255,0.98))] px-2 py-0.5 text-[12px] font-semibold text-[#5b6ee1] ring-1 ring-violet-100/80">
                          <PinBadgeIcon className="h-3.5 w-3.5" />
                          Pinned Trip
                        </span>
                      </>
                    ) : null}

                    <span className="w-1 h-1 rounded-full bg-zinc-300" />
                    <span className="capitalize">{privacyLabel}</span>
                  </div>
                </div>
              </div>

              <JourneyCardActionsMenu
                variant={isOwnerTrip ? "owner" : "visitor"}
                privacyLabel={privacyLabel}
                isPinned={isPinned}
                isSaved={saved}
                onPin={handlePinTrip}
                onSave={handleSaveTrip}
                onEdit={handleEditTrip}
                onEditAudience={handleEditAudience}
                onMoveToTrash={handleMoveTripToTrash}
                onReport={handleReportTrip}
                onHide={handleHideTrip}
              />
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
                    <p className="mt-3 text-sm font-medium">
                      Chưa có media nào
                    </p>
                  </div>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 pointer-events-none h-28 bg-gradient-to-t from-black/35 via-black/8 to-transparent" />

              <div className="absolute flex flex-wrap gap-2 left-4 top-4">
                {isPinned ? (
                  <JourneyMetaChip text="Pinned" tone="blue" />
                ) : null}
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
