import { SearchIcon, MicIcon } from "../page/feed.icons";

export default function SearchBar() {
  return (
    <div className="flex h-[46px] items-center gap-2.5 rounded-[14px] bg-white px-3 shadow-[0_6px_14px_rgba(15,23,42,0.035)] ring-1 ring-zinc-200/70 sm:h-[58px] sm:gap-3 sm:rounded-[18px] sm:px-4 sm:shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
      <SearchIcon className="h-4 w-4 text-zinc-400 sm:h-5 sm:w-5" />
      <input
        type="text"
        placeholder="Search destination, journey, creators..."
        className="h-full flex-1 bg-transparent text-[13px] text-zinc-800 outline-none placeholder:text-zinc-400 sm:text-[14px]"
      />
      <button className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700 sm:h-10 sm:w-10">
        <MicIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
    </div>
  );
}
