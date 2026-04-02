import { PlusIcon } from "./feed.icons";

export function FeedCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-[26px] border border-zinc-200/80 bg-white px-4 py-4 shadow-[0_10px_30px_rgba(17,24,39,0.03)] sm:px-5 sm:py-5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="rounded-full h-11 w-11 bg-zinc-200" />
        <div className="flex-1">
          <div className="w-40 h-4 rounded bg-zinc-200" />
          <div className="w-24 h-3 mt-2 rounded bg-zinc-100" />
        </div>
      </div>

      <div className="mt-4 h-[260px] rounded-[18px] bg-zinc-100" />

      <div className="mt-4">
        <div className="w-48 h-5 rounded bg-zinc-200" />
        <div className="w-full h-4 mt-3 rounded bg-zinc-100" />
        <div className="w-5/6 h-4 mt-2 rounded bg-zinc-100" />
      </div>
    </article>
  );
}

export function EmptyJourneyState({ onOpenComposer }) {
  return (
    <div className="rounded-[26px] border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
      <h4 className="text-[20px] font-semibold text-zinc-900">
        Chưa có journey nào trong feed
      </h4>
      <p className="mt-2 text-sm leading-6 text-zinc-500">
        Hãy đăng chuyến đi đầu tiên của bạn để feed bắt đầu có dữ liệu thật.
      </p>

      <button
        onClick={onOpenComposer}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#d66df7] to-[#2663ff] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(82,105,255,0.28)] transition hover:-translate-y-0.5"
      >
        <PlusIcon className="w-4 h-4" />
        Share Journey
      </button>
    </div>
  );
}
