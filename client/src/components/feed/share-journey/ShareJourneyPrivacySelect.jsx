import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  CheckIcon,
  ChevronDownIcon,
  PrivacyOptionIcon,
} from "./shareJourneyIcons";

export default function ShareJourneyPrivacySelect({
  value,
  onChange,
  options,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected = options.find((item) => item.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`group relative flex min-h-[60px] w-full cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-[20px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,248,250,0.96))] px-3 py-3 text-left shadow-[0_10px_26px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_18px_48px_rgba(15,23,42,0.10)] focus:outline-none focus:ring-4 focus:ring-[#d7c3a3]/25 sm:min-h-[72px] sm:gap-4 sm:rounded-[24px] sm:px-4 sm:py-4 sm:shadow-[0_14px_40px_rgba(15,23,42,0.06)] ${
          open ? "border-[#d7c3a3]/70 ring-[#d7c3a3]/40" : ""
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(212,175,122,0.75),transparent)]" />

        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-white/70 bg-[linear-gradient(135deg,#fff7ed,#f5ecff)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:h-12 sm:w-12 sm:rounded-[18px]">
            <PrivacyOptionIcon
              value={selected.value}
              className="h-4 w-4 text-zinc-700 sm:h-5 sm:w-5"
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[14px] font-semibold tracking-[0.01em] text-zinc-900 sm:text-[15px]">
                {selected.label}
              </p>

              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] sm:px-2.5 sm:py-1 sm:text-[11px] ${selected.tone}`}
              >
                Selected
              </span>
            </div>

            <p className="mt-0.5 line-clamp-2 text-[12px] leading-4.5 text-zinc-500 sm:mt-1 sm:text-[13px] sm:leading-5">
              {selected.description}
            </p>
          </div>
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200/80 bg-white/80 shadow-[0_6px_16px_rgba(15,23,42,0.05)] sm:h-10 sm:w-10">
          <ChevronDownIcon
            className={`h-4 w-4 text-zinc-500 transition duration-200 sm:h-4.5 sm:w-4.5 ${
              open ? "rotate-180 text-zinc-800" : "group-hover:text-zinc-700"
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-[calc(100%+12px)] z-[160] overflow-hidden rounded-[26px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,247,249,0.98))] p-2.5 shadow-[0_28px_70px_rgba(15,23,42,0.16)] ring-1 ring-zinc-200/70 backdrop-blur-xl"
          >
            <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(212,175,122,0.85),transparent)]" />

            <div className="space-y-1.5">
              {options.map((item) => {
                const active = item.value === value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    className={`group flex w-full cursor-pointer items-start gap-2.5 rounded-[16px] px-2.5 py-2.5 text-left transition sm:gap-3 sm:rounded-[20px] sm:px-3 sm:py-3.5 ${
                      active
                        ? "bg-[linear-gradient(135deg,rgba(255,247,237,0.95),rgba(245,236,255,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                        : "hover:bg-white/90"
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border border-white/70 bg-white/90 shadow-[0_8px_20px_rgba(15,23,42,0.05)] sm:h-11 sm:w-11 sm:rounded-[16px]">
                      <PrivacyOptionIcon
                        value={item.value}
                        className="h-4 w-4 text-zinc-700 sm:h-5 sm:w-5"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`text-[13px] font-semibold sm:text-[14px] ${
                            active ? "text-zinc-950" : "text-zinc-800"
                          }`}
                        >
                          {item.label}
                        </p>

                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] sm:px-2.5 sm:py-1 sm:text-[10px] ${item.tone}`}
                        >
                          {item.value}
                        </span>
                      </div>

                      <p className="mt-0.5 text-[11.5px] leading-4.5 text-zinc-500 sm:mt-1 sm:text-[12.5px] sm:leading-5">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex h-7 w-7 shrink-0 items-center justify-center sm:h-8 sm:w-8">
                      {active ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,#caa56c,#b689ff)] text-white shadow-[0_8px_18px_rgba(202,165,108,0.28)] sm:h-7 sm:w-7">
                          <CheckIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </div>
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-zinc-300 transition group-hover:bg-zinc-400 sm:h-2.5 sm:w-2.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
