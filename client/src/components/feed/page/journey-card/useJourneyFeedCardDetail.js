import { useCallback, useEffect, useRef, useState } from "react";

import {
  tripApi,
  getTripUnavailableMessage,
  isTripUnavailableError,
} from "../../../../api/trip.api";
import { hasEmbeddedDetail } from "./journeyFeedCard.utils";

export default function useJourneyFeedCardDetail({
  trip,
  forceOpen,
  onForceOpenClose,
  showToast,
}) {
  const detailRequestIdRef = useRef(0);
  const [expanded, setExpanded] = useState(false);
  const [forceOpenDismissed, setForceOpenDismissed] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detail, setDetail] = useState(() =>
    hasEmbeddedDetail(trip) ? trip : null,
  );

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
      } catch (error) {
        if (detailRequestIdRef.current !== requestId) return;

        if (isTripUnavailableError(error)) {
          closeOverlayWithUnavailableToast(error);
          onForceOpenClose?.();
          return;
        }

        setDetailError(
          error?.response?.data?.message || "Không tải được chi tiết journey.",
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

  const handleToggleShow = useCallback(async () => {
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
        error?.response?.data?.message || "Không tải được chi tiết journey.",
      );
    } finally {
      if (detailRequestIdRef.current === requestId) {
        setDetailLoading(false);
      }
    }
  }, [
    closeOverlayWithUnavailableToast,
    detail,
    detailLoading,
    expanded,
    onForceOpenClose,
    trip,
  ]);

  const handleOverlayClose = useCallback(() => {
    setExpanded(false);
    setForceOpenDismissed(true);
    onForceOpenClose?.();
  }, [onForceOpenClose]);

  return {
    expanded,
    setExpanded,
    forceOpenDismissed,
    setForceOpenDismissed,
    detailLoading,
    detailError,
    detail,
    setDetail,
    setDetailError,
    handleToggleShow,
    handleOverlayClose,
  };
}
