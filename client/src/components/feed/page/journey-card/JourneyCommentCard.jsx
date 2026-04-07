import { SendIcon } from "../feed.icons";
import { formatFeedTime, getInitials } from "../feed.utils";
import CommentComposerAvatar from "./CommentComposerAvatar";

const REPLIES_PAGE_SIZE = 10;

function countReplyNodes(replies = []) {
  return replies.reduce(
    (total, reply) =>
      total +
      1 +
      countReplyNodes(Array.isArray(reply?.replies) ? reply.replies : []),
    0,
  );
}

function limitReplyTree(replies = [], limit = 0) {
  if (limit <= 0 || !replies.length) {
    return { items: [], used: 0 };
  }

  let used = 0;
  const items = [];

  for (const reply of replies) {
    if (used >= limit) break;

    used += 1;

    const childReplies = Array.isArray(reply?.replies) ? reply.replies : [];
    let nextReplies = [];

    if (childReplies.length && used < limit) {
      const limitedChildren = limitReplyTree(childReplies, limit - used);
      nextReplies = limitedChildren.items;
      used += limitedChildren.used;
    }

    items.push({
      ...reply,
      replies: nextReplies,
    });
  }

  return { items, used };
}

function getCommentId(comment) {
  if (!comment) return "";
  if (typeof comment?._id === "string") return comment._id;
  return comment?._id?.toString?.() || "";
}

function getCommentAuthor(comment) {
  return comment?.userId || comment?.user || null;
}

function getCommentAuthorName(comment) {
  return getCommentAuthor(comment)?.name?.trim?.() || "Traveler";
}

function getCommentAuthorId(comment) {
  const author = getCommentAuthor(comment);
  if (!author) return "";
  if (typeof author === "string") return author;
  return author?._id?.toString?.() || author?.id?.toString?.() || "";
}

function getCommentAvatar(comment) {
  const author = getCommentAuthor(comment);

  return (
    author?.avatarUrl ||
    author?.avatar ||
    author?.profile?.avatarUrl ||
    author?.profile?.avatar ||
    ""
  );
}

function getReplyToName(comment) {
  return (
    comment?.replyToUser?.name?.trim?.() ||
    comment?.replyToUserId?.name?.trim?.() ||
    ""
  );
}

function treeContainsComment(comment, targetId) {
  if (!targetId) return false;
  if (getCommentId(comment) === targetId) return true;

  const replies = Array.isArray(comment?.replies) ? comment.replies : [];
  return replies.some((reply) => treeContainsComment(reply, targetId));
}

