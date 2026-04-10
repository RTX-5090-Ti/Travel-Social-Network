import { useEffect, useState } from "react";
import { BellOff, Languages, MoonStar, ShieldCheck } from "lucide-react";
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
import DeleteAccountModal from "../components/settings/page/DeleteAccountModal";
import DeactivateAccountModal from "../components/settings/page/DeactivateAccountModal";
import SettingsAccordion from "../components/settings/page/SettingsAccordion";
import SettingsAccountAccessSection from "../components/settings/page/SettingsAccountAccessSection";
import SettingsOptionGroup from "../components/settings/page/SettingsOptionGroup";
import SettingsPasswordSection from "../components/settings/page/SettingsPasswordSection";
import {
  PROFILE_COVER_URL,
  formatLargeNumber,
} from "../components/profile/page/profile-page.helpers";
import { useProfileData } from "../components/profile/page/useProfileData";
import { useTheme } from "../theme/useTheme";
import { useToast } from "../toast/useToast";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();
  const { themeMode: persistedThemeMode, setThemeMode: applyThemeMode } =
    useTheme();
  const { showToast } = useToast();
  const [openSection, setOpenSection] = useState("");
  const [messagePermission, setMessagePermission] = useState("everyone");
  const [language, setLanguage] = useState("english");
  const [themeMode, setThemeMode] = useState(persistedThemeMode);
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
    setThemeMode(persistedThemeMode);
  }, [persistedThemeMode]);

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
  }, [clearAuth, isDeactivateConfirmOpen, isDeactivateSuccess, navigate]);

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

  function handleSaveSettings() {
    applyThemeMode(themeMode);
    showToast("Đã lưu giao diện hiển thị.", "success");
  }

  return (
    <div className="theme-page-shell relative min-h-screen bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-4">
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

      <div className="theme-app-shell relative z-10 mx-auto w-full max-w-[1680px] overflow-hidden rounded-[34px] border border-white/60 bg-[#fafafb] shadow-[0_25px_80px_rgba(30,41,59,0.08)] lg:h-[calc(100vh-2rem)]">
        <div className="grid min-h-[900px] grid-cols-1 lg:h-full lg:min-h-0 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
          <ProfileLeftSidebar user={displayUser} stats={sidebarStats} />

          <main className="theme-main-pane profile-main-scroll min-w-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(250,250,251,0.96))] px-5 py-6 sm:px-7 sm:py-8 lg:h-full lg:overflow-y-auto lg:overflow-x-hidden lg:border-r lg:px-9 xl:px-10 border-zinc-200/80">
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
                    <div className="space-y-4 ">
                      <SettingsPasswordSection
                        open={openSection === "password"}
                        onToggle={() =>
                          setOpenSection((prev) =>
                            prev === "password" ? "" : "password",
                          )
                        }
                        isPasswordFormOpen={isPasswordFormOpen}
                        onOpenPasswordForm={() => setIsPasswordFormOpen(true)}
                        passwordForm={passwordForm}
                        passwordErrors={passwordErrors}
                        passwordShow={passwordShow}
                        isConfirmMatched={isConfirmMatched}
                        isPasswordSaving={isPasswordSaving}
                        onPasswordInputChange={handlePasswordInputChange}
                        onTogglePasswordVisibility={
                          handleTogglePasswordVisibility
                        }
                        onCancelPasswordForm={handleCancelPasswordForm}
                        onSavePassword={handleSavePassword}
                      />

                      <SettingsAccountAccessSection
                        open={openSection === "account"}
                        onToggle={() =>
                          setOpenSection((prev) =>
                            prev === "account" ? "" : "account",
                          )
                        }
                        onOpenDeactivateModal={() =>
                          setIsDeactivateConfirmOpen(true)
                        }
                        onOpenDeleteModal={() => setIsDeleteConfirmOpen(true)}
                      />

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
                        open={false}
                        onToggle={() =>
                          showToast(
                            "Tính năng này đang được phát triển",
                            "info",
                          )
                        }
                      />

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
                          ]}
                        />
                      </SettingsAccordion>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleSaveSettings}
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

      <DeactivateAccountModal
        open={isDeactivateConfirmOpen}
        success={isDeactivateSuccess}
        countdown={deactivateCountdown}
        isSubmitting={isDeactivateSubmitting}
        onClose={handleCloseDeactivateModal}
        onConfirm={handleDeactivateAccount}
      />

      <DeleteAccountModal
        open={isDeleteConfirmOpen}
        success={isDeleteSuccess}
        countdown={deleteCountdown}
        isSubmitting={isDeleteSubmitting}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
