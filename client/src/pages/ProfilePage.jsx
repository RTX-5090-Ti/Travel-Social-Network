import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ImageIcon, Sparkles, Camera, PenSquare } from "lucide-react";

import { useAuth } from "../auth/useAuth";
import { useToast } from "../toast/useToast";
import FloatingShape from "../components/auth/login/FloatingShape";
import JourneyFeedCard from "../components/feed/page/JourneyFeedCard";
import { tripApi } from "../api/trip.api";

import { shapeStyles } from "../components/feed/page/feed.constants";
import { getInitials } from "../components/feed/page/feed.utils";
import ProfileHero from "../components/profile/page/ProfileHero";
import ProfileLeftSidebar from "../components/profile/page/ProfileLeftSidebar";
import ProfileRightSidebar from "../components/profile/page/ProfileRightSidebar";
import ProfileTabButton from "../components/profile/page/ProfileTabButton";
import ProfileHighlightCard from "../components/profile/page/ProfileHighlightCard";
import ProfileRecentCapturesCard from "../components/profile/page/ProfileRecentCapturesCard";
import ProfileMediaGrid from "../components/profile/page/ProfileMediaGrid";
import ProfileMediaLightbox from "../components/profile/page/ProfileMediaLightbox";
import ProfileEmptyLuxuryCard from "../components/profile/page/ProfileEmptyLuxuryCard";
import ProfileEmptyJourneyPanel from "../components/profile/page/ProfileEmptyJourneyPanel";
import ProfileFeedSkeleton from "../components/profile/page/ProfileFeedSkeleton";
import ShareJourneyModal from "../components/feed/ShareJourneyModal";
import ProfileConnectionsModal from "../components/profile/page/ProfileConnectionsModal";
import {
  getTripId,
  PROFILE_TABS,
  PROFILE_COVER_URL,
  EMPTY_ARRAY,
  formatLargeNumber,
} from "../components/profile/page/profile-page.helpers";
import { useProfileData } from "../components/profile/page/useProfileData";
import { useProfileConnections } from "../components/profile/page/useProfileConnections";

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const isVisitorProfile = Boolean(userId) && userId !== user?.id;

  const routedProfileUser = location.state?.profileUser ?? null;
  const routedProfileTrips = Array.isArray(location.state?.profileTrips)
    ? location.state.profileTrips
    : EMPTY_ARRAY;

  const [activeTab, setActiveTab] = useState("posts");
  const [tabDirection, setTabDirection] = useState(0);
  const [mediaLightboxIndex, setMediaLightboxIndex] = useState(null);
  const [selectedHighlightTrip, setSelectedHighlightTrip] = useState(null);
  const [highlightDetailLoading, setHighlightDetailLoading] = useState(false);
  const [openComposer, setOpenComposer] = useState(false);

  const {
    loading,
    error,
    avatar,
    displayUser,
    profileTrips,
    profileUserId,
    stats,
    sidebarStats,
    highlightTrips,
    mediaItems,
    recentCaptures,
    isFollowing,
    isFollowSubmitting,
    applyOwnFollowingCountDelta,
    handleToggleFollow,
    loadOwnTrips,
  } = useProfileData({
    user,
    userId,
    isVisitorProfile,
    routedProfileUser,
    routedProfileTrips,
    showToast,
  });

  const {
    isConnectionsOpen,
    setIsConnectionsOpen,
    connectionsTab,
    connectionsDirection,
    connectionsSearch,
    setConnectionsSearch,
    connectionsLoading,
    connectionsError,
    connectionsFollowBusyId,
    filteredConnections,
    handleOpenConnections,
    handleChangeConnectionsTab,
    handleToggleConnectionFollow,
  } = useProfileConnections({
    profileUserId,
    isVisitorProfile,
    user,
    showToast,
    applyOwnFollowingCountDelta,
  });

  const initials = getInitials(displayUser?.name || "Traveler");
  const activeTabIndex = PROFILE_TABS.findIndex((tab) => tab.key === activeTab);

  async function handleOpenHighlightTrip(trip) {
    const tripId = getTripId(trip);

    if (!tripId) {
      showToast("Không mở được journey này lúc này.", "warning");
      return;
    }

    try {
      setHighlightDetailLoading(true);

      const res = await tripApi.getDetail(tripId);
      const detailTrip = res?.data;

      if (!detailTrip) {
        showToast("Không tải được chi tiết journey.", "error");
        return;
      }

      setSelectedHighlightTrip({
        ...trip,
        ...detailTrip,
        _id: detailTrip?._id || tripId,
      });
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Không tải được chi tiết journey.",
        "error",
      );
    } finally {
      setHighlightDetailLoading(false);
    }
  }

  function handleCloseHighlightTrip() {
    setSelectedHighlightTrip(null);
  }

  function handleChangeTab(nextTab) {
    if (nextTab === activeTab) return;

    const nextIndex = PROFILE_TABS.findIndex((tab) => tab.key === nextTab);
    setTabDirection(nextIndex > activeTabIndex ? 1 : -1);
    setActiveTab(nextTab);
  }

  function handleOpenShareJourney() {
    setOpenComposer(true);
  }

  function handleOpenCreatePost() {
    navigate("/");
  }

  async function handleProfileJourneyPosted() {
    setOpenComposer(false);
    setActiveTab("posts");
    setTabDirection(0);
    await loadOwnTrips({ skipLoading: true });
  }

  function openMediaLightbox(index) {
    if (!mediaItems.length) return;
    const safeIndex = Math.min(Math.max(index, 0), mediaItems.length - 1);
    setMediaLightboxIndex(safeIndex);
  }

  function closeMediaLightbox() {
    setMediaLightboxIndex(null);
  }

  function showPrevMediaItem() {
    setMediaLightboxIndex((prev) => {
      if (prev === null || !mediaItems.length) return prev;
      return (prev - 1 + mediaItems.length) % mediaItems.length;
    });
  }

  function showNextMediaItem() {
    setMediaLightboxIndex((prev) => {
      if (prev === null || !mediaItems.length) return prev;
      return (prev + 1) % mediaItems.length;
    });
  }

  const isMediaLightboxOpen =
    mediaLightboxIndex !== null &&
    mediaLightboxIndex >= 0 &&
    mediaLightboxIndex < mediaItems.length;

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
          <ProfileLeftSidebar
            user={displayUser}
            stats={sidebarStats}
            onOpenConnections={handleOpenConnections}
          />

          <main className="profile-main-scroll min-w-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(250,250,251,0.96))] px-5 py-6 sm:px-7 sm:py-8 lg:h-full lg:overflow-y-auto lg:overflow-x-hidden lg:border-r lg:px-9 xl:px-10 border-zinc-200/80">
            <div className="mx-auto w-full max-w-[920px]">
              <ProfileHero
                user={displayUser}
                avatar={avatar}
                initials={initials}
                stats={stats}
                onBackToFeed={() => navigate("/")}
                coverUrl={PROFILE_COVER_URL}
                formatLargeNumber={formatLargeNumber}
                isVisitorProfile={isVisitorProfile}
                isFollowing={isFollowing}
                isFollowSubmitting={isFollowSubmitting}
                isFollowHydrating={isVisitorProfile && isFollowing === null}
                isProfileHydrating={loading}
                onToggleFollow={handleToggleFollow}
              />

              <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="rounded-[30px] border border-white/70 bg-white/80 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 backdrop-blur sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                        Journey highlights
                      </p>
                      <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-zinc-900">
                        Most loved journeys
                      </h2>
                    </div>
                  </div>

                  {highlightTrips.length ? (
                    <div className="grid grid-cols-2 gap-4 mt-5">
                      {highlightTrips.map((trip, index) => {
                        const tripId = getTripId(trip);

                        return (
                          <ProfileHighlightCard
                            key={
                              tripId ||
                              `highlight-trip-${trip?.createdAt || "x"}-${index}`
                            }
                            trip={trip}
                            onOpen={() => {
                              if (!highlightDetailLoading) {
                                handleOpenHighlightTrip(trip);
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  ) : isVisitorProfile ? (
                    <ProfileEmptyJourneyPanel
                      onShareJourney={handleOpenShareJourney}
                      isVisitorProfile
                    />
                  ) : (
                    <ProfileEmptyLuxuryCard
                      onShareJourney={handleOpenShareJourney}
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <ProfileRecentCapturesCard
                    captures={recentCaptures}
                    onOpenCapture={openMediaLightbox}
                    onShareJourney={handleOpenShareJourney}
                  />
                </div>
              </section>

              {!isVisitorProfile ? (
                <div className="mt-6 overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.74),rgba(244,247,255,0.90),rgba(243,238,255,0.88))] shadow-[0_18px_42px_rgba(15,23,42,0.06)] ring-1 ring-zinc-200/60 backdrop-blur">
                  <div className="relative px-4 py-4 overflow-hidden sm:px-5 sm:py-5">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.10),transparent_30%)]" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)]" />

                    <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center">
                      <button
                        type="button"
                        onClick={handleOpenShareJourney}
                        className="group relative flex min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-[24px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(246,248,255,0.98),rgba(243,238,255,0.96))] p-3 shadow-[0_16px_34px_rgba(15,23,42,0.06)] ring-1 ring-zinc-200/60 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(15,23,42,0.10)] cursor-pointer"
                      >
                        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.08),transparent_30%)] opacity-80" />
                        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)]" />
                        <span className="pointer-events-none absolute inset-y-0 left-[-120%] w-[55%] skew-x-[-20deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.52),transparent)] transition-all duration-700 group-hover:left-[130%]" />

                        <span className="relative z-10 shrink-0">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={user?.name || "Traveler"}
                              className="h-12 w-12 rounded-full object-cover ring-2 ring-white/85 shadow-[0_10px_22px_rgba(15,23,42,0.10)]"
                            />
                          ) : (
                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-[18px] font-semibold text-white shadow-[0_12px_24px_rgba(102,126,234,0.24)]">
                              {initials}
                            </span>
                          )}
                        </span>

                        <span className="relative z-10 flex-1 min-w-0">
                          <span className="flex h-[48px] items-center rounded-full border border-white/70 bg-[linear-gradient(180deg,rgba(241,243,248,0.98),rgba(235,238,244,1))] px-5 text-left text-[15px] font-medium text-zinc-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition duration-300 group-hover:bg-[linear-gradient(180deg,rgba(237,240,247,1),rgba(232,236,243,1))]">
                            Share your next journey...
                          </span>
                        </span>

                        <span className="relative z-10 flex items-center gap-2 pl-1 shrink-0">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-100 bg-[linear-gradient(180deg,#fff1f2,#ffe4e6)] text-rose-500 shadow-[0_8px_18px_rgba(244,63,94,0.12)] transition duration-300 group-hover:scale-105 group-hover:shadow-[0_10px_22px_rgba(244,63,94,0.16)]">
                            <Camera className="w-4 h-4" />
                          </span>
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-100 bg-[linear-gradient(180deg,#ecfdf5,#d1fae5)] text-emerald-500 shadow-[0_8px_18px_rgba(16,185,129,0.12)] transition duration-300 group-hover:scale-105 group-hover:shadow-[0_10px_22px_rgba(16,185,129,0.16)]">
                            <ImageIcon className="w-4 h-4" />
                          </span>
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-100 bg-[linear-gradient(180deg,#fffbeb,#fef3c7)] text-amber-500 shadow-[0_8px_18px_rgba(245,158,11,0.12)] transition duration-300 group-hover:scale-105 group-hover:shadow-[0_10px_22px_rgba(245,158,11,0.16)]">
                            <Sparkles className="w-4 h-4" />
                          </span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenCreatePost}
                        className="group relative inline-flex h-[60px] shrink-0 items-center justify-center gap-3 overflow-hidden rounded-[18px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(244,247,255,0.96),rgba(243,237,255,0.94))] px-7 text-[15px] font-semibold text-[#5b63f6] shadow-[0_12px_28px_rgba(91,99,246,0.12)] ring-1 ring-zinc-200/60 transition duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_18px_38px_rgba(91,99,246,0.18)] cursor-pointer"
                      >
                        <span className="absolute inset-y-0 left-[-100%] w-full bg-[linear-gradient(135deg,rgba(102,126,234,0.10),rgba(118,75,162,0.14),rgba(78,205,196,0.10),rgba(69,183,209,0.10))] transition-all duration-500 group-hover:left-0" />
                        <span className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.10),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.10),transparent_38%)]" />
                        <span className="relative z-10 inline-flex items-center gap-3">
                          <PenSquare className="w-4 h-4" />
                          Create Post
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <section className="mt-8">
                <div className="flex items-center justify-between gap-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                        {isVisitorProfile ? "Traveler space" : "Personal space"}
                      </p>
                      <h3 className="mt-2 text-[26px] font-semibold tracking-tight text-zinc-900">
                        {isVisitorProfile ? "Journey collection" : "My content"}
                      </h3>
                    </div>
                  </div>

                  <div className="inline-flex w-fit rounded-[18px] border border-white/70 bg-white/85 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 backdrop-blur">
                    {PROFILE_TABS.map((tab) => (
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
                    <p className="font-semibold">Không tải được profile</p>
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
                      ) : activeTab === "posts" ? (
                        profileTrips.length ? (
                          <div className="space-y-7">
                            {profileTrips.map((trip, index) => (
                              <JourneyFeedCard
                                key={
                                  trip?._id ||
                                  `profile-trip-${trip?.createdAt || "x"}-${index}`
                                }
                                trip={trip}
                              />
                            ))}
                          </div>
                        ) : (
                          <ProfileEmptyJourneyPanel
                            onShareJourney={handleOpenShareJourney}
                            isVisitorProfile={isVisitorProfile}
                          />
                        )
                      ) : (
                        <ProfileMediaGrid
                          mediaItems={mediaItems}
                          onOpenLightbox={openMediaLightbox}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </section>
            </div>
            <AnimatePresence>
              {isMediaLightboxOpen ? (
                <ProfileMediaLightbox
                  key="profile-media-lightbox"
                  mediaItems={mediaItems}
                  currentIndex={mediaLightboxIndex}
                  onClose={closeMediaLightbox}
                  onPrev={showPrevMediaItem}
                  onNext={showNextMediaItem}
                />
              ) : null}

              {selectedHighlightTrip ? (
                <JourneyFeedCard
                  key={`highlight-trip-overlay-${getTripId(selectedHighlightTrip) || "fallback"}`}
                  trip={selectedHighlightTrip}
                  forceOpen
                  overlayOnly
                  onForceOpenClose={handleCloseHighlightTrip}
                />
              ) : null}
            </AnimatePresence>
          </main>

          <ProfileRightSidebar />
        </div>
      </div>

      <ProfileConnectionsModal
        open={isConnectionsOpen}
        onClose={() => setIsConnectionsOpen(false)}
        activeTab={connectionsTab}
        onChangeTab={handleChangeConnectionsTab}
        tabDirection={connectionsDirection}
        searchValue={connectionsSearch}
        onSearchChange={setConnectionsSearch}
        items={filteredConnections}
        loading={connectionsLoading}
        error={connectionsError}
        onToggleFollow={handleToggleConnectionFollow}
        followBusyId={connectionsFollowBusyId}
        viewerUserId={user?.id || ""}
      />

      <ShareJourneyModal
        open={openComposer}
        onClose={() => setOpenComposer(false)}
        onPosted={handleProfileJourneyPosted}
      />
    </div>
  );
}
