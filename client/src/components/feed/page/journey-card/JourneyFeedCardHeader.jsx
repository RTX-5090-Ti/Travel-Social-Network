import { PinBadgeIcon } from "../feed.icons";
import JourneyCardActionsMenu from "./JourneyCardActionsMenu";

export default function JourneyFeedCardHeader({
  ownerAvatar,
  ownerName,
  initials,
  trip,
  createdAtLabel,
  onPreviewUser,
  isPinned,
  privacyLabel,
  isOwnerTrip,
  saved,
  handlePinTrip,
  handleSaveTrip,
  handleEditTrip,
  handleEditAudience,
  handleMoveTripToTrash,
  handleReportTrip,
  handleHideTrip,
}) {
  return (
    <div className="px-4 pt-4 sm:px-6 sm:pt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative">
            {ownerAvatar ? (
              <img
                src={ownerAvatar}
                alt={ownerName}
                className="h-10 w-10 rounded-full object-cover shadow-[0_8px_18px_rgba(102,126,234,0.16)] ring-1 ring-white/70 sm:h-12 sm:w-12 sm:shadow-[0_10px_24px_rgba(102,126,234,0.18)]"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(102,126,234,0.28)] sm:h-12 sm:w-12 sm:text-sm sm:shadow-[0_10px_24px_rgba(102,126,234,0.35)]">
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onPreviewUser?.(trip.ownerId)}
              className="block max-w-full cursor-pointer truncate text-left text-[15px] font-semibold text-zinc-900 transition hover:text-[#5b6ee1] sm:text-[16px]"
            >
              {ownerName}
            </button>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-zinc-400 sm:gap-2 sm:text-[13px]">
              <span>{createdAtLabel}</span>

              {isPinned ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-zinc-300" />
                  <span className="inline-flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,rgba(238,242,255,0.98),rgba(245,240,255,0.98))] px-2 py-0.5 text-[12px] font-semibold text-[#5b6ee1] ring-1 ring-violet-100/80">
                    <PinBadgeIcon className="h-3.5 w-3.5" />
                    Pinned Trip
                  </span>
                </>
              ) : null}

              <span className="h-1 w-1 rounded-full bg-zinc-300" />
              <span className="capitalize">{privacyLabel}</span>
            </div>
          </div>
        </div>

        <JourneyCardActionsMenu
          variant={isOwnerTrip ? "owner" : "visitor"}
          privacyLabel={privacyLabel}
          isPinned={isPinned}
          isSaved={saved}
          onPin={handlePinTrip}
          onSave={handleSaveTrip}
          onEdit={handleEditTrip}
          onEditAudience={handleEditAudience}
          onMoveToTrash={handleMoveTripToTrash}
          onReport={handleReportTrip}
          onHide={handleHideTrip}
        />
      </div>
    </div>
  );
}
