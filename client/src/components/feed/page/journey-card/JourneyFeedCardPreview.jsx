import { PhotoIcon, PinBadgeIcon } from "../feed.icons";
import JourneyMetaChip from "./JourneyMetaChip";
import PreviewMediaSlide from "./PreviewMediaSlide";

export default function JourneyFeedCardPreview({
  previewItems,
  previewIndex,
  previousPreviewIndex,
  shouldAutoplayPreview,
  previewDirection,
  shouldPlayActiveMedia,
  trip,
  expanded,
  isPinned,
  privacyLabel,
  milestoneCount,
  mediaCount,
}) {
  return (
    <div className="pt-4 sm:px-6 sm:pt-5">
      <div className="group relative h-[220px] overflow-hidden bg-zinc-100 sm:h-[340px] sm:rounded-[24px]">
        {previewItems.length > 0 ? (
          <>
            {previewItems.map((item, idx) => {
              const isActive = idx === previewIndex;
              const isPrevious =
                shouldAutoplayPreview &&
                previousPreviewIndex !== null &&
                idx === previousPreviewIndex;

              let animateProps = isActive
                ? {
                    opacity: 1,
                    x: "0%",
                    scale: 1,
                  }
                : {
                    opacity: 0,
                    x: "0%",
                    scale: 1,
                  };

              let transitionProps = { duration: 0 };

              if (shouldAutoplayPreview && isActive) {
                animateProps = {
                  opacity: 1,
                  x: "0%",
                  scale: 1,
                };
                transitionProps = {
                  duration: 0.42,
                  ease: [0.22, 1, 0.36, 1],
                };
              } else if (shouldAutoplayPreview && isPrevious) {
                animateProps = {
                  opacity: 0,
                  x: previewDirection === 1 ? "-10%" : "6%",
                  scale: 1.02,
                };
                transitionProps = {
                  duration: 0.42,
                  ease: [0.22, 1, 0.36, 1],
                };
              }

              return (
                <PreviewMediaSlide
                  key={item.__safeKey}
                  item={item}
                  tripTitle={trip.title}
                  isActive={isActive}
                  isPrevious={isPrevious}
                  shouldPlay={shouldPlayActiveMedia}
                  animateProps={animateProps}
                  transitionProps={transitionProps}
                />
              );
            })}
          </>
        ) : trip.coverUrl ? (
          <img
            src={trip.coverUrl}
            alt={trip.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#eef2ff,#f8fafc)] text-zinc-400">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                <PhotoIcon className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-medium">Chưa có media nào</p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/35 via-black/8 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 sm:left-4 sm:top-4 sm:gap-2">
          {isPinned ? (
            <JourneyMetaChip
              text="Pinned"
              tone="blue"
              icon={<PinBadgeIcon className="h-3.5 w-3.5" />}
            />
          ) : null}
          <JourneyMetaChip text={privacyLabel} tone="blue" />
          {milestoneCount ? (
            <JourneyMetaChip
              text={`${milestoneCount} milestone${milestoneCount > 1 ? "s" : ""}`}
              tone="white"
            />
          ) : null}
          {mediaCount ? (
            <JourneyMetaChip text={`${mediaCount} media`} tone="white" />
          ) : null}
        </div>

        {previewItems.length > 1 && !expanded ? (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur sm:bottom-4 sm:right-4 sm:px-3 sm:text-[12px]">
            {previewIndex + 1} / {previewItems.length}
          </div>
        ) : null}
      </div>
    </div>
  );
}
