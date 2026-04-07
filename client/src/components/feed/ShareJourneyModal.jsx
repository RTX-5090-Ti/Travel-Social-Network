import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { tripApi } from "../../api/trip.api";
import { uploadApi } from "../../api/upload.api";
import { useToast } from "../../toast/useToast";

function makeMilestone(overrides = {}) {
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

function pickAcceptedFiles(fileList) {
  return Array.from(fileList || []).filter((file) => {
    return file?.type?.startsWith("image/") || file?.type?.startsWith("video/");
  });
}

function createFileEntry(file) {
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

function revokeFileEntry(entry) {
  if (entry?.revokePreview && entry?.previewUrl) {
    URL.revokeObjectURL(entry.previewUrl);
  }
}

function revokeFileEntries(entries = []) {
  entries.forEach(revokeFileEntry);
}

function getFileSignature(entryOrFile) {
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

function createExistingMediaEntry(media = {}, index = 0) {
  const kind = getMediaKind(media?.type);
  const publicId =
    typeof media?.publicId === "string" ? media.publicId.trim() : "";
  const fallbackName =
    publicId.split("/").pop() || `${kind}-${String(index + 1).padStart(2, "0")}`;

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

function formatDateTimeLocal(value) {
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

function normalizeTripDetail(detail) {
  if (!detail) return null;

  if (detail?.trip || Array.isArray(detail?.milestones) || Array.isArray(detail?.generalItems)) {
    return detail;
  }

  return {
    trip: detail,
    generalItems: Array.isArray(detail?.generalItems) ? detail.generalItems : [],
    milestones: Array.isArray(detail?.milestones) ? detail.milestones : [],
  };
}

function buildMilestoneNote(items = []) {
  return items
    .map((item) => (typeof item?.content === "string" ? item.content.trim() : ""))
    .filter(Boolean)
    .join("\n\n");
}

function buildMilestoneFiles(items = []) {
  const files = [];

  items.forEach((item) => {
    (item?.media || []).forEach((media) => {
      files.push(createExistingMediaEntry(media, files.length));
    });
  });

  return files;
}

function buildEmptyFormState() {
  return {
    tripTitle: "",
    tripCaption: "",
    privacy: "public",
    milestones: [makeMilestone()],
  };
}

function buildEditFormState(detail) {
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

  if (milestoneEntries.length === 0 && Array.isArray(normalized?.generalItems) && normalized.generalItems.length > 0) {
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
    milestones: milestoneEntries.length > 0 ? milestoneEntries : [makeMilestone()],
  };
}

const privacyOptions = [
  {
    value: "public",
    label: "Public",
    description: "Hiển thị công khai cho mọi người.",
    tone: "border-emerald-200/80 bg-emerald-50/80 text-emerald-700",
  },
  {
    value: "followers",
    label: "Followers",
    description: "Chỉ người theo dõi mới có thể xem.",
    tone: "border-sky-200/80 bg-sky-50/80 text-sky-700",
  },
  {
    value: "private",
    label: "Private",
    description: "Chỉ mình bạn có thể xem nội dung này.",
    tone: "border-amber-200/80 bg-amber-50/80 text-amber-700",
  },
];

const MAX_FILES_PER_MILESTONE = 6;

export default function ShareJourneyModal({
  open,
  onClose,
  onPosted,
  mode = "create",
  tripId = "",
  initialTripDetail = null,
  onUpdated,
}) {
  const { showToast } = useToast();
  const isEditMode = mode === "edit";

  const [tripTitle, setTripTitle] = useState("");
  const [tripCaption, setTripCaption] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [milestones, setMilestones] = useState([makeMilestone()]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [draggingMilestoneId, setDraggingMilestoneId] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);

  const milestonesRef = useRef(milestones);
  const dragDepthRef = useRef({});
  const initialTripDetailRef = useRef(initialTripDetail);

  const totalFiles = useMemo(() => {
    return milestones.reduce((sum, item) => sum + item.files.length, 0);
  }, [milestones]);

  useEffect(() => {
    milestonesRef.current = milestones;
  }, [milestones]);

  useEffect(() => {
    initialTripDetailRef.current = initialTripDetail;
  }, [initialTripDetail]);

  useEffect(() => {
    return () => {
      milestonesRef.current.forEach((item) => revokeFileEntries(item.files));
    };
  }, []);

  function applyFormState(nextState) {
    setPreviewMedia(null);
    setDraggingMilestoneId(null);
    dragDepthRef.current = {};

    milestonesRef.current.forEach((item) => revokeFileEntries(item.files));

    setTripTitle(nextState.tripTitle || "");
    setTripCaption(nextState.tripCaption || "");
    setPrivacy(nextState.privacy || "public");
    setMilestones(
      Array.isArray(nextState.milestones) && nextState.milestones.length > 0
        ? nextState.milestones
        : [makeMilestone()],
    );
    setErrorMsg("");
  }

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const nextState = isEditMode
      ? buildEditFormState(initialTripDetail)
      : buildEmptyFormState();

    applyFormState(nextState);

    return () => {
      document.body.style.overflow = prev;
    };
  }, [initialTripDetail, isEditMode, open]);

  function resetForm() {
    const nextState = isEditMode
      ? buildEditFormState(initialTripDetailRef.current)
      : buildEmptyFormState();

    applyFormState(nextState);
  }

  function handleCloseModal() {
    if (submitting) return;
    resetForm();
    onClose?.();
  }

  function addMilestone() {
    setMilestones((prev) => [...prev, makeMilestone()]);
  }

  function removeMilestone(id) {
    setMilestones((prev) => {
      const target = prev.find((item) => item.id === id);

      if (target) {
        const removedFileIds = new Set(target.files.map((file) => file.id));

        setPreviewMedia((current) =>
          removedFileIds.has(current?.id) ? null : current,
        );

        revokeFileEntries(target.files);
      }

      return prev.filter((item) => item.id !== id);
    });
  }

  function updateMilestone(id, key, value) {
    setMilestones((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  }

  function handleFilesChange(id, fileList) {
    const acceptedFiles = pickAcceptedFiles(fileList);
    const nextEntries = acceptedFiles.map(createFileEntry);

    if (nextEntries.length === 0) return;

    setMilestones((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const existingSignatures = new Set(
          item.files.map((entry) => getFileSignature(entry)),
        );

        const uniqueNewEntries = nextEntries.filter((entry) => {
          const signature = getFileSignature(entry);

          if (existingSignatures.has(signature)) {
            revokeFileEntry(entry);
            return false;
          }

          existingSignatures.add(signature);
          return true;
        });

        const remainingSlots = Math.max(
          0,
          MAX_FILES_PER_MILESTONE - item.files.length,
        );

        if (remainingSlots <= 0) {
          uniqueNewEntries.forEach(revokeFileEntry);
          showToast(
            `Each milestone can have up to ${MAX_FILES_PER_MILESTONE} files.`,
            "error",
          );
          return item;
        }

        const acceptedEntries = uniqueNewEntries.slice(0, remainingSlots);
        const rejectedEntries = uniqueNewEntries.slice(remainingSlots);

        if (rejectedEntries.length > 0) {
          rejectedEntries.forEach(revokeFileEntry);
          showToast(
            `Each milestone can have up to ${MAX_FILES_PER_MILESTONE} files.`,
            "error",
          );
        }

        return {
          ...item,
          files: [...item.files, ...acceptedEntries],
        };
      }),
    );
  }

  function handleDragEnter(id, e) {
    e.preventDefault();
    e.stopPropagation();

    if (submitting) return;

    dragDepthRef.current[id] = (dragDepthRef.current[id] || 0) + 1;
    setDraggingMilestoneId(id);
  }

  function handleDragOver(id, e) {
    e.preventDefault();
    e.stopPropagation();

    if (submitting) return;

    e.dataTransfer.dropEffect = "copy";
    if (draggingMilestoneId !== id) {
      setDraggingMilestoneId(id);
    }
  }

  function handleDragLeave(id, e) {
    e.preventDefault();
    e.stopPropagation();

    if (submitting) return;

    dragDepthRef.current[id] = Math.max((dragDepthRef.current[id] || 1) - 1, 0);

    if (dragDepthRef.current[id] === 0) {
      setDraggingMilestoneId((prev) => (prev === id ? null : prev));
    }
  }

  function handleDropFiles(id, e) {
    e.preventDefault();
    e.stopPropagation();

    dragDepthRef.current[id] = 0;
    setDraggingMilestoneId(null);

    if (submitting) return;

    const droppedFiles = pickAcceptedFiles(e.dataTransfer.files);
    if (!droppedFiles.length) return;

    handleFilesChange(id, droppedFiles);
  }

  function removeFileFromMilestone(milestoneId, fileId) {
    setPreviewMedia((prev) => (prev?.id === fileId ? null : prev));

    setMilestones((prev) =>
      prev.map((item) => {
        if (item.id !== milestoneId) return item;

        const target = item.files.find((file) => file.id === fileId);
        if (target) revokeFileEntry(target);

        return {
          ...item,
          files: item.files.filter((file) => file.id !== fileId),
        };
      }),
    );
  }

  function openPreview(file) {
    if (file.kind !== "image" && file.kind !== "video") return;
    setPreviewMedia(file);
  }

  function closePreview() {
    setPreviewMedia(null);
  }

  function getRequestErrorMessage(error, fallbackMessage) {
    const serverMessage = error?.response?.data?.message;
    if (serverMessage) return serverMessage;

    if (error?.response?.status === 413) {
      return "File quá nặng, vui lòng chọn file nhỏ hơn.";
    }

    if (error?.message === "Network Error") {
      return "Kết nối mạng không ổn định, vui lòng thử lại.";
    }

    return fallbackMessage;
  }

  async function uploadFiles(files) {
    if (!files || files.length === 0) return [];

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const res = await uploadApi.uploadTripMedia(formData);
    return res.data?.files || [];
  }

  async function cleanupUploadedFiles(files) {
    if (!Array.isArray(files) || files.length === 0) return;

    try {
      await uploadApi.cleanupTripMedia(
        files.map((item) => ({
          publicId: item.publicId,
          type: item.type,
        })),
      );
    } catch {
      // bỏ qua lỗi cleanup nền để không làm gián đoạn UX
    }
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    const normalizedTitle = tripTitle.trim();
    if (!normalizedTitle) {
      setErrorMsg("Trip title không được để trống.");
      return;
    }

    const normalizedMilestones = milestones.map((item, index) => ({
      ...item,
      title: item.title.trim(),
      note: item.note.trim(),
      order: index,
    }));

    const invalidMilestone = normalizedMilestones.find((item) => !item.title);
    if (invalidMilestone) {
      setErrorMsg("Mỗi milestone cần có title.");
      return;
    }

    const uploadedFilesForCleanup = [];

    try {
      setSubmitting(true);
      setErrorMsg("");

      const uploadedEntries = [];

      for (const item of normalizedMilestones) {
        try {
          const uploadedMedia = await uploadFiles(
            item.files.map((entry) => entry.file),
          );

          uploadedFilesForCleanup.push(...uploadedMedia);
          uploadedEntries.push([item.id, uploadedMedia]);
        } catch (error) {
          const milestoneLabel = item.title || `Milestone ${item.order + 1}`;

          await cleanupUploadedFiles(uploadedFilesForCleanup);

          throw new Error(
            `Upload media ở "${milestoneLabel}" thất bại. ${getRequestErrorMessage(
              error,
              "Vui lòng thử lại.",
            )}`,
          );
        }
      }

      const uploadedMap = new Map(uploadedEntries);

      const payload = {
        title: normalizedTitle,
        caption: tripCaption.trim(),
        privacy,
        participantIds: [],
        milestones: normalizedMilestones.map((item) => ({
          tempId: item.id,
          title: item.title,
          time: item.time ? new Date(item.time).toISOString() : null,
          order: item.order,
        })),
        items: normalizedMilestones
          .map((item) => ({
            milestoneTempId: item.id,
            content: item.note,
            media: uploadedMap.get(item.id) || [],
            order: 0,
          }))
          .filter((item) => item.content || item.media.length > 0),
      };

      let tripId = null;

      try {
        const res = await tripApi.create(payload);
        tripId = res.data?.tripId;
      } catch (error) {
        await cleanupUploadedFiles(uploadedFilesForCleanup);

        throw new Error(
          getRequestErrorMessage(error, "Tạo Trip thất bại, vui lòng thử lại."),
        );
      }

      showToast("Post journey thành công.", "success");
      handleCloseModal();
      onPosted?.(tripId);
    } catch (error) {
      const message = error?.message || "Không thể đăng journey lúc này.";
      setErrorMsg(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    if (!isEditMode) {
      return handleCreateSubmit(e);
    }

    e.preventDefault();
    if (submitting) return;

    if (!tripId) {
      const message = "Không xác định được journey để chỉnh sửa.";
      setErrorMsg(message);
      showToast(message, "error");
      return;
    }

    const normalizedTitle = tripTitle.trim();
    if (!normalizedTitle) {
      setErrorMsg("Trip title không được để trống.");
      return;
    }

    const normalizedMilestones = milestones.map((item, index) => ({
      ...item,
      title: item.title.trim(),
      note: item.note.trim(),
      order: index,
    }));

    const invalidMilestone = normalizedMilestones.find((item) => !item.title);
    if (invalidMilestone) {
      setErrorMsg("Mỗi milestone cần có title.");
      return;
    }

    const uploadedFilesForCleanup = [];

    try {
      setSubmitting(true);
      setErrorMsg("");

      const uploadedEntryMap = new Map();

      for (const item of normalizedMilestones) {
        const newFileEntries = item.files.filter((entry) => entry?.file);

        try {
          const uploadedMedia = await uploadFiles(
            newFileEntries.map((entry) => entry.file),
          );

          uploadedFilesForCleanup.push(...uploadedMedia);

          newFileEntries.forEach((entry, index) => {
            uploadedEntryMap.set(entry.id, uploadedMedia[index] || null);
          });
        } catch (error) {
          const milestoneLabel = item.title || `Milestone ${item.order + 1}`;

          await cleanupUploadedFiles(uploadedFilesForCleanup);

          throw new Error(
            `Upload media ở "${milestoneLabel}" thất bại. ${getRequestErrorMessage(
              error,
              "Vui lòng thử lại.",
            )}`,
          );
        }
      }

      const payload = {
        title: normalizedTitle,
        caption: tripCaption.trim(),
        privacy,
        participantIds: [],
        milestones: normalizedMilestones.map((item) => ({
          tempId: item.id,
          title: item.title,
          time: item.time ? new Date(item.time).toISOString() : null,
          order: item.order,
        })),
        items: normalizedMilestones
          .map((item) => ({
            milestoneTempId: item.id,
            content: item.note,
            media: item.files
              .map(
                (entry) => entry.existingMedia || uploadedEntryMap.get(entry.id),
              )
              .filter(Boolean),
            order: 0,
          }))
          .filter((item) => item.content || item.media.length > 0),
      };

      const res = await tripApi.updateTrip(tripId, payload);

      showToast("Đã cập nhật journey.", "success");
      handleCloseModal();
      onUpdated?.(res.data?.tripId || tripId, res.data?.trip || null);
    } catch (error) {
      await cleanupUploadedFiles(uploadedFilesForCleanup);

      const message =
        error?.message ||
        getRequestErrorMessage(error, "Không thể cập nhật journey lúc này.");
      setErrorMsg(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="share-journey-backdrop"
              className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={submitting ? undefined : handleCloseModal}
            />

            <motion.div
              key="share-journey-modal"
              className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 22, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.98 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] shadow-[0_40px_120px_rgba(15,23,42,0.28)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 z-20 px-5 py-4 border-b border-zinc-200/80 bg-white/75 backdrop-blur-xl sm:px-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#3d68ff]">
                        <span className="h-2 w-2 rounded-full bg-[#4f7cff]" />
                        Travel Social
                      </div>

                      <h2 className="mt-3 text-[24px] font-semibold text-zinc-900 sm:text-[28px]">
                        {isEditMode ? "Chỉnh sửa journey" : "Share Journey"}
                      </h2>

                      <p className="max-w-2xl mt-1 text-sm leading-6 text-zinc-500">
                        Chia sẻ chuyến đi theo từng cột mốc, thêm cảm nhận cá
                        nhân và media cho từng chặng để bài post sinh động hơn.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={submitting}
                      className="cursor-pointer inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <XIcon className="w-5 h-5 " />
                    </button>
                  </div>
                </div>

                <form
                  id="share-journey-form"
                  onSubmit={handleSubmit}
                  className="flex-1 px-5 py-5 overflow-y-auto sm:px-7 sm:py-6"
                >
                  <div className="grid gap-6 xl:grid-cols-[1.02fr_1.34fr]">
                    <section className="rounded-[28px] border border-zinc-200/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                            Overview
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-zinc-900">
                            Trip information
                          </h3>
                        </div>

                        <div className="px-3 py-2 text-xs font-semibold rounded-2xl bg-violet-50 text-violet-600">
                          {milestones.length} milestone
                          {milestones.length > 1 ? "s" : ""}
                        </div>
                      </div>

                      <div className="mt-5 space-y-5">
                        <Field label="Trip title">
                          <input
                            value={tripTitle}
                            onChange={(e) => setTripTitle(e.target.value)}
                            type="text"
                            placeholder="Ví dụ: Đà Lạt 2N1Đ cùng hội bạn"
                            className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-[#4f7cff] focus:bg-white focus:ring-4 focus:ring-blue-100"
                          />
                        </Field>

                        <Field label="Trip intro">
                          <textarea
                            value={tripCaption}
                            onChange={(e) => setTripCaption(e.target.value)}
                            rows={5}
                            placeholder="Viết mô tả ngắn cho toàn bộ chuyến đi..."
                            className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-[#4f7cff] focus:bg-white focus:ring-4 focus:ring-blue-100"
                          />
                        </Field>

                        <Field label="Privacy">
                          <PrivacySelect
                            value={privacy}
                            onChange={setPrivacy}
                            options={privacyOptions}
                          />
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="px-4 py-3 border rounded-2xl border-zinc-200 bg-zinc-50/70">
                            <p className="text-xs font-medium text-zinc-400">
                              Milestones
                            </p>
                            <p className="mt-1 text-lg font-semibold text-zinc-900">
                              {milestones.length}
                            </p>
                          </div>

                          <div className="px-4 py-3 border rounded-2xl border-zinc-200 bg-zinc-50/70">
                            <p className="text-xs font-medium text-zinc-400">
                              Media selected
                            </p>
                            <p className="mt-1 text-lg font-semibold text-zinc-900">
                              {totalFiles}
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-[28px] border border-zinc-200/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                            Timeline
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-zinc-900">
                            Journey milestones
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-zinc-500">
                            Mỗi milestone là một chặng trong hành trình, có mô
                            tả, thời gian và media riêng.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={addMilestone}
                          disabled={submitting}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#d66df7] to-[#2663ff] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(82,105,255,0.28)] transition hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {isEditMode ? "+ Thêm milestone" : "+ Add milestone"}
                        </button>
                      </div>

                      <div className="mt-5 space-y-4">
                        {milestones.map((item, index) => (
                          <div
                            key={item.id}
                            className="overflow-hidden rounded-[24px] border border-zinc-200 bg-[linear-gradient(180deg,#ffffff,#fafafb)]"
                          >
                            <div className="flex items-start justify-between gap-3 px-4 py-4 border-b border-zinc-100 sm:px-5">
                              <div className="min-w-0">
                                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#4f7cff]">
                                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] text-[#4f7cff] shadow-sm">
                                    {index + 1}
                                  </span>
                                  Milestone
                                </div>

                                <p className="mt-2 text-sm text-zinc-500">
                                  Thêm hoạt động, cảm nhận và hình ảnh cho chặng
                                  này
                                </p>
                              </div>

                              {milestones.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeMilestone(item.id)}
                                  disabled={submitting}
                                  className="inline-flex items-center justify-center w-10 h-10 transition bg-white border rounded-full cursor-pointer shrink-0 border-zinc-200 text-zinc-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            <div className="px-4 py-4 space-y-5 sm:px-5 sm:py-5">
                              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                                <Field label="Milestone title">
                                  <input
                                    value={item.title}
                                    onChange={(e) =>
                                      updateMilestone(
                                        item.id,
                                        "title",
                                        e.target.value,
                                      )
                                    }
                                    type="text"
                                    placeholder="Ví dụ: Săn mây Đà Lạt"
                                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-[#4f7cff] focus:ring-4 focus:ring-blue-100"
                                  />
                                </Field>

                                <Field label="Time">
                                  <input
                                    value={item.time}
                                    onChange={(e) =>
                                      updateMilestone(
                                        item.id,
                                        "time",
                                        e.target.value,
                                      )
                                    }
                                    type="datetime-local"
                                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-[#4f7cff] focus:ring-4 focus:ring-blue-100"
                                  />
                                </Field>
                              </div>

                              <Field label="Your feeling">
                                <textarea
                                  value={item.note}
                                  onChange={(e) =>
                                    updateMilestone(
                                      item.id,
                                      "note",
                                      e.target.value,
                                    )
                                  }
                                  rows={4}
                                  placeholder="Ghi lại cảm nhận cá nhân ở cột mốc này..."
                                  className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-[#4f7cff] focus:ring-4 focus:ring-blue-100"
                                />
                              </Field>

                              <Field
                                label="Photos / Videos"
                                hint={`${item.files.length}/${MAX_FILES_PER_MILESTONE} files selected`}
                              >
                                <label
                                  onDragEnter={(e) =>
                                    handleDragEnter(item.id, e)
                                  }
                                  onDragOver={(e) => handleDragOver(item.id, e)}
                                  onDragLeave={(e) =>
                                    handleDragLeave(item.id, e)
                                  }
                                  onDrop={(e) => handleDropFiles(item.id, e)}
                                  className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[24px] border border-dashed px-4 py-9 text-center transition duration-200 ${
                                    draggingMilestoneId === item.id
                                      ? "border-[#4f7cff] bg-blue-50/70 shadow-[0_18px_40px_rgba(79,124,255,0.14)] ring-4 ring-blue-100"
                                      : "border-zinc-300 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] hover:border-[#4f7cff] hover:bg-blue-50/40"
                                  }`}
                                >
                                  {draggingMilestoneId === item.id && (
                                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,124,255,0.14),transparent_65%)]" />
                                  )}

                                  <div
                                    className={`relative z-[1] inline-flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/70 text-[#4f7cff] shadow-[0_12px_28px_rgba(79,124,255,0.14)] transition duration-200 ${
                                      draggingMilestoneId === item.id
                                        ? "scale-105 bg-blue-100"
                                        : "bg-[linear-gradient(135deg,#eff6ff,#eef2ff)] group-hover:scale-[1.04]"
                                    }`}
                                  >
                                    <UploadIcon className="w-6 h-6" />
                                  </div>

                                  <span className="relative z-[1] mt-4 text-sm font-semibold text-zinc-800">
                                    {draggingMilestoneId === item.id
                                      ? "Drop media here"
                                      : "Upload media for this milestone"}
                                  </span>

                                  <span className="relative z-[1] mt-1 text-xs leading-5 text-zinc-500">
                                    Kéo & thả ảnh/video vào đây hoặc click để
                                    chọn thêm
                                  </span>

                                  <span className="relative z-[1] mt-1 text-[11px] font-medium text-zinc-400">
                                    Up to {MAX_FILES_PER_MILESTONE} files per
                                    milestone
                                  </span>

                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      handleFilesChange(
                                        item.id,
                                        e.target.files,
                                      );
                                      e.target.value = "";
                                    }}
                                    disabled={submitting}
                                  />
                                </label>

                                {item.files.length > 0 && (
                                  <div className="grid grid-cols-2 gap-3 mt-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                                    {item.files.map((file) => (
                                      <MediaPreviewCard
                                        key={file.id}
                                        file={file}
                                        onPreview={() => openPreview(file)}
                                        onRemove={() =>
                                          removeFileFromMilestone(
                                            item.id,
                                            file.id,
                                          )
                                        }
                                        disabled={submitting}
                                      />
                                    ))}
                                  </div>
                                )}
                              </Field>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </form>

                <div className="px-5 py-4 border-t border-zinc-200/80 bg-white/80 backdrop-blur-xl sm:px-7">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm text-zinc-500">
                        <span className="font-semibold text-zinc-700">
                          {milestones.length}
                        </span>{" "}
                        milestones •{" "}
                        <span className="font-semibold text-zinc-700">
                          {totalFiles}
                        </span>{" "}
                        media files selected
                      </div>

                      {errorMsg ? (
                        <p className="mt-1 text-sm font-medium text-red-500">
                          {errorMsg}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        disabled={submitting}
                        className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold transition bg-white border cursor-pointer rounded-2xl border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        form="share-journey-form"
                        disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#d66df7] to-[#2663ff] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(82,105,255,0.28)] transition hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <SendIcon className="w-4 h-4" />
                        {submitting
                          ? isEditMode
                            ? "Đang lưu..."
                            : "Posting..."
                          : isEditMode
                            ? "Lưu thay đổi"
                            : "Post journey"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {previewMedia && (
          <MediaLightbox media={previewMedia} onClose={closePreview} />
        )}
      </AnimatePresence>
    </>
  );
}

function MediaPreviewCard({ file, onPreview, onRemove, disabled }) {
  const isPreviewable = file.kind === "image" || file.kind === "video";

  const kindLabel =
    file.kind === "image" ? "Photo" : file.kind === "video" ? "Video" : "File";

  const extension = file.name?.split(".")?.pop()?.toUpperCase() || "FILE";

  return (
    <div className="group relative overflow-visible rounded-[24px]">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        disabled={disabled}
        className="cursor-pointer absolute -right-2.5 -top-2.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-black/65 text-white shadow-[0_10px_24px_rgba(15,23,42,0.24)] backdrop-blur-md transition duration-200 hover:scale-105 hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <XIcon className="w-4 h-4" />
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
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-black/45 text-white shadow-[0_12px_30px_rgba(15,23,42,0.28)] backdrop-blur-md">
                    <PlayIcon className="w-5 h-5" />
                  </div>
                </div>
              </>
            )}

            <div className="absolute inset-x-0 top-0 h-20 pointer-events-none bg-gradient-to-b from-black/45 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 pointer-events-none h-28 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

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
                <p className="text-sm font-semibold line-clamp-2 text-zinc-800">
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

function MediaLightbox({ media, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[180] bg-[linear-gradient(180deg,rgba(248,245,255,0.58),rgba(236,242,255,0.60))] backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="fixed inset-0 z-[190] flex items-center justify-center p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(250,246,255,0.92),rgba(240,247,255,0.90))] shadow-[0_32px_100px_rgba(129,140,248,0.16),0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute z-20 inline-flex items-center justify-center text-zinc-700 transition border rounded-full cursor-pointer right-4 top-4 h-11 w-11 border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(245,239,255,0.82))] shadow-[0_12px_26px_rgba(148,163,184,0.18)] backdrop-blur-xl hover:scale-105 hover:text-zinc-900 hover:shadow-[0_16px_34px_rgba(182,137,255,0.20)] cursor-pointer"
          >
            <XIcon className="w-5 h-5" />
          </button>

          <div className="flex max-h-[85vh] min-h-[320px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(182,137,255,0.16),transparent_34%),radial-gradient(circle_at_bottom,rgba(79,124,255,0.10),transparent_38%),linear-gradient(180deg,#fffdfc,#f7f2ff,#eef5ff)] p-3 sm:p-5">
            {media.kind === "image" ? (
              <img
                src={media.previewUrl}
                alt={media.name}
                className="max-h-[72vh] w-auto max-w-full rounded-[22px] object-contain"
              />
            ) : (
              <video
                src={media.previewUrl}
                controls
                autoPlay
                playsInline
                className="max-h-[72vh] w-full rounded-[22px] bg-white/70 object-contain"
              />
            )}
          </div>

          <div className="px-5 py-4 border-t border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(247,242,255,0.76))] backdrop-blur-xl sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate text-zinc-900">
                  {media.name}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {media.kind === "image" ? "Image" : "Video"} •{" "}
                  {formatFileSize(media.size)}
                </p>
              </div>

              <div className="inline-flex w-fit items-center rounded-full border border-[#e7dcff] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(245,238,255,0.92))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c59d9] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                {media.kind === "image" ? "Photo preview" : "Video preview"}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

function formatFileSize(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024)
    return `${Math.max(bytes / 1024, 0.1).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <label className="block text-sm font-medium text-zinc-700">
          {label}
        </label>
        {hint ? <span className="text-xs text-zinc-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function PrivacySelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected = options.find((item) => item.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (!rootRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`cursor-pointer group relative flex min-h-[72px] w-full items-center justify-between gap-4 overflow-hidden rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,248,250,0.96))] px-4 py-4 text-left shadow-[0_14px_40px_rgba(15,23,42,0.06)] ring-1 ring-zinc-200/60 transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_18px_48px_rgba(15,23,42,0.10)] focus:outline-none focus:ring-4 focus:ring-[#d7c3a3]/25 ${
          open ? "border-[#d7c3a3]/70 ring-[#d7c3a3]/40" : ""
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(212,175,122,0.75),transparent)]" />

        <div className="flex items-center min-w-0 gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-white/70 bg-[linear-gradient(135deg,#fff7ed,#f5ecff)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <PrivacyOptionIcon
              value={selected.value}
              className="w-5 h-5 text-zinc-700"
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[15px] font-semibold tracking-[0.01em] text-zinc-900">
                {selected.label}
              </p>

              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase ${selected.tone}`}
              >
                Selected
              </span>
            </div>

            <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-zinc-500">
              {selected.description}
            </p>
          </div>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200/80 bg-white/80 shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
          <ChevronDownIcon
            className={`h-4.5 w-4.5 text-zinc-500 transition duration-200 ${
              open ? "rotate-180 text-zinc-800" : "group-hover:text-zinc-700"
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-[calc(100%+12px)] z-[160] overflow-hidden rounded-[26px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,247,249,0.98))] p-2.5 shadow-[0_28px_70px_rgba(15,23,42,0.16)] ring-1 ring-zinc-200/70 backdrop-blur-xl"
          >
            <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(212,175,122,0.85),transparent)]" />

            <div className="space-y-1.5">
              {options.map((item) => {
                const active = item.value === value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    className={`cursor-pointer group flex w-full items-start gap-3 rounded-[20px] px-3 py-3.5 text-left transition ${
                      active
                        ? "bg-[linear-gradient(135deg,rgba(255,247,237,0.95),rgba(245,236,255,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                        : "hover:bg-white/90"
                    }`}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-white/70 bg-white/90 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                      <PrivacyOptionIcon
                        value={item.value}
                        className="w-5 h-5 text-zinc-700"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`text-[14px] font-semibold ${
                            active ? "text-zinc-950" : "text-zinc-800"
                          }`}
                        >
                          {item.label}
                        </p>

                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase ${item.tone}`}
                        >
                          {item.value}
                        </span>
                      </div>

                      <p className="mt-1 text-[12.5px] leading-5 text-zinc-500">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-center w-8 h-8 shrink-0">
                      {active ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,#caa56c,#b689ff)] text-white shadow-[0_8px_18px_rgba(202,165,108,0.28)]">
                          <CheckIcon className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="h-2.5 w-2.5 rounded-full bg-zinc-300 transition group-hover:bg-zinc-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function XIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function PlayIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8.5 6.75c0-1.01 1.1-1.64 1.97-1.12l7.83 4.75c.84.51.84 1.73 0 2.24l-7.83 4.75c-.87.52-1.97-.11-1.97-1.12V6.75Z" />
    </svg>
  );
}

function PlusIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function TrashIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4.8A1.8 1.8 0 0 1 9.8 3h4.4A1.8 1.8 0 0 1 16 4.8V6" />
      <path d="m8 10 .6 8.2A2 2 0 0 0 10.6 20h2.8a2 2 0 0 0 2-1.8L16 10" />
      <path d="M10 10v6" />
      <path d="M14 10v6" />
    </svg>
  );
}

function UploadIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function FileIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  );
}

function SendIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
    </svg>
  );
}

function ChevronDownIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PrivacyOptionIcon({ value, className = "w-5 h-5" }) {
  if (value === "public") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <circle cx="12" cy="12" r="8" />
        <path d="M4.5 9h15" />
        <path d="M4.5 15h15" />
        <path d="M12 4c2 2.2 3 5 3 8s-1 5.8-3 8c-2-2.2-3-5-3-8s1-5.8 3-8Z" />
      </svg>
    );
  }

  if (value === "followers") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M15 19c0-2.3-1.8-4-4-4s-4 1.7-4 4" />
        <circle cx="11" cy="8" r="3" />
        <path d="M18 8v6" />
        <path d="M15 11h6" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="5" y="11" width="14" height="9" rx="2.5" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}
