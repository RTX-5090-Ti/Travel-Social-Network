import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import CropAvatarPreview from "./CropAvatarPreview";
import { loadImage } from "./profileAvatar.utils";

export default function AvatarCropModal({
  src,
  crop,
  onChangeCrop,
  onClose,
  onSave,
  onLoadedSize,
  isSaving = false,
}) {
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const dragStateRef = useRef({
    dragging: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handlePointerDown(e) {
    dragStateRef.current = {
      dragging: true,
      x: e.clientX,
      y: e.clientY,
    };
  }

  function clampCrop(nextCrop) {
    if (!naturalSize.width || !naturalSize.height) return nextCrop;

    const viewportSize = 440;
    const baseScale = Math.max(
      viewportSize / naturalSize.width,
      viewportSize / naturalSize.height,
    );

    const scale = baseScale * nextCrop.zoom;
    const drawWidth = naturalSize.width * scale;
    const drawHeight = naturalSize.height * scale;

    const maxOffsetX = Math.max(0, (drawWidth - viewportSize) / 2);
    const maxOffsetY = Math.max(0, (drawHeight - viewportSize) / 2);

    return {
      ...nextCrop,
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, nextCrop.x)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, nextCrop.y)),
    };
  }

  useEffect(() => {
    let ignore = false;

    loadImage(src)
      .then((img) => {
        if (ignore) return;
        setNaturalSize({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [src]);

  function handlePointerMove(e) {
    if (!dragStateRef.current.dragging) return;

    const dx = e.clientX - dragStateRef.current.x;
    const dy = e.clientY - dragStateRef.current.y;

    dragStateRef.current.x = e.clientX;
    dragStateRef.current.y = e.clientY;

    onChangeCrop((prev) =>
      clampCrop({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }),
    );
  }

  function handlePointerUp() {
    dragStateRef.current.dragging = false;
  }

  function handleZoomChange(e) {
    const nextZoom = Number(e.target.value);

    onChangeCrop((prev) =>
      clampCrop({
        ...prev,
        zoom: nextZoom,
      }),
    );
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[230] flex items-center justify-center bg-[linear-gradient(180deg,rgba(245,247,255,0.74),rgba(236,242,255,0.78))] p-3 backdrop-blur-md dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.72),rgba(15,23,42,0.82))] sm:p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close crop modal"
        className="absolute inset-0 w-full h-full"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.985, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.985, y: 10 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-[1] w-full max-w-3xl overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,249,255,0.94),rgba(244,240,255,0.92))] shadow-[0_28px_90px_rgba(15,23,42,0.14)] ring-1 ring-zinc-200/60 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(15,23,42,0.98),rgba(30,27,75,0.96))] dark:shadow-[0_28px_90px_rgba(2,6,23,0.55)] dark:ring-white/10"
      >
        <div className="flex items-center justify-between border-b border-zinc-200/70 px-5 py-4 dark:border-white/10 sm:px-7">
          <div>
            <h3 className="text-[28px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Chọn ảnh đại diện
            </h3>
            <p className="mt-1 text-[14px] text-zinc-500 dark:text-zinc-400">
              Kéo ảnh để chọn khung hiển thị phù hợp.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/70 bg-white/80 text-zinc-500 shadow-sm transition hover:scale-105 hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <span className="text-[30px] leading-none">×</span>
          </button>
        </div>

        <div className="px-5 py-6 sm:px-7 sm:py-7">
          <div className="rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(242,246,255,0.86),rgba(245,240,255,0.82))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(30,41,59,0.92),rgba(30,27,75,0.92))] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex justify-center">
              <div
                className="relative aspect-square w-full max-w-[440px] overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(102,126,234,0.10),rgba(118,75,162,0.12),rgba(255,255,255,0.55))] shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                style={{ touchAction: "none", cursor: "move" }}
              >
                <CropAvatarPreview
                  src={src}
                  crop={crop}
                  onLoadedSize={onLoadedSize}
                />

                <div className="pointer-events-none absolute inset-0 rounded-[30px] ring-1 ring-white/70" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(15,23,42,0.06))]" />
              </div>
            </div>

            <div className="mx-auto mt-6 w-full max-w-[680px]">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    onChangeCrop((prev) =>
                      clampCrop({
                        ...prev,
                        zoom: Math.max(1, +(prev.zoom - 0.1).toFixed(2)),
                      }),
                    )
                  }
                  className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/70 bg-white/80 text-zinc-500 shadow-sm transition hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <span className="text-[24px] leading-none">−</span>
                </button>

                <input
                  type="range"
                  min="1"
                  max="2.4"
                  step="0.01"
                  value={crop.zoom}
                  onChange={handleZoomChange}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-[#5b63f6] dark:bg-white/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    onChangeCrop((prev) =>
                      clampCrop({
                        ...prev,
                        zoom: Math.min(2.4, +(prev.zoom + 0.1).toFixed(2)),
                      }),
                    )
                  }
                  className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/70 bg-white/80 text-[#5b63f6] shadow-sm transition hover:scale-105 hover:text-[#4b54e8] dark:border-white/10 dark:bg-white/5 dark:text-violet-200 dark:hover:bg-white/10 dark:hover:text-violet-100"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[14px] text-zinc-500"></div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-200/70 px-5 py-5 dark:border-white/10 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="cursor-pointer rounded-2xl px-5 py-3 text-[15px] font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-zinc-500 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white dark:disabled:hover:bg-transparent dark:disabled:hover:text-zinc-300"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="cursor-pointer rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-8 py-3 text-[15px] font-semibold text-white shadow-[0_14px_28px_rgba(102,126,234,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(102,126,234,0.34)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[0_14px_28px_rgba(102,126,234,0.28)] dark:shadow-[0_14px_28px_rgba(15,23,42,0.34)] dark:hover:shadow-[0_18px_34px_rgba(15,23,42,0.4)]"
          >
            {isSaving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
