import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";

function getAvatar(user) {
  return (
    user?.avatarUrl ||
    user?.avatar ||
    user?.profile?.avatarUrl ||
    user?.profile?.avatar ||
    ""
  );
}

function getInitial(user) {
  return (user?.name || "T").charAt(0).toUpperCase();
}

const TAB_META = {
  followers: "Followers",
  following: "Following",
};

const TAB_SEARCH_META = {
  followers: "followers",
  following: "following",
};

export default function ProfileConnectionsModal({
  open,
  onClose,
  activeTab,
  onChangeTab,
  tabDirection = 0,
  searchValue,
  onSearchChange,
  items = [],
  loading = false,
  error = "",
  onToggleFollow,
  followBusyId = "",
  viewerUserId = "",
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[220] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close connections modal"
            onClick={onClose}
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(239,244,255,0.22),rgba(125,96,255,0.16))] backdrop-blur-[10px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="theme-popover relative z-[1] w-full max-w-[840px] overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,247,255,0.96),rgba(246,241,255,0.94))] shadow-[0_30px_80px_rgba(76,82,160,0.22)] ring-1 ring-[rgba(255,255,255,0.6)]"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.10),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.10),transparent_28%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)]" />

            <div className="relative z-10 px-5 py-4 border-b border-white/60 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div className="theme-card inline-flex rounded-[18px] border border-white/70 bg-white/75 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 backdrop-blur">
                  {["followers", "following"].map((tab) => {
                    const isActive = activeTab === tab;

                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => onChangeTab(tab)}
                        className={`relative inline-flex min-w-[136px] items-center justify-center rounded-[14px] px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${
                          isActive
                            ? "text-white shadow-[0_12px_28px_rgba(91,99,246,0.24)]"
                            : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        {isActive ? (
                          <motion.span
                            layoutId="profile-connections-tab-pill"
                            className="absolute inset-0 rounded-[14px] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)]"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        ) : null}
                        <span className="relative z-10">{TAB_META[tab]}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="theme-card inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/82 text-zinc-500 shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:text-zinc-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative mt-4">
                <Search className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-4 top-1/2 text-zinc-400" />
                <input
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={`Tìm trong ${TAB_SEARCH_META[activeTab]}...`}
                  className="theme-card h-12 w-full rounded-[18px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,243,252,0.96))] pl-11 pr-4 text-sm text-zinc-700 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-zinc-200/50 placeholder:text-zinc-400 focus:border-[rgba(139,92,246,0.28)] focus:ring-[rgba(139,92,246,0.16)]"
                />
              </div>
            </div>

            <div className="relative z-10 h-[520px] overflow-hidden">
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
                    x: tabDirection >= 0 ? 30 : -30,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: tabDirection >= 0 ? -30 : 30,
                  }}
                  transition={{
                    duration: 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="h-full px-4 py-4 overflow-y-auto sm:px-5"
                >
                  {loading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={index}
                          className="theme-card flex items-center justify-between gap-3 rounded-[22px] border border-white/70 bg-white/72 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-full h-14 w-14 animate-pulse bg-zinc-200/70" />
                            <div className="space-y-2">
                              <div className="w-32 h-4 rounded-full animate-pulse bg-zinc-200/70" />
                              <div className="w-24 h-3 rounded-full animate-pulse bg-zinc-200/60" />
                            </div>
                          </div>
                          <div className="h-11 w-32 animate-pulse rounded-[16px] bg-zinc-200/70" />
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-full max-w-md rounded-[24px] border border-red-200 bg-red-50/90 px-5 py-6 text-center shadow-[0_16px_34px_rgba(239,68,68,0.08)]">
                        <p className="text-base font-semibold text-red-600">
                          Không tải được danh sách
                        </p>
                        <p className="mt-2 text-sm text-red-500/90">{error}</p>
                      </div>
                    </div>
                  ) : items.length ? (
                    <div className="space-y-3">
                      {items.map((person) => {
                        const personId = person?._id || person?.id || "";
                        const avatar = getAvatar(person);
                        const isSelf =
                          viewerUserId && personId === viewerUserId;
                        const isBusy = followBusyId === personId;
                        const followed = !!person?.followedByMe;

                        return (
                          <div
                            key={personId || `connection-${person?.name || "traveler"}`}
                            className="theme-card group flex items-center justify-between gap-4 rounded-[22px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(245,247,255,0.94),rgba(244,239,255,0.90))] px-4 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.06)] ring-1 ring-zinc-200/55 transition hover:-translate-y-[1px] hover:shadow-[0_18px_36px_rgba(91,99,246,0.10)]"
                          >
                            <div className="flex items-center min-w-0 gap-3">
                              {avatar ? (
                                <img
                                  src={avatar}
                                  alt={person?.name || "Traveler"}
                                  className="h-14 w-14 rounded-full object-cover ring-2 ring-white/85 shadow-[0_10px_22px_rgba(15,23,42,0.10)]"
                                />
                              ) : (
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-lg font-semibold text-white shadow-[0_10px_22px_rgba(91,99,246,0.18)]">
                                  {getInitial(person)}
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="truncate text-[15px] font-semibold text-zinc-900">
                                  {person?.name || "Traveler"}
                                </p>
                                <p className="text-sm truncate text-zinc-500">
                                  Travel Social member
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isSelf || isBusy}
                              onClick={() => onToggleFollow?.(person)}
                              className={`inline-flex h-11 min-w-[132px] items-center justify-center rounded-[16px] px-4 text-sm font-semibold transition cursor-pointer ${
                                isSelf
                                  ? "cursor-default border border-white/70 bg-white/75 text-zinc-400"
                                  : followed
                                    ? "border border-white/85 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,247,255,0.98),rgba(243,238,255,0.96))] text-zinc-700 shadow-[0_12px_26px_rgba(91,99,246,0.10)] ring-1 ring-[rgba(167,139,250,0.12)] hover:-translate-y-0.5"
                                    : "bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white shadow-[0_14px_30px_rgba(91,99,246,0.24)] hover:-translate-y-0.5"
                              } ${isBusy ? "opacity-70" : ""}`}
                            >
                              {isSelf ? (
                                "Bạn"
                              ) : isBusy ? (
                                <span className="inline-flex items-center justify-center">
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                                </span>
                              ) : followed ? (
                                "Following"
                              ) : (
                                "Follow"
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="theme-card w-full max-w-md rounded-[24px] border border-white/70 bg-white/80 px-5 py-8 text-center shadow-[0_16px_34px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60">
                        <p className="text-lg font-semibold text-zinc-900">
                          {activeTab === "followers"
                            ? "Chưa có follower nào"
                            : "Chưa có following nào"}
                        </p>
                        <p className="mt-2 text-sm text-zinc-500">
                          {activeTab === "followers"
                            ? "Danh sách này hiện chưa có ai."
                            : "Bạn chưa theo dõi ai trong danh sách này."}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
