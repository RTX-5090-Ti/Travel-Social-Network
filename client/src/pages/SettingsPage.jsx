import { useEffect, useState } from "react";
import { BellOff, Languages, LogOut, MoonStar, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [tabletSidebarOpen, setTabletSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, clearAuth, logout } = useAuth();
  const { themeMode: persistedThemeMode, setThemeMode: applyThemeMode } =
    useTheme();
  const { showToast } = useToast();
  const [openSection, setOpenSection] = useState("");
  const [messagePermission, setMessagePermission] = useState("everyone");
  const [language, setLanguage] = useState(
    (i18n.resolvedLanguage || i18n.language || "vi").startsWith("en")
      ? "en"
      : "vi",
  );
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
    const resolvedLanguage = i18n.resolvedLanguage || i18n.language || "vi";
    setLanguage(resolvedLanguage.startsWith("en") ? "en" : "vi");
  }, [i18n.language, i18n.resolvedLanguage]);

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
        "Không vô hiệu hóa được tài khoản lúc này.";
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
        "Không thể yêu cầu xoá tài khoản lúc này.";
      showToast(message, "error");
      setIsDeleteSubmitting(false);
    }
  }

  function handleSaveSettings() {
    applyThemeMode(themeMode);
    void i18n.changeLanguage(language);
    showToast(t("settings.savedAppearance"), "success");
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="theme-page-shell relative min-h-screen bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-0 pt-0 pb-[calc(env(safe-area-inset-bottom,0px)+92px)] md:px-3 md:pt-3 md:pb-3 lg:px-4 lg:pt-4 lg:pb-4">
      <div className="absolute inset-0 hidden pointer-events-none md:block">
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

      <div className="theme-app-shell relative z-10 mx-auto w-full max-w-[1680px] overflow-hidden bg-[#fafafb] md:rounded-[34px] md:border md:border-white/60 md:shadow-[0_25px_80px_rgba(30,41,59,0.08)] lg:h-[calc(100vh-2rem)]">
        <div className="grid min-h-screen grid-cols-1 md:min-h-[900px] lg:h-full lg:min-h-0 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <ProfileLeftSidebar
            user={displayUser}
            stats={sidebarStats}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            tabletSidebarOpen={tabletSidebarOpen}
            onToggleTabletSidebar={() =>
              setTabletSidebarOpen((prev) => !prev)
            }
          />

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
                        {t("settings.personalSettings")}
                      </p>
                      <h3 className="mt-2 text-[26px] font-semibold tracking-tight text-zinc-900">
                        {t("settings.title")}
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
                        title={t("settings.privacyTitle")}
                        description={t("settings.privacyDescription")}
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
                            title={t("settings.messagePermissionTitle")}
                            value={messagePermission}
                            onChange={setMessagePermission}
                            options={[
                              {
                                value: "everyone",
                                label: t("settings.messagePermission.everyone"),
                              },
                              {
                                value: "followers",
                                label: t("settings.messagePermission.followers"),
                              },
                              {
                                value: "nobody",
                                label: t("settings.messagePermission.nobody"),
                              },
                            ]}
                          />
                        </div>
                      </SettingsAccordion>

                      <SettingsAccordion
                        title={t("settings.notificationsTitle")}
                        description={t("settings.notificationsDescription")}
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
                        title={t("settings.languageTitle")}
                        description={t("settings.languageDescription")}
                        icon={Languages}
                        open={openSection === "language"}
                        onToggle={() =>
                          setOpenSection((prev) =>
                            prev === "language" ? "" : "language",
                          )
                        }
                      >
                        <SettingsOptionGroup
                          title={t("settings.languagePreferenceTitle")}
                          value={language}
                          onChange={setLanguage}
                          options={[
                            { value: "en", label: t("settings.languageOptions.en") },
                            { value: "vi", label: t("settings.languageOptions.vi") },
                          ]}
                        />
                      </SettingsAccordion>

                      <SettingsAccordion
                        title={t("settings.themeTitle")}
                        description={t("settings.themeDescription")}
                        icon={MoonStar}
                        open={openSection === "theme"}
                        onToggle={() =>
                          setOpenSection((prev) =>
                            prev === "theme" ? "" : "theme",
                          )
                        }
                      >
                        <SettingsOptionGroup
                          title={t("settings.appearanceModeTitle")}
                          value={themeMode}
                          onChange={setThemeMode}
                          options={[
                            { value: "light", label: t("settings.themeOptions.light") },
                            { value: "dark", label: t("settings.themeOptions.dark") },
                            { value: "system", label: t("settings.themeOptions.system") },
                          ]}
                        />
                      </SettingsAccordion>

                      <div className="flex items-center justify-between gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-8 py-6 text-l font-semibold text-rose-600 shadow-[0_8px_18px_rgba(244,63,94,0.10)] transition hover:-translate-y-0.5 hover:bg-rose-100 cursor-pointer"
                        >
                          <LogOut className="h-4.5 w-4.5" />
                          {t("settings.logout")}
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveSettings}
                          className="inline-flex h-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-15 py-6 text-l font-semibold text-white shadow-[0_12px_24px_rgba(102,126,234,0.24)] transition hover:-translate-y-0.5 cursor-pointer"
                        >
                          {t("settings.save")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </main>

          <ProfileRightSidebar
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
            tabletOpen={tabletSidebarOpen}
            onCloseTablet={() => setTabletSidebarOpen(false)}
          />
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
