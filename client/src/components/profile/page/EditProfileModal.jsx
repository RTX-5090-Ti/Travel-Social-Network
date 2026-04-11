import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Compass,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  Upload,
  User,
  X,
} from "lucide-react";

import { userApi } from "../../../api/user.api";
import { useAuth } from "../../../auth/useAuth";
import { useToast } from "../../../toast/useToast";
import {
  BIO_MAX_LENGTH,
  LOCATION_OPTIONS,
  TRAVEL_STYLE_OPTIONS,
} from "./profile.constants";
import ProfileSelectField from "./ProfileSelectField";

const DISPLAY_NAME_MAX_LENGTH = 40;

function normalizeValue(value = "") {
  return typeof value === "string" ? value.trim() : "";
}

export default function EditProfileModal({ open, user, onClose }) {
  const { setUser } = useAuth();
  const { showToast } = useToast();

  const normalizedInitialState = useMemo(
    () => ({
      name: normalizeValue(user?.name),
      bio: normalizeValue(user?.bio),
      location: normalizeValue(user?.location),
      travelStyle: normalizeValue(user?.travelStyle),
    }),
    [user?.name, user?.bio, user?.location, user?.travelStyle],
  );

  const [form, setForm] = useState(normalizedInitialState);
  const [isSaving, setIsSaving] = useState(false);
  const [activePanel, setActivePanel] = useState("profile");

  const [draftCoverFile, setDraftCoverFile] = useState(null);
  const [draftCoverPreview, setDraftCoverPreview] = useState("");
  const [isSavingCover, setIsSavingCover] = useState(false);

  const coverInputRef = useRef(null);

  const isBusy = isSaving || isSavingCover;
  const isCoverPanel = activePanel === "cover";
  const currentCoverPreview = draftCoverPreview || user?.coverUrl || "";
  const hasDraftCover = Boolean(draftCoverFile);

  const bioLength = form.bio.length;
  const nameLength = form.name.length;

  useEffect(() => {
    if (!open) return;

    setForm(normalizedInitialState);
    setActivePanel("profile");
    setDraftCoverFile(null);
    setDraftCoverPreview((prev) => {
      if (prev?.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return "";
    });
  }, [open, normalizedInitialState]);

  useEffect(() => {
    return () => {
      if (draftCoverPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(draftCoverPreview);
      }
    };
  }, [draftCoverPreview]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e) {
      if (e.key === "Escape" && !isBusy) {
        if (activePanel === "cover") {
          setActivePanel("profile");
          return;
        }

        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isBusy, onClose, activePanel]);

  const trimmedForm = {
    name: normalizeValue(form.name),
    bio: normalizeValue(form.bio),
    location: normalizeValue(form.location),
    travelStyle: normalizeValue(form.travelStyle),
  };

  const isNameEmpty = !trimmedForm.name;
  const isNameTooLong = nameLength > DISPLAY_NAME_MAX_LENGTH;
  const isBioTooLong = bioLength > BIO_MAX_LENGTH;

  const locationSelectOptions = LOCATION_OPTIONS.map((option) => {
    if (typeof option === "string") {
      return {
        value: option,
        label: option,
        description: "",
      };
    }

    return {
      value: option.value,
      label: option.label,
      description: option.description || "",
    };
  });

  const travelStyleSelectOptions = TRAVEL_STYLE_OPTIONS.map((option) => ({
    value: option.key,
    label: option.label,
    description: option.description,
  }));

  const hasChanges =
    trimmedForm.name !== normalizedInitialState.name ||
    trimmedForm.bio !== normalizedInitialState.bio ||
    trimmedForm.location !== normalizedInitialState.location ||
    trimmedForm.travelStyle !== normalizedInitialState.travelStyle;

  const canSubmit =
    hasChanges && !isBusy && !isNameEmpty && !isNameTooLong && !isBioTooLong;

  function handleChangeField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function clearDraftCover() {
    setDraftCoverFile(null);
    setDraftCoverPreview((prev) => {
      if (prev?.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return "";
    });
  }

  function handleTogglePanel() {
    if (isBusy) return;
    setActivePanel((prev) => (prev === "profile" ? "cover" : "profile"));
  }

  function handleChooseCover() {
    if (isBusy) return;
    coverInputRef.current?.click();
  }

  function handleCoverInputChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      showToast("Vui lòng chọn file ảnh hợp lệ.", "warning");
      e.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast("Ảnh bìa tối đa 8MB.", "warning");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setDraftCoverPreview((prev) => {
      if (prev?.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return previewUrl;
    });

    setDraftCoverFile(file);
    e.target.value = "";
  }

  async function handleSaveCover() {
    if (!draftCoverFile || isSavingCover) return;

    try {
      setIsSavingCover(true);

      const formData = new FormData();
      formData.append("cover", draftCoverFile, draftCoverFile.name);

      const res = await userApi.updateCover(formData);
      const nextUser = res.data?.user || null;

      if (!nextUser) {
        throw new Error("Không nhận được dữ liệu cover mới.");
      }

      setUser((prev) => (prev ? { ...prev, ...nextUser } : nextUser));

      clearDraftCover();
      showToast("Cập nhật ảnh bìa thành công.", "success");
      setActivePanel("profile");
    } catch (err) {
      console.error(err);
      showToast(
        err?.response?.data?.message || "Cập nhật ảnh bìa thất bại.",
        "error",
      );
    } finally {
      setIsSavingCover(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setIsSaving(true);

      const changedPayload = {};

      if (trimmedForm.name !== normalizedInitialState.name) {
        changedPayload.name = trimmedForm.name;
      }

      if (trimmedForm.bio !== normalizedInitialState.bio) {
        changedPayload.bio = trimmedForm.bio;
      }

      if (trimmedForm.location !== normalizedInitialState.location) {
        changedPayload.location = trimmedForm.location;
      }

      if (trimmedForm.travelStyle !== normalizedInitialState.travelStyle) {
        changedPayload.travelStyle = trimmedForm.travelStyle;
      }

      const res = await userApi.updateProfile(changedPayload);
      const nextUser = res.data?.user || null;

      if (!nextUser) {
        throw new Error("Không nhận được dữ liệu profile mới.");
      }

      setUser((prev) => (prev ? { ...prev, ...nextUser } : nextUser));

      showToast("Cập nhật hồ sơ thành công.", "success");
      onClose?.();
    } catch (err) {
      console.error(err);
      showToast(
        err?.response?.data?.message || "Cập nhật hồ sơ thất bại.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[240] flex items-center justify-center p-3 sm:p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <input
        ref={coverInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleCoverInputChange}
      />
      <button
        type="button"
        aria-label="Close edit profile modal"
        onClick={() => {
          if (!isBusy) onClose?.();
        }}
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(239,244,255,0.28),rgba(125,96,255,0.18))] backdrop-blur-[10px] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.72),rgba(15,23,42,0.82))]"
      />

      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.985 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-[1] flex max-h-[calc(100vh-24px)] w-full max-w-[760px] flex-col overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,247,255,0.96),rgba(246,241,255,0.94))] shadow-[0_30px_90px_rgba(76,82,160,0.22)] ring-1 ring-[rgba(255,255,255,0.6)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(15,23,42,0.98),rgba(30,27,75,0.96))] dark:shadow-[0_30px_90px_rgba(2,6,23,0.55)] dark:ring-white/10 sm:max-h-[calc(100vh-40px)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.10),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.10),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)] dark:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />

        <div className="relative z-10 flex items-start justify-between gap-4 border-b border-white/60 px-5 py-4 dark:border-white/10 sm:px-6">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c5ce7]">
              Personal profile
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
              <h3 className="text-[28px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {isCoverPanel ? "Change cover" : "Edit profile"}
              </h3>

              <button
                type="button"
                disabled={isBusy}
                onClick={handleTogglePanel}
                className="inline-flex cursor-pointer items-center gap-2 rounded-[18px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(244,247,255,0.92),rgba(245,240,255,0.94))] px-4 py-2.5 text-[14px] font-semibold text-[#5b63f6] shadow-[0_14px_30px_rgba(91,99,246,0.10)] ring-1 ring-[rgba(139,92,246,0.10)] transition hover:-translate-y-0.5 hover:border-[rgba(139,92,246,0.22)] hover:text-[#4c51d0] hover:shadow-[0_18px_34px_rgba(91,99,246,0.14)] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(30,41,59,0.96),rgba(30,27,75,0.92),rgba(17,24,39,0.96))] dark:text-violet-200 dark:ring-white/10 dark:hover:border-violet-400/30 dark:hover:text-violet-100 dark:hover:shadow-[0_18px_34px_rgba(15,23,42,0.34)]"
              >
                {isCoverPanel ? (
                  <>
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                  </>
                ) : (
                  <>
                    <span>Thay đổi ảnh bìa</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!isBusy) onClose?.();
            }}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/80 bg-white/82 text-zinc-500 shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
            disabled={isBusy}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden touch-pan-y">
          <motion.div
            className="flex min-h-full w-[200%] items-stretch"
            animate={{ x: isCoverPanel ? "-50%" : "0%" }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="min-h-0 w-1/2 shrink-0">
              <form
                onSubmit={handleSubmit}
                className="flex min-h-full flex-col px-5 py-5 sm:px-6 sm:py-6"
              >
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/55 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:ring-white/10">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(102,126,234,0.14),rgba(91,99,246,0.16))] text-[#5b63f6]">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
                          Display name
                        </h4>
                      </div>
                    </div>

                    <div className="mt-4">
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          handleChangeField("name", e.target.value)
                        }
                        maxLength={DISPLAY_NAME_MAX_LENGTH}
                        placeholder="Nhập tên hiển thị của bạn"
                        className="w-full rounded-[22px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,243,252,0.96))] px-4 py-3 text-[15px] text-zinc-700 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-zinc-200/50 placeholder:text-zinc-400 focus:border-[rgba(139,92,246,0.28)] focus:ring-[rgba(139,92,246,0.16)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.94))] dark:text-zinc-100 dark:shadow-none dark:ring-white/10 dark:placeholder:text-zinc-500 dark:focus:border-violet-400/40 dark:focus:ring-violet-400/20"
                      />

                      <div className="flex items-center justify-between gap-3 mt-3">
                        <p className="text-[13px] text-zinc-500">
                          Tên này sẽ cập nhật ngay ở phần profile header và
                          sidebar.
                        </p>
                        <span
                          className={`shrink-0 text-[13px] font-medium ${
                            nameLength >= DISPLAY_NAME_MAX_LENGTH - 8
                              ? "text-[#7c3aed]"
                              : "text-zinc-400"
                          }`}
                        >
                          {nameLength}/{DISPLAY_NAME_MAX_LENGTH}
                        </span>
                      </div>

                      {isNameEmpty ? (
                        <p className="mt-3 text-[13px] font-medium text-red-500">
                          Tên hiển thị không được để trống.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/55 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:ring-white/10">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(102,126,234,0.14),rgba(118,75,162,0.16))] text-[#5b63f6]">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
                          Bio
                        </h4>
                      </div>
                    </div>

                    <div className="mt-4">
                      <textarea
                        value={form.bio}
                        onChange={(e) =>
                          handleChangeField("bio", e.target.value)
                        }
                        maxLength={BIO_MAX_LENGTH}
                        rows={4}
                        placeholder="Viết vài dòng ngắn để giới thiệu bản thân và cách bạn tận hưởng những chuyến đi..."
                        className="min-h-[128px] w-full resize-none rounded-[22px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,243,252,0.96))] px-4 py-3 text-[15px] leading-7 text-zinc-700 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-zinc-200/50 placeholder:text-zinc-400 focus:border-[rgba(139,92,246,0.28)] focus:ring-[rgba(139,92,246,0.16)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.94))] dark:text-zinc-100 dark:shadow-none dark:ring-white/10 dark:placeholder:text-zinc-500 dark:focus:border-violet-400/40 dark:focus:ring-violet-400/20"
                      />
                      <div className="flex items-center justify-between gap-3 mt-3">
                        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                          Gợi ý: ngắn gọn, tự nhiên, đủ để người xem hiểu vibe
                          du lịch của bạn.
                        </p>
                        <span
                          className={`shrink-0 text-[13px] font-medium ${
                            bioLength >= BIO_MAX_LENGTH - 20
                              ? "text-[#7c3aed]"
                              : "text-zinc-400"
                          }`}
                        >
                          {bioLength}/{BIO_MAX_LENGTH}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/55 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:ring-white/10">
                      <div className="flex items-center gap-2">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(96,165,250,0.14),rgba(59,130,246,0.16))] text-[#3b82f6]">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
                            Location
                          </h4>
                        </div>
                      </div>

                      <div className="mt-4">
                        <ProfileSelectField
                          value={form.location}
                          onChange={(nextValue) =>
                            handleChangeField("location", nextValue)
                          }
                          options={locationSelectOptions}
                          placeholder="Chọn tỉnh / thành phố"
                          searchable
                          searchPlaceholder="Tìm tỉnh / thành phố..."
                          emptyMessage="Không tìm thấy khu vực phù hợp."
                          showHelperText={false}
                          showSelectedDescription={false}
                        />
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/55 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:ring-white/10">
                      <div className="flex items-center gap-2">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(139,92,246,0.14),rgba(91,99,246,0.16))] text-[#6c5ce7]">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
                            Travel style
                          </h4>
                        </div>
                      </div>

                      <div className="mt-4">
                        <ProfileSelectField
                          value={form.travelStyle}
                          onChange={(nextValue) =>
                            handleChangeField("travelStyle", nextValue)
                          }
                          options={travelStyleSelectOptions}
                          placeholder="Chọn travel style"
                          emptyMessage="Không tìm thấy phong cách phù hợp."
                          showHelperText={false}
                          showSelectedDescription={false}
                        />
                      </div>
                    </div>
                  </div>

                  {isNameTooLong ? (
                    <div className="rounded-[18px] border border-red-200 bg-red-50/90 px-4 py-3 text-[14px] text-red-500 shadow-[0_10px_24px_rgba(239,68,68,0.08)] dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                      Tên hiển thị đang vượt quá giới hạn{" "}
                      {DISPLAY_NAME_MAX_LENGTH} ký tự.
                    </div>
                  ) : null}

                  {isBioTooLong ? (
                    <div className="rounded-[18px] border border-red-200 bg-red-50/90 px-4 py-3 text-[14px] text-red-500 shadow-[0_10px_24px_rgba(239,68,68,0.08)] dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                      Bio đang vượt quá giới hạn {BIO_MAX_LENGTH} ký tự.
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-200/70 pt-5 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isBusy) onClose?.();
                    }}
                    disabled={isBusy}
                    className="cursor-pointer rounded-2xl px-5 py-3 text-[15px] font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-zinc-500 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white dark:disabled:hover:bg-transparent dark:disabled:hover:text-zinc-300"
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="cursor-pointer rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-8 py-3 text-[15px] font-semibold text-white shadow-[0_14px_28px_rgba(102,126,234,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(102,126,234,0.34)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_14px_28px_rgba(102,126,234,0.28)]"
                  >
                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            </div>

            <div className="flex min-h-0 w-1/2 shrink-0 flex-col px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-1 flex-col space-y-5">
                <div className="rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/55 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:ring-white/10">
                  <div className="flex items-center gap-2">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(139,92,246,0.14),rgba(96,165,250,0.16))] text-[#6c5ce7]">
                      <ImageIcon className="w-4 h-4" />
                    </div>

                    <div>
                      <h4 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
                        Cover image
                      </h4>
                      <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                        Chọn một ảnh ngang sáng, sạch và hợp vibe profile.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-[26px] border border-white/75 bg-[linear-gradient(135deg,rgba(247,249,255,0.96),rgba(241,245,255,0.92),rgba(246,241,255,0.95))] shadow-[0_18px_36px_rgba(91,99,246,0.08)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(30,41,59,0.92),rgba(30,27,75,0.92))] dark:shadow-[0_18px_36px_rgba(2,6,23,0.3)]">
                    <div className="relative aspect-[16/6] w-full overflow-hidden">
                      {currentCoverPreview ? (
                        <>
                          <img
                            src={currentCoverPreview}
                            alt="Draft cover preview"
                            className="absolute inset-0 object-cover w-full h-full"
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(243,244,255,0.12),rgba(250,247,255,0.16))]" />
                        </>
                      ) : (
                        <>
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.18),transparent_28%)]" />
                          <div className="absolute inset-0 flex items-center justify-center p-5">
                            <div className="w-full max-w-[380px] rounded-[24px] border border-white/75 bg-white/82 p-5 text-center shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-900/80 dark:shadow-[0_16px_36px_rgba(2,6,23,0.35)]">
                              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(139,92,246,0.16),rgba(96,165,250,0.18))] text-[#6c5ce7]">
                                <Camera className="w-5 h-5" />
                              </div>

                              <h5 className="mt-3 text-[16px] font-semibold text-zinc-900 dark:text-zinc-50">
                                Chưa chọn ảnh bìa mới
                              </h5>

                              <p className="mt-2 text-[13px] leading-6 text-zinc-500 dark:text-zinc-400">
                                Hãy chọn một ảnh để xem preview ngay trong khung
                                này.
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <button
                      type="button"
                      onClick={handleChooseCover}
                      disabled={isBusy}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,rgba(102,126,234,0.12),rgba(118,75,162,0.14))] px-4 py-3 text-[14px] font-semibold text-[#5b63f6] shadow-[0_12px_24px_rgba(91,99,246,0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(91,99,246,0.14)] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(88,28,135,0.24))] dark:text-violet-100 dark:shadow-[0_12px_24px_rgba(15,23,42,0.28)] dark:hover:shadow-[0_16px_30px_rgba(15,23,42,0.34)]"
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {currentCoverPreview ? "Chọn ảnh khác" : "Chọn ảnh bìa"}
                      </span>
                    </button>

                    {hasDraftCover ? (
                      <button
                        type="button"
                        onClick={clearDraftCover}
                        disabled={isBusy}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-zinc-200 bg-white/85 px-4 py-3 text-[14px] font-semibold text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                      >
                        Xóa ảnh nháp
                      </button>
                    ) : null}
                  </div>

                  <p className="mt-3 text-[12px] leading-5 text-zinc-400 dark:text-zinc-500">
                    Hỗ trợ JPG, PNG, WEBP. Tối đa 8MB. Lưu xong sẽ trượt về lại
                    phần Edit profile.
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-end border-t border-zinc-200/70 pt-5 dark:border-white/10">
                  <button
                    type="button"
                    onClick={handleSaveCover}
                    disabled={!hasDraftCover || isSavingCover}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-5 py-3 text-[15px] font-semibold text-white shadow-[0_14px_28px_rgba(102,126,234,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(102,126,234,0.30)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {isSavingCover ? (
                      <>
                        <LoaderCircle className="w-4 h-4 animate-spin" />
                        <span>Đang lưu ảnh bìa...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        <span>Lưu ảnh bìa</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
