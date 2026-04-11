import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { formatFeedTime } from "../../feed/page/feed.utils";

export default function ProfileMediaLightbox({
  mediaItems,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}) {
  const activeItem = mediaItems[currentIndex] ?? null;
  const videoRef = useRef(null);

  useEffect(() => {
    if (!activeItem) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [activeItem]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (!activeItem) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onPrev?.();
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        onNext?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeItem, onClose, onPrev, onNext]);

  useEffect(() => {
    if (activeItem?.type !== "video") return;

    const node = videoRef.current;
    if (!node) return;

    node.currentTime = 0;

    const playPromise = node.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {});
    }
  }, [activeItem?.type, activeItem?.url]);

  if (!activeItem) return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[linear-gradient(180deg,rgba(248,245,255,0.58),rgba(236,242,255,0.60))] p-3 backdrop-blur-md dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.78),rgba(15,23,42,0.82))] sm:p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label="Close media viewer"
        onClick={onClose}
        className="absolute inset-0 w-full h-full cursor-default "
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.985, y: 8 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-[1] flex h-full max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(250,246,255,0.92),rgba(240,247,255,0.90))] shadow-[0_32px_100px_rgba(129,140,248,0.16),0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(15,23,42,0.98),rgba(30,27,75,0.96))] dark:shadow-[0_32px_100px_rgba(2,6,23,0.55)] dark:ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {mediaItems.length > 1 ? (
          <>
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous media"
              className="absolute left-3 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(245,239,255,0.84))] text-[28px] font-semibold text-zinc-700 shadow-[0_12px_26px_rgba(148,163,184,0.18)] backdrop-blur-xl transition hover:scale-105 hover:text-zinc-900 hover:shadow-[0_16px_34px_rgba(182,137,255,0.20)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.9),rgba(30,27,75,0.88))] dark:text-zinc-200 dark:shadow-[0_12px_26px_rgba(2,6,23,0.32)] dark:hover:text-white dark:hover:shadow-[0_16px_34px_rgba(15,23,42,0.4)] sm:left-4 cursor-pointer"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={onNext}
              aria-label="Next media"
              className="absolute right-3 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(245,239,255,0.84))] text-[28px] font-semibold text-zinc-700 shadow-[0_12px_26px_rgba(148,163,184,0.18)] backdrop-blur-xl transition hover:scale-105 hover:text-zinc-900 hover:shadow-[0_16px_34px_rgba(182,137,255,0.20)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.9),rgba(30,27,75,0.88))] dark:text-zinc-200 dark:shadow-[0_12px_26px_rgba(2,6,23,0.32)] dark:hover:text-white dark:hover:shadow-[0_16px_34px_rgba(15,23,42,0.4)] sm:right-4 cursor-pointer"
            >
              ›
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close media viewer"
          className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(245,239,255,0.82))] text-zinc-700 shadow-[0_12px_26px_rgba(148,163,184,0.18)] backdrop-blur-xl transition hover:scale-105 hover:text-zinc-900 hover:shadow-[0_16px_34px_rgba(182,137,255,0.20)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.9),rgba(30,27,75,0.88))] dark:text-zinc-200 dark:shadow-[0_12px_26px_rgba(2,6,23,0.32)] dark:hover:text-white dark:hover:shadow-[0_16px_34px_rgba(15,23,42,0.4)] cursor-pointer"
        >
          ✕
        </button>

        <div className="flex min-h-0 flex-1 w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(182,137,255,0.16),transparent_34%),radial-gradient(circle_at_bottom,rgba(79,124,255,0.10),transparent_38%),linear-gradient(180deg,#fffdfc,#f7f2ff,#eef5ff)] p-3 dark:bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.18),transparent_34%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.12),transparent_38%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.98),rgba(17,24,39,0.98))] sm:p-5">
          {activeItem.type === "video" ? (
            <video
              ref={videoRef}
              src={activeItem.url}
              controls
              playsInline
              preload="metadata"
              className="max-h-full max-w-full rounded-[22px] bg-white/70 object-contain"
            />
          ) : (
            <img
              src={activeItem.url}
              alt={activeItem.tripTitle}
              className="max-h-full max-w-full rounded-[22px] object-contain"
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(247,242,255,0.76))] px-4 pb-3 pt-3 text-zinc-800 backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(17,24,39,0.9))] dark:text-zinc-100 sm:px-5">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-50">
              {activeItem.tripTitle}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{activeItem.type === "video" ? "Video" : "Photo"}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300" />
              <span className="capitalize">{activeItem.privacy}</span>
              {activeItem.createdAt ? (
                <>
                  <span className="w-1 h-1 rounded-full bg-zinc-300" />
                  <span>{formatFeedTime(activeItem.createdAt)}</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="inline-flex shrink-0 items-center rounded-full border border-[#e7dcff] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(245,238,255,0.92))] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c59d9] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-violet-400/20 dark:bg-[linear-gradient(135deg,rgba(30,41,59,0.92),rgba(30,27,75,0.9))] dark:text-violet-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            {currentIndex + 1} / {mediaItems.length}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
