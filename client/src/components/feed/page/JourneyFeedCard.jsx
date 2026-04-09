import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";

import { useToast } from "../../../toast/useToast";
import { useAuth } from "../../../auth/useAuth";
import {
  getInitials,
  formatFeedTime,
  getPrivacyLabel,
  countJourneyMedia,
} from "./feed.utils";
import JourneyDetailOverlay from "./journey-card/JourneyDetailOverlay";
import JourneyAudienceModal from "./journey-card/JourneyAudienceModal";
import JourneyFeedCardFooter from "./journey-card/JourneyFeedCardFooter";
import JourneyFeedCardHeader from "./journey-card/JourneyFeedCardHeader";
import JourneyFeedCardPreview from "./journey-card/JourneyFeedCardPreview";
import { getEntityId, getUserAvatar } from "./journey-card/journeyFeedCard.utils";
import useJourneyFeedCardActions from "./journey-card/useJourneyFeedCardActions";
import useJourneyFeedCardDetail from "./journey-card/useJourneyFeedCardDetail";
import useJourneyFeedCardPreview from "./journey-card/useJourneyFeedCardPreview";
import ShareJourneyModal from "../ShareJourneyModal";

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
  const [commentDeltaState, setCommentDeltaState] = useState(() => ({
    tripId: trip._id,
    delta: 0,
  }));
  const cardRef = useRef(null);

  const {
    expanded,
    setExpanded,
    detailLoading,
    detailError,
    detail,
    setDetail,
    handleToggleShow,
    handleOverlayClose,
  } = useJourneyFeedCardDetail({
    trip,
    forceOpen,
    onForceOpenClose,
    showToast,
  });

  const {
    previewItems,
    previewIndex,
    previousPreviewIndex,
    previewDirection,
    shouldPlayActiveMedia,
    shouldAutoplayPreview,
  } = useJourneyFeedCardPreview({
    trip,
    expanded,
    cardRef,
  });

  const {
    liked,
    likeCount,
    likeLoading,
    saved,
    displayPrivacy,
    audienceModalOpen,
    audienceDraft,
    audienceSaving,
    editModalOpen,
    editTripDetail,
    handleToggleLike,
    handlePinTrip,
    handleSaveTrip,
    handleEditTrip,
    handleEditAudience,
    handleConfirmAudience,
    handleMoveTripToTrash,
    handleReportTrip,
    handleHideTrip,
    handleEditCompleted,
    handleEditModalClose,
    handleAudienceModalClose,
    setAudienceDraft,
  } = useJourneyFeedCardActions({
    trip,
    tripId,
    detail,
    setDetail,
    setExpanded,
    setUser,
    showToast,
    isOwnerTrip,
    isPinned,
    surface,
    onTripSavedChange,
    onTripTrashed,
    onTripHidden,
    onForceOpenClose,
    onTripUpdated,
  });

  const previewCaption =
    caption.length > 170 ? `${caption.slice(0, 170).trim()}...` : caption;

  const milestoneCount =
    trip.feedPreview?.milestoneCount ?? detail?.milestones?.length ?? null;

  const mediaCount =
    trip.feedPreview?.mediaCount ??
    trip.feedPreview?.imageCount ??
    (detail ? countJourneyMedia(detail) : previewItems.length);
  const commentCount = Math.max(
    (trip.counts?.comments ?? 0) +
      (commentDeltaState.tripId === trip._id ? commentDeltaState.delta : 0),
    0,
  );
  const privacyLabel = getPrivacyLabel(displayPrivacy);

  const displayTrip = useMemo(
    () => ({
      ...trip,
      privacy: displayPrivacy || "public",
    }),
    [displayPrivacy, trip],
  );

  useEffect(() => {
    queueMicrotask(() => {
      setCommentDeltaState((prev) => {
        if (prev.tripId === trip._id) return prev;
        return { tripId: trip._id, delta: 0 };
      });
    });
  }, [trip._id]);

  const handleCommentCreated = useCallback(() => {
    setCommentDeltaState((prev) => ({
      tripId: trip._id,
      delta: (prev.tripId === trip._id ? prev.delta : 0) + 1,
    }));
  }, [trip._id, setCommentDeltaState]);

  const handleCommentDeleted = useCallback(
    (deletedCount = 1) => {
      setCommentDeltaState((prev) => ({
        tripId: trip._id,
        delta: Math.max(
          (prev.tripId === trip._id ? prev.delta : 0) - deletedCount,
          -1 * (trip.counts?.comments ?? 0),
        ),
      }));
    },
    [trip._id, trip.counts?.comments, setCommentDeltaState],
  );

  // const activePreview = previewItems[previewIndex];

  return (
    <>
      <ShareJourneyModal
        open={editModalOpen}
        onClose={handleEditModalClose}
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
          onClose={handleAudienceModalClose}
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
            onCommentCreated={handleCommentCreated}
            onCommentDeleted={handleCommentDeleted}
            onClose={handleOverlayClose}
          />
        ) : null}
      </AnimatePresence>

      {!overlayOnly ? (
        <article
          ref={cardRef}
          className="-mx-4 overflow-hidden bg-white sm:mx-0 sm:rounded-[30px] sm:border sm:border-white/70 sm:shadow-[0_18px_50px_rgba(17,24,39,0.06)] sm:ring-1 sm:ring-zinc-200/60"
        >
          <JourneyFeedCardHeader
            ownerAvatar={ownerAvatar}
            ownerName={ownerName}
            initials={initials}
            trip={trip}
            createdAtLabel={formatFeedTime(trip.createdAt)}
            onPreviewUser={onPreviewUser}
            isPinned={isPinned}
            privacyLabel={privacyLabel}
            isOwnerTrip={isOwnerTrip}
            saved={saved}
            handlePinTrip={handlePinTrip}
            handleSaveTrip={handleSaveTrip}
            handleEditTrip={handleEditTrip}
            handleEditAudience={handleEditAudience}
            handleMoveTripToTrash={handleMoveTripToTrash}
            handleReportTrip={handleReportTrip}
            handleHideTrip={handleHideTrip}
          />

          <JourneyFeedCardPreview
            previewItems={previewItems}
            previewIndex={previewIndex}
            previousPreviewIndex={previousPreviewIndex}
            shouldAutoplayPreview={shouldAutoplayPreview}
            previewDirection={previewDirection}
            shouldPlayActiveMedia={shouldPlayActiveMedia}
            trip={trip}
            expanded={expanded}
            isPinned={isPinned}
            privacyLabel={privacyLabel}
            milestoneCount={milestoneCount}
            mediaCount={mediaCount}
          />

          <JourneyFeedCardFooter
            tripTitle={trip.title}
            caption={caption}
            previewCaption={previewCaption}
            expanded={expanded}
            likeCount={likeCount}
            commentCount={commentCount}
            milestoneCount={milestoneCount}
            mediaCount={mediaCount}
            liked={liked}
            likeLoading={likeLoading}
            detailLoading={detailLoading}
            onToggleLike={handleToggleLike}
            onToggleShow={handleToggleShow}
          />
        </article>
      ) : null}
    </>
  );
}
