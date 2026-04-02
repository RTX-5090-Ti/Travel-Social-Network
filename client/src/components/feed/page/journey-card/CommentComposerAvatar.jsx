export default function CommentComposerAvatar({ src, initials, name }) {
  return (
    <div className="relative shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-11 w-11 rounded-full border border-white/80 object-cover shadow-[0_10px_24px_rgba(99,102,241,0.12)] ring-1 ring-zinc-200/70"
        />
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(135deg,#667eea_0%,#8b5cf6_55%,#764ba2_100%)] text-sm font-semibold text-white shadow-[0_12px_26px_rgba(102,126,234,0.22)] ring-1 ring-white/60">
          {initials}
        </div>
      )}
    </div>
  );
}
