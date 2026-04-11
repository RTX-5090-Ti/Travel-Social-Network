import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { stories } from "../page/feed.constants";
import { AddStory, StoryBubble } from "../page/StoriesSection";
import { EmptyJourneyState, FeedCardSkeleton } from "../page/FeedStates";
import JourneyFeedCard from "../page/JourneyFeedCard";
import FeedHeroBar from "./FeedHeroBar";
import SectionHeader from "./SectionHeader";

export default function MainFeed({
  onOpenComposer,
  feedMode = "trending",
  feedItems,
  feedLoading,
  feedLoadingMore = false,
  feedError,
  feedHasMore = false,
  onChangeFeedMode,
  onReloadFeed,
  onLoadMoreFeed,
  onPreviewUser,
  onTripTrashed,
  onTripUpdated,
  onTripHidden,
}) {
  const { t } = useTranslation();
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const targetNode = loadMoreRef.current;

    if (
      !targetNode ||
      typeof IntersectionObserver === "undefined" ||
      feedLoading ||
      feedLoadingMore ||
      !feedHasMore
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        onLoadMoreFeed?.();
      },
      {
        root: null,
        rootMargin: "0px 0px 420px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(targetNode);

    return () => observer.disconnect();
  }, [feedHasMore, feedLoading, feedLoadingMore, onLoadMoreFeed]);

  return (
    <main className="theme-main-pane feed-main-scroll min-w-0 bg-white px-4 pb-28 pt-5 sm:px-6 sm:py-7 md:bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(250,250,251,0.96))] md:px-7 md:py-8 lg:h-full lg:overflow-y-auto lg:overflow-x-hidden lg:border-r border-zinc-200/80 lg:px-9 xl:px-10">
      <div className="mx-auto w-full max-w-[860px]">
        <FeedHeroBar onOpenComposer={onOpenComposer} />

        <section className="mt-6 sm:mt-8">
          <SectionHeader
            title={t("feed.stories")}
            actionLabel={t("feed.watchAll")}
          />

          <div className="theme-card mt-4 rounded-[24px] border border-white/70 bg-white/80 p-3 shadow-[0_12px_28px_rgba(15,23,42,0.045)] ring-1 ring-zinc-200/60 backdrop-blur sm:mt-5 sm:rounded-[28px] sm:p-4 sm:shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="flex gap-3 overflow-x-auto sm:gap-4 sm:pb-1">
              <AddStory />
              {stories.map((story) => (
                <StoryBubble key={story.id} story={story} />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-7 sm:mt-9">
          <div className="flex items-end justify-between gap-3 lg:gap-4">
            <div className="min-w-0 flex-1">
              <SectionHeader title={t("feed.communityTitle")} />
            </div>

            <div className="theme-card inline-flex w-fit shrink-0 rounded-[15px] border border-white/70 bg-white/85 p-1 shadow-[0_8px_18px_rgba(15,23,42,0.045)] ring-1 ring-zinc-200/60 backdrop-blur sm:rounded-[18px] sm:p-1.5 sm:shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <button
                type="button"
                onClick={() => onChangeFeedMode?.("trending")}
                className={
                  feedMode === "trending"
                    ? "theme-toggle-active rounded-[11px] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(102,126,234,0.22)] sm:rounded-[14px] sm:px-5 sm:py-2.5 sm:text-[13px] sm:shadow-[0_10px_20px_rgba(102,126,234,0.26)]"
                    : "theme-toggle-idle rounded-[11px] px-4 py-2 text-[12px] font-semibold text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900 sm:rounded-[14px] sm:px-5 sm:py-2.5 sm:text-[13px] cursor-pointer"
                }
              >
                {t("feed.trending")}
              </button>
              <button
                type="button"
                onClick={() => onChangeFeedMode?.("latest")}
                className={
                  feedMode === "latest"
                    ? "theme-toggle-active rounded-[11px] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(102,126,234,0.22)] sm:rounded-[14px] sm:px-5 sm:py-2.5 sm:text-[13px] sm:shadow-[0_10px_20px_rgba(102,126,234,0.26)]"
                    : "theme-toggle-idle rounded-[11px] px-4 py-2 text-[12px] font-semibold text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900 sm:rounded-[14px] sm:px-5 sm:py-2.5 sm:text-[13px] cursor-pointer"
                }
              >
                {t("feed.latest")}
              </button>
            </div>
          </div>

          {feedError ? (
            <div className="mt-5 flex flex-col gap-3 rounded-[24px] border border-red-200 bg-red-50/90 px-4 py-4 text-sm text-red-600 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{t("feed.loadErrorTitle")}</p>
                <p className="mt-1 text-red-500/90">{feedError}</p>
              </div>

              <button
                type="button"
                onClick={onReloadFeed}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-200 transition hover:bg-red-100 cursor-pointer"
              >
                {t("feed.retry")}
              </button>
            </div>
          ) : null}

          <div className="mt-6 space-y-7">
            {feedLoading ? (
              <>
                <FeedCardSkeleton />
                <FeedCardSkeleton />
              </>
            ) : feedItems.length > 0 ? (
              <>
                {feedItems.map((trip, index) => (
                  <JourneyFeedCard
                    key={trip._id || `feed-trip-${trip.createdAt || "x"}-${index}`}
                    trip={trip}
                    surface="feed"
                    onPreviewUser={onPreviewUser}
                    onTripTrashed={onTripTrashed}
                    onTripUpdated={onTripUpdated}
                    onTripHidden={onTripHidden}
                  />
                ))}

                <div ref={loadMoreRef} className="h-6 w-full" />

                {feedLoadingMore ? (
                  <div className="flex items-center justify-center py-2">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-violet-200 border-t-violet-500" />
                  </div>
                ) : null}

                {!feedHasMore ? (
                  <div className="theme-card rounded-[22px] border border-dashed border-zinc-200 bg-[linear-gradient(180deg,#ffffff,#fbfbff)] px-4 py-4 text-center text-sm font-medium text-zinc-500">
                    {t("feed.endOfFeed")}
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyJourneyState onOpenComposer={onOpenComposer} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
