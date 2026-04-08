import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function SettingsAccordion({
  title,
  description,
  icon: Icon,
  open = false,
  onToggle,
  children,
}) {
  return (
    <div className="overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,#ffffff,#fbfbff)] shadow-[0_16px_34px_rgba(15,23,42,0.04)] ring-1 ring-zinc-200/60">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/65"
      >
        <div className="flex min-w-0 items-start gap-4">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,rgba(102,126,234,0.12),rgba(118,75,162,0.16))] text-violet-600 shadow-[0_10px_24px_rgba(102,126,234,0.10)]">
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h4 className="text-[19px] font-semibold tracking-tight text-zinc-900">
              {title}
            </h4>
            <p className="mt-2 text-[14px] leading-7 text-zinc-500">
              {description}
            </p>
          </div>
        </div>

        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200/70 bg-white/80 text-zinc-500 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex"
          >
            <ChevronDown className="h-5 w-5" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -8 }}
              animate={{ y: 0 }}
              exit={{ y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="border-t border-zinc-100/80 px-5 pb-5 pt-4"
            >
              {children}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
