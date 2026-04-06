export default function ProfileMetaPill({ icon, text, loading = false }) {
  return (
    <div className="inline-flex items-center max-w-full gap-2 px-3 py-2 border rounded-full shadow-sm border-white/70 bg-white/75 backdrop-blur">
      <span className="shrink-0 text-zinc-500">{icon}</span>

      {loading ? (
        <span className="block h-[12px] w-[140px] animate-pulse rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.88),rgba(226,232,240,0.92),rgba(255,255,255,0.88))]" />
      ) : (
        <span
          className="max-w-[220px] truncate text-[13px] font-medium text-zinc-600"
          title={text}
        >
          {text}
        </span>
      )}
    </div>
  );
}
