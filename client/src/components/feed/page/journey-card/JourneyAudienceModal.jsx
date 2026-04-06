import { AnimatePresence, motion } from "framer-motion";

function CloseIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function GlobeIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.8 12h16.4" />
      <path d="M12 3.5c2.4 2.5 3.8 5.4 3.8 8.5S14.4 18 12 20.5" />
      <path d="M12 3.5C9.6 6 8.2 8.9 8.2 12s1.4 6 3.8 8.5" />
    </svg>
  );
}

function FollowersIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M16.5 10.5a2.75 2.75 0 1 0 0-5.5" />
      <path d="M3.75 19a5.4 5.4 0 0 1 10.5 0" />
      <path d="M14.75 18a4.2 4.2 0 0 1 5.5-3.95" />
    </svg>
  );
}

function LockIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="5" y="10" width="14" height="10" rx="2.5" />
      <path d="M8 10V8a4 4 0 1 1 8 0v2" />
    </svg>
  );
}

function RadioIcon({ selected }) {
  return (
    <span
      className={`flex h-5.5 w-5.5 items-center justify-center rounded-full border transition ${
        selected ? "border-[#5b6ee1] bg-[#eef2ff]" : "border-zinc-300 bg-white"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full transition ${
          selected ? "bg-[#4f67f5]" : "bg-transparent"
        }`}
      />
    </span>
  );
}

function AudienceOption({
  value,
  selected,
  title,
  description,
  icon: Icon,
  onSelect,
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled) onSelect(value);
      }}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-[20px] border px-3.5 py-3.5 text-left transition ${
        selected
          ? "cursor-pointer border-violet-200/80 bg-[linear-gradient(135deg,rgba(238,242,255,0.96),rgba(245,240,255,0.98))] shadow-[0_14px_34px_rgba(91,110,225,0.10)]"
          : disabled
            ? "cursor-not-allowed border-transparent bg-white/55 opacity-70"
            : "cursor-pointer border-transparent bg-white/70 hover:border-violet-100/80 hover:bg-[linear-gradient(135deg,rgba(250,251,255,0.98),rgba(248,245,255,0.98))]"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border shadow-sm ${
          selected
            ? "border-violet-200/80 bg-[linear-gradient(135deg,rgba(234,239,255,0.98),rgba(245,239,255,0.98))] text-[#5b6ee1]"
            : "border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(244,246,255,0.96))] text-zinc-500"
        }`}
      >
        <Icon className="w-5 h-5" />
      </span>

      <span className="flex-1 min-w-0">
        <span className="block text-[16px] font-semibold text-zinc-900">
          {title}
        </span>
        <span className="mt-1 block text-[13px] leading-6 text-zinc-500">
          {description}
        </span>
      </span>

      <RadioIcon selected={selected} />
    </button>
  );
}

export default function JourneyAudienceModal({
  open,
  value,
  onChange,
  onClose,
  onConfirm,
  isSaving = false,
}) {
  const options = [
    {
      value: "public",
      title: "Public",
      description:
        "Ai đã đăng nhập vào Travel Social cũng có thể xem journey này.",
      icon: GlobeIcon,
    },
    {
      value: "followers",
      title: "Followers",
      description: "Chỉ những người đang follow bạn mới xem được journey này.",
      icon: FollowersIcon,
    },
    {
      value: "private",
      title: "Private",
      description: "Chỉ mình bạn có thể xem journey này.",
      icon: LockIcon,
    },
  ];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[180] flex items-center justify-center bg-[linear-gradient(180deg,rgba(248,245,255,0.54),rgba(235,241,255,0.62))] p-3 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close audience modal"
            onClick={isSaving ? undefined : onClose}
            disabled={isSaving}
            className="absolute inset-0 w-full h-full cursor-default"
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.985 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-[1] w-full max-w-[620px] overflow-hidden rounded-[26px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,248,255,0.98),rgba(250,246,255,0.98))] shadow-[0_26px_72px_rgba(76,81,191,0.18)] ring-1 ring-violet-200/40"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200/70 sm:px-6">
              <h3 className="text-[24px] font-semibold tracking-tight text-zinc-900">
                Chọn đối tượng
              </h3>

              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="inline-flex items-center justify-center w-10 h-10 transition rounded-full bg-zinc-100/90 text-zinc-500 hover:bg-zinc-200/80 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[62vh] overflow-y-auto px-5 py-4 sm:px-6">
              <div className="mb-4">
                <p className="text-[21px] font-semibold tracking-tight text-zinc-900">
                  Ai có thể xem bài viết của bạn?
                </p>
                <p className="mt-1.5 max-w-xl text-[14px] leading-6 text-zinc-500">
                  Chọn đối tượng phù hợp cho journey này. Thiết lập này sẽ quyết
                  định ai được nhìn thấy bài viết trong feed và trang cá nhân
                  của bạn.
                </p>
              </div>

              <div className="space-y-2.5">
                {options.map((option) => (
                  <AudienceOption
                    key={option.value}
                    value={option.value}
                    selected={value === option.value}
                    title={option.title}
                    description={option.description}
                    icon={option.icon}
                    onSelect={onChange}
                    disabled={isSaving}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-zinc-200/70 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-[14px] font-semibold text-[#6b7df2] transition hover:bg-[#eef2ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isSaving}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#5d72f6_0%,#6f63f6_45%,#7d5cf1_100%)] px-5 text-[14px] font-semibold text-white shadow-[0_14px_30px_rgba(93,114,246,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(93,114,246,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Đang lưu..." : "Xong"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
