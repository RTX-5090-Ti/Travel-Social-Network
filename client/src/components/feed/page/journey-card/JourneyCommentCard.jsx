import { getInitials, formatFeedTime } from "../feed.utils";

export default function JourneyCommentCard({ comment }) {
  const authorName = comment?.userId?.name || comment?.user?.name || "Traveler";

  const initials = getInitials(authorName);

  const authorAvatar =
    comment?.userId?.avatarUrl ||
    comment?.userId?.avatar ||
    comment?.user?.avatarUrl ||
    comment?.user?.avatar ||
    "";

  const content =
    typeof comment?.content === "string" ? comment.content.trim() : "";

  return (
    <div className="flex items-start gap-3">
      {authorAvatar ? (
        <img
          src={authorAvatar}
          alt={authorName}
          className="object-cover w-10 h-10 rounded-full shrink-0"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#8b5cf6_55%,#764ba2_100%)] text-xs font-semibold text-white">
          {initials}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="inline-block max-w-full rounded-[22px] bg-[#eef0f3] px-4 py-2.5">
          <p className="text-[15px] font-semibold leading-5 text-zinc-900">
            {authorName}
          </p>

          <p className="mt-1 whitespace-pre-line break-words text-[15px] leading-6 text-zinc-800">
            {content}
          </p>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-4 pl-3 text-[13px] font-semibold text-zinc-500">
          <span>{formatFeedTime(comment?.createdAt)}</span>

          <button
            type="button"
            className="transition cursor-pointer hover:text-zinc-700"
          >
            Like
          </button>

          <button
            type="button"
            className="transition cursor-pointer hover:text-zinc-700"
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}
