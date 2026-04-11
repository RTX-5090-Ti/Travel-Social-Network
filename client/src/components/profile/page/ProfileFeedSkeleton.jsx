export default function ProfileFeedSkeleton() {
  return (
    <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/80 shadow-[0_16px_36px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(15,23,42,0.98))] dark:shadow-[0_16px_36px_rgba(2,6,23,0.24)] dark:ring-white/10">
      <div className="p-5 animate-pulse sm:p-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-zinc-200 dark:bg-white/10" />
          <div className="space-y-2">
            <div className="h-4 w-36 rounded bg-zinc-200 dark:bg-white/10" />
            <div className="h-3 w-24 rounded bg-zinc-100 dark:bg-white/5" />
          </div>
        </div>
        <div className="mt-5 h-5 w-60 rounded bg-zinc-200 dark:bg-white/10" />
        <div className="mt-3 h-4 w-full rounded bg-zinc-100 dark:bg-white/5" />
        <div className="mt-2 h-4 w-10/12 rounded bg-zinc-100 dark:bg-white/5" />
        <div className="mt-5 h-[260px] rounded-[24px] bg-zinc-100 dark:bg-white/5" />
      </div>
    </div>
  );
}
