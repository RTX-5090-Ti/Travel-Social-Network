import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import NotificationBellButton from "../../notifications/NotificationBellButton";
import MutualContactsSection from "../../shared/MutualContactsSection";
import SuggestedFollowsSection from "../../shared/SuggestedFollowsSection";
import MessageInboxButton from "../../chat/MessageInboxButton";
import Divider from "./Divider";

export default function RightSidebar({
  mobileOpen = false,
  onCloseMobile = () => {},
  tabletOpen = false,
  onCloseTablet = () => {},
}) {
  return (
    <>
      <AnimatePresence>
        {tabletOpen ? (
          <motion.div
            className="fixed inset-0 z-[110] hidden lg:block xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close tablet sidebar"
              className="absolute inset-0"
              onClick={onCloseTablet}
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="theme-sidebar absolute bottom-4 right-4 top-4 z-[1] w-[344px] overflow-hidden rounded-[34px] border border-white/60 bg-white/90 px-6 shadow-[0_25px_80px_rgba(30,41,59,0.12)] backdrop-blur"
            >
              <div className="feed-side-scroll min-w-0 pb-7 pt-0 max-h-full overflow-y-auto overflow-x-hidden">
                <div className="theme-sidebar-header sticky top-0 z-30 -mx-6 mb-3 border-b border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.88)_100%)] px-6 pb-3 pt-7 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
                  <div className="flex items-center justify-between px-3">
                    <div />

                    <div className="flex items-center gap-4">
                      <MessageInboxButton />
                      <NotificationBellButton />
                    </div>
                  </div>
                </div>

                <SuggestedFollowsSection />

                <Divider />

                <MutualContactsSection />
              </div>
            </motion.aside>
          </motion.div>
        ) : null}

        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-[120] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close mobile sidebar"
              className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
              onClick={onCloseMobile}
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="theme-sidebar absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden bg-white/95 px-6 backdrop-blur"
            >
              <div className="feed-side-scroll min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-[calc(env(safe-area-inset-bottom,0px)+28px)] pt-0">
                <div className="theme-sidebar-header sticky top-0 z-30 -mx-6 mb-3 border-b border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.88)_100%)] px-6 pb-3 pt-7 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
                  <div className="flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={onCloseMobile}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/90 text-zinc-600 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:text-zinc-900 cursor-pointer"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-4">
                      <MessageInboxButton />
                      <NotificationBellButton />
                    </div>
                  </div>
                </div>

                <SuggestedFollowsSection />

                <Divider />

                <MutualContactsSection />
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <aside className="theme-sidebar hidden min-w-0 bg-white/80 px-6 backdrop-blur xl:block xl:self-start xl:sticky xl:top-4 xl:z-30 xl:overflow-x-hidden xl:rounded-r-[34px]">
        <div className="feed-side-scroll min-w-0 pb-7 pt-0 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:overflow-x-hidden">
        <div className="theme-sidebar-header sticky top-0 z-30 -mx-6 mb-3 border-b border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.88)_100%)] px-6 pb-3 pt-7 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
          <div className="flex items-center justify-between px-3">
            <div>
              <h3 className="text-[20px] font-semibold tracking-tight text-zinc-900"></h3>
            </div>

            <div className="flex items-center gap-4">
              <MessageInboxButton />
              <NotificationBellButton />
            </div>
          </div>
        </div>

        <SuggestedFollowsSection />

        <Divider />

        <MutualContactsSection />
        </div>
      </aside>
    </>
  );
}
