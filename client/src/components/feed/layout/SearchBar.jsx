import { SearchIcon, MicIcon } from "../page/feed.icons";

export default function SearchBar() {
  return (
    <div className="flex h-[58px] items-center gap-3 rounded-[18px] bg-white px-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)] ring-1 ring-zinc-200/70">
      <SearchIcon className="w-5 h-5 text-zinc-400" />
      <input
        type="text"
        placeholder="Search destination, journey, creators..."
        className="h-full flex-1 bg-transparent text-[14px] text-zinc-800 outline-none placeholder:text-zinc-400"
      />
      <button className="inline-flex items-center justify-center w-10 h-10 transition rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700">
        <MicIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
