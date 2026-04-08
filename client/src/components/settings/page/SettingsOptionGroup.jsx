export default function SettingsOptionGroup({
  title,
  value,
  onChange,
  options,
}) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,255,0.95))] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)] ring-1 ring-zinc-200/55">
      <h4 className="text-[17px] font-semibold tracking-tight text-zinc-900">
        {title}
      </h4>

      <div className="mt-4 space-y-3">
        {options.map((option) => {
          const checked = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex w-full cursor-pointer items-center justify-between rounded-[18px] border px-4 py-2.5 text-left transition ${
                checked
                  ? "border-violet-200 bg-[linear-gradient(135deg,rgba(102,126,234,0.10),rgba(118,75,162,0.12))] text-zinc-900 shadow-[0_10px_22px_rgba(102,126,234,0.08)]"
                  : "border-zinc-200/80 bg-white text-zinc-600 hover:border-violet-100 hover:bg-violet-50/40"
              }`}
            >
              <span className="text-[14px] font-medium">{option.label}</span>

              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                  checked
                    ? "border-violet-500 bg-violet-500"
                    : "border-zinc-300 bg-white"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    checked ? "bg-white" : "bg-transparent"
                  }`}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
