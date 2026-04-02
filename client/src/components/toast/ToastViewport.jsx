import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../../toast/useToast";

const TOAST_DURATION = 3000;
const EXIT_DURATION = 220;

function toastTypeClasses(type) {
  switch (type) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "error":
      return "border-red-200 bg-red-50 text-red-900";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "border-zinc-200 bg-white text-zinc-900";
  }
}

function ToastItem({ toast, onRemove }) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const removedRef = useRef(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = useCallback(() => {
    if (removedRef.current) return;
    removedRef.current = true;
    setClosing(true);

    setTimeout(() => {
      onRemove(toast.id);
    }, EXIT_DURATION);
  }, [onRemove, toast.id]);

  useEffect(() => {
    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, TOAST_DURATION);

    return () => clearTimeout(autoCloseTimer);
  }, [handleClose]);

  return (
    <div
      className={[
        "pointer-events-auto w-full overflow-hidden rounded-2xl border px-4 py-3 shadow-lg",
        "transition-all duration-200 ease-out will-change-transform",
        toastTypeClasses(toast.type),
        mounted && !closing
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{toast.message}</p>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="text-xs font-semibold transition shrink-0 opacity-70 hover:opacity-100"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

export default function ToastViewport() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(92vw,380px)] flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
