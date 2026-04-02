import { ImageIcon, Plus } from "lucide-react";
import ProfileCaptureThumb from "./ProfileCaptureThumb";

export default function ProfileRecentCapturesCard({
  captures,
  onOpenCapture,
  onShareJourney,
}) {
  const hasCaptures = captures.length > 0;

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
