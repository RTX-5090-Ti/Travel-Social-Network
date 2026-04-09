import {
  ChevronDownIcon,
  ChevronUpIcon,
  CommentIcon,
  HeartIcon,
  ShareIcon,
} from "../feed.icons";
import JourneyMetaChip from "./JourneyMetaChip";

export default function JourneyFeedCardFooter({
  tripTitle,
  caption,
  previewCaption,
  expanded,
  likeCount,
  commentCount,
  milestoneCount,
  mediaCount,
  liked,
  likeLoading,
  detailLoading,
  onToggleLike,
  onToggleShow,
}) {
  return (
    <div className="px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[19px] font-semibold tracking-tight text-zinc-900 sm:text-[22px]">
              {tripTitle}
            </h4>
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-600 sm:px-3 sm:text-[12px]">
              Journey
            </span>
          </div>

          {caption ? (
            <p className="mt-2.5 whitespace-pre-line text-[13px] leading-6 text-zinc-600 sm:mt-3 sm:text-[14px] sm:leading-7">
              {expanded ? caption : previewCaption}
            </p>
          ) : (
            <p className="mt-2.5 text-[13px] italic leading-6 text-zinc-400 sm:mt-3 sm:text-[14px] sm:leading-7">
              Chưa có phần intro cho journey này.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-5 sm:gap-2">
        <JourneyMetaChip
          text={`${likeCount} ${likeCount === 1 ? "like" : "likes"}`}
          tone="soft"
        />
        <JourneyMetaChip
          text={`${commentCount} ${commentCount === 1 ? "comment" : "comments"}`}
          tone="soft"
        />
        {milestoneCount ? (
          <JourneyMetaChip text={`${milestoneCount} stops in journey`} tone="soft" />
        ) : null}
        {mediaCount ? (
          <JourneyMetaChip text={`${mediaCount} media`} tone="soft" />
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
        <div className="mt-2 grid grid-cols-3 gap-1.5 border-zinc-200/80 pt-1 sm:mt-3 sm:gap-2 sm:pt-2">
          <button
            type="button"
            onClick={onToggleLike}
            disabled={likeLoading}
            className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl text-[13px] font-medium transition active:scale-[0.98] sm:h-11 sm:gap-2 sm:text-[15px] ${
              liked
                ? "bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            } ${likeLoading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
          >
            <HeartIcon
              filled={liked}
              className={`h-[18px] w-[18px] transition sm:h-[20px] sm:w-[20px] ${
                liked ? "scale-110" : ""
              }`}
            />
            <span>{liked ? "Liked" : "Like"}</span>
          </button>

          <button
            type="button"
            onClick={onToggleShow}
            disabled={detailLoading}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-6 text-[13px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 active:scale-[0.98] sm:h-11 sm:gap-2 sm:px-10 sm:text-[15px]"
          >
            <CommentIcon className="h-[18px] w-[18px] sm:h-[20px] sm:w-[20px]" />
            <span>Comment</span>
          </button>

          <button
            type="button"
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl text-[13px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 active:scale-[0.98] sm:h-11 sm:gap-2 sm:text-[15px]"
          >
            <ShareIcon className="h-[18px] w-[18px] sm:h-[20px] sm:w-[20px]" />
            <span>Share</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleShow}
          disabled={detailLoading}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_12px_24px_rgba(102,126,234,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(102,126,234,0.38)] sm:px-5 sm:py-3 sm:text-sm sm:shadow-[0_14px_32px_rgba(102,126,234,0.28)]"
        >
          {expanded ? (
            <>
              <ChevronUpIcon className="h-4 w-4" />
              Hide journey
            </>
          ) : (
            <>
              <ChevronDownIcon className="h-4 w-4" />
              Show journey
            </>
          )}
        </button>
      </div>
    </div>
  );
}
