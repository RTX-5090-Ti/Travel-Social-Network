export default function ShareJourneyField({ label, hint, children }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-zinc-700">
          {label}
        </label>
        {hint ? <span className="text-xs text-zinc-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
