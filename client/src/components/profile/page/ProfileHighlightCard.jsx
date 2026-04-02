import { Heart, ImageIcon, MessageCircle, Play } from "lucide-react";
import { formatFeedTime } from "../../feed/page/feed.utils";

function formatLargeNumber(value = 0) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
}

export default function ProfileHighlightCard({ trip, onOpen }) {
  const previewMedia = Array.isArray(trip?.feedPreview?.previewMedia)
    ? trip.feedPreview.previewMedia
    : [];

  const firstMedia = previewMedia[0] || null;
  const mediaCount = trip?.feedPreview?.mediaCount || 0;
  const reactions = trip?.counts?.reactions || 0;
  const comments = trip?.counts?.comments || 0;

  const hasImageCover =
    trip?.coverUrl && !/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trip.coverUrl);

  const displayType = hasImageCover
    ? "image"
    : firstMedia?.type === "video"
      ? "video"
      : "image";

  const displayUrl = hasImageCover
    ? trip.coverUrl
    : firstMedia?.url || trip?.coverUrl || "";

  const privacyLabel = trip?.privacy
    ? `${trip.privacy.charAt(0).toUpperCase()}${trip.privacy.slice(1)}`
    : "Public";

  const postedText = trip?.createdAt
    ? formatFeedTime(trip.createdAt)
    : "Just now";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,#ffffff,#fbfbff)] text-left shadow-[0_16px_34px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_rgba(15,23,42,0.08)] cursor-pointer"
    >
      <div className="relative h-[220px] overflow-hidden bg-[linear-gradient(135deg,rgba(102,126,234,0.18),rgba(118,75,162,0.16),rgba(255,255,255,0.45))]">
        {displayUrl ? (
          displayType === "video" ? (
            <video
              src={displayUrl}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={displayUrl}
              alt={trip?.title || "Journey cover"}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          )
        ) : (
          <div className="flex items-center justify-center w-full h-full text-zinc-400">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}

        <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/82 px-3 py-1 text-[11px] font-semibold text-zinc-700 shadow-sm backdrop-blur">
          {displayType === "video" ? (
            <>
              <Play className="h-3.5 w-3.5" />
              Video
            </>
          ) : (
            <>
              <ImageIcon className="h-3.5 w-3.5" />
              Photo
            </>
          )}
        </div>

        <div className="absolute right-3 top-3 rounded-full border border-white/60 bg-black/20 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
          {postedText}
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(15,23,42,0),rgba(15,23,42,0.78))] p-4">
          <div className="flex flex-wrap items-center gap-2 text-white">
            <span className="rounded-full bg-white/16 px-3 py-1 text-[11px] font-semibold backdrop-blur">
              {mediaCount} media
            </span>
            <span className="rounded-full bg-white/16 px-3 py-1 text-[11px] font-semibold backdrop-blur">
              {privacyLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h4 className="line-clamp-1 text-[18px] font-semibold tracking-tight text-zinc-900">
          {trip?.title || "Untitled journey"}
        </h4>

        <p className="mt-2 line-clamp-2 text-[14px] leading-6 text-zinc-500">
          {trip?.caption?.trim() ||
            "Một hành trình đẹp, gọn và có cảm xúc để làm điểm nhấn cho profile."}
        </p>

        <div className="flex items-center justify-between gap-3 pt-3 mt-4 border-t border-zinc-100">
          <div className="inline-flex items-center gap-2 text-[13px] font-medium text-zinc-500">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>{formatLargeNumber(reactions)}</span>
          </div>

          <div className="inline-flex items-center gap-2 text-[13px] font-medium text-zinc-500">
            <MessageCircle className="w-4 h-4 text-violet-500" />
            <span>{formatLargeNumber(comments)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
