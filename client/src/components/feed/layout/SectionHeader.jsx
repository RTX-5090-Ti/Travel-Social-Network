export default function SectionHeader({
  eyebrow,
  title,
  description,
  actionLabel,
}) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 sm:text-[11px] sm:tracking-[0.14em]">
          {eyebrow}
        </p>
        <h3 className="mt-1.5 text-[20px] font-semibold tracking-tight text-zinc-900 sm:mt-2 sm:text-[24px]">
          {title}
        </h3>
        {description ? (
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-zinc-500 sm:text-[14px] sm:leading-7">
            {description}
          </p>
        ) : null}
      </div>

      {actionLabel ? (
        <button className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#4f7cff] shadow-sm transition hover:bg-blue-50 sm:px-4 sm:py-2 sm:text-[13px] cursor-pointer">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
