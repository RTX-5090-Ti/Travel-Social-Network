export default function SectionHeader({
  eyebrow,
  title,
  description,
  actionLabel,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {eyebrow}
        </p>
        <h3 className="mt-2 text-[24px] font-semibold tracking-tight text-zinc-900">
          {title}
        </h3>
        {description ? (
          <p className="mt-2 max-w-2xl text-[14px] leading-7 text-zinc-500">
            {description}
          </p>
        ) : null}
      </div>

      {actionLabel ? (
        <button className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-[13px] font-semibold text-[#4f7cff] shadow-sm transition hover:bg-blue-50 cursor-pointer">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
