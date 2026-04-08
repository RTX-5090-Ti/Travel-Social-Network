import { formatFileSize } from "./shareJourneyModal.utils";
import { FileIcon, PlayIcon, XIcon } from "./shareJourneyIcons";

export default function ShareJourneyMediaPreviewCard({
  file,
  onPreview,
  onRemove,
  disabled,
}) {
  const isPreviewable = file.kind === "image" || file.kind === "video";

  const kindLabel =
    file.kind === "image" ? "Photo" : file.kind === "video" ? "Video" : "File";

  const extension = file.name?.split(".")?.pop()?.toUpperCase() || "FILE";

  return (
    <div className="group relative overflow-visible rounded-[24px]">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        disabled={disabled}
        className="absolute -right-2.5 -top-2.5 z-20 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/70 bg-black/65 text-white shadow-[0_10px_24px_rgba(15,23,42,0.24)] backdrop-blur-md transition duration-200 hover:scale-105 hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <XIcon className="h-4 w-4" />
      </button>

      {isPreviewable ? (
        <button
          type="button"
          onClick={onPreview}
          className="block w-full overflow-hidden rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] text-left shadow-[0_14px_36px_rgba(15,23,42,0.08)] ring-1 ring-zinc-200/70 transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(15,23,42,0.12)] focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          <div className="relative aspect-[5/7] overflow-hidden bg-zinc-100">
            {file.kind === "image" ? (
              <img
                src={file.previewUrl}
                alt={file.name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
              />
            ) : (
              <>
                <video
                  src={file.previewUrl}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  muted
                  playsInline
                  preload="metadata"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-black/45 text-white shadow-[0_12px_30px_rgba(15,23,42,0.28)] backdrop-blur-md">
                    <PlayIcon className="h-5 w-5" />
                  </div>
                </div>
              </>
            )}

            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 via-black/10 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

            <div className="absolute left-3 top-3 z-10 inline-flex items-center rounded-full border border-white/30 bg-white/18 px-2.5 py-[3] text-[11px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-md">
              {kindLabel}
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 p-3">
              <div className="flex flex-col items-center justify-between gap-1 text-[11px] text-white/90">
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/15 px-2.5 py-[2] font-medium backdrop-blur-sm">
                  {extension}
                </span>
                <span className="font-medium">{formatFileSize(file.size)}</span>
              </div>
            </div>
          </div>
        </button>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] shadow-[0_14px_36px_rgba(15,23,42,0.08)] ring-1 ring-zinc-200/70 transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(15,23,42,0.12)]">
          <div className="relative aspect-[5/7] overflow-hidden bg-zinc-100">
            <div className="flex h-full flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,#f8fafc,#eef2ff)] px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-zinc-900 text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)]">
                <FileIcon className="h-7 w-7" />
              </div>

              <div>
                <p className="line-clamp-2 text-sm font-semibold text-zinc-800">
                  {file.name}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{extension}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
