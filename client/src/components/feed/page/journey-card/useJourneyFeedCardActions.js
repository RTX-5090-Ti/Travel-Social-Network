import { useEffect, useState } from "react";

import {
  tripApi,
  getTripUnavailableMessage,
  isTripUnavailableError,
} from "../../../../api/trip.api";
import { getPrivacyLabel } from "../feed.utils";
import { hasEmbeddedDetail } from "./journeyFeedCard.utils";

export default function useJourneyFeedCardActions({
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
}) {
  const [liked, setLiked] = useState(!!trip.hearted);
  const [likeCount, setLikeCount] = useState(trip.counts?.reactions ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [saved, setSaved] = useState(!!trip.saved);
  const [saveLoading, setSaveLoading] = useState(false);
  const [hideLoading, setHideLoading] = useState(false);

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

  useEffect(() => {
    const nextPrivacy = trip.privacy || "public";
    setDisplayPrivacy(nextPrivacy);
    setAudienceDraft(nextPrivacy);
    setAudienceModalOpen(false);
  }, [trip._id, trip.privacy]);

  useEffect(() => {
    setLiked(!!trip.hearted);
  }, [trip._id, trip.hearted]);

  useEffect(() => {
    setLikeCount(trip.counts?.reactions ?? 0);
  }, [trip._id, trip.counts?.reactions]);

  useEffect(() => {
    setSaved(!!trip.saved);
  }, [trip._id, trip.saved]);

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
          generalItems: Array.isArray(trip?.generalItems)
            ? trip.generalItems
            : [],
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
          error?.response?.data?.message ||
            "Không tải được dữ liệu để chỉnh sửa.",
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

  function handleEditModalClose() {
    if (!editLoading) {
      setEditModalOpen(false);
    }
  }

  function handleAudienceModalClose() {
    if (!audienceSaving) {
      setAudienceModalOpen(false);
    }
  }

  return {
    liked,
    likeCount,
    likeLoading,
    saved,
    displayPrivacy,
    audienceModalOpen,
    audienceDraft,
    audienceSaving,
    editModalOpen,
    editLoading,
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
  };
}
