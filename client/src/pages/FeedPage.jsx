import { useCallback, useEffect, useState } from "react";
import FloatingShape from "../components/auth/login/FloatingShape";
import ShareJourneyModal from "../components/feed/ShareJourneyModal";
import { feedApi } from "../api/feed.api";

import { shapeStyles } from "../components/feed/page/feed.constants";

import LeftSidebar from "../components/feed/layout/LeftSidebar";
import MainFeed from "../components/feed/layout/MainFeed";
import RightSidebar from "../components/feed/layout/RightSidebar";

export default function FeedPage() {
  const [openComposer, setOpenComposer] = useState(false);
  const [feedItems, setFeedItems] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [previewUser, setPreviewUser] = useState(null);

  const loadFeed = useCallback(async () => {
    try {
      setFeedLoading(true);
      setFeedError("");

      const res = await feedApi.list({ limit: 12 });
      setFeedItems(res.data?.items || []);
    } catch (e) {
      setFeedError(
        e?.response?.data?.message || "Không tải được feed lúc này.",
      );
      setFeedItems([]);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  async function handlePosted() {
    setOpenComposer(false);
    await loadFeed();
  }

  function handlePreviewUser(user) {
    if (!user) return;

    const ownerId = user?._id || user?.id || "";

    const ownerTrips = feedItems.filter((item) => {
      const itemOwnerId = item?.ownerId?._id || item?.ownerId?.id || "";
      return itemOwnerId && itemOwnerId === ownerId;
    });

    setPreviewUser({
      id: ownerId,
      name: user?.name || "Traveler",
      email: user?.email || "",
      avatar:
        user?.avatarUrl ||
        user?.avatar ||
        user?.profile?.avatarUrl ||
        user?.profile?.avatar ||
        "",
      previewTrips: ownerTrips,
    });
  }

  return (
    <div className="relative min-h-screen bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-4">
      <div className="absolute inset-0 pointer-events-none">
        <FloatingShape
          className="left-[10%] top-[10%] h-20 w-20"
          style={shapeStyles[0]}
        >
          <div className="h-full w-full rounded-full bg-[linear-gradient(45deg,rgba(255,107,107,0.3),rgba(255,142,83,0.3))]" />
        </FloatingShape>

        <FloatingShape
          className="right-[15%] top-[20%] h-[120px] w-[120px]"
          style={shapeStyles[1]}
        >
          <div className="h-full w-full rounded-full bg-[linear-gradient(45deg,rgba(72,187,120,0.3),rgba(56,178,172,0.3))]" />
        </FloatingShape>

        <FloatingShape
          className="bottom-[30%] left-[20%] h-[60px] w-[60px]"
          style={shapeStyles[2]}
        >
          <div className="h-full w-full rounded-full bg-[linear-gradient(45deg,rgba(99,102,241,0.3),rgba(139,92,246,0.3))]" />
        </FloatingShape>

        <FloatingShape
          className="bottom-[10%] right-[10%] h-[100px] w-[100px]"
          style={shapeStyles[3]}
        >
          <div className="h-full w-full rounded-full bg-[linear-gradient(45deg,rgba(236,72,153,0.3),rgba(219,39,119,0.3))]" />
        </FloatingShape>

        <FloatingShape
          className="left-[5%] top-1/2 h-[140px] w-[140px]"
          style={shapeStyles[4]}
        >
          <div className="h-full w-full rounded-full bg-[linear-gradient(45deg,rgba(251,191,36,0.3),rgba(245,158,11,0.3))]" />
        </FloatingShape>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1680px] overflow-hidden rounded-[34px] border border-white/60 bg-[#fafafb] shadow-[0_25px_80px_rgba(30,41,59,0.08)] lg:h-[calc(100vh-2rem)]">
        <div className="grid min-h-[900px] grid-cols-1 lg:h-full lg:min-h-0 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
          <LeftSidebar
            previewUser={previewUser}
            onClearPreview={() => setPreviewUser(null)}
          />
          <MainFeed
            onOpenComposer={() => setOpenComposer(true)}
            feedItems={feedItems}
            feedLoading={feedLoading}
            feedError={feedError}
            onReloadFeed={loadFeed}
            onPreviewUser={handlePreviewUser}
          />
          <RightSidebar />
        </div>
      </div>

      <ShareJourneyModal
        open={openComposer}
        onClose={() => setOpenComposer(false)}
        onPosted={handlePosted}
      />
    </div>
  );
}
