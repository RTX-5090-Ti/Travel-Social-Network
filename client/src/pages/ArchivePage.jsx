import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, Bookmark, RotateCcw, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import {
  getTripUnavailableMessage,
  tripApi,
} from "../api/trip.api";
import { useToast } from "../toast/useToast";
import FloatingShape from "../components/auth/login/FloatingShape";
import { shapeStyles } from "../components/feed/page/feed.constants";
import JourneyFeedCard from "../components/feed/page/JourneyFeedCard";
import ProfileHero from "../components/profile/page/ProfileHero";
import ProfileLeftSidebar from "../components/profile/page/ProfileLeftSidebar";
import ProfileRightSidebar from "../components/profile/page/ProfileRightSidebar";
import ProfileTabButton from "../components/profile/page/ProfileTabButton";
import ProfileFeedSkeleton from "../components/profile/page/ProfileFeedSkeleton";
import {
  PROFILE_COVER_URL,
  formatLargeNumber,
} from "../components/profile/page/profile-page.helpers";
import { getInitials } from "../components/feed/page/feed.utils";
import { useProfileData } from "../components/profile/page/useProfileData";

export default function ArchivePage() {
  const { t } = useTranslation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [tabletSidebarOpen, setTabletSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("saved");
  const [tabDirection, setTabDirection] = useState(0);
  const [savedItems, setSavedItems] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState("");
  const [trashItems, setTrashItems] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashError, setTrashError] = useState("");
  const [openingUnavailableTripId, setOpeningUnavailableTripId] = useState("");
  const [removingSavedTripId, setRemovingSavedTripId] = useState("");
  const [restoringTripId, setRestoringTripId] = useState("");

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
  const archiveTabs = [
    { key: "saved", label: t("archive.tabArchive"), icon: Bookmark },
    { key: "trash", label: t("archive.tabTrash"), icon: Trash2 },
  ];
  const activeTabIndex = archiveTabs.findIndex((tab) => tab.key === activeTab);

  function handleChangeTab(nextTab) {
    if (nextTab === activeTab) return;

    const nextIndex = archiveTabs.findIndex((tab) => tab.key === nextTab);
    setTabDirection(nextIndex > activeTabIndex ? 1 : -1);
    setActiveTab(nextTab);
  }

  const removeSavedTripLocally = useCallback((tripId) => {
    if (!tripId) return;

    setSavedItems((prev) =>
      prev.filter((item) => {
        const itemId = item?._id || item?.tripId || item?.id || "";
        return itemId !== tripId;
      }),
    );
  }, []);

  const loadSaved = useCallback(async () => {
    try {
      setSavedLoading(true);
      setSavedError("");

      const res = await tripApi.listSaved({ limit: 50 });
      setSavedItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (error) {
      setSavedError(
        error?.response?.data?.message || t("archive.savedLoadErrorTitle"),
      );
      setSavedItems([]);
    } finally {
      setSavedLoading(false);
    }
  }, [t]);

  const loadTrash = useCallback(async () => {
    try {
      setTrashLoading(true);
      setTrashError("");

      const res = await tripApi.listTrash({ limit: 50 });
      setTrashItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (error) {
      setTrashError(
        error?.response?.data?.message || t("archive.trashLoadErrorTitle"),
      );
      setTrashItems([]);
    } finally {
      setTrashLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (activeTab === "saved") {
      loadSaved();
    }
  }, [activeTab, loadSaved]);

  useEffect(() => {
    if (activeTab === "trash") {
      loadTrash();
    }
  }, [activeTab, loadTrash]);

  function handleSavedTripChange(tripId, nextSaved) {
    if (nextSaved || !tripId) return;
    removeSavedTripLocally(tripId);
  }

  function handleSavedTripTrashed(tripId) {
    if (!tripId) return;
    removeSavedTripLocally(tripId);
  }

  async function handleSavedTripUpdated() {
    await loadSaved();
  }

  async function handleOpenUnavailableSavedTrip(tripId) {
    if (!tripId || openingUnavailableTripId) return;

    try {
      setOpeningUnavailableTripId(tripId);
      await tripApi.getDetail(tripId);
      await loadSaved();
    } catch (error) {
      showToast(getTripUnavailableMessage(error), "warning");
    } finally {
      setOpeningUnavailableTripId("");
    }
  }

  async function handleRemoveSavedTrip(tripId) {
    if (!tripId || removingSavedTripId) return;

    try {
      setRemovingSavedTripId(tripId);
      await tripApi.unsaveTrip(tripId);
      removeSavedTripLocally(tripId);
      showToast(t("archive.savedRemoved"), "success");
    } catch (error) {
      showToast(
        error?.response?.data?.message || t("archive.savedRemoveError"),
        "error",
      );
    } finally {
      setRemovingSavedTripId("");
    }
  }

  async function handleRestoreTrip(tripId) {
    if (!tripId || restoringTripId) return;

    try {
      setRestoringTripId(tripId);
      await tripApi.restoreFromTrash(tripId);

      setTrashItems((prev) =>
        prev.filter((item) => {
          const itemId = item?._id || item?.id || "";
          return itemId !== tripId;
        }),
      );

      showToast(t("archive.restoreSuccess"), "success");
    } catch (error) {
      showToast(
        error?.response?.data?.message || t("archive.restoreError"),
        "error",
      );
    } finally {
      setRestoringTripId("");
    }
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
                        {t("archive.personalArchive")}
                      </p>
                      <h3 className="mt-2 text-[26px] font-semibold tracking-tight text-zinc-900">
                        {t("archive.title")}
                      </h3>
                    </div>
                  </div>

                  <div className="theme-card inline-flex w-fit rounded-[18px] border border-white/70 bg-white/85 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 backdrop-blur">
                    {archiveTabs.map((tab) => (
                      <ProfileTabButton
                        key={tab.key}
                        active={activeTab === tab.key}
                        onClick={() => handleChangeTab(tab.key)}
                        icon={tab.icon}
                        label={tab.label}
                      />
                    ))}
                  </div>
                </div>

                {error ? (
                  <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50/90 px-4 py-4 text-sm text-red-600">
                    <p className="font-semibold">
                      {t("archive.loadErrorTitle")}
                    </p>
                    <p className="mt-1 text-red-500/90">{error}</p>
                  </div>
                ) : null}

                <div className="mt-6 min-h-[320px] overflow-hidden">
                  <AnimatePresence
                    mode="wait"
                    initial={false}
                    custom={tabDirection}
                  >
                    <motion.div
                      key={activeTab}
                      custom={tabDirection}
                      initial={{
                        opacity: 0,
                        x: tabDirection >= 0 ? 28 : -28,
                        scale: 0.985,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        x: tabDirection >= 0 ? -28 : 28,
                        scale: 0.985,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {loading ? (
                        <div className="space-y-7">
                          <ProfileFeedSkeleton />
                          <ProfileFeedSkeleton />
                        </div>
                      ) : activeTab === "saved" ? (
                        savedLoading ? (
                          <div className="space-y-7">
                            <ProfileFeedSkeleton />
                            <ProfileFeedSkeleton />
                          </div>
                        ) : savedError ? (
                          <div className="rounded-[24px] border border-red-200 bg-red-50/90 px-4 py-4 text-sm text-red-600">
                            <p className="font-semibold">
                              {t("archive.savedLoadErrorTitle")}
                            </p>
                            <p className="mt-1 text-red-500/90">{savedError}</p>
                          </div>
                        ) : savedItems.length ? (
                          <div className="space-y-7">
                            {savedItems.map((trip, index) => {
                              const tripId =
                                trip?._id || trip?.tripId || trip?.id || "";

                              if (trip?.unavailable) {
                                return (
                                  <UnavailableSavedTripCard
                                    key={
                                      tripId ||
                                      `saved-unavailable-${trip?.savedAt || "x"}-${index}`
                                    }
                                    loadingView={
                                      openingUnavailableTripId === tripId
                                    }
                                    loadingRemove={
                                      removingSavedTripId === tripId
                                    }
                                    onOpen={() =>
                                      handleOpenUnavailableSavedTrip(tripId)
                                    }
                                    onRemove={() =>
                                      handleRemoveSavedTrip(tripId)
                                    }
                                  />
                                );
                              }

                              return (
                                <JourneyFeedCard
                                  key={
                                    tripId ||
                                    `saved-trip-${trip?.createdAt || "x"}-${index}`
                                  }
                                  trip={trip}
                                  surface="archive"
                                  onTripSavedChange={handleSavedTripChange}
                                  onTripTrashed={handleSavedTripTrashed}
                                  onTripUpdated={handleSavedTripUpdated}
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <ArchiveEmptyPanel
                            icon={Archive}
                            title={t("archive.savedEmptyTitle")}
                            description=""
                            tone="violet"
                          />
                        )
                      ) : trashLoading ? (
                        <div className="space-y-7">
                          <ProfileFeedSkeleton />
                        </div>
                      ) : trashError ? (
                        <div className="rounded-[24px] border border-red-200 bg-red-50/90 px-4 py-4 text-sm text-red-600">
                          <p className="font-semibold">
                            {t("archive.trashLoadErrorTitle")}
                          </p>
                          <p className="mt-1 text-red-500/90">{trashError}</p>
                        </div>
                      ) : trashItems.length ? (
                        <div className="space-y-4">
                          {trashItems.map((trip, index) => {
                            const tripId = trip?._id || trip?.id || "";

                            return (
                              <TrashTripCard
                                key={
                                  tripId ||
                                  `trash-trip-${trip?.createdAt || "x"}-${index}`
                                }
                                trip={trip}
                                restoring={restoringTripId === tripId}
                                onRestore={() => handleRestoreTrip(tripId)}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <ArchiveEmptyPanel
                          icon={Trash2}
                          title={t("archive.trashEmptyTitle")}
                          description={t("archive.trashEmptyDescription")}
                          tone="rose"
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
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
    </div>
  );
}

function TrashTripCard({ trip, restoring = false, onRestore }) {
  const { t } = useTranslation();
  const title = trip?.title || t("journey.untitled");
  const caption = typeof trip?.caption === "string" ? trip.caption.trim() : "";
  const previewCaption =
    caption.length > 160 ? `${caption.slice(0, 160).trim()}...` : caption;

  return (
    <article className="theme-card rounded-[26px] border border-white/70 bg-white/88 px-5 py-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          {/* <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-500">
            <Trash2 className="h-3.5 w-3.5" />
            Trash
          </div> */}

          <h4 className="mt-4 text-[22px] font-semibold tracking-tight text-zinc-900">
            {title}
          </h4>

          <p className="mt-3 text-[14px] leading-7 text-zinc-500 whitespace-pre-line">
            {previewCaption || t("archive.introFallback")}
          </p>
        </div>

        <button
          type="button"
          onClick={onRestore}
          disabled={restoring}
          className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${
            restoring
              ? "cursor-not-allowed bg-zinc-100 text-zinc-400"
              : "cursor-pointer bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white shadow-[0_12px_24px_rgba(102,126,234,0.24)] hover:-translate-y-0.5"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>{restoring ? t("archive.restoring") : t("archive.restore")}</span>
        </button>
      </div>
    </article>
  );
}

function UnavailableSavedTripCard({
  loadingView = false,
  loadingRemove = false,
  onOpen,
  onRemove,
}) {
  const { t } = useTranslation();
  return (
    <article className="theme-card rounded-[26px] border border-white/70 bg-white/88 px-5 py-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 backdrop-blur">
      <div className="flex flex-col gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-500">
            <Bookmark className="h-3.5 w-3.5" />
            {t("archive.trashBadge")}
          </div>

          <h4 className="mt-4 text-[22px] font-semibold tracking-tight text-zinc-900">
            {t("archive.unavailableTitle")}
          </h4>

          <p className="mt-3 text-[14px] leading-7 text-zinc-500">
            {t("archive.unavailableDescription")}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onOpen}
            disabled={loadingView || loadingRemove}
            className={`inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition ${
              loadingView || loadingRemove
                ? "cursor-not-allowed bg-zinc-100 text-zinc-400"
                : "cursor-pointer bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white shadow-[0_12px_24px_rgba(102,126,234,0.24)] hover:-translate-y-0.5"
            }`}
          >
            {loadingView ? t("archive.checking") : t("archive.showJourney")}
          </button>

          <button
            type="button"
            onClick={onRemove}
            disabled={loadingView || loadingRemove}
            className={`inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition ${
              loadingView || loadingRemove
                ? "cursor-not-allowed border border-zinc-200 bg-zinc-50 text-zinc-400"
                : "cursor-pointer border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {loadingRemove ? t("archive.removing") : t("archive.unsave")}
          </button>
        </div>
      </div>
    </article>
  );
}

function ArchiveEmptyPanel({
  icon: Icon,
  title,
  description,
  tone = "violet",
}) {
  const toneClasses =
    tone === "rose"
      ? "bg-[linear-gradient(135deg,rgba(251,113,133,0.12),rgba(244,63,94,0.16))] text-rose-500"
      : "bg-[linear-gradient(135deg,rgba(102,126,234,0.12),rgba(118,75,162,0.16))] text-violet-600";

  return (
    <div className="theme-card rounded-[30px] border border-dashed border-zinc-200 bg-[linear-gradient(180deg,#ffffff,#fbfbff)] px-5 py-12 text-center shadow-[0_16px_34px_rgba(15,23,42,0.04)]">
      <div
        className={`mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[22px] ${toneClasses}`}
      >
        <Icon className="h-7 w-7" />
      </div>

      <h4 className="mt-5 text-[22px] font-semibold tracking-tight text-zinc-900">
        {title}
      </h4>

      <p className="mx-auto mt-3 max-w-[560px] text-[15px] leading-7 text-zinc-500">
        {description}
      </p>
    </div>
  );
}
