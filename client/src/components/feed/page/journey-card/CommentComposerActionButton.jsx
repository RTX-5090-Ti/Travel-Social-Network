export default function CommentComposerActionButton({ children, ariaLabel }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/90 hover:text-[#6d5dfc] hover:shadow-[0_6px_16px_rgba(109,93,252,0.10)]"
    >
      {children}
    </button>
  );
}
