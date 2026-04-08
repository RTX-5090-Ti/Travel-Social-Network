import { useEffect } from "react";
import { motion } from "framer-motion";

import { formatFileSize } from "./shareJourneyModal.utils";
import { XIcon } from "./shareJourneyIcons";

export default function ShareJourneyMediaLightbox({ media, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[180] bg-[linear-gradient(180deg,rgba(248,245,255,0.58),rgba(236,242,255,0.60))] backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="fixed inset-0 z-[190] flex items-center justify-center p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(250,246,255,0.92),rgba(240,247,255,0.90))] shadow-[0_32px_100px_rgba(129,140,248,0.16),0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(245,239,255,0.82))] text-zinc-700 shadow-[0_12px_26px_rgba(148,163,184,0.18)] backdrop-blur-xl transition hover:scale-105 hover:text-zinc-900 hover:shadow-[0_16px_34px_rgba(182,137,255,0.20)]"
          >
            <XIcon className="h-5 w-5" />
          </button>

          <div className="flex max-h-[85vh] min-h-[320px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(182,137,255,0.16),transparent_34%),radial-gradient(circle_at_bottom,rgba(79,124,255,0.10),transparent_38%),linear-gradient(180deg,#fffdfc,#f7f2ff,#eef5ff)] p-3 sm:p-5">
            {media.kind === "image" ? (
              <img
                src={media.previewUrl}
                alt={media.name}
                className="max-h-[72vh] w-auto max-w-full rounded-[22px] object-contain"
              />
            ) : (
              <video
                src={media.previewUrl}
                controls
                autoPlay
                playsInline
                className="max-h-[72vh] w-full rounded-[22px] bg-white/70 object-contain"
              />
            )}
          </div>

          <div className="border-t border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(247,242,255,0.76))] px-5 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {media.name}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {media.kind === "image" ? "Image" : "Video"} •{" "}
                  {formatFileSize(media.size)}
                </p>
              </div>

              <div className="inline-flex w-fit items-center rounded-full border border-[#e7dcff] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(245,238,255,0.92))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c59d9] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                {media.kind === "image" ? "Photo preview" : "Video preview"}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
