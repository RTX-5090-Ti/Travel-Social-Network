import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function AvatarPreviewModal({ src, alt, onClose }) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[240] flex items-center justify-center bg-[linear-gradient(180deg,rgba(247,248,255,0.76),rgba(239,243,255,0.78),rgba(245,240,255,0.78))] p-3 backdrop-blur-md dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.72),rgba(15,23,42,0.82))] sm:p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close avatar preview"
        className="absolute inset-0 w-full h-full"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.985, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.985, y: 10 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-[1] w-full max-w-3xl overflow-hidden rounded-[34px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,249,255,0.94),rgba(244,240,255,0.92))] shadow-[0_28px_90px_rgba(15,23,42,0.14)] ring-1 ring-zinc-200/60 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(15,23,42,0.98),rgba(30,27,75,0.96))] dark:shadow-[0_28px_90px_rgba(2,6,23,0.55)] dark:ring-white/10"
      >
        <div className="flex items-center justify-end border-b border-zinc-200/70 px-5 py-4 dark:border-white/10 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/70 bg-white/80 text-zinc-500 shadow-sm transition hover:scale-105 hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex justify-center">
            <div className="relative w-full max-w-[560px] overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(135deg,rgba(102,126,234,0.10),rgba(118,75,162,0.12),rgba(255,255,255,0.55))] p-3 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(30,41,59,0.92),rgba(30,27,75,0.92))] dark:shadow-[0_24px_60px_rgba(2,6,23,0.35)]">
              <div className="overflow-hidden rounded-[28px]">
                <img
                  src={src}
                  alt={alt}
                  className="block object-cover w-full aspect-square"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
