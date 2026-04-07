import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { requests, navItems } from "../page/feed.constants";
import { CheckIcon } from "../page/feed.icons";
import Divider from "./Divider";

function getPreviewAvatar(user) {
  return (
    user?.avatar ||
    user?.avatarUrl ||
    user?.profile?.avatarUrl ||
    user?.profile?.avatar ||
    ""
  );
}

export default function LeftSidebar({
  previewUser = null,
  previewStats = null,
  previewStatsLoading = false,
  onClearPreview = () => {},
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const displayUser = previewUser || null;
  const previewAvatar = getPreviewAvatar(displayUser);

  const previewUserId = displayUser?._id || displayUser?.id || "";

  const sidebarStats = previewStatsLoading
    ? [
        { label: "Posts", value: "..." },
        { label: "Followers", value: "..." },
        { label: "Following", value: "..." },
      ]
    : Array.isArray(previewStats) && previewStats.length
      ? previewStats
      : [
          { label: "Posts", value: "0" },
          { label: "Followers", value: "0" },
          { label: "Following", value: "0" },
        ];

  const sidebarNavItems = navItems.map((item) => {
    if (item.label === "Feed") {
      return { ...item, active: location.pathname === "/" };
    }

    if (item.label === "Home") {
      return { ...item, active: location.pathname === "/profile" };
    }

    if (item.label === "Archive") {
      return { ...item, active: location.pathname === "/archive" };
    }

    return { ...item, active: false };
  });

  function handleSidebarNavigate(item) {
    if (item.label === "Feed") {
      navigate("/");
      return;
    }

    if (item.label === "Home") {
      navigate("/profile");
      return;
    }

    if (item.label === "Archive") {
      navigate("/archive");
    }
  }

  function handleViewProfile() {
    if (!previewUserId) return;

    navigate(`/profile/${previewUserId}`, {
      state: {
        profileUser: displayUser,
        profileTrips: displayUser.previewTrips || [],
      },
    });
  }

  return (
    <aside className="hidden border-r border-zinc-200/80 bg-white/80 px-6 py-7 backdrop-blur lg:block lg:self-start lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:rounded-l-[34px] feed-side-scroll">
      <div>
        <div className="flex items-center justify-center gap-3">
          <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.08, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute h-[48px] w-[48px] rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#ff8e53]"
            />
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.08, 1] }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear",
                delay: -5,
              }}
              className="absolute h-8 w-8 rounded-full bg-gradient-to-br from-[#4ecdc4] to-[#44a08d]"
            />
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.08, 1] }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear",
                delay: -10,
              }}
              className="absolute h-4 w-4 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe]"
            />
          </div>

          <div className="flex flex-col justify-center text-center">
            <p className="text-[17px] font-semibold leading-tight tracking-tight text-zinc-900">
              Travel Social
            </p>
            <p className="text-[12px] leading-tight text-zinc-400">
              Explore with stories
            </p>
          </div>
        </div>

        <LayoutGroup>
          <AnimatePresence initial={false} mode="popLayout">
            {displayUser ? (
              <motion.section
                layout
                initial={{ opacity: 0, y: -10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{
                  duration: 0.28,
                  ease: [0.22, 1, 0.36, 1],
                  layout: {
                    duration: 0.42,
                    ease: [0.22, 1, 0.36, 1],
                  },
                }}
                className="relative mt-8 overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,247,255,0.97),rgba(247,243,255,0.95))] p-5 shadow-[0_24px_55px_rgba(91,99,246,0.12)] ring-1 ring-white/70 backdrop-blur-xl"
              >
                <div className="absolute inset-0 pointer-events-none">
                  <motion.div
                    animate={{
                      x: [0, 10, 0],
                      y: [0, -8, 0],
                      scale: [1, 1.06, 1],
                      opacity: [0.28, 0.42, 0.28],
                    }}
                    transition={{
                      duration: 7,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.28)_0%,rgba(167,139,250,0.12)_34%,transparent_72%)]"
                  />
                  <motion.div
                    animate={{
                      x: [0, -10, 0],
                      y: [0, 10, 0],
                      scale: [1, 1.08, 1],
                      opacity: [0.24, 0.38, 0.24],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.6,
                    }}
                    className="absolute -bottom-14 -right-12 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.24)_0%,rgba(96,165,250,0.10)_36%,transparent_74%)]"
                  />
                  <div className="absolute inset-[1px] rounded-[28px] border border-white/40" />
                  <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)]" />
                </div>

                <motion.button
                  type="button"
                  onClick={onClearPreview}
                  aria-label="Close preview"
                  whileHover={{ scale: 1.06, rotate: 90 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/85 bg-white/90 text-zinc-500 shadow-[0_12px_28px_rgba(15,23,42,0.08)] backdrop-blur transition hover:text-zinc-900 cursor-pointer"
                >
                  <span className="text-[18px] leading-none">×</span>
                </motion.button>

                <div className="relative z-10">
                  <div className="relative mx-auto h-[118px] w-[118px]">
                    <motion.div
                      animate={{
                        opacity: [0.55, 0.8, 0.55],
                        scale: [1, 1.04, 1],
                      }}
                      transition={{
                        duration: 3.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-[-8px] rounded-[38px] bg-[linear-gradient(135deg,rgba(167,139,250,0.22),rgba(96,165,250,0.18),rgba(255,255,255,0.48))] blur-md"
                    />

                    <AnimatePresence mode="sync" initial={false}>
                      <motion.div
                        key={
                          previewAvatar ||
                          displayUser._id ||
                          displayUser.id ||
                          displayUser.email ||
                          displayUser.name ||
                          "avatar"
                        }
                        initial={{
                          opacity: 0,
                          scale: 0.94,
                          filter: "blur(5px)",
                        }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 1.03, filter: "blur(5px)" }}
                        transition={{
                          duration: 0.22,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="absolute inset-0"
                      >
                        {previewAvatar ? (
                          <img
                            src={previewAvatar}
                            alt={displayUser.name || "User avatar"}
                            className="h-full w-full rounded-[32px] object-cover shadow-[0_20px_36px_rgba(80,97,164,0.18)] ring-1 ring-white/85"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-[32px] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-[34px] font-semibold text-white shadow-[0_20px_36px_rgba(80,97,164,0.18)] ring-1 ring-white/75">
                            {(displayUser.name || "T").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="relative mt-5 h-[64px]">
                    <AnimatePresence mode="sync" initial={false}>
                      <motion.div
                        key={
                          displayUser._id ||
                          displayUser.id ||
                          displayUser.email ||
                          displayUser.name ||
                          "identity"
                        }
                        initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-x-0 top-0 text-center"
                      >
                        <h2 className="text-[20px] font-semibold tracking-tight text-zinc-900">
                          {displayUser.name || "Traveler"}
                        </h2>
                        <p className="mt-1 break-all text-[14px] text-zinc-400">
                          {displayUser.email ||
                            "Email chưa có trong dữ liệu feed"}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.24,
                      delay: 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="mt-5 grid grid-cols-3 gap-2 rounded-[24px] bg-white/82 p-3 shadow-[0_12px_30px_rgba(20,20,43,0.05)] ring-1 ring-zinc-200/60 backdrop-blur"
                  >
                    {sidebarStats.map((stat) => (
                      <motion.div
                        key={stat.label}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.18 }}
                        className="rounded-[16px] px-2 py-2 text-center"
                      >
                        <p className="text-[17px] font-semibold text-zinc-900">
                          {stat.value}
                        </p>
                        <p className="mt-1 text-[12px] text-zinc-400">
                          {stat.label}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.button
                    onClick={handleViewProfile}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.24,
                      delay: 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="group relative mt-4 inline-flex h-[54px] w-full shrink-0 items-center justify-center gap-3 overflow-hidden rounded-[20px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(244,247,255,0.97),rgba(243,237,255,0.95))] px-6 text-[14px] font-semibold text-[#5b63f6] shadow-[0_14px_30px_rgba(91,99,246,0.14)] ring-1 ring-zinc-200/60 transition duration-300 hover:shadow-[0_20px_42px_rgba(91,99,246,0.20)] cursor-pointer"
                  >
                    <span className="absolute inset-y-0 left-[-120%] w-full bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.7),transparent)] transition-all duration-700 group-hover:left-[120%]" />
                    <span className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.10),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.10),transparent_38%)]" />
                    <span className="relative z-10 inline-flex items-center gap-2">
                      <span>View profile</span>
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        className="h-4 w-4 transition duration-300 group-hover:translate-x-0.5"
                      >
                        <path
                          d="M7 5L12 10L7 15"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </motion.button>
                </div>
              </motion.section>
            ) : null}
          </AnimatePresence>

          <motion.nav
            layout
            transition={{
              layout: {
                duration: 0.42,
                ease: [0.22, 1, 0.36, 1],
              },
            }}
            className="space-y-2 mt-7"
          >
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  layout="position"
                  key={item.id}
                  onClick={() => handleSidebarNavigate(item)}
                  className={`cursor-pointer flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-[15px] font-medium transition ${
                    item.active
                      ? "bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white shadow-[0_14px_30px_rgba(102,126,234,0.24)]"
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </motion.nav>

          <motion.div layout>
            <Divider />
          </motion.div>

          <motion.div
            layout
            transition={{
              layout: {
                duration: 0.34,
                ease: [0.22, 1, 0.36, 1],
              },
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-zinc-900">
                Friend requests
              </h3>
              <button className="text-[13px] font-medium text-[#4f7cff]">
                See all
              </button>
            </div>

            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between gap-3 rounded-[18px] bg-white px-3 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.03)] ring-1 ring-zinc-200/60"
                >
                  <div className="flex items-center min-w-0 gap-3">
                    <img
                      src={request.avatar}
                      alt={request.name}
                      className="object-cover rounded-full h-11 w-11"
                    />
                    <p className="truncate text-[14px] font-medium text-zinc-800">
                      {request.name}
                    </p>
                  </div>
                  <button className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#4f7cff] transition hover:bg-blue-100">
                    <CheckIcon />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </LayoutGroup>
      </div>
    </aside>
  );
}