function CommentBubble({
  comment,
  showConnector = false,
  onReply,
  currentUserId = "",
}) {
  const authorName = getCommentAuthorName(comment);
  const authorId = getCommentAuthorId(comment);
  const initials = getInitials(authorName);
  const authorAvatar = getCommentAvatar(comment);
  const replyToName = getReplyToName(comment);
  const content =
    typeof comment?.content === "string" ? comment.content.trim() : "";
  const isOwnComment =
    Boolean(currentUserId) && Boolean(authorId) && currentUserId === authorId;

  return (
    <div className="relative flex items-start gap-3">
      {showConnector ? (
        <span className="absolute left-[-24px] top-5 h-px w-5 rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-300" />
      ) : null}

      {authorAvatar ? (
        <img
          src={authorAvatar}
          alt={authorName}
          className="h-8.5 w-8.5 shrink-0 rounded-full object-cover ring-1 ring-white/70"
        />
      ) : (
        <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#8b5cf6_55%,#764ba2_100%)] text-[10px] font-semibold text-white">
          {initials}
        </div>
      )}

      <div className="flex-1 min-w-0 group/comment">
        <div className="relative inline-block max-w-full">
          <div className="inline-block max-w-full rounded-[19px] border border-zinc-200/90 bg-[linear-gradient(180deg,#faf7ff,#f1ebff)] px-3 py-2 shadow-[0_8px_18px_rgba(76,29,149,0.08)] ring-1 ring-white/70">
            <p className="text-[13px] font-semibold leading-[1.15rem] text-zinc-900">
              {authorName}
            </p>

            <p className="mt-0.5 whitespace-pre-line break-words text-[13px] leading-[1.35rem] text-zinc-800">
              {replyToName ? (
                <span className="mr-1 font-semibold text-zinc-800">
                  {replyToName}
                </span>
              ) : null}
              {content}
            </p>
          </div>

          {isOwnComment ? (
            <button
              type="button"
              aria-label="Comment actions"
              className="absolute left-full top-1/2 ml-2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,241,255,0.96))] text-[#8b5cf6] opacity-0 shadow-[0_8px_18px_rgba(76,29,149,0.08)] ring-1 ring-zinc-200/70 transition duration-200 group-hover/comment:pointer-events-auto group-hover/comment:opacity-100 hover:-translate-y-1/2 hover:scale-[1.04] hover:border-violet-200 hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(243,232,255,0.98))] hover:text-[#7c3aed] hover:shadow-[0_12px_24px_rgba(124,58,237,0.14)] cursor-pointer pointer-events-none"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-[18px] w-[18px]"
                aria-hidden="true"
              >
                <circle cx="5" cy="12" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="19" cy="12" r="1.8" />
              </svg>
            </button>
          ) : null}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-3 pl-2.5 text-[11px] font-semibold text-zinc-500">
          <span>{formatFeedTime(comment?.createdAt)}</span>

          <button
            type="button"
            className="transition cursor-pointer hover:text-zinc-700"
          >
            Like
          </button>

          {onReply ? (
            <button
              type="button"
              onClick={onReply}
              className="transition cursor-pointer hover:text-zinc-700"
            >
              Reply
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CommentThread({
  comment,
  depth = 0,
  forceExpanded = false,
  expandedByAncestor = false,
  expandedReplyThreads = {},
  visibleReplyCounts = {},
  activeReplyId = "",
  replyText = "",
  replySubmitting = false,
  replyTargetName = "",
  currentUserId = "",
  currentUserAvatar = "",
  currentUserInitials = "Y",
  currentUserName = "You",
  onReplyToggle,
  onExpandReplies,
  onLoadMoreReplies,
  onReplyTextChange,
  onReplySubmit,
}) {
  const rawReplies = Array.isArray(comment?.replies) ? comment.replies : [];
  const commentId = getCommentId(comment);
  const childDepth = Math.min(depth + 1, 2);
  const hasReplies = rawReplies.length > 0;
  const isActivePath = treeContainsComment(comment, activeReplyId);
  const isExpanded = !!expandedReplyThreads[commentId];
  const visibleRepliesCount =
    visibleReplyCounts[commentId] || REPLIES_PAGE_SIZE;
  const expandDescendants = isExpanded || forceExpanded;
  const repliesExpanded = expandDescendants || isActivePath;
  const replyingHere = activeReplyId === commentId;
  const shouldIndentChildren = depth < 2;
  const childWrapperClass = shouldIndentChildren
    ? "relative ml-[18px] mt-3 pl-8"
    : "relative mt-3";

  const totalReplies = Math.max(
    Number.isFinite(comment?.replyCount)
      ? Number(comment.replyCount)
      : countReplyNodes(rawReplies),
    countReplyNodes(rawReplies),
  );
  const limitedReplies = expandedByAncestor
    ? { items: rawReplies, used: countReplyNodes(rawReplies) }
    : limitReplyTree(rawReplies, visibleRepliesCount);
  const visibleReplies = repliesExpanded ? limitedReplies.items : [];
  const remainingReplies = expandedByAncestor
    ? 0
    : Math.max(totalReplies - limitedReplies.used, 0);
  const replyToggleLabel =
    totalReplies === 1
      ? "Xem 1 phản hồi"
      : `Xem tất cả ${totalReplies} phản hồi`;

  return (
    <div className="rounded-[24px] bg-transparent">
      <CommentBubble
        comment={comment}
        showConnector={depth > 0}
        onReply={() => onReplyToggle?.(comment)}
        currentUserId={currentUserId}
      />

      {hasReplies || replyingHere ? (
        <div className={childWrapperClass}>
          {shouldIndentChildren ? (
            <span className="absolute top-0 left-0 w-px rounded-full bottom-2 bg-gradient-to-b from-violet-300 via-fuchsia-300 to-transparent" />
          ) : null}

          {hasReplies ? (
            <div className={repliesExpanded ? "space-y-3" : ""}>
              {!repliesExpanded && !expandedByAncestor ? (
                <button
                  type="button"
                  onClick={() => onExpandReplies?.(commentId)}
                  className="group relative inline-flex cursor-pointer items-center gap-3 pl-1 text-[14px] font-semibold text-violet-500 transition hover:text-violet-700"
                >
                  <span className="absolute left-[-24px] top-1/2 h-px w-5 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-300" />
                  <span>{replyToggleLabel}</span>
                </button>
              ) : null}

              {repliesExpanded ? (
                <div className="space-y-3">
                  {visibleReplies.map((reply, index) => (
                    <CommentThread
                      key={getCommentId(reply) || `reply-${index}`}
                      comment={reply}
                      depth={childDepth}
                      forceExpanded={expandDescendants}
                      expandedByAncestor={repliesExpanded}
                      expandedReplyThreads={expandedReplyThreads}
                      visibleReplyCounts={visibleReplyCounts}
                      activeReplyId={activeReplyId}
                      replyText={replyText}
                      replySubmitting={replySubmitting}
                      replyTargetName={replyTargetName}
                      currentUserId={currentUserId}
                      currentUserAvatar={currentUserAvatar}
                      currentUserInitials={currentUserInitials}
                      currentUserName={currentUserName}
                      onReplyToggle={onReplyToggle}
                      onExpandReplies={onExpandReplies}
                      onLoadMoreReplies={onLoadMoreReplies}
                      onReplyTextChange={onReplyTextChange}
                      onReplySubmit={onReplySubmit}
                    />
                  ))}

                  {remainingReplies > 0 && !expandedByAncestor ? (
                    <button
                      type="button"
                      onClick={() =>
                        onLoadMoreReplies?.(commentId, totalReplies)
                      }
                      className="relative inline-flex cursor-pointer items-center gap-2 pl-1 text-[13px] font-semibold text-violet-500 transition hover:text-violet-700"
                    >
                      <span className="absolute left-[-24px] top-1/2 h-px w-5 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-300" />
                      <span>
                        Xem thêm {Math.min(REPLIES_PAGE_SIZE, remainingReplies)}{" "}
                        phản hồi
                      </span>
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {replyingHere ? (
            <form onSubmit={onReplySubmit} className="mt-3">
              <div className="relative">
                <span className="absolute left-[-24px] top-5 h-px w-5 rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-300" />
                <div className="flex items-end gap-3">
                  <CommentComposerAvatar
                    src={currentUserAvatar}
                    initials={currentUserInitials}
                    name={currentUserName}
                  />

                  <div className="min-w-0 flex-1 rounded-[21px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(244,247,255,0.95),rgba(250,247,255,0.96))] px-3 py-1.5 shadow-[0_8px_18px_rgba(99,102,241,0.08)] ring-1 ring-zinc-200/70">
                    <textarea
                      value={replyText}
                      onChange={(event) =>
                        onReplyTextChange?.(event.target.value)
                      }
                      rows={1}
                      placeholder={
                        replyTargetName
                          ? `Reply to ${replyTargetName}...`
                          : "Write a reply..."
                      }
                      className="min-h-[28px] w-full resize-none overflow-y-hidden border-0 bg-transparent text-[12px] leading-5 text-zinc-700 outline-none placeholder:text-zinc-400"
                    />

                    <div className="flex items-center justify-between gap-3 mt-1">
                      <button
                        type="button"
                        onClick={() => onReplyToggle?.(comment)}
                        className="text-[11px] font-semibold text-zinc-400 transition hover:text-zinc-700"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={!replyText.trim() || replySubmitting}
                        className={`inline-flex h-8.5 w-8.5 items-center justify-center rounded-full transition ${
                          replyText.trim()
                            ? "cursor-pointer bg-[linear-gradient(135deg,#667eea_0%,#8b5cf6_48%,#7c3aed_100%)] text-white shadow-[0_12px_24px_rgba(124,58,237,0.22)] hover:-translate-y-0.5"
                            : "cursor-not-allowed bg-white/80 text-zinc-300 ring-1 ring-zinc-200/80"
                        }`}
                      >
                        {replySubmitting ? (
                          <span className="h-[13px] w-[13px] animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                        ) : (
                          <SendIcon className="h-[14px] w-[14px]" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function JourneyCommentCard(props) {
  return <CommentThread {...props} depth={0} />;
}
