import { AnimatePresence, motion } from "framer-motion";
import { Check, Trash2 } from "lucide-react";

export default function DeleteAccountModal({
  open,
  success,
  countdown,
  isSubmitting,
  onClose,
  onConfirm,
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[241] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close delete confirmation"
            onClick={onClose}
            className="absolute inset-0 cursor-pointer bg-[linear-gradient(180deg,rgba(24,24,27,0.36),rgba(24,24,27,0.42))] backdrop-blur-[8px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-[1] w-full max-w-[460px] overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(255,244,247,0.97),rgba(255,255,255,0.99))] p-6 shadow-[0_28px_64px_rgba(15,23,42,0.2)] ring-1 ring-white/70"
          >
            <AnimatePresence mode="wait" initial={false}>
              {success ? (
                <motion.div
                  key="delete-success"
                  initial={{ opacity: 0, x: 32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -32 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center"
                >
                  <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#14c8b8] shadow-[0_16px_34px_rgba(20,200,184,0.28)]">
                    <Check className="h-10 w-10 stroke-[3.2] text-white" />
                  </div>

                  <h3 className="mt-5 text-[24px] font-semibold tracking-tight text-zinc-900">
                    Account deleted successfully
                  </h3>

                  <p className="mt-3 whitespace-nowrap text-[14px] font-medium text-zinc-500">
                    You will be redirected to the login page in
                  </p>

                  <div className="mt-3 text-[48px] leading-none tracking-[-0.04em] text-[#19191c] tabular-nums">
                    {countdown}s
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="delete-confirm"
                  initial={{ opacity: 0, x: -32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 32 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-rose-100/90 text-rose-600 shadow-[0_10px_24px_rgba(244,63,94,0.12)]">
                    <Trash2 className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 text-[24px] font-semibold tracking-tight text-zinc-900">
                    Delete account permanently?
                  </h3>

                  <p className="mt-3 text-[14px] leading-7 text-zinc-500">
                    Your account will be permanently deleted after 7 days. You
                    can cancel by logging in.
                  </p>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex h-10 cursor-pointer items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={onConfirm}
                      disabled={isSubmitting}
                      className="inline-flex h-10 cursor-pointer items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fb7185_0%,#f43f5e_100%)] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(244,63,94,0.2)] transition hover:-translate-y-0.5"
                    >
                      {isSubmitting ? "Please wait..." : "Delete"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
