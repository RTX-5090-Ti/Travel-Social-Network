import { MessageCircleMore } from "lucide-react";

import { suggestions } from "../../feed/page/feed.constants";
import { UserPlusIcon } from "../../feed/page/feed.icons";
import NotificationBellButton from "../../notifications/NotificationBellButton";
import MutualContactsSection from "../../shared/MutualContactsSection";
import ProfileDivider from "./ProfileDivider";

export default function ProfileRightSidebar() {
  return (
    <aside className="hidden min-w-0 bg-white/80 px-6 backdrop-blur lg:block lg:self-start lg:sticky lg:top-4 lg:z-30 lg:overflow-x-hidden lg:rounded-r-[34px]">
      <div className="feed-side-scroll min-w-0 pb-7 pt-0 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:overflow-x-hidden">
        <div className="sticky top-0 z-30 -mx-6 mb-3 border-b border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.88)_100%)] px-6 pb-3 pt-7 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
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

              <NotificationBellButton />
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
              <button className="text-[13px] font-medium text-[#4f7cff] cursor-pointer">
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

                  <button className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#4f7cff] transition hover:bg-blue-100 cursor-pointer">
                    <UserPlusIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ProfileDivider />

        <MutualContactsSection />
      </div>
    </aside>
  );
}
