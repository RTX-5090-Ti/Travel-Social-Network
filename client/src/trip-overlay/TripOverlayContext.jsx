import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";

import JourneyFeedCard from "../components/feed/page/JourneyFeedCard";
import { TripOverlayContext } from "./trip-overlay-context";
import {
  tripApi,
  getTripUnavailableMessage,
  isTripUnavailableError,
} from "../api/trip.api";
import { useToast } from "../toast/useToast";

function normalizeOverlayTrip(detailPayload) {
  const baseTrip = detailPayload?.trip;
  if (!baseTrip?._id) return null;

  return {
    ...baseTrip,
    generalItems: Array.isArray(detailPayload?.generalItems)
      ? detailPayload.generalItems
      : [],
    milestones: Array.isArray(detailPayload?.milestones)
      ? detailPayload.milestones
      : [],
  };
}

export function TripOverlayProvider({ children }) {
  const { showToast } = useToast();
  const [overlayTarget, setOverlayTarget] = useState(null);
  const [overlayTrip, setOverlayTrip] = useState(null);
  const [overlayLoading, setOverlayLoading] = useState(false);
  const requestIdRef = useRef(0);

  const openTripOverlay = useCallback((target) => {
    if (!target?.tripId) return;

    setOverlayTrip(null);
    setOverlayTarget({
      ...target,
      nonce:
        target?.nonce ||
        `${Date.now()}-${target.tripId}-${target.focusCommentId || "trip"}`,
    });
  }, []);

  const closeTripOverlay = useCallback(() => {
    requestIdRef.current += 1;
    setOverlayTarget(null);
    setOverlayTrip(null);
    setOverlayLoading(false);
  }, []);

  useEffect(() => {
    if (!overlayTarget?.tripId) return undefined;

    let ignore = false;
    const requestId = ++requestIdRef.current;

    async function hydrateOverlayTrip() {
      try {
        setOverlayLoading(true);

        const res = await tripApi.getDetail(overlayTarget.tripId);
        if (ignore || requestId !== requestIdRef.current) return;

        const nextTrip = normalizeOverlayTrip(res.data);

        if (!nextTrip) {
          throw new Error("Missing trip detail");
        }

        setOverlayTrip(nextTrip);
      } catch (error) {
        if (ignore || requestId !== requestIdRef.current) return;

        showToast(
          getTripUnavailableMessage(
            error,
            "Không tải được chi tiết journey lúc này.",
          ),
          isTripUnavailableError(error) ? "warning" : "error",
        );
        closeTripOverlay();
      } finally {
        if (!ignore && requestId === requestIdRef.current) {
          setOverlayLoading(false);
        }
      }
    }

    hydrateOverlayTrip();

    return () => {
      ignore = true;
    };
  }, [closeTripOverlay, overlayTarget, showToast]);

  const value = useMemo(
    () => ({
      openTripOverlay,
      closeTripOverlay,
      isTripOverlayOpen: !!overlayTarget,
    }),
    [closeTripOverlay, openTripOverlay, overlayTarget],
  );

  return (
    <TripOverlayContext.Provider value={value}>
      {children}

      <AnimatePresence>
        {overlayTarget && overlayTrip ? (
          <JourneyFeedCard
            key={`global-trip-overlay-${overlayTarget.nonce}`}
            trip={overlayTrip}
            forceOpen
            overlayOnly
            targetCommentId={overlayTarget.focusCommentId || ""}
            targetThreadCommentId={overlayTarget.threadCommentId || ""}
            onForceOpenClose={closeTripOverlay}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {overlayTarget && !overlayTrip && overlayLoading ? (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-zinc-950/18 backdrop-blur-[2px]">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/95 px-5 py-3 text-sm font-semibold text-zinc-600 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-500" />
              Đang mở journey...
            </div>
          </div>
        ) : null}
      </AnimatePresence>
    </TripOverlayContext.Provider>
  );
}
