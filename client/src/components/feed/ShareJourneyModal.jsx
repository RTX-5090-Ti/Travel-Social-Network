import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { tripApi } from "../../api/trip.api";
import { uploadApi } from "../../api/upload.api";
import { useToast } from "../../toast/useToast";
import ShareJourneyMediaPreviewCard from "./share-journey/ShareJourneyMediaPreviewCard";
import ShareJourneyMediaLightbox from "./share-journey/ShareJourneyMediaLightbox";
import ShareJourneyPrivacySelect from "./share-journey/ShareJourneyPrivacySelect";
import ShareJourneyField from "./share-journey/ShareJourneyField";
import {
  buildEditFormState,
  buildEmptyFormState,
  createFileEntry,
  getFileSignature,
  makeMilestone,
  pickAcceptedFiles,
  revokeFileEntries,
  revokeFileEntry,
} from "./share-journey/shareJourneyModal.utils";

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
                (entry) =>
                  entry.existingMedia || uploadedEntryMap.get(entry.id),
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
              className="fixed inset-0 z-[90] bg-transparent sm:bg-slate-950/40 sm:backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={submitting ? undefined : handleCloseModal}
            />

            <motion.div
              key="share-journey-modal"
              className="fixed inset-0 z-[100] flex items-stretch justify-center p-0 sm:items-center sm:p-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 22, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.98 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="relative flex h-screen max-h-screen w-full max-w-none flex-col overflow-hidden rounded-none border-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] shadow-none sm:h-auto sm:max-h-[92vh] sm:max-w-6xl sm:rounded-[32px] sm:border sm:border-white/60 sm:bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] sm:shadow-[0_40px_120px_rgba(15,23,42,0.28)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 z-20 px-4 py-3 border-b border-zinc-200/80 bg-white/75 backdrop-blur-xl sm:px-7 sm:py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-[#3d68ff] sm:gap-2 sm:px-3 sm:text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#4f7cff] sm:h-2 sm:w-2" />
                        Travel Social
                      </div>

                      <h2 className="mt-2.5 text-[20px] font-semibold text-zinc-900 sm:mt-3 sm:text-[28px]">
                        {isEditMode ? "Chỉnh sửa journey" : "Share Journey"}
                      </h2>

                      <p className="mt-1 max-w-2xl text-[13px] leading-5 text-zinc-500 sm:text-sm sm:leading-6">
                        Chia sẻ chuyến đi theo từng cột mốc, thêm cảm nhận cá
                        nhân và media cho từng chặng để bài post sinh động hơn.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={submitting}
                      className="cursor-pointer inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11"
                    >
                      <XIcon className="w-4 h-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>

                <form
                  id="share-journey-form"
                  onSubmit={handleSubmit}
                  className="flex-1 px-4 py-4 overflow-y-auto sm:px-7 sm:py-6"
                >
                  <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1.02fr_1.34fr]">
                    <section className="rounded-[22px] border border-zinc-200/80 bg-white/90 p-4 shadow-[0_8px_22px_rgba(15,23,42,0.045)] sm:rounded-[28px] sm:p-6 sm:shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
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

                      <div className="mt-4 space-y-4 sm:mt-5 sm:space-y-5">
                        <ShareJourneyField label="Trip title">
                          <input
                            value={tripTitle}
                            onChange={(e) => setTripTitle(e.target.value)}
                            type="text"
                            placeholder="Ví dụ: Đà Lạt 2N1Đ cùng hội bạn"
                            className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-[#4f7cff] focus:bg-white focus:ring-4 focus:ring-blue-100"
                          />
                        </ShareJourneyField>

                        <ShareJourneyField label="Trip intro">
                          <textarea
                            value={tripCaption}
                            onChange={(e) => setTripCaption(e.target.value)}
                            rows={5}
                            placeholder="Viết mô tả ngắn cho toàn bộ chuyến đi..."
                            className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-[#4f7cff] focus:bg-white focus:ring-4 focus:ring-blue-100"
                          />
                        </ShareJourneyField>

                        <ShareJourneyField label="Privacy">
                          <ShareJourneyPrivacySelect
                            value={privacy}
                            onChange={setPrivacy}
                            options={privacyOptions}
                          />
                        </ShareJourneyField>

                        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                          <div className="rounded-[18px] border border-zinc-200 bg-zinc-50/70 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                            <p className="text-[11px] font-medium text-zinc-400 sm:text-xs">
                              Milestones
                            </p>
                            <p className="mt-0.5 text-[17px] font-semibold text-zinc-900 sm:mt-1 sm:text-lg">
                              {milestones.length}
                            </p>
                          </div>

                          <div className="rounded-[18px] border border-zinc-200 bg-zinc-50/70 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                            <p className="text-[11px] font-medium text-zinc-400 sm:text-xs">
                              Media selected
                            </p>
                            <p className="mt-0.5 text-[17px] font-semibold text-zinc-900 sm:mt-1 sm:text-lg">
                              {totalFiles}
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-[22px] border border-zinc-200/80 bg-white/90 p-4 shadow-[0_8px_22px_rgba(15,23,42,0.045)] sm:rounded-[28px] sm:p-6 sm:shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
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
                                <ShareJourneyField label="Milestone title">
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
                                </ShareJourneyField>

                                <ShareJourneyField label="Time">
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
                                </ShareJourneyField>
                              </div>

                              <ShareJourneyField label="Your feeling">
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
                              </ShareJourneyField>

                              <ShareJourneyField
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
                                  className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[20px] border border-dashed px-4 py-6 text-center transition duration-200 sm:rounded-[24px] sm:py-9 ${
                                    draggingMilestoneId === item.id
                                      ? "border-[#4f7cff] bg-blue-50/70 shadow-[0_18px_40px_rgba(79,124,255,0.14)] ring-4 ring-blue-100"
                                      : "border-zinc-300 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] hover:border-[#4f7cff] hover:bg-blue-50/40"
                                  }`}
                                >
                                  {draggingMilestoneId === item.id && (
                                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,124,255,0.14),transparent_65%)]" />
                                  )}

                                  <div
                                    className={`relative z-[1] inline-flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/70 text-[#4f7cff] shadow-[0_10px_22px_rgba(79,124,255,0.12)] transition duration-200 sm:h-14 sm:w-14 sm:rounded-[20px] sm:shadow-[0_12px_28px_rgba(79,124,255,0.14)] ${
                                      draggingMilestoneId === item.id
                                        ? "scale-105 bg-blue-100"
                                        : "bg-[linear-gradient(135deg,#eff6ff,#eef2ff)] group-hover:scale-[1.04]"
                                    }`}
                                  >
                                    <UploadIcon className="w-5 h-5 sm:h-6 sm:w-6" />
                                  </div>

                                  <span className="relative z-[1] mt-3 text-[13px] font-semibold text-zinc-800 sm:mt-4 sm:text-sm">
                                    {draggingMilestoneId === item.id
                                      ? "Drop media here"
                                      : "Upload media for this milestone"}
                                  </span>

                                  <span className="relative z-[1] mt-1 text-[11px] leading-4.5 text-zinc-500 sm:text-xs sm:leading-5">
                                    Kéo & thả ảnh/video vào đây hoặc click để
                                    chọn thêm
                                  </span>

                                  <span className="relative z-[1] mt-1 text-[10px] font-medium text-zinc-400 sm:text-[11px]">
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
                                      <ShareJourneyMediaPreviewCard
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
                              </ShareJourneyField>
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

                    <div className="flex justify-end gap-3 ml-auto">
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
          <ShareJourneyMediaLightbox
            media={previewMedia}
            onClose={closePreview}
          />
        )}
      </AnimatePresence>
    </>
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
