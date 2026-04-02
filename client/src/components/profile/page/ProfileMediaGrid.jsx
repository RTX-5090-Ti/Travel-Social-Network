import { ImageIcon, Play } from "lucide-react";
import { formatFeedTime } from "../../feed/page/feed.utils";

export default function ProfileMediaGrid({ mediaItems, onOpenLightbox }) {
  if (!mediaItems.length) {
    return (
      <div className="rounded-[30px] border border-dashed border-zinc-200 bg-[linear-gradient(180deg,#ffffff,#fbfbff)] px-5 py-12 text-center shadow-[0_16px_34px_rgba(15,23,42,0.04)]">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,rgba(102,126,234,0.12),rgba(118,75,162,0.16))] text-violet-600">
          <ImageIcon className="h-7 w-7" />
        </div>
        <h4 className="mt-5 text-[22px] font-semibold tracking-tight text-zinc-900">
          Chưa có media nào
        </h4>
        <p className="mx-auto mt-3 max-w-[560px] text-[15px] leading-7 text-zinc-500">
          Tab này lấy ảnh và video thật từ các journey của bạn. Khi bạn đăng
          thêm bài, chỗ này sẽ thành một gallery rất đẹp.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {mediaItems.map((media, index) => (
        <button
          key={media.id}
          type="button"
          onClick={() => onOpenLightbox?.(index)}
          className="group overflow-hidden rounded-[28px] border border-white/70 bg-white text-left shadow-[0_16px_34px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_rgba(15,23,42,0.08)] cursor-pointer"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-[linear-gradient(135deg,rgba(102,126,234,0.14),rgba(118,75,162,0.12),rgba(255,255,255,0.50))]">
            {media.type === "video" ? (
              <video
                src={media.url}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={media.url}
                alt={media.tripTitle}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              />
            )}

            <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-semibold text-zinc-700 backdrop-blur">
              {media.type === "video" ? (
                <Play className="h-3.5 w-3.5" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
              )}
              {media.type === "video" ? "Video" : "Photo"}
            </div>

            <div className="absolute right-3 top-3 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-semibold capitalize text-zinc-700 backdrop-blur">
              {media.privacy}
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(15,23,42,0),rgba(15,23,42,0.80))] p-4 text-white">
              <p className="line-clamp-1 text-[15px] font-semibold">
                {media.tripTitle}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-white/80">
                <span>{formatFeedTime(media.createdAt)}</span>
                {media.milestoneTitle ? (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/60" />
                    <span className="line-clamp-1">{media.milestoneTitle}</span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(15,23,42,0.08))] opacity-0 transition duration-300 group-hover:opacity-100" />

            <div className="absolute inset-0 flex items-center justify-center transition duration-300 opacity-0 pointer-events-none group-hover:opacity-100">
              <div className="rounded-full border border-white/80 bg-white/84 px-4 py-2 text-[12px] font-semibold text-zinc-800 shadow-[0_14px_30px_rgba(15,23,42,0.16)] backdrop-blur">
                Tap to view
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
