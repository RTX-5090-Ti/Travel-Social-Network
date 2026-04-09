import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Camera,
  Check,
  ChevronLeft,
  Compass,
  Heart,
  ImageIcon,
  Mail,
  MapPin,
  MessageCircle,
  PenSquare,
  Sparkles,
  UserCheck,
} from "lucide-react";

import { authApi } from "../../../api/auth.api";
import { useToast } from "../../../toast/useToast";
import { useAuth } from "../../../auth/useAuth";
import ProfileMetaPill from "./ProfileMetaPill";
import ProfileHeroStatCard from "./ProfileHeroStatCard";
import AvatarCropModal from "./AvatarCropModal";
import AvatarPreviewModal from "./AvatarPreviewModal";
import { createCroppedAvatar } from "./profileAvatar.utils";
import {
  getProfileBioText,
  getProfileLocationText,
  getProfileTravelStyleText,
} from "./profile.constants";
import EditProfileModal from "./EditProfileModal";

export default function ProfileHero({
  user,
  avatar,
  initials,
  stats,
  onBackToFeed,
  coverUrl,
  formatLargeNumber,
  isVisitorProfile = false,
  isFollowing = null,
  isFollowSubmitting = false,
  isFollowHydrating = false,
  isProfileHydrating = false,
  onToggleFollow,
}) {
  const fileInputRef = useRef(null);
  const { setUser } = useAuth();
  const { showToast } = useToast();

  const [localAvatarPreview, setLocalAvatarPreview] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [draftAvatarSrc, setDraftAvatarSrc] = useState("");
  const [draftAvatarCrop, setDraftAvatarCrop] = useState({
    x: 0,
    y: 0,
    zoom: 1,
  });
  const [draftAvatarNaturalSize, setDraftAvatarNaturalSize] = useState({
    width: 0,
    height: 0,
  });
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const displayUser = user || null;

  const isBioHydrating =
    isProfileHydrating && !String(displayUser?.bio || "").trim();

  const isLocationHydrating =
    isProfileHydrating && !String(displayUser?.location || "").trim();

  const isTravelStyleHydrating =
    isProfileHydrating && !String(displayUser?.travelStyle || "").trim();

  const displayBio = getProfileBioText({
    bio: displayUser?.bio,
    isVisitorProfile,
  });

  const displayLocation = getProfileLocationText(displayUser?.location);
  const displayTravelStyle = getProfileTravelStyleText(
    displayUser?.travelStyle,
  );

  const resolvedIsFollowing = isFollowing === true;
  const isFollowBusy = isFollowSubmitting || isFollowHydrating;
  const isFollowSkeleton = isFollowHydrating && !isFollowSubmitting;

  useEffect(() => {
    return () => {
      if (localAvatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(localAvatarPreview);
      }
      if (draftAvatarSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(draftAvatarSrc);
      }
    };
  }, [localAvatarPreview, draftAvatarSrc]);

  const displayAvatar = localAvatarPreview || avatar;

  const canPreviewAvatar = Boolean(displayAvatar);

  function handleOpenAvatarPreview() {
    if (!canPreviewAvatar) return;
    setIsAvatarPreviewOpen(true);
  }

  function handleCloseAvatarPreview() {
    setIsAvatarPreviewOpen(false);
  }

  function handleOpenEditProfile() {
    if (isVisitorProfile) return;
    setIsEditProfileOpen(true);
  }

  function handleCloseEditProfile() {
    setIsEditProfileOpen(false);
  }

  function handleOpenAvatarPicker() {
    if (isVisitorProfile) return;
    fileInputRef.current?.click();
  }

  function handleAvatarFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      showToast("Vui lòng chọn file ảnh hợp lệ.", "warning");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setDraftAvatarSrc((prev) => {
      if (prev?.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return previewUrl;
    });

    setDraftAvatarCrop({
      x: 0,
      y: 0,
      zoom: 1,
    });
    setIsCropModalOpen(true);

    e.target.value = "";
  }

  function handleCloseCropModal() {
    setDraftAvatarSrc((prev) => {
      if (prev?.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return "";
    });

    setDraftAvatarCrop({
      x: 0,
      y: 0,
      zoom: 1,
    });
    setIsCropModalOpen(false);
  }

  async function handleSaveCroppedAvatar() {
    if (!draftAvatarSrc || isUploadingAvatar) return;

    try {
      const croppedBlob = await createCroppedAvatar(
        draftAvatarSrc,
        draftAvatarCrop,
        draftAvatarNaturalSize,
      );

      const previewUrl = URL.createObjectURL(croppedBlob);

      setLocalAvatarPreview((prev) => {
        if (prev?.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return previewUrl;
      });

      setIsUploadingAvatar(true);
      setIsCropModalOpen(false);

      const formData = new FormData();
      formData.append("avatar", croppedBlob, `avatar-${Date.now()}.jpg`);

      const res = await authApi.updateAvatar(formData);
      const nextUser = res.data?.user || null;

      if (!nextUser) {
        throw new Error("Không nhận được dữ liệu user mới.");
      }

      setUser(nextUser);

      setLocalAvatarPreview((prev) => {
        if (prev?.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return nextUser.avatarUrl || "";
      });

      showToast("Cập nhật avatar thành công.", "success");
    } catch (err) {
      console.error(err);

      setLocalAvatarPreview((prev) => {
        if (prev?.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return "";
      });

      showToast(
        err?.response?.data?.message || "Upload avatar thất bại.",
        "error",
      );
    } finally {
      setDraftAvatarSrc((prev) => {
        if (prev?.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return "";
      });

      setDraftAvatarCrop({
        x: 0,
        y: 0,
        zoom: 1,
      });
      setDraftAvatarNaturalSize({ width: 0, height: 0 });
      setIsCropModalOpen(false);
      setIsUploadingAvatar(false);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.85),rgba(240,244,255,0.92),rgba(248,244,255,0.96))] shadow-[0_20px_50px_rgba(15,23,42,0.06)] ring-1 ring-zinc-200/60 backdrop-blur">
        <div className="relative min-h-[320px] overflow-hidden border-b border-white/60 px-5 pb-6 pt-5 sm:px-7 sm:pt-6">
          <img
            src={coverUrl}
            alt="Profile cover"
            className="absolute inset-0 object-cover w-full h-full"
          />

          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.26),rgba(243,246,255,0.34),rgba(246,241,255,0.38))]" />

          <div className="absolute inset-0 bg-white/18 backdrop-blur-[1px]" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.34),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(167,139,250,0.14),transparent_30%)]" />

          <div className="relative z-[1]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <button
                  onClick={onBackToFeed}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-[13px] font-semibold text-zinc-700 shadow-sm transition hover:bg-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to feed
                </button>

                <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c5ce7]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Personal sanctuary
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isVisitorProfile ? (
                  <button
                    type="button"
                    onClick={onToggleFollow}
                    disabled={isFollowBusy}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-300 ${
                      isFollowBusy
                        ? "cursor-not-allowed opacity-70"
                        : "cursor-pointer"
                    } ${
                      resolvedIsFollowing
                        ? "border border-white/85 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(245,247,255,0.96),rgba(242,237,255,0.94))] text-zinc-700 shadow-[0_14px_30px_rgba(91,99,246,0.14)] ring-1 ring-[rgba(167,139,250,0.16)] hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(91,99,246,0.20)]"
                        : "group relative overflow-hidden bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white shadow-[0_12px_28px_rgba(102,126,234,0.34)] hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_18px_38px_rgba(102,126,234,0.42)]"
                    }`}
                  >
                    {!resolvedIsFollowing &&
                    !isFollowSkeleton &&
                    !isFollowSubmitting ? (
                      <span className="pointer-events-none absolute inset-y-0 left-[-100%] w-full bg-[linear-gradient(135deg,#ff6b6b,#4ecdc4,#45b7d1,#6c5ce7)] bg-[length:300%_100%] transition-all duration-300 group-hover:left-0" />
                    ) : null}

                    {isFollowSkeleton ? (
                      <span className="relative z-10 inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#c4b5fd]/80" />
                        <span className="h-3.5 w-[68px] rounded-full bg-[linear-gradient(90deg,rgba(221,214,254,0.95),rgba(196,181,253,0.55),rgba(221,214,254,0.95))] animate-pulse" />
                      </span>
                    ) : resolvedIsFollowing ? (
                      <span className="relative z-10 inline-flex items-center gap-2">
                        {isFollowSubmitting ? (
                          <>
                            <span className="inline-flex h-4 w-4 animate-spin rounded-full border-[2px] border-zinc-300 border-t-[#7c3aed] border-r-[#5b63f6]" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Following
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="relative z-10 inline-flex items-center gap-2">
                        {isFollowSubmitting ? (
                          <>
                            <span className="inline-flex h-4 w-4 animate-spin rounded-full border-[2px] border-white/35 border-t-white border-r-white" />
                            Updating...
                          </>
                        ) : (
                          "Follow"
                        )}
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenEditProfile}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(102,126,234,0.28)] transition hover:-translate-y-0.5 cursor-pointer"
                  >
                    <PenSquare className="w-4 h-4" />
                    Edit profile
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6 mt-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex flex-col min-w-0 gap-5 sm:flex-row sm:items-end">
                <div className="relative h-[108px] w-[108px] shrink-0 sm:h-[124px] sm:w-[124px]">
                  <div className="absolute inset-[-10px] rounded-[38px] bg-[linear-gradient(135deg,rgba(102,126,234,0.18),rgba(118,75,162,0.20),rgba(255,255,255,0.4))] blur-md" />

                  {displayAvatar ? (
                    <button
                      type="button"
                      onClick={handleOpenAvatarPreview}
                      aria-label="Preview avatar"
                      className="group relative block h-full w-full overflow-hidden rounded-[34px] ring-4 ring-white/70 shadow-[0_22px_40px_rgba(51,65,85,0.12)] cursor-pointer"
                    >
                      <img
                        src={displayAvatar}
                        alt={displayUser?.name || "Traveler"}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />

                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(91,99,246,0.10),rgba(15,23,42,0.18))] opacity-0 transition duration-300 group-hover:opacity-100" />

                      <div className="absolute inset-x-0 flex justify-center transition duration-300 opacity-0 pointer-events-none bottom-3 group-hover:opacity-100">
                        <div className="rounded-full border border-white/80 bg-white/84 px-3 py-1.5 text-[11px] font-semibold text-zinc-800 shadow-[0_10px_24px_rgba(15,23,42,0.14)] backdrop-blur">
                          View avatar
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="relative flex h-full w-full items-center justify-center rounded-[34px] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-[34px] font-semibold text-white ring-4 ring-white/70 shadow-[0_22px_40px_rgba(51,65,85,0.12)]">
                      {initials}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />

                  <button
                    type="button"
                    aria-label="Upload avatar"
                    onClick={handleOpenAvatarPicker}
                    disabled={isUploadingAvatar}
                    className={`absolute bottom-1 right-1 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/80 ring-1 ring-zinc-200/70 backdrop-blur transition duration-200 sm:bottom-1.5 sm:right-1.5 ${
                      isUploadingAvatar
                        ? "cursor-not-allowed bg-[linear-gradient(135deg,#fbf9ff_0%,#f3ecff_52%,#eef4ff_100%)] text-[#7c3aed] shadow-[0_12px_26px_rgba(124,58,237,0.24)]"
                        : "cursor-pointer bg-[linear-gradient(135deg,#ffffff_0%,#f3f6ff_45%,#efe9ff_100%)] text-[#5b63f6] shadow-[0_12px_24px_rgba(91,99,246,0.22)] hover:scale-105 hover:shadow-[0_16px_28px_rgba(91,99,246,0.28)] active:scale-[0.98]"
                    }`}
                  >
                    {isUploadingAvatar ? (
                      <span className="relative inline-flex h-[16px] w-[16px] items-center justify-center">
                        <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.18)_0%,rgba(168,85,247,0)_72%)]" />
                        <span className="h-[16px] w-[16px] animate-spin rounded-full border-[2px] border-[#d8c8ff] border-t-[#8b5cf6] border-r-[#6d5dfc] shadow-[0_0_10px_rgba(139,92,246,0.22)]" />
                      </span>
                    ) : (
                      <Camera className="h-[14px] w-[14px]" />
                    )}
                  </button>
                </div>

                <div className="min-w-0">
                  <h1 className="text-[30px] font-semibold tracking-tight text-zinc-900 sm:text-[36px]">
                    {displayUser?.name || "Traveler"}
                  </h1>

                  {isBioHydrating ? (
                    <div className="mt-3 max-w-[640px] space-y-2">
                      <div className="h-[12px] w-[92%] animate-pulse rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.88),rgba(226,232,240,0.92),rgba(255,255,255,0.88))]" />
                      <div className="h-[12px] w-[74%] animate-pulse rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.88),rgba(226,232,240,0.92),rgba(255,255,255,0.88))]" />
                    </div>
                  ) : (
                    <p
                      className="mt-2 max-w-[640px] overflow-hidden text-[15px] leading-7 text-zinc-600"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                      title={displayBio}
                    >
                      {displayBio}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2.5 text-[13px] text-zinc-500">
                    {!isVisitorProfile ? (
                      <div className="w-full">
                      <ProfileMetaPill
                        icon={<Mail className="w-4 h-4" />}
                        text={displayUser?.email || "Chưa cập nhật email"}
                      />
                      </div>
                    ) : null}
                    <div className="w-full">
                      <ProfileMetaPill
                        icon={<MapPin className="w-4 h-4" />}
                        text={displayLocation}
                        loading={isLocationHydrating}
                      />
                    </div>
                    <div className="w-full">
                      <ProfileMetaPill
                        icon={<Compass className="w-4 h-4" />}
                        text={displayTravelStyle}
                        loading={isTravelStyleHydrating}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ProfileHeroStatCard
                  label="Journeys"
                  value={formatLargeNumber(stats.totalJourneys)}
                  icon={Compass}
                />
                <ProfileHeroStatCard
                  label="Media"
                  value={formatLargeNumber(stats.totalMedia)}
                  icon={ImageIcon}
                />
                <ProfileHeroStatCard
                  label="Hearts"
                  value={formatLargeNumber(stats.totalHearts)}
                  icon={Heart}
                />
                <ProfileHeroStatCard
                  label="Comments"
                  value={formatLargeNumber(stats.totalComments)}
                  icon={MessageCircle}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isCropModalOpen && draftAvatarSrc ? (
          <AvatarCropModal
            src={draftAvatarSrc}
            crop={draftAvatarCrop}
            onChangeCrop={setDraftAvatarCrop}
            onClose={handleCloseCropModal}
            onSave={handleSaveCroppedAvatar}
            onLoadedSize={setDraftAvatarNaturalSize}
            isSaving={isUploadingAvatar}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isAvatarPreviewOpen && displayAvatar ? (
          <AvatarPreviewModal
            src={displayAvatar}
            alt={displayUser?.name || "Traveler"}
            onClose={handleCloseAvatarPreview}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {!isVisitorProfile && isEditProfileOpen ? (
          <EditProfileModal
            open={isEditProfileOpen}
            user={displayUser}
            onClose={handleCloseEditProfile}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
