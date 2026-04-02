import { PlusIcon } from "./feed.icons";

export function AddStory() {
  return (
    <div className="min-w-[74px] text-center">
      <button className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-full border border-dashed border-zinc-300 bg-white text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700 cursor-pointer">
        <PlusIcon className="w-5 h-5" />
      </button>
      <p className="mt-3 text-[14px] font-medium text-zinc-700">Add story</p>
    </div>
  );
}

export function StoryBubble({ story }) {
  return (
    <div className="min-w-[74px] text-center cursor-pointer">
      <div
        className={`mx-auto rounded-full bg-gradient-to-br p-[2px] ${story.ring}`}
      >
        <div className="rounded-full bg-white p-[3px]">
          <img
            src={story.avatar}
            alt={story.name}
            className="h-[68px] w-[68px] rounded-full object-cover"
          />
        </div>
      </div>
      <p className="mt-3 text-[14px] font-medium text-zinc-700">{story.name}</p>
    </div>
  );
}
