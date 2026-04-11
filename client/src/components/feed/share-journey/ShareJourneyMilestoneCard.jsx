import ShareJourneyField from "./ShareJourneyField";
import ShareJourneyMediaPreviewCard from "./ShareJourneyMediaPreviewCard";
import { MAX_FILES_PER_MILESTONE } from "./shareJourneyModal.utils";
import { TrashIcon, UploadIcon } from "./shareJourneyIcons";

export default function ShareJourneyMilestoneCard({
  item,
  index,
  milestonesLength,
  submitting,
  draggingMilestoneId,
  onRemoveMilestone,
  onUpdateMilestone,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDropFiles,
  onFilesChange,
  onOpenPreview,
  onRemoveFile,
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-zinc-200 bg-[linear-gradient(180deg,#ffffff,#fafafb)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(15,23,42,0.98))]">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-4 dark:border-white/10 sm:px-5">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#4f7cff] dark:bg-blue-500/10 dark:text-blue-200">
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] text-[#4f7cff] shadow-sm dark:bg-white/10 dark:text-blue-200">
              {index + 1}
            </span>
            Milestone
          </div>

          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Add activities, notes, and media for this milestone
          </p>
        </div>

        {milestonesLength > 1 ? (
          <button
            type="button"
            onClick={() => onRemoveMilestone(item.id)}
            disabled={submitting}
            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:border-red-400/25 dark:hover:bg-red-500/10 dark:hover:text-red-300"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="space-y-5 px-4 py-4 sm:px-5 sm:py-5">
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <ShareJourneyField label="Milestone title">
            <input
              value={item.title}
              onChange={(event) =>
                onUpdateMilestone(item.id, "title", event.target.value)
              }
              type="text"
              placeholder="Ví dụ: Săn mây Đà Lạt"
              className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-[#4f7cff] focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-blue-500/15"
            />
          </ShareJourneyField>

          <ShareJourneyField label="Time">
            <input
              value={item.time}
              onChange={(event) =>
                onUpdateMilestone(item.id, "time", event.target.value)
              }
              type="datetime-local"
              className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-[#4f7cff] focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:focus:ring-blue-500/15"
            />
          </ShareJourneyField>
        </div>

        <ShareJourneyField label="Your feeling">
          <textarea
            value={item.note}
            onChange={(event) =>
              onUpdateMilestone(item.id, "note", event.target.value)
            }
            rows={4}
            placeholder="Ghi lại cảm nhận cá nhân ở cột mốc này..."
            className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-[#4f7cff] focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-blue-500/15"
          />
        </ShareJourneyField>

        <ShareJourneyField
          label="Photos / Videos"
          hint={`${item.files.length}/${MAX_FILES_PER_MILESTONE} files selected`}
        >
          <label
            onDragEnter={(event) => onDragEnter(item.id, event)}
            onDragOver={(event) => onDragOver(item.id, event)}
            onDragLeave={(event) => onDragLeave(item.id, event)}
            onDrop={(event) => onDropFiles(item.id, event)}
            className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[20px] border border-dashed px-4 py-6 text-center transition duration-200 sm:rounded-[24px] sm:py-9 ${
              draggingMilestoneId === item.id
                ? "border-[#4f7cff] bg-blue-50/70 shadow-[0_18px_40px_rgba(79,124,255,0.14)] ring-4 ring-blue-100 dark:border-blue-400/40 dark:bg-blue-500/10 dark:shadow-[0_18px_40px_rgba(2,6,23,0.3)] dark:ring-blue-500/15"
                : "border-zinc-300 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] hover:border-[#4f7cff] hover:bg-blue-50/40 dark:border-white/15 dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(15,23,42,0.96))] dark:hover:border-blue-400/30 dark:hover:bg-blue-500/5"
            }`}
          >
            {draggingMilestoneId === item.id ? (
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,124,255,0.14),transparent_65%)]" />
            ) : null}

            <div
              className={`relative z-[1] inline-flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/70 text-[#4f7cff] shadow-[0_10px_22px_rgba(79,124,255,0.12)] transition duration-200 sm:h-14 sm:w-14 sm:rounded-[20px] sm:shadow-[0_12px_28px_rgba(79,124,255,0.14)] ${
                draggingMilestoneId === item.id
                  ? "scale-105 bg-blue-100 dark:bg-blue-500/15"
                  : "bg-[linear-gradient(135deg,#eff6ff,#eef2ff)] group-hover:scale-[1.04] dark:bg-[linear-gradient(135deg,rgba(30,41,59,0.96),rgba(30,27,75,0.92))]"
              }`}
            >
              <UploadIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>

            <span className="relative z-[1] mt-3 text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 sm:mt-4 sm:text-sm">
              {draggingMilestoneId === item.id
                ? "Drop media here"
                : "Upload media for this milestone"}
            </span>

            <span className="relative z-[1] mt-1 text-[11px] leading-4.5 text-zinc-500 dark:text-zinc-400 sm:text-xs sm:leading-5">
              Drag and drop media here or click to upload more
            </span>

            <span className="relative z-[1] mt-1 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 sm:text-[11px]">
              Up to {MAX_FILES_PER_MILESTONE} files per milestone
            </span>

            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(event) => {
                onFilesChange(item.id, event.target.files);
                event.target.value = "";
              }}
              disabled={submitting}
            />
          </label>

          {item.files.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {item.files.map((file) => (
                <ShareJourneyMediaPreviewCard
                  key={file.id}
                  file={file}
                  onPreview={() => onOpenPreview(file)}
                  onRemove={() => onRemoveFile(item.id, file.id)}
                  disabled={submitting}
                />
              ))}
            </div>
          ) : null}
        </ShareJourneyField>
      </div>
    </div>
  );
}
