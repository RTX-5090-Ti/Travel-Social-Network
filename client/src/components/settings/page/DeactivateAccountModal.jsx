import { AnimatePresence, motion } from "framer-motion";
import { Check, UserX } from "lucide-react";

export default function DeactivateAccountModal({
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
          className="fixed inset-0 z-[240] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close deactivate confirmation"
            onClick={onClose}
            className="absolute inset-0 cursor-pointer bg-[linear-gradient(180deg,rgba(15,23,42,0.28),rgba(15,23,42,0.34))] backdrop-blur-[6px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-[1] w-full max-w-[460px] overflow-hidden rounded-[28px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,235,0.96),rgba(255,255,255,0.98))] p-6 shadow-[0_26px_60px_rgba(15,23,42,0.18)] ring-1 ring-white/70 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(15,23,42,0.98),rgba(30,27,75,0.96))] dark:shadow-[0_26px_60px_rgba(2,6,23,0.5)] dark:ring-white/10"
          >
            <AnimatePresence mode="wait" initial={false}>
              {success ? (
                <motion.div
                  key="deactivate-success"
                  initial={{ opacity: 0, x: 32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -32 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center"
                >
                  <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#14c8b8] shadow-[0_16px_34px_rgba(20,200,184,0.28)]">
                    <Check className="h-10 w-10 stroke-[3.2] text-white" />
                  </div>

                  <h3 className="mt-5 text-[24px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Account deactivated successfully
                  </h3>

                  <p className="mt-3 whitespace-nowrap text-[14px] font-medium text-zinc-500 dark:text-zinc-400">
                    You will be redirected to the login page in
                  </p>

                  <div className="mt-3 text-[48px] leading-none tracking-[-0.04em] text-[#19191c] tabular-nums">
                    {countdown}s
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="deactivate-confirm"
                  initial={{ opacity: 0, x: -32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 32 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-amber-100/85 text-amber-600 shadow-[0_10px_24px_rgba(245,158,11,0.12)]">
                    <UserX className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 text-[24px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Deactivate account?
                  </h3>

                  <p className="mt-3 text-[14px] leading-7 text-zinc-500 dark:text-zinc-400">
                    Your account will be temporarily hidden. You can reactivate
                    your account when you log in.
                  </p>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex h-10 cursor-pointer items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={onConfirm}
                      disabled={isSubmitting}
                      className="inline-flex h-10 cursor-pointer items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b_0%,#d97706_100%)] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(245,158,11,0.20)] transition hover:-translate-y-0.5"
                    >
                      {isSubmitting ? "Please wait..." : "Deactivate"}
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
