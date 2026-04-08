import { PlusIcon } from "../page/feed.icons";
import SearchBar from "./SearchBar";

export default function FeedHeroBar({ onOpenComposer }) {
  return (
    <section className="overflow-hidden rounded-[20px] border border-white/70 bg-[linear-gradient(135deg,rgba(102,126,234,0.12),rgba(118,75,162,0.16),rgba(255,255,255,0.92))] p-2.5 shadow-[0_12px_28px_rgba(15,23,42,0.04)] ring-1 ring-zinc-200/60 backdrop-blur sm:rounded-[32px] sm:p-5 sm:shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 sm:gap-5">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white/80 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#4f7cff] sm:gap-2 sm:px-3 sm:text-[11px] sm:tracking-[0.14em]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4f7cff] sm:h-2 sm:w-2" />
            Travel Social Feed
          </div>

          <h1 className="mt-2.5 max-w-[760px] text-[18px] font-semibold leading-[1.2] tracking-tight text-zinc-900 sm:mt-3 sm:text-[30px]">
            Capture memories, then share the journey beautifully.
          </h1>
        </div>

        <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
          <div className="flex-1 rounded-[15px] border border-white/80 bg-white/80 p-1.5 shadow-[0_6px_14px_rgba(15,23,42,0.035)] backdrop-blur sm:rounded-[24px] sm:p-3 sm:shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <SearchBar />
          </div>

          <button
            onClick={onOpenComposer}
            className="group relative inline-flex h-[46px] shrink-0 items-center justify-center gap-2 overflow-hidden rounded-[14px] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-4 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(102,126,234,0.26)] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_18px_38px_rgba(102,126,234,0.42)] md:min-w-[240px] md:px-7 md:text-[15px] md:gap-3 md:h-[60px] md:rounded-[18px] cursor-pointer"
          >
            <span className="absolute inset-y-0 left-[-100%] w-full bg-[linear-gradient(135deg,#ff6b6b,#4ecdc4,#45b7d1,#6c5ce7)] bg-[length:300%_100%] transition-all duration-500 group-hover:left-0" />
            <span className="relative z-10 inline-flex items-center gap-2.5 md:gap-3">
              <PlusIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Share Journey
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
