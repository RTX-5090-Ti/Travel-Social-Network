export function makeMilestone(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    title: "",
    time: "",
    note: "",
    files: [],
    ...overrides,
  };
}

function getFileKind(file) {
  if (file?.type?.startsWith("image/")) return "image";
  if (file?.type?.startsWith("video/")) return "video";
  return "file";
}

export function pickAcceptedFiles(fileList) {
  return Array.from(fileList || []).filter((file) => {
    return (
      file?.type?.startsWith("image/") || file?.type?.startsWith("video/")
    );
  });
}

export function createFileEntry(file) {
  const kind = getFileKind(file);

  return {
    id: crypto.randomUUID(),
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    kind,
    previewUrl:
      kind === "image" || kind === "video" ? URL.createObjectURL(file) : "",
    revokePreview: kind === "image" || kind === "video",
    existingMedia: null,
  };
}

export function revokeFileEntry(entry) {
  if (entry?.revokePreview && entry?.previewUrl) {
    URL.revokeObjectURL(entry.previewUrl);
  }
}

export function revokeFileEntries(entries = []) {
  entries.forEach(revokeFileEntry);
}

export function getFileSignature(entryOrFile) {
  return [
    entryOrFile?.name,
    entryOrFile?.size,
    entryOrFile?.type,
    entryOrFile?.lastModified,
  ].join("__");
}

function getMediaKind(type) {
  return type === "video" ? "video" : "image";
}

export function createExistingMediaEntry(media = {}, index = 0) {
  const kind = getMediaKind(media?.type);
  const publicId =
    typeof media?.publicId === "string" ? media.publicId.trim() : "";
  const fallbackName =
    publicId.split("/").pop() ||
    `${kind}-${String(index + 1).padStart(2, "0")}`;

  return {
    id: crypto.randomUUID(),
    file: null,
    name: fallbackName,
    size: Number(media?.bytes || 0),
    type: kind,
    lastModified: 0,
    kind,
    previewUrl: typeof media?.url === "string" ? media.url.trim() : "",
    revokePreview: false,
    existingMedia: {
      type: kind,
      url: typeof media?.url === "string" ? media.url.trim() : "",
      publicId,
      width: media?.width ?? null,
      height: media?.height ?? null,
      duration: media?.duration ?? null,
      bytes: media?.bytes ?? null,
    },
  };
}

export function formatDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function normalizeTripDetail(detail) {
  if (!detail) return null;

  if (
    detail?.trip ||
    Array.isArray(detail?.milestones) ||
    Array.isArray(detail?.generalItems)
  ) {
    return detail;
  }

  return {
    trip: detail,
    generalItems: Array.isArray(detail?.generalItems)
      ? detail.generalItems
      : [],
    milestones: Array.isArray(detail?.milestones) ? detail.milestones : [],
  };
}

export function buildMilestoneNote(items = []) {
  return items
    .map((item) =>
      typeof item?.content === "string" ? item.content.trim() : "",
    )
    .filter(Boolean)
    .join("\n\n");
}

export function buildMilestoneFiles(items = []) {
  const files = [];

  items.forEach((item) => {
    (item?.media || []).forEach((media) => {
      files.push(createExistingMediaEntry(media, files.length));
    });
  });

  return files;
}

export function buildEmptyFormState() {
  return {
    tripTitle: "",
    tripCaption: "",
    privacy: "public",
    milestones: [makeMilestone()],
  };
}

export function buildEditFormState(detail) {
  const normalized = normalizeTripDetail(detail);
  if (!normalized) {
    return buildEmptyFormState();
  }

  const trip = normalized?.trip || normalized;

  const milestoneEntries = Array.isArray(normalized?.milestones)
    ? normalized.milestones.map((item) =>
        makeMilestone({
          id: item?._id || crypto.randomUUID(),
          title: item?.title || "",
          time: formatDateTimeLocal(item?.time),
          note: buildMilestoneNote(item?.items || []),
          files: buildMilestoneFiles(item?.items || []),
        }),
      )
    : [];

  if (
    milestoneEntries.length === 0 &&
    Array.isArray(normalized?.generalItems) &&
    normalized.generalItems.length > 0
  ) {
    milestoneEntries.push(
      makeMilestone({
        title: trip?.title || "",
        note: buildMilestoneNote(normalized.generalItems),
        files: buildMilestoneFiles(normalized.generalItems),
      }),
    );
  }

  return {
    tripTitle: typeof trip?.title === "string" ? trip.title : "",
    tripCaption: typeof trip?.caption === "string" ? trip.caption : "",
    privacy: trip?.privacy || "public",
    milestones:
      milestoneEntries.length > 0 ? milestoneEntries : [makeMilestone()],
  };
}

export const privacyOptions = [
  {
    value: "public",
    label: "Public",
    description: "Hiá»ƒn thá»‹ cÃ´ng khai cho má»i ngÆ°á»i.",
    tone: "border-emerald-200/80 bg-emerald-50/80 text-emerald-700",
  },
  {
    value: "followers",
    label: "Followers",
    description: "Chá»‰ ngÆ°á»i theo dÃµi má»›i cÃ³ thá»ƒ xem.",
    tone: "border-sky-200/80 bg-sky-50/80 text-sky-700",
  },
  {
    value: "private",
    label: "Private",
    description: "Chá»‰ mÃ¬nh báº¡n cÃ³ thá»ƒ xem ná»™i dung nÃ y.",
    tone: "border-amber-200/80 bg-amber-50/80 text-amber-700",
  },
];

export const MAX_FILES_PER_MILESTONE = 6;

export function formatFileSize(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) {
    return `${Math.max(bytes / 1024, 0.1).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
