import { stories } from "../page/feed.constants";
import { AddStory, StoryBubble } from "../page/StoriesSection";
import { FeedCardSkeleton, EmptyJourneyState } from "../page/FeedStates";
import JourneyFeedCard from "../page/JourneyFeedCard";
import FeedHeroBar from "./FeedHeroBar";
import SectionHeader from "./SectionHeader";

export default function MainFeed({
  onOpenComposer,
  feedItems,
  feedLoading,
  feedError,
  onReloadFeed,
  onPreviewUser,
}) {
  return (
    <main className="feed-main-scroll min-w-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(250,250,251,0.96))] px-5 py-6 sm:px-7 sm:py-8 lg:h-full lg:overflow-y-auto lg:overflow-x-hidden lg:border-r border-zinc-200/80 lg:px-9 xl:px-10">
      <div className="mx-auto w-full max-w-[860px]">
        <FeedHeroBar onOpenComposer={onOpenComposer} />

        <section className="mt-8">
          <SectionHeader title="Stories" actionLabel="Watch all" />

          <div className="mt-5 rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 backdrop-blur">
            <div className="flex gap-4 pb-1 overflow-x-auto">
              <AddStory />
              {stories.map((story) => (
                <StoryBubble key={story.id} story={story} />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-9">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader title="Journeys from the community" />

            <div className="inline-flex w-fit rounded-[18px] border border-white/70 bg-white/85 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 backdrop-blur">
              <button className="rounded-[14px] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_20px_rgba(102,126,234,0.26)]">
                Trending
              </button>
              <button className="rounded-[14px] px-5 py-2.5 text-[13px] font-semibold text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900">
                Latest
              </button>
            </div>
          </div>

          {feedError ? (
            <div className="mt-5 flex flex-col gap-3 rounded-[24px] border border-red-200 bg-red-50/90 px-4 py-4 text-sm text-red-600 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Không tải được feed</p>
                <p className="mt-1 text-red-500/90">{feedError}</p>
              </div>

              <button
                onClick={onReloadFeed}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-200 transition hover:bg-red-100"
              >
                Retry
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
              feedItems.map((trip, index) => (
                <JourneyFeedCard
                  key={
                    trip._id || `feed-trip-${trip.createdAt || "x"}-${index}`
                  }
                  trip={trip}
                  onPreviewUser={onPreviewUser}
                />
              ))
            ) : (
              <EmptyJourneyState onOpenComposer={onOpenComposer} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
