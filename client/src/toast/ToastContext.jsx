import { useCallback, useMemo, useState } from "react";
import { ToastContext } from "./toast-context";

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info") => {
    const id =
      window.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const toast = {
      id,
      message,
      type, // "success" | "error" | "warning" | "info"
    };

    setToasts((prev) => [...prev, toast]);

    return id;
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      removeToast,
      clearToasts,
    }),
    [toasts, showToast, removeToast, clearToasts],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}
