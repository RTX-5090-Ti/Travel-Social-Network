export default function JourneySectionTitle({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
        {eyebrow}
      </p>
      <h5 className="mt-2 text-[20px] font-semibold tracking-tight text-zinc-900">
        {title}
      </h5>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
      ) : null}
    </div>
  );
}
