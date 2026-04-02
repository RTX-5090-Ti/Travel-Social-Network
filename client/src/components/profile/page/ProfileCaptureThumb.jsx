import { ImageIcon, Play } from "lucide-react";
import { formatFeedTime } from "../../feed/page/feed.utils";

export default function ProfileCaptureThumb({ item, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-[22px] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(244,247,255,0.92),rgba(243,238,255,0.90))] shadow-[0_12px_24px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(15,23,42,0.08)]"
    >
      <div className="relative overflow-hidden cursor-pointer aspect-square">
        {item.type === "video" ? (
          <>
            <video
              src={item.url}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              muted
              playsInline
              preload="metadata"
            />
            <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/70 bg-black/25 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
              <Play className="w-3 h-3" />
              Video
            </div>
          </>
        ) : (
          <>
            <img
              src={item.url}
              alt={item.tripTitle || "Recent capture"}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
            <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/70 bg-black/25 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
              <ImageIcon className="w-3 h-3" />
              Photo
            </div>
          </>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(15,23,42,0),rgba(15,23,42,0.78))] p-3 text-left">
          <p className="line-clamp-1 text-[12px] font-semibold text-white">
            {item.tripTitle || "Untitled journey"}
          </p>
          <p className="mt-1 text-[10px] font-medium text-white/80">
            {formatFeedTime(item.createdAt)}
          </p>
        </div>
      </div>
    </button>
  );
}
