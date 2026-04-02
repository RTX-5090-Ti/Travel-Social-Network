import { getMediaRenderKey, normalizeMediaItems } from "./journeyMedia.utils";

export default function JourneyMediaGrid({ media, onOpenLightbox }) {
  const safeMedia = normalizeMediaItems(media);

  if (!safeMedia.length) return null;

  const oneItem = safeMedia.length === 1;
  const hasOverflow = safeMedia.length > 4;
  const visibleMedia = hasOverflow ? safeMedia.slice(0, 4) : safeMedia;
  const extraCount = safeMedia.length - visibleMedia.length;

  return (
    <div className={`grid gap-3 ${oneItem ? "grid-cols-1" : "grid-cols-2"}`}>
      {visibleMedia.map((item, index) => {
        const isLastVisibleTile = index === visibleMedia.length - 1;
        const showOverflowBadge = hasOverflow && isLastVisibleTile;

        return (
          <button
            key={getMediaRenderKey(
              item,
              index,
              item.type === "video" ? "detail-video" : "detail-image",
            )}
            type="button"
            onClick={() => onOpenLightbox?.(safeMedia, index)}
            className={`cursor-pointer group relative overflow-hidden rounded-[22px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,241,255,0.88))] text-left shadow-[0_10px_26px_rgba(148,163,184,0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(182,137,255,0.14)] active:scale-[0.99] ${
              oneItem ? "max-h-[420px]" : "h-[220px]"
            }`}
          >
            {item.type === "video" ? (
              <>
                <video
                  src={item.url}
                  muted
                  playsInline
                  preload="metadata"
                  className={`w-full rounded-[18px] bg-white/70 object-cover transition duration-300 group-hover:scale-[1.02] ${
                    oneItem ? "max-h-[420px]" : "h-[220px]"
                  }`}
                />
                <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center rounded-full border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(245,238,255,0.88))] px-2.5 py-1 text-[11px] font-semibold text-[#7c59d9] shadow-[0_8px_18px_rgba(148,163,184,0.12)] backdrop-blur">
                  Video
                </div>
              </>
            ) : (
              <img
                src={item.url}
                alt=""
                loading="lazy"
                decoding="async"
                className={`w-full rounded-[18px] object-cover transition duration-300 group-hover:scale-[1.02] ${
                  oneItem ? "max-h-[420px]" : "h-[220px]"
                }`}
              />
            )}

            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/60" />

            {showOverflowBadge ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(31,41,55,0.38))] backdrop-blur-[1.5px]">
                <span className="rounded-full border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(245,238,255,0.90))] px-4 py-2 text-[24px] font-semibold tracking-tight text-zinc-900 shadow-[0_14px_30px_rgba(148,163,184,0.18)]">
                  +{extraCount}
                </span>
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
