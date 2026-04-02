export default function ProfileFeedSkeleton() {
  return (
    <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/80 shadow-[0_16px_36px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60">
      <div className="p-5 animate-pulse sm:p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-zinc-200" />
          <div className="space-y-2">
            <div className="h-4 rounded w-36 bg-zinc-200" />
            <div className="w-24 h-3 rounded bg-zinc-100" />
          </div>
        </div>
        <div className="h-5 mt-5 rounded w-60 bg-zinc-200" />
        <div className="w-full h-4 mt-3 rounded bg-zinc-100" />
        <div className="w-10/12 h-4 mt-2 rounded bg-zinc-100" />
        <div className="mt-5 h-[260px] rounded-[24px] bg-zinc-100" />
      </div>
    </div>
  );
}
