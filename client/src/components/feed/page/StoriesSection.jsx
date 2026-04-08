import { PlusIcon } from "./feed.icons";

export function AddStory() {
  return (
    <div className="min-w-[62px] text-center sm:min-w-[74px]">
      <button className="mx-auto flex h-[62px] w-[62px] items-center justify-center rounded-full border border-dashed border-zinc-300 bg-white text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700 sm:h-[74px] sm:w-[74px] cursor-pointer">
        <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      <p className="mt-1.5 text-[12px] font-medium text-zinc-700 sm:mt-3 sm:text-[14px]">
        Add story
      </p>
    </div>
  );
}

export function StoryBubble({ story }) {
  return (
    <div className="min-w-[62px] text-center cursor-pointer sm:min-w-[74px]">
      <div
        className={`mx-auto rounded-full bg-gradient-to-br p-[2px] ${story.ring}`}
      >
        <div className="rounded-full bg-white p-[2.5px] sm:p-[3px]">
          <img
            src={story.avatar}
            alt={story.name}
            className="h-[56px] w-[56px] rounded-full object-cover sm:h-[68px] sm:w-[68px]"
          />
        </div>
      </div>
      <p className="mt-1.5 text-[12px] font-medium text-zinc-700 sm:mt-3 sm:text-[14px]">
        {story.name}
      </p>
    </div>
  );
}
