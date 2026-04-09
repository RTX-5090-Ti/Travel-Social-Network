import { Bell, MessageCircleMore } from "lucide-react";

import { suggestions, contacts } from "../page/feed.constants";
import { SendIcon, UserPlusIcon } from "../page/feed.icons";
import { useNotifications } from "../../../notifications/useNotifications";
import Divider from "./Divider";

export default function RightSidebar() {
  const { unreadCount } = useNotifications();

  return (
    <aside className="hidden bg-white/80 px-6 backdrop-blur lg:block lg:self-start lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:rounded-r-[34px] feed-side-scroll">
      <div className="py-7">
        <div className="sticky top-0 z-30 -mx-6 mb-3 border-b border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.88)_100%)] px-6 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
          <div className="flex items-center justify-between px-3">
            <div>
              <h3 className="text-[20px] font-semibold tracking-tight text-zinc-900"></h3>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Messages"
                className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white shadow-[0_12px_28px_rgba(108,92,231,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(79,124,255,0.28)] cursor-pointer"
              >
                <MessageCircleMore
                  className="h-[22px] w-[22px] transition duration-200 group-hover:scale-105"
                  strokeWidth={2.2}
                />
                <span className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 py-[2px] text-[10px] font-semibold leading-none text-white shadow-[0_8px_18px_rgba(244,63,94,0.32)]">
                  2
                </span>
              </button>

              <button
                type="button"
                aria-label="Notifications"
                className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white shadow-[0_12px_28px_rgba(108,92,231,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(79,124,255,0.28)] cursor-pointer"
              >
                <Bell
                  className="h-[22px] w-[22px] transition duration-200 group-hover:scale-105"
                  strokeWidth={2.2}
                />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 py-[2px] text-[10px] font-semibold leading-none text-white shadow-[0_8px_18px_rgba(255,255,255,0.35)]">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] p-[1px] shadow-[0_18px_36px_rgba(102,126,234,0.24)]">
          <div className="rounded-[23px] bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Suggested
                </p>
                <h4 className="mt-1 text-[18px] font-semibold text-zinc-900">
                  People to follow
                </h4>
              </div>
              <button className="text-[13px] font-medium text-[#4f7cff]">
                Refresh
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {suggestions.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center min-w-0 gap-3">
                    <div className="relative">
                      <img
                        src={person.avatar}
                        alt={person.name}
                        className="object-cover rounded-full h-11 w-11"
                      />
                      <span
                        className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${person.dot}`}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-zinc-800">
                        {person.name}
                      </p>
                      <p className="truncate text-[12px] text-zinc-400">
                        {person.city}
                      </p>
                    </div>
                  </div>

                  <button className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#4f7cff] transition hover:bg-blue-100">
                    <UserPlusIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Divider />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-zinc-900">
              Online now
            </h3>
            <button className="text-[13px] font-medium text-[#4f7cff]">
              View all
            </button>
          </div>

          <div className="space-y-4">
            {contacts.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between gap-3 rounded-[18px] bg-white px-3 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.03)] ring-1 ring-zinc-200/60"
              >
                <div className="flex items-center min-w-0 gap-3">
                  <div className="relative">
                    <img
                      src={person.avatar}
                      alt={person.name}
                      className="object-cover rounded-full h-11 w-11"
                    />
                    <span
                      className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${person.dot}`}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-zinc-800">
                      {person.name}
                    </p>
                    <p className="truncate text-[12px] text-zinc-400">
                      {person.city}
                    </p>
                  </div>
                </div>

                <button className="inline-flex items-center justify-center w-8 h-8 transition rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700">
                  <SendIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
