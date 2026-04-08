import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BellOff,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
  Languages,
  LockKeyhole,
  MoonStar,
  Settings as SettingsIcon,
  ShieldCheck,
  Trash2,
  UserX,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { authApi } from "../api/auth.api";
import FloatingShape from "../components/auth/login/FloatingShape";
import { shapeStyles } from "../components/feed/page/feed.constants";
import { getInitials } from "../components/feed/page/feed.utils";
import ProfileHero from "../components/profile/page/ProfileHero";
import ProfileLeftSidebar from "../components/profile/page/ProfileLeftSidebar";
import ProfileRightSidebar from "../components/profile/page/ProfileRightSidebar";
import ProfileFeedSkeleton from "../components/profile/page/ProfileFeedSkeleton";
import {
  PROFILE_COVER_URL,
  formatLargeNumber,
} from "../components/profile/page/profile-page.helpers";
import { useProfileData } from "../components/profile/page/useProfileData";
import { useToast } from "../toast/useToast";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();
  const { showToast } = useToast();
  const [openSection, setOpenSection] = useState("privacy");
  const [messagePermission, setMessagePermission] = useState("everyone");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState("english");
  const [themeMode, setThemeMode] = useState("system");
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState(false);
  const [isDeactivateSuccess, setIsDeactivateSuccess] = useState(false);
  const [deactivateCountdown, setDeactivateCountdown] = useState(4);
  const [isDeactivateSubmitting, setIsDeactivateSubmitting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteSuccess, setIsDeleteSuccess] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(4);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordShow, setPasswordShow] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const { loading, error, avatar, displayUser, stats, sidebarStats } =
    useProfileData({
      user,
      userId: undefined,
      isVisitorProfile: false,
      routedProfileUser: null,
      routedProfileTrips: [],
      showToast,
    });

  const initials = getInitials(displayUser?.name || "Traveler");
  const isConfirmMatched =
    passwordForm.confirmPassword.trim().length > 0 &&
    passwordForm.confirmPassword === passwordForm.newPassword;

  useEffect(() => {
    if (openSection !== "password") {
      setIsPasswordFormOpen(false);
      setPasswordErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [openSection]);

  useEffect(() => {
    if (!isDeactivateConfirmOpen || !isDeactivateSuccess) return undefined;

    setDeactivateCountdown(4);

    const intervalId = window.setInterval(() => {
      setDeactivateCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          return 1;
        }
        return prev - 1;
      });
    }, 1000);

    const closeTimeoutId = window.setTimeout(() => {
      handleCloseDeactivateModal();
      clearAuth();
      navigate("/login", { replace: true });
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(closeTimeoutId);
    };
  }, [
    clearAuth,
    isDeactivateConfirmOpen,
    isDeactivateSuccess,
    navigate,
  ]);

  useEffect(() => {
    if (!isDeleteConfirmOpen || !isDeleteSuccess) return undefined;

    setDeleteCountdown(4);

    const intervalId = window.setInterval(() => {
      setDeleteCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          return 1;
        }
        return prev - 1;
      });
    }, 1000);

    const closeTimeoutId = window.setTimeout(() => {
      handleCloseDeleteModal();
      clearAuth();
      navigate("/login", { replace: true });
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(closeTimeoutId);
    };
  }, [clearAuth, isDeleteConfirmOpen, isDeleteSuccess, navigate]);

  function handlePasswordInputChange(field, value) {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setPasswordErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  }

  function handleTogglePasswordVisibility(field) {
    setPasswordShow((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }

  function handleCancelPasswordForm() {
    setIsPasswordFormOpen(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordShow({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
  }

  function handleCloseDeactivateModal() {
    setIsDeactivateConfirmOpen(false);
    setIsDeactivateSuccess(false);
    setDeactivateCountdown(4);
    setIsDeactivateSubmitting(false);
  }

  function handleCloseDeleteModal() {
    setIsDeleteConfirmOpen(false);
    setIsDeleteSuccess(false);
    setDeleteCountdown(4);
    setIsDeleteSubmitting(false);
  }

  async function handleSavePassword() {
    const nextErrors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    if (!passwordForm.currentPassword.trim()) {
      nextErrors.currentPassword = "Please enter your current password.";
    }

    if (!passwordForm.newPassword.trim()) {
      nextErrors.newPassword = "Please enter a new password.";
    } else if (passwordForm.newPassword.length < 6) {
      nextErrors.newPassword = "New password must be at least 6 characters.";
    }

    if (!passwordForm.confirmPassword.trim()) {
      nextErrors.confirmPassword = "Please confirm your new password.";
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      nextErrors.confirmPassword = "Confirm password does not match.";
    }

    if (
      nextErrors.currentPassword ||
      nextErrors.newPassword ||
      nextErrors.confirmPassword
    ) {
      setPasswordErrors(nextErrors);
      return;
    }

    try {
      setIsPasswordSaving(true);
      setPasswordErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      showToast("Đổi mật khẩu thành công", "success");
      handleCancelPasswordForm();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Không đổi mật khẩu được lúc này.";

      if (
        message === "Current password is incorrect." ||
        message.toLowerCase().includes("current password")
      ) {
        setPasswordErrors((prev) => ({
          ...prev,
          currentPassword: "Current password is incorrect.",
        }));
        return;
      }

      if (
        message === "Confirm password does not match." ||
        message.toLowerCase().includes("confirm password")
      ) {
        setPasswordErrors((prev) => ({
          ...prev,
          confirmPassword: "Confirm password does not match.",
        }));
        return;
      }

      if (message.toLowerCase().includes("new password")) {
        setPasswordErrors((prev) => ({
          ...prev,
          newPassword: message,
        }));
        return;
      }

      showToast(message, "error");
    } finally {
      setIsPasswordSaving(false);
    }
  }

  async function handleDeactivateAccount() {
    try {
      setIsDeactivateSubmitting(true);
      await authApi.deactivateAccount();
      setIsDeactivateSuccess(true);
      setDeactivateCountdown(4);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "KhÃ´ng vá» hiá»‡u hÃ³a Ä‘Æ°á»£c tÃ i khoáº£n lÃºc nÃ y.";
      showToast(message, "error");
      setIsDeactivateSubmitting(false);
    }
  }

  async function handleDeleteAccount() {
    try {
      setIsDeleteSubmitting(true);
      await authApi.deleteAccount();
      setIsDeleteSuccess(true);
      setDeleteCountdown(4);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "KhÃ´ng thá»ƒ yÃªu cáº§u xoÃ¡ tÃ i khoáº£n lÃºc nÃ y.";
      showToast(message, "error");
      setIsDeleteSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-4">
      <div className="absolute inset-0 pointer-events-none">
        <FloatingShape
          className="left-[8%] top-[10%] h-20 w-20"
          style={shapeStyles[0]}
        >
          <div className="h-full w-full rounded-full bg-[linear-gradient(45deg,rgba(255,255,255,0.20),rgba(147,197,253,0.24))]" />
        </FloatingShape>

        <FloatingShape
          className="right-[12%] top-[20%] h-[120px] w-[120px]"
          style={shapeStyles[1]}
        >
          <div className="h-full w-full rounded-full bg-[linear-gradient(45deg,rgba(244,114,182,0.18),rgba(192,132,252,0.24))]" />
        </FloatingShape>

        <FloatingShape
          className="bottom-[28%] left-[18%] h-[60px] w-[60px]"
          style={shapeStyles[2]}
        >
          <div className="h-full w-full rounded-full bg-[linear-gradient(45deg,rgba(56,189,248,0.20),rgba(59,130,246,0.24))]" />
        </FloatingShape>

        <FloatingShape
          className="bottom-[10%] right-[10%] h-[100px] w-[100px]"
          style={shapeStyles[3]}
        >
          <div className="h-full w-full rounded-full bg-[linear-gradient(45deg,rgba(196,181,253,0.22),rgba(255,255,255,0.18))]" />
        </FloatingShape>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1680px] overflow-hidden rounded-[34px] border border-white/60 bg-[#fafafb] shadow-[0_25px_80px_rgba(30,41,59,0.08)] lg:h-[calc(100vh-2rem)]">
        <div className="grid min-h-[900px] grid-cols-1 lg:h-full lg:min-h-0 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
          <ProfileLeftSidebar user={displayUser} stats={sidebarStats} />

          <main className="profile-main-scroll min-w-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(250,250,251,0.96))] px-5 py-6 sm:px-7 sm:py-8 lg:h-full lg:overflow-y-auto lg:overflow-x-hidden lg:border-r lg:px-9 xl:px-10 border-zinc-200/80">
            <div className="mx-auto w-full max-w-[920px]">
              <ProfileHero
                user={displayUser}
                avatar={avatar}
                initials={initials}
                stats={stats}
                onBackToFeed={() => navigate("/")}
                coverUrl={displayUser?.coverUrl || PROFILE_COVER_URL}
                formatLargeNumber={formatLargeNumber}
                isVisitorProfile={false}
              />

              <section className="mt-8">
                <div className="flex items-center justify-between gap-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                        Personal settings
                      </p>
                      <h3 className="mt-2 text-[26px] font-semibold tracking-tight text-zinc-900">
                        Settings
                      </h3>
                    </div>
                  </div>
                </div>

                {error ? (
                  <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50/90 px-4 py-4 text-sm text-red-600">
                    <p className="font-semibold">
                      Không tải được giao diện cài đặt
                    </p>
                    <p className="mt-1 text-red-500/90">{error}</p>
                  </div>
                ) : null}

                <div className="mt-6 min-h-[320px] overflow-hidden">
                  {loading ? (
                    <div className="space-y-7">
                      <ProfileFeedSkeleton />
                      <ProfileFeedSkeleton />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <SettingsAccordion
                        title="Change password"
                        description="Update your password to keep your account secure."
                        icon={LockKeyhole}
                        open={openSection === "password"}
                        onToggle={() =>
                          setOpenSection((prev) =>
                            prev === "password" ? "" : "password",
                          )
                        }
                      >
                        <div className="rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,255,0.95))] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)] ring-1 ring-zinc-200/55">
                          <p className="text-[14px] leading-7 text-zinc-500">
                            You can change your password here whenever you want.
                          </p>

                          {!isPasswordFormOpen ? (
                            <button
                              type="button"
                              onClick={() => setIsPasswordFormOpen(true)}
                              className="mt-4 inline-flex h-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(102,126,234,0.24)] transition hover:-translate-y-0.5 cursor-pointer"
                            >
                              Change password
                            </button>
                          ) : (
                            <div className="mt-5 rounded-[24px] border border-zinc-200/80 bg-white/90 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                              <div className="grid gap-3">
                                <label className="block">
                                  <span className="mb-2 block text-[13px] font-semibold text-zinc-700">
                                    Current password
                                  </span>
                                  <div className="relative">
                                    <input
                                      type={
                                        passwordShow.currentPassword
                                          ? "text"
                                          : "password"
                                      }
                                      value={passwordForm.currentPassword}
                                      onChange={(e) =>
                                        handlePasswordInputChange(
                                          "currentPassword",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Enter current password"
                                      className={`h-11 w-full rounded-[18px] border bg-[linear-gradient(180deg,#ffffff,#f7f8fc)] px-4 pr-12 text-[14px] text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:ring-2 ${
                                        passwordErrors.currentPassword
                                          ? "border-red-300 focus:border-red-300 focus:ring-red-100"
                                          : "border-zinc-200/80 focus:border-violet-200 focus:ring-violet-100"
                                      }`}
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleTogglePasswordVisibility(
                                          "currentPassword",
                                        )
                                      }
                                      className="absolute inline-flex items-center justify-center transition -translate-y-1/2 cursor-pointer right-3 top-1/2 text-zinc-400 hover:text-zinc-700"
                                    >
                                      {passwordShow.currentPassword ? (
                                        <EyeOff className="h-4.5 w-4.5" />
                                      ) : (
                                        <Eye className="h-4.5 w-4.5" />
                                      )}
                                    </button>
                                  </div>
                                  {passwordErrors.currentPassword ? (
                                    <p className="mt-2 text-[12px] font-medium text-red-500">
                                      {passwordErrors.currentPassword}
                                    </p>
                                  ) : null}
                                </label>

                                <label className="block">
                                  <span className="mb-2 block text-[13px] font-semibold text-zinc-700">
                                    New password
                                  </span>
                                  <div className="relative">
                                    <input
                                      type={
                                        passwordShow.newPassword
                                          ? "text"
                                          : "password"
                                      }
                                      value={passwordForm.newPassword}
                                      onChange={(e) =>
                                        handlePasswordInputChange(
                                          "newPassword",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Enter new password"
                                      className={`h-11 w-full rounded-[18px] border bg-[linear-gradient(180deg,#ffffff,#f7f8fc)] px-4 pr-12 text-[14px] text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:ring-2 ${
                                        passwordErrors.newPassword
                                          ? "border-red-300 focus:border-red-300 focus:ring-red-100"
                                          : "border-zinc-200/80 focus:border-violet-200 focus:ring-violet-100"
                                      }`}
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleTogglePasswordVisibility(
                                          "newPassword",
                                        )
                                      }
                                      className="absolute inline-flex items-center justify-center transition -translate-y-1/2 cursor-pointer right-3 top-1/2 text-zinc-400 hover:text-zinc-700"
                                    >
                                      {passwordShow.newPassword ? (
                                        <EyeOff className="h-4.5 w-4.5" />
                                      ) : (
                                        <Eye className="h-4.5 w-4.5" />
                                      )}
                                    </button>
                                  </div>
                                  {passwordErrors.newPassword ? (
                                    <p className="mt-2 text-[12px] font-medium text-red-500">
                                      {passwordErrors.newPassword}
                                    </p>
                                  ) : null}
                                </label>

                                <label className="block">
                                  <span className="mb-2 block text-[13px] font-semibold text-zinc-700">
                                    Confirm password
                                  </span>
                                  <div className="relative">
                                    <input
                                      type={
                                        passwordShow.confirmPassword
                                          ? "text"
                                          : "password"
                                      }
                                      value={passwordForm.confirmPassword}
                                      onChange={(e) =>
                                        handlePasswordInputChange(
                                          "confirmPassword",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Confirm new password"
                                      className={`h-11 w-full rounded-[18px] border bg-[linear-gradient(180deg,#ffffff,#f7f8fc)] px-4 pr-20 text-[14px] text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:ring-2 ${
                                        passwordErrors.confirmPassword
                                          ? "border-red-300 focus:border-red-300 focus:ring-red-100"
                                          : "border-zinc-200/80 focus:border-violet-200 focus:ring-violet-100"
                                      }`}
                                    />

                                    <div className="absolute inline-flex items-center gap-2 -translate-y-1/2 right-3 top-1/2">
                                      {isConfirmMatched ? (
                                        <span className="inline-flex items-center justify-center text-emerald-500">
                                          <Check className="h-4.5 w-4.5" />
                                        </span>
                                      ) : null}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleTogglePasswordVisibility(
                                            "confirmPassword",
                                          )
                                        }
                                        className="inline-flex items-center justify-center transition cursor-pointer text-zinc-400 hover:text-zinc-700"
                                      >
                                        {passwordShow.confirmPassword ? (
                                          <EyeOff className="h-4.5 w-4.5" />
                                        ) : (
                                          <Eye className="h-4.5 w-4.5" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  {passwordErrors.confirmPassword ? (
                                    <p className="mt-2 text-[12px] font-medium text-red-500">
                                      {passwordErrors.confirmPassword}
                                    </p>
                                  ) : null}
                                </label>
                              </div>

                              <div className="flex items-center justify-end gap-3 mt-4">
                                <button
                                  type="button"
                                  onClick={handleCancelPasswordForm}
                                  className="inline-flex items-center justify-center h-10 px-5 text-sm font-semibold transition bg-white border cursor-pointer rounded-2xl border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                >
                                  Cancel
                                </button>

                                <button
                                  type="button"
                                  onClick={handleSavePassword}
                                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(102,126,234,0.24)] transition hover:-translate-y-0.5 cursor-pointer"
                                >
                                  {isPasswordSaving ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </SettingsAccordion>

                      <SettingsAccordion
                        title="Account access"
                        description="Deactivate your account temporarily or delete it permanently."
                        icon={UserX}
                        open={openSection === "account"}
                        onToggle={() =>
                          setOpenSection((prev) =>
                            prev === "account" ? "" : "account",
                          )
                        }
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[24px] border border-amber-100 bg-[linear-gradient(180deg,#fffdf6,#fff7e6)] p-5 shadow-[0_12px_28px_rgba(245,158,11,0.07)]">
                            <div className="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-amber-100/80 text-amber-600">
                              <UserX className="w-5 h-5" />
                            </div>
                            <h4 className="mt-4 text-[18px] font-semibold tracking-tight text-zinc-900">
                              Deactivate account
                            </h4>
                            <p className="mt-2 text-[14px] leading-7 text-zinc-500">
                              Temporarily hide your account until you are ready
                              to come back.
                            </p>
                            <button
                              type="button"
                              onClick={() => setIsDeactivateConfirmOpen(true)}
                              className="inline-flex items-center justify-center h-10 px-4 mt-4 text-sm font-semibold transition bg-white border cursor-pointer rounded-2xl border-amber-200 text-amber-700 hover:bg-amber-50"
                            >
                              Deactivate
                            </button>
                          </div>

                          <div className="rounded-[24px] border border-rose-100 bg-[linear-gradient(180deg,#fff8fa,#fff0f3)] p-5 shadow-[0_12px_28px_rgba(244,63,94,0.07)]">
                            <div className="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-rose-100/80 text-rose-600">
                              <Trash2 className="w-5 h-5" />
                            </div>
                            <h4 className="mt-4 text-[18px] font-semibold tracking-tight text-zinc-900">
                              Delete account
                            </h4>
                            <p className="mt-2 text-[14px] leading-7 text-zinc-500">
                              Permanently remove your account and all associated
                              data.
                            </p>
                            <button
                              type="button"
                              onClick={() => setIsDeleteConfirmOpen(true)}
                              className="mt-4 inline-flex h-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fb7185_0%,#f43f5e_100%)] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(244,63,94,0.18)] transition hover:-translate-y-0.5 cursor-pointer"
                            >
                              Delete account
                            </button>
                          </div>
                        </div>
                      </SettingsAccordion>

                      <SettingsAccordion
                        title="Privacy"
                        description="Control who can message you."
                        icon={ShieldCheck}
                        open={openSection === "privacy"}
                        onToggle={() =>
                          setOpenSection((prev) =>
                            prev === "privacy" ? "" : "privacy",
                          )
                        }
                      >
                        <div className="grid gap-4">
                          <SettingsOptionGroup
                            title="Who can message you"
                            value={messagePermission}
                            onChange={setMessagePermission}
                            options={[
                              { value: "everyone", label: "Everyone" },
                              { value: "followers", label: "Followers" },
                              { value: "nobody", label: "Nobody" },
                            ]}
                          />
                        </div>
                      </SettingsAccordion>

                      <SettingsAccordion
                        title="Notifications"
                        description="Turn notification delivery on or off."
                        icon={BellOff}
                        open={openSection === "notifications"}
                        onToggle={() =>
                          setOpenSection((prev) =>
                            prev === "notifications" ? "" : "notifications",
                          )
                        }
                      >
                        <div className="flex flex-col gap-4 rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,255,0.95))] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)] ring-1 ring-zinc-200/55 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h4 className="text-[17px] font-semibold tracking-tight text-zinc-900">
                              Notification delivery
                            </h4>
                            <p className="mt-2 text-[14px] leading-7 text-zinc-500">
                              {notificationsEnabled
                                ? "You are currently receiving notifications."
                                : "All notifications are currently turned off."}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setNotificationsEnabled((prev) => !prev)
                            }
                            className={`inline-flex h-10 min-w-[142px] items-center justify-center rounded-2xl px-4 text-sm font-semibold transition cursor-pointer ${
                              notificationsEnabled
                                ? "bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white shadow-[0_12px_24px_rgba(102,126,234,0.24)]"
                                : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 "
                            }`}
                          >
                            {notificationsEnabled
                              ? "Turn off notifications"
                              : "Enable notifications"}
                          </button>
                        </div>
                      </SettingsAccordion>

                      <SettingsAccordion
                        title="Language"
                        description="Choose the language you want to use in the app."
                        icon={Languages}
                        open={openSection === "language"}
                        onToggle={() =>
                          setOpenSection((prev) =>
                            prev === "language" ? "" : "language",
                          )
                        }
                      >
                        <SettingsOptionGroup
                          title="Language preference"
                          value={language}
                          onChange={setLanguage}
                          options={[
                            { value: "english", label: "English" },
                            { value: "vietnamese", label: "Tiếng Việt" },
                          ]}
                        />
                      </SettingsAccordion>

                      <SettingsAccordion
                        title="Dark mode"
                        description="Choose how the app appearance should behave."
                        icon={MoonStar}
                        open={openSection === "theme"}
                        onToggle={() =>
                          setOpenSection((prev) =>
                            prev === "theme" ? "" : "theme",
                          )
                        }
                      >
                        <SettingsOptionGroup
                          title="Appearance mode"
                          value={themeMode}
                          onChange={setThemeMode}
                          options={[
                            { value: "light", label: "Light" },
                            { value: "dark", label: "Dark" },
                            { value: "system", label: "System" },
                          ]}
                        />
                      </SettingsAccordion>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          className="inline-flex h-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-15 py-6 text-l font-semibold text-white shadow-[0_12px_24px_rgba(102,126,234,0.24)] transition hover:-translate-y-0.5 cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </main>

          <ProfileRightSidebar />
        </div>
      </div>

      <AnimatePresence>
        {isDeactivateConfirmOpen ? (
          <motion.div
            className="fixed inset-0 z-[240] flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close deactivate confirmation"
              onClick={handleCloseDeactivateModal}
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.28),rgba(15,23,42,0.34))] backdrop-blur-[6px]"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.985 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-[1] w-full max-w-[460px] overflow-hidden rounded-[28px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,235,0.96),rgba(255,255,255,0.98))] p-6 shadow-[0_26px_60px_rgba(15,23,42,0.18)] ring-1 ring-white/70"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDeactivateSuccess ? (
                  <motion.div
                    key="deactivate-success"
                    initial={{ opacity: 0, x: 32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -32 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center"
                  >
                    <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#14c8b8] shadow-[0_16px_34px_rgba(20,200,184,0.28)]">
                      <Check className="h-10 w-10 text-white stroke-[3.2]" />
                    </div>

                    <h3 className="mt-5 text-[24px] font-semibold tracking-tight text-zinc-900">
                      Account deactivated successfully
                    </h3>

                    <p className="mt-3 whitespace-nowrap text-[14px] font-medium text-zinc-500">
                      You will be redirected to the login page in
                    </p>

                    <div className="mt-3 text-[48px]  leading-none tracking-[-0.04em] text-[#19191c] tabular-nums">
                      {deactivateCountdown}s
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="deactivate-confirm"
                    initial={{ opacity: 0, x: -32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 32 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-amber-100/85 text-amber-600 shadow-[0_10px_24px_rgba(245,158,11,0.12)]">
                      <UserX className="w-5 h-5" />
                    </div>

                    <h3 className="mt-5 text-[24px] font-semibold tracking-tight text-zinc-900">
                      Deactivate account?
                    </h3>

                    <p className="mt-3 text-[14px] leading-7 text-zinc-500">
                      Your account will be temporarily hidden. You can
                      reactivate your account when you log in.
                    </p>

                    <div className="flex items-center justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={handleCloseDeactivateModal}
                        className="inline-flex items-center justify-center h-10 px-5 text-sm font-semibold transition bg-white border cursor-pointer rounded-2xl border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleDeactivateAccount}
                        disabled={isDeactivateSubmitting}
                        className="inline-flex h-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b_0%,#d97706_100%)] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(245,158,11,0.20)] transition hover:-translate-y-0.5 cursor-pointer"
                      >
                        {isDeactivateSubmitting ? "Please wait..." : "Deactivate"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteConfirmOpen ? (
          <motion.div
            className="fixed inset-0 z-[241] flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close delete confirmation"
              onClick={handleCloseDeleteModal}
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,24,27,0.36),rgba(24,24,27,0.42))] backdrop-blur-[8px]"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.985 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-[1] w-full max-w-[460px] overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(255,244,247,0.97),rgba(255,255,255,0.99))] p-6 shadow-[0_28px_64px_rgba(15,23,42,0.2)] ring-1 ring-white/70"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDeleteSuccess ? (
                  <motion.div
                    key="delete-success"
                    initial={{ opacity: 0, x: 32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -32 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center"
                  >
                    <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#14c8b8] shadow-[0_16px_34px_rgba(20,200,184,0.28)]">
                      <Check className="h-10 w-10 text-white stroke-[3.2]" />
                    </div>

                    <h3 className="mt-5 text-[24px] font-semibold tracking-tight text-zinc-900">
                      Account deleted successfully
                    </h3>

                    <p className="mt-3 whitespace-nowrap text-[14px] font-medium text-zinc-500">
                      You will be redirected to the login page in
                    </p>

                    <div className="mt-3 text-[48px] leading-none tracking-[-0.04em] text-[#19191c] tabular-nums">
                      {deleteCountdown}s
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="delete-confirm"
                    initial={{ opacity: 0, x: -32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 32 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-rose-100/90 text-rose-600 shadow-[0_10px_24px_rgba(244,63,94,0.12)]">
                      <Trash2 className="w-5 h-5" />
                    </div>

                    <h3 className="mt-5 text-[24px] font-semibold tracking-tight text-zinc-900">
                      Delete account permanently?
                    </h3>

                    <p className="mt-3 text-[14px] leading-7 text-zinc-500">
                      Your account will be permanently deleted after 7 days. You
                      can cancel by logging in.
                    </p>

                    <div className="flex items-center justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={handleCloseDeleteModal}
                        className="inline-flex items-center justify-center h-10 px-5 text-sm font-semibold transition bg-white border cursor-pointer rounded-2xl border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={isDeleteSubmitting}
                        className="inline-flex h-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fb7185_0%,#f43f5e_100%)] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(244,63,94,0.2)] transition hover:-translate-y-0.5 cursor-pointer"
                      >
                        {isDeleteSubmitting ? "Please wait..." : "Delete"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SettingsAccordion({
  title,
  description,
  icon: Icon,
  open = false,
  onToggle,
  children,
}) {
  return (
    <div className="overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,#ffffff,#fbfbff)] shadow-[0_16px_34px_rgba(15,23,42,0.04)] ring-1 ring-zinc-200/60">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full gap-4 px-5 py-4 text-left transition cursor-pointer hover:bg-white/65"
      >
        <div className="flex items-start min-w-0 gap-4">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,rgba(102,126,234,0.12),rgba(118,75,162,0.16))] text-violet-600 shadow-[0_10px_24px_rgba(102,126,234,0.10)]">
            <Icon className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <h4 className="text-[19px] font-semibold tracking-tight text-zinc-900">
              {title}
            </h4>
            <p className="mt-2 text-[14px] leading-7 text-zinc-500">
              {description}
            </p>
          </div>
        </div>

        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200/70 bg-white/80 text-zinc-500 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -8 }}
              animate={{ y: 0 }}
              exit={{ y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="px-5 pt-4 pb-5 border-t border-zinc-100/80"
            >
              {children}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SettingsOptionGroup({ title, value, onChange, options }) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,255,0.95))] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)] ring-1 ring-zinc-200/55">
      <h4 className="text-[17px] font-semibold tracking-tight text-zinc-900">
        {title}
      </h4>

      <div className="mt-4 space-y-3">
        {options.map((option) => {
          const checked = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex w-full items-center justify-between rounded-[18px] border px-4 py-2.5 text-left transition cursor-pointer ${
                checked
                  ? "border-violet-200 bg-[linear-gradient(135deg,rgba(102,126,234,0.10),rgba(118,75,162,0.12))] text-zinc-900 shadow-[0_10px_22px_rgba(102,126,234,0.08)]"
                  : "border-zinc-200/80 bg-white text-zinc-600 hover:border-violet-100 hover:bg-violet-50/40"
              }`}
            >
              <span className="text-[14px] font-medium">{option.label}</span>

              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                  checked
                    ? "border-violet-500 bg-violet-500"
                    : "border-zinc-300 bg-white"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    checked ? "bg-white" : "bg-transparent"
                  }`}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
