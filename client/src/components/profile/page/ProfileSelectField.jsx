import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search } from "lucide-react";

function normalizeText(value = "") {
  return String(value).toLowerCase().trim();
}

export default function ProfileSelectField({
  value,
  onChange,
  options = [],
  placeholder = "Select option",
  helperText = "Tap to choose",
  searchable = false,
  searchPlaceholder = "Tìm kiếm...",
  emptyMessage = "Không tìm thấy kết quả phù hợp.",
  showSelectedDescription = true,
  showHelperText = true,
}) {
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuStyle, setMenuStyle] = useState(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) || null,
    [options, value],
  );

  const secondaryText = selectedOption
    ? showSelectedDescription
      ? selectedOption.description
      : ""
    : showHelperText
      ? helperText
      : "";

  const filteredOptions = useMemo(() => {
    if (!searchable) return options;

    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return options;

    return options.filter((option) => {
      const haystack = normalizeText(
        `${option.label} ${option.description || ""}`,
      );
      return haystack.includes(normalizedQuery);
    });
  }, [options, query, searchable]);

  function closeMenu() {
    setOpen(false);
    setQuery("");
  }

  function updateMenuPosition() {
    const triggerEl = buttonRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const viewportPadding = 16;
    const offset = 12;
    const preferredMaxHeight = searchable ? 340 : 300;

    const availableBelow = window.innerHeight - rect.bottom - viewportPadding;
    const availableAbove = rect.top - viewportPadding;

    const shouldOpenUp =
      availableBelow < 220 && availableAbove > availableBelow;

    const nextMaxHeight = Math.max(
      160,
      Math.min(
        preferredMaxHeight,
        shouldOpenUp ? availableAbove - offset : availableBelow - offset,
      ),
    );

    const nextTop = shouldOpenUp
      ? Math.max(viewportPadding, rect.top - nextMaxHeight - offset)
      : Math.min(
          rect.bottom + offset,
          window.innerHeight - viewportPadding - nextMaxHeight,
        );

    const nextWidth = Math.min(
      Math.max(rect.width, 220),
      window.innerWidth - viewportPadding * 2,
    );

    const nextLeft = Math.min(
      Math.max(viewportPadding, rect.left),
      window.innerWidth - viewportPadding - nextWidth,
    );

    setMenuStyle({
      top: nextTop,
      left: nextLeft,
      width: nextWidth,
      maxHeight: nextMaxHeight,
      placement: shouldOpenUp ? "top" : "bottom",
    });
  }

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();

    function handleResizeOrScroll() {
      updateMenuPosition();
    }

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [open, searchable, filteredOptions.length]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      const target = e.target;

      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;

      closeMenu();
    }

    function handleEscape(e) {
      if (e.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleToggle() {
    if (open) {
      closeMenu();
      return;
    }

    setQuery("");
    setOpen(true);
  }

  function handleSelect(nextValue) {
    onChange?.(nextValue);
    closeMenu();
  }

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const listMaxHeight = Math.max(
    120,
    (menuStyle?.maxHeight || 280) - (searchable ? 82 : 16),
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className={`group flex w-full items-center justify-between gap-3 rounded-[20px] border px-4 py-3.5 text-left transition duration-300 ${
          open
            ? "border-[rgba(139,92,246,0.24)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,242,255,0.96))] shadow-[0_16px_30px_rgba(124,58,237,0.12)] ring-1 ring-[rgba(139,92,246,0.10)]"
            : "border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,243,252,0.96))] shadow-[0_10px_22px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(91,99,246,0.10)]"
        }`}
      >
        <div className="min-w-0">
          <p
            className={`truncate text-[14px] font-semibold ${
              selectedOption ? "text-zinc-900" : "text-zinc-400"
            }`}
          >
            {selectedOption?.label || placeholder}
          </p>

          {secondaryText ? (
            <p className="mt-1 truncate text-[12px] text-zinc-500">
              {secondaryText}
            </p>
          ) : null}
        </div>

        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/85 text-zinc-400 shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition duration-300 ${
            open ? "rotate-180 text-[#7c3aed]" : "group-hover:text-zinc-600"
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </span>
      </button>

      {portalTarget
        ? createPortal(
            <AnimatePresence>
              {open && menuStyle ? (
                <motion.div
                  ref={menuRef}
                  initial={{
                    opacity: 0,
                    y: menuStyle.placement === "top" ? -8 : 8,
                    scale: 0.985,
                  }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    y: menuStyle.placement === "top" ? -6 : 6,
                    scale: 0.985,
                  }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: "fixed",
                    top: menuStyle.top,
                    left: menuStyle.left,
                    width: menuStyle.width,
                    zIndex: 500,
                  }}
                  className="overflow-hidden rounded-[24px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,247,255,0.98),rgba(247,242,255,0.98))] shadow-[0_24px_54px_rgba(76,82,160,0.18)] ring-1 ring-[rgba(255,255,255,0.72)] backdrop-blur-xl"
                >
                  {searchable ? (
                    <div className="px-3 py-3 border-b border-white/70">
                      <div className="flex items-center gap-2 rounded-[18px] border border-white/75 bg-white/85 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-zinc-200/55">
                        <Search className="w-4 h-4 shrink-0 text-zinc-400" />
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder={searchPlaceholder}
                          className="w-full border-0 bg-transparent text-[14px] text-zinc-700 outline-none placeholder:text-zinc-400"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div
                    className="p-2 overflow-y-auto"
                    style={{ maxHeight: listMaxHeight }}
                  >
                    {filteredOptions.length ? (
                      filteredOptions.map((option, index) => {
                        const isSelected = option.value === value;

                        return (
                          <button
                            key={`${option.value ?? option.label ?? "option"}-${index}`}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            className={`mb-2 w-full rounded-[18px] px-3.5 py-3 text-left transition last:mb-0 ${
                              isSelected
                                ? "bg-[linear-gradient(135deg,rgba(247,242,255,0.98),rgba(238,245,255,0.96))] ring-1 ring-[rgba(139,92,246,0.14)] shadow-[0_10px_22px_rgba(124,58,237,0.10)]"
                                : "hover:bg-white/85"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-[14px] font-semibold text-zinc-900">
                                  {option.label}
                                </p>
                                {option.description ? (
                                  <p className="mt-1 text-[12px] leading-5 text-zinc-500">
                                    {option.description}
                                  </p>
                                ) : null}
                              </div>

                              <span
                                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                                  isSelected
                                    ? "border-[#c4b5fd] bg-white/85 text-[#7c3aed]"
                                    : "border-white/80 bg-white/80 text-transparent"
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-8 text-center">
                        <p className="text-[13px] font-medium text-zinc-500">
                          {emptyMessage}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            portalTarget,
          )
        : null}
    </div>
  );
}
