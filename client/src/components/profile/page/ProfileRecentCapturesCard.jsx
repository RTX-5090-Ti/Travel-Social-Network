import { ImageIcon, Plus } from "lucide-react";
import ProfileCaptureThumb from "./ProfileCaptureThumb";

export default function ProfileRecentCapturesCard({
  captures,
  onOpenCapture,
  onShareJourney,
  loading = false,
}) {
  const hasCaptures = captures.length > 0;

  if (loading) {
    return (
      <div className="overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.90),rgba(246,247,255,0.92),rgba(243,239,255,0.90))] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 backdrop-blur">
        <div className="animate-pulse">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="h-3 w-28 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.88),rgba(226,232,240,0.92),rgba(255,255,255,0.88))]" />
              <div className="mt-3 h-6 w-40 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.88),rgba(226,232,240,0.92),rgba(255,255,255,0.88))]" />
            </div>

            <div className="h-11 w-11 rounded-2xl bg-[linear-gradient(135deg,rgba(102,126,234,0.08),rgba(118,75,162,0.10))]" />
          </div>

          <div className="mt-4 space-y-2">
            <div className="h-3.5 w-full rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.88),rgba(226,232,240,0.92),rgba(255,255,255,0.88))]" />
            <div className="h-3.5 w-4/5 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.88),rgba(226,232,240,0.92),rgba(255,255,255,0.88))]" />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[0.95] rounded-[22px] bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(233,238,247,0.94),rgba(244,239,255,0.88))] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.90),rgba(246,247,255,0.92),rgba(243,239,255,0.90))] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Recent captures
          </p>
          <h3 className="mt-2 text-[20px] font-semibold tracking-tight text-zinc-900">
            Latest moments
          </h3>
        </div>

        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(102,126,234,0.12),rgba(118,75,162,0.16))] text-violet-600 shadow-[0_10px_24px_rgba(102,126,234,0.10)]">
          <ImageIcon className="w-5 h-5" />
        </div>
      </div>

      <p className="mt-3 text-[14px] leading-7 text-zinc-600">
        {hasCaptures
          ? "Những khoảnh khắc ảnh và video mới nhất của bạn."
          : "Ảnh và video mới nhất sẽ xuất hiện tại đây."}
      </p>

      {hasCaptures ? (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {captures.map((item, index) => (
            <ProfileCaptureThumb
              key={item.id}
              item={item}
              onClick={() => onOpenCapture?.(index)}
            />
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={onShareJourney}
          className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(102,126,234,0.24)] transition hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Share your first journey
        </button>
      )}
    </div>
  );
}
