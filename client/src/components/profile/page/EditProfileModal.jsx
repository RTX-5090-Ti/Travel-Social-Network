import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Compass, FileText, MapPin, User, X } from "lucide-react";

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

  useEffect(() => {
    if (!open) return;
    setForm(normalizedInitialState);
  }, [open, normalizedInitialState]);

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
      if (e.key === "Escape" && !isSaving) {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isSaving, onClose]);

  const bioLength = form.bio.length;
  const nameLength = form.name.length;

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
    hasChanges && !isSaving && !isNameEmpty && !isNameTooLong && !isBioTooLong;

  function handleChangeField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      <button
        type="button"
        aria-label="Close edit profile modal"
        onClick={() => {
          if (!isSaving) onClose?.();
        }}
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(239,244,255,0.28),rgba(125,96,255,0.18))] backdrop-blur-[10px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.985 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-[1] w-full max-w-[760px] overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,247,255,0.96),rgba(246,241,255,0.94))] shadow-[0_30px_90px_rgba(76,82,160,0.22)] ring-1 ring-[rgba(255,255,255,0.6)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.10),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.10),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)]" />

        <div className="relative z-10 flex items-start justify-between gap-4 px-5 py-4 border-b border-white/60 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c5ce7]">
              Personal profile
            </p>
            <h3 className="mt-2 text-[28px] font-semibold tracking-tight text-zinc-900">
              Edit profile
            </h3>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!isSaving) onClose?.();
            }}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/80 bg-white/82 text-zinc-500 shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative z-10 px-5 py-5 sm:px-6 sm:py-6"
        >
          <div className="space-y-5">
            <div className="rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/55 backdrop-blur">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(102,126,234,0.14),rgba(91,99,246,0.16))] text-[#5b63f6]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-zinc-900">
                    Display name
                  </h4>
                </div>
              </div>

              <div className="mt-4">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChangeField("name", e.target.value)}
                  maxLength={DISPLAY_NAME_MAX_LENGTH}
                  placeholder="Nhập tên hiển thị của bạn"
                  className="w-full rounded-[22px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,243,252,0.96))] px-4 py-3 text-[15px] text-zinc-700 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-zinc-200/50 placeholder:text-zinc-400 focus:border-[rgba(139,92,246,0.28)] focus:ring-[rgba(139,92,246,0.16)]"
                />

                <div className="flex items-center justify-between gap-3 mt-3">
                  <p className="text-[13px] text-zinc-500">
                    Tên này sẽ cập nhật ngay ở phần profile header và sidebar.
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

            <div className="rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/55 backdrop-blur">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(102,126,234,0.14),rgba(118,75,162,0.16))] text-[#5b63f6]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-zinc-900">
                    Bio
                  </h4>
                </div>
              </div>

              <div className="mt-4">
                <textarea
                  value={form.bio}
                  onChange={(e) => handleChangeField("bio", e.target.value)}
                  maxLength={BIO_MAX_LENGTH}
                  rows={4}
                  placeholder="Viết vài dòng ngắn để giới thiệu bản thân và cách bạn tận hưởng những chuyến đi..."
                  className="min-h-[128px] w-full resize-none rounded-[22px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,243,252,0.96))] px-4 py-3 text-[15px] leading-7 text-zinc-700 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-zinc-200/50 placeholder:text-zinc-400 focus:border-[rgba(139,92,246,0.28)] focus:ring-[rgba(139,92,246,0.16)]"
                />
                <div className="flex items-center justify-between gap-3 mt-3">
                  <p className="text-[13px] text-zinc-500">
                    Gợi ý: ngắn gọn, tự nhiên, đủ để người xem hiểu vibe du lịch
                    của bạn.
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
              <div className="rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/55 backdrop-blur">
                <div className="flex items-center gap-2">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(96,165,250,0.14),rgba(59,130,246,0.16))] text-[#3b82f6]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold text-zinc-900">
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

              <div className="rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/55 backdrop-blur">
                <div className="flex items-center gap-2">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(139,92,246,0.14),rgba(91,99,246,0.16))] text-[#6c5ce7]">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold text-zinc-900">
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
              <div className="rounded-[18px] border border-red-200 bg-red-50/90 px-4 py-3 text-[14px] text-red-500 shadow-[0_10px_24px_rgba(239,68,68,0.08)]">
                Tên hiển thị đang vượt quá giới hạn {DISPLAY_NAME_MAX_LENGTH} ký
                tự.
              </div>
            ) : null}

            {isBioTooLong ? (
              <div className="rounded-[18px] border border-red-200 bg-red-50/90 px-4 py-3 text-[14px] text-red-500 shadow-[0_10px_24px_rgba(239,68,68,0.08)]">
                Bio đang vượt quá giới hạn {BIO_MAX_LENGTH} ký tự.
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 mt-6 border-t border-zinc-200/70">
            <button
              type="button"
              onClick={() => {
                if (!isSaving) onClose?.();
              }}
              disabled={isSaving}
              className="cursor-pointer rounded-2xl px-5 py-3 text-[15px] font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
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
      </motion.div>
    </motion.div>,
    document.body,
  );
}
