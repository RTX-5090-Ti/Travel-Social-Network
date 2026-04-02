import { PlusIcon } from "../page/feed.icons";
import SearchBar from "./SearchBar";

export default function FeedHeroBar({ onOpenComposer }) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(102,126,234,0.12),rgba(118,75,162,0.16),rgba(255,255,255,0.92))] p-4 shadow-[0_20px_50px_rgba(15,23,42,0.06)] ring-1 ring-zinc-200/60 backdrop-blur sm:p-5">
      <div className="flex flex-col gap-5">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4f7cff]">
            <span className="h-2 w-2 rounded-full bg-[#4f7cff]" />
            Travel Social Feed
          </div>

          <h1 className="mt-3 max-w-[760px] text-[26px] font-semibold tracking-tight text-zinc-900 sm:text-[30px]">
            Capture memories, then share the journey beautifully.
          </h1>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1 rounded-[24px] border border-white/80 bg-white/80 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)] backdrop-blur">
            <SearchBar />
          </div>

          <button
            onClick={onOpenComposer}
            className="group relative inline-flex h-[60px] shrink-0 items-center justify-center gap-3 overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-7 text-[15px] font-semibold text-white shadow-[0_12px_28px_rgba(102,126,234,0.34)] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_18px_38px_rgba(102,126,234,0.42)] md:min-w-[240px] cursor-pointer"
          >
            <span className="absolute inset-y-0 left-[-100%] w-full bg-[linear-gradient(135deg,#ff6b6b,#4ecdc4,#45b7d1,#6c5ce7)] bg-[length:300%_100%] transition-all duration-500 group-hover:left-0" />
            <span className="relative z-10 inline-flex items-center gap-3">
              <PlusIcon className="w-4 h-4" />
              Share Journey
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
