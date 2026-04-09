import { useEffect, useState } from "react";

export default function useJourneyFeedCardPreview({ trip, expanded, cardRef }) {
  const supportsIntersectionObserver =
    typeof IntersectionObserver !== "undefined";

  const [isNearViewport, setIsNearViewport] = useState(
    () => !supportsIntersectionObserver,
  );
  const [isInViewport, setIsInViewport] = useState(
    () => !supportsIntersectionObserver,
  );
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previousPreviewIndex, setPreviousPreviewIndex] = useState(null);
  const [previewDirection, setPreviewDirection] = useState(1);

  const rawItems = trip.feedPreview?.previewMedia?.length
    ? trip.feedPreview.previewMedia
    : trip.coverUrl
      ? [{ url: trip.coverUrl, type: "image" }]
      : [];

  const seen = new Set();

  const previewItems = rawItems
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

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    if (!supportsIntersectionObserver) {
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
  }, [cardRef, supportsIntersectionObserver]);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    if (!supportsIntersectionObserver) {
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
  }, [cardRef, supportsIntersectionObserver]);

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

    queueMicrotask(() => {
      setPreviousPreviewIndex(null);
    });
  }, [shouldAutoplayPreview]);

  useEffect(() => {
    queueMicrotask(() => {
      setPreviewIndex(0);
      setPreviousPreviewIndex(null);
      setPreviewDirection(1);
    });
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

  return {
    previewItems,
    previewIndex,
    previousPreviewIndex,
    previewDirection,
    shouldPlayActiveMedia,
    shouldAutoplayPreview,
  };
}
