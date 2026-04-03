import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../../auth/useAuth";
import { requests, navItems } from "../../feed/page/feed.constants";
import { CheckIcon } from "../../feed/page/feed.icons";
import ProfileDivider from "./ProfileDivider";

export default function ProfileLeftSidebar({
  user: profileUser = null,
  stats = null,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const displayUser = profileUser || user;

  const fallbackProfile = {
    name: "Traveler",
    location: "No email",
    avatar: "",
    stats: [
      { label: "Posts", value: "0" },
      { label: "Followers", value: "0" },
      { label: "Following", value: "0" },
    ],
  };

  const sidebarProfile = {
    name: displayUser?.name || fallbackProfile.name,
    location: displayUser?.email || fallbackProfile.location,
    avatar:
      displayUser?.avatarUrl ||
      displayUser?.avatar ||
      displayUser?.profile?.avatarUrl ||
      displayUser?.profile?.avatar ||
      fallbackProfile.avatar,
    stats: Array.isArray(stats) && stats.length ? stats : fallbackProfile.stats,
  };

  const sidebarInitial = (sidebarProfile.name || "Traveler")
    .charAt(0)
    .toUpperCase();

  const sidebarNavItems = navItems.map((item) => {
    if (item.label === "Feed") {
      return { ...item, active: location.pathname === "/" };
    }

    if (item.label === "Home") {
      return { ...item, active: location.pathname === "/profile" };
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

        <div className="mt-8 rounded-[28px] bg-[linear-gradient(180deg,#eef4ff_0%,#ffffff_100%)] p-5 shadow-[0_16px_40px_rgba(76,109,255,0.08)] ring-1 ring-zinc-200/70">
          <div className="relative mx-auto h-[110px] w-[110px]">
            {sidebarProfile.avatar ? (
              <img
                src={sidebarProfile.avatar}
                alt={sidebarProfile.name}
                className="h-full w-full rounded-[30px] object-cover shadow-[0_16px_30px_rgba(80,97,164,0.18)]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-[30px] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-[32px] font-semibold text-white shadow-[0_16px_30px_rgba(80,97,164,0.18)]">
                {sidebarInitial}
              </div>
            )}
          </div>

          <div className="mt-5 text-center">
            <h2 className="text-[20px] font-semibold tracking-tight text-zinc-900">
              {sidebarProfile.name}
            </h2>
            <p className="mt-1 text-[14px] text-zinc-400">
              {sidebarProfile.location}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 rounded-[22px] bg-white p-3 shadow-[0_10px_26px_rgba(20,20,43,0.04)] ring-1 ring-zinc-200/60">
            {sidebarProfile.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-[17px] font-semibold text-zinc-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-[12px] text-zinc-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <nav className="space-y-2 mt-7">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
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
              </button>
            );
          })}
        </nav>

        <ProfileDivider />

        <div>
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
        </div>
      </div>
    </aside>
  );
}
