import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DotsIcon } from "../feed.icons";

function PinIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m15 4 5 5" />
      <path d="m11.5 7.5 5 5" />
      <path d="m14 2 8 8-3 3-3-1-7 7-1.5-1.5 7-7-1-3Z" />
      <path d="M4 20h6" />
    </svg>
  );
}

function BookmarkIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M7 4.75h10a1.25 1.25 0 0 1 1.25 1.25v13.25l-6.25-3.75-6.25 3.75V6A1.25 1.25 0 0 1 7 4.75Z" />
    </svg>
  );
}

function EditIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20Z" />
      <path d="m12.5 7 4.5 4.5" />
    </svg>
  );
}

function AudienceIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 13.5a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Z" />
      <path d="M5.5 19.25a6.5 6.5 0 0 1 13 0" />
      <path d="M18.75 7.25a2.5 2.5 0 1 1 0 5" />
      <path d="M5.25 12.25a2.5 2.5 0 1 1 0-5" />
    </svg>
  );
}

function FlagIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 20V4" />
      <path d="M6 5c2-1.4 4.5-1.4 6.5 0s4.5 1.4 6.5 0v8c-2 1.4-4.5 1.4-6.5 0S8 11.6 6 13" />
    </svg>
  );
}

function EyeOffIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3.5 3.5 20.5 20.5" />
      <path d="M10.6 10.6a2 2 0 1 0 2.8 2.8" />
      <path d="M9.2 5.4A10.7 10.7 0 0 1 12 5c5.1 0 8.7 3.2 10 7-0.5 1.4-1.3 2.8-2.5 4" />
      <path d="M6.2 6.3C4.3 7.6 2.9 9.5 2 12c1.3 3.8 4.9 7 10 7 1.4 0 2.7-0.2 3.9-0.6" />
    </svg>
  );
}

function TrashIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4.5 7.25h15" />
      <path d="M9.25 4.75h5.5" />
      <path d="M7.5 7.25 8.2 18a1.75 1.75 0 0 0 1.75 1.62h4.1A1.75 1.75 0 0 0 15.8 18l.7-10.75" />
      <path d="M10 10.5v5.25" />
      <path d="M14 10.5v5.25" />
    </svg>
  );
}

function MenuActionButton({
  title,
  description,
  icon: Icon,
  tone = "default",
  onClick,
}) {
  const isDanger = tone === "danger";
  const isWarning = tone === "warning";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-2.5 rounded-[18px] px-2.5 py-2.5 text-left transition cursor-pointer ${
        isDanger
          ? "hover:bg-[linear-gradient(135deg,rgba(255,241,242,0.9),rgba(255,247,248,0.95))]"
          : isWarning
            ? "hover:bg-[linear-gradient(135deg,rgba(255,247,237,0.92),rgba(255,251,245,0.96))]"
            : "hover:bg-[linear-gradient(135deg,rgba(245,247,255,0.95),rgba(250,247,255,0.98))]"
      }`}
    >
      <span
        className={`mt-0.5 flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[16px] border shadow-sm transition ${
          isDanger
            ? "border-rose-200/70 bg-[linear-gradient(135deg,rgba(255,241,242,0.95),rgba(255,255,255,0.96))] text-rose-500 group-hover:border-rose-300"
            : isWarning
              ? "border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(255,255,255,0.96))] text-amber-500 group-hover:border-amber-300"
              : "border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(242,246,255,0.94),rgba(248,244,255,0.96))] text-[#667eea] group-hover:border-violet-200/70 group-hover:text-[#5b6ee1]"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <span className="flex-1 min-w-0">
        <span
          className={`block text-[14px] font-semibold leading-5 ${
            isDanger
              ? "text-rose-600"
              : isWarning
                ? "text-amber-600"
                : "text-zinc-800"
          }`}
        >
          {title}
        </span>
        {description ? (
          <span
            className={`mt-0.5 block text-[12px] leading-[18px] ${
              isDanger
                ? "text-rose-400"
                : isWarning
                  ? "text-amber-500"
                  : "text-zinc-500"
            }`}
          >
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export default function JourneyCardActionsMenu({
  variant = "owner",
  privacyLabel = "Public",
  onPin,
  onSave,
  onEdit,
  onEditAudience,
  onMoveToTrash,
  onReport,
  onHide,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const sections = useMemo(() => {
    if (variant === "visitor") {
      return [
        [
          {
            key: "save",
            title: "Lưu bài viết",
            description: "Thêm vào danh sách mục đã lưu",
            icon: BookmarkIcon,
            onClick: onSave,
          },
        ],
        [
          {
            key: "report",
            title: "Báo cáo bài viết",
            description: "Báo cáo nếu nội dung không phù hợp",
            icon: FlagIcon,
            tone: "warning",
            onClick: onReport,
          },
          {
            key: "hide",
            title: "Ẩn bài viết",
            description: "Tạm ẩn journey này khỏi feed của bạn.",
            icon: EyeOffIcon,
            onClick: onHide,
          },
        ],
      ];
    }

    return [
      [
        {
          key: "pin",
          title: "Ghim bài viết",
          description: "",
          icon: PinIcon,
          onClick: onPin,
        },
        {
          key: "save",
          title: "Lưu bài viết",
          description: "Chuyển vào mục đã lưu",
          icon: BookmarkIcon,
          onClick: onSave,
        },
      ],
      [
        {
          key: "edit",
          title: "Chỉnh sửa bài viết",
          description: "",
          icon: EditIcon,
          onClick: onEdit,
        },
        {
          key: "audience",
          title: "Chỉnh sửa đối tượng",
          description: `Đang ở chế độ ${privacyLabel}.`,
          icon: AudienceIcon,
          onClick: onEditAudience,
        },
      ],
      [
        {
          key: "trash",
          title: "Chuyển vào thùng rác",
          description: "Các mục trong thùng rác sẽ bị xoá sau 7 ngày.",
          icon: TrashIcon,
          tone: "danger",
          onClick: onMoveToTrash,
        },
      ],
    ];
  }, [
    variant,
    privacyLabel,
    onPin,
    onSave,
    onEdit,
    onEditAudience,
    onMoveToTrash,
    onReport,
    onHide,
  ]);

  function handleSelect(action) {
    setOpen(false);
    action?.();
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition cursor-pointer ${
          open
            ? "bg-[linear-gradient(135deg,rgba(238,242,255,0.95),rgba(245,240,255,0.98))] text-[#5b6ee1] shadow-[0_10px_22px_rgba(102,126,234,0.16)]"
            : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        }`}
      >
        <DotsIcon className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] z-30 w-[296px] overflow-hidden rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,248,255,0.98),rgba(250,246,255,0.98))] p-2 shadow-[0_22px_64px_rgba(76,81,191,0.16)] ring-1 ring-violet-200/40 backdrop-blur-xl"
          >
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(132,94,247,0.28),transparent)]" />

            {sections.map((section, sectionIndex) => (
              <div key={`section-${sectionIndex}`}>
                {section.map((item) => (
                  <MenuActionButton
                    key={item.key}
                    title={item.title}
                    description={item.description}
                    icon={item.icon}
                    tone={item.tone}
                    onClick={() => handleSelect(item.onClick)}
                  />
                ))}

                {sectionIndex < sections.length - 1 ? (
                  <div className="mx-2.5 my-1 h-px bg-[linear-gradient(90deg,transparent,rgba(161,161,170,0.22),transparent)]" />
                ) : null}
              </div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
