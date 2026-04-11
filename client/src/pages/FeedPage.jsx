import { useCallback, useEffect, useRef, useState } from "react";

import FloatingShape from "../components/auth/login/FloatingShape";
import ShareJourneyModal from "../components/feed/ShareJourneyModal";
import { feedApi } from "../api/feed.api";
import { userApi } from "../api/user.api";

import { shapeStyles } from "../components/feed/page/feed.constants";

import LeftSidebar from "../components/feed/layout/LeftSidebar";
import MainFeed from "../components/feed/layout/MainFeed";
import RightSidebar from "../components/feed/layout/RightSidebar";

const FEED_MODE = {
  TRENDING: "trending",
  LATEST: "latest",
};

function formatLargeNumber(value = 0) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
}

function buildPreviewStats(summary) {
  return [
    {
      label: "Posts",
      value: formatLargeNumber(summary?.postsCount || 0),
    },
    {
      label: "Followers",
      value: formatLargeNumber(summary?.followersCount || 0),
    },
    {
      label: "Following",
      value: formatLargeNumber(summary?.followingCount || 0),
    },
  ];
}

function getTripId(item) {
  return item?._id || item?.id || "";
}

function mergeFeedItems(existingItems = [], incomingItems = []) {
  const nextMap = new Map();

  [...existingItems, ...incomingItems].forEach((item) => {
    const itemId = getTripId(item);
    if (!itemId) return;
    nextMap.set(itemId, {
      ...nextMap.get(itemId),
      ...item,
    });
  });

  return [...nextMap.values()];
}

export default function FeedPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [tabletSidebarOpen, setTabletSidebarOpen] = useState(false);
  const [openComposer, setOpenComposer] = useState(false);
  const [feedItems, setFeedItems] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [feedCursor, setFeedCursor] = useState(null);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [feedMode, setFeedMode] = useState(FEED_MODE.TRENDING);
  const [previewUser, setPreviewUser] = useState(null);

  const [previewStats, setPreviewStats] = useState(null);
  const [previewStatsLoading, setPreviewStatsLoading] = useState(false);

  const previewStatsCacheRef = useRef(new Map());
  const previewUserCacheRef = useRef(new Map());
  const previewRequestIdRef = useRef(0);
  const feedRequestIdRef = useRef(0);
  const feedCursorRef = useRef(null);

  const loadFeed = useCallback(
    async ({ reset = true } = {}) => {
      const requestId = ++feedRequestIdRef.current;

      try {
        if (reset) {
          setFeedLoading(true);
          setFeedError("");
          setFeedItems([]);
          feedCursorRef.current = null;
          setFeedCursor(null);
          setFeedHasMore(false);
        } else {
          setFeedLoadingMore(true);
        }

        const res = await feedApi.list({
          limit: 12,
          mode: feedMode,
          ...(reset ? {} : { cursor: feedCursorRef.current }),
        });
        const nextItems = Array.isArray(res.data?.items) ? res.data.items : [];

        if (requestId !== feedRequestIdRef.current) return;

        setFeedItems((prev) => {
          if (reset) {
            return nextItems;
          }

          return mergeFeedItems(prev, nextItems);
        });
        feedCursorRef.current = res.data?.page?.nextCursor || null;
        setFeedCursor(res.data?.page?.nextCursor || null);
        setFeedHasMore(!!res.data?.page?.hasMore);
      } catch (error) {
        if (requestId !== feedRequestIdRef.current) return;

        setFeedError(
          error?.response?.data?.message || "Không tải được feed lúc này.",
        );

      } finally {
        if (requestId === feedRequestIdRef.current) {
          if (reset) {
            setFeedLoading(false);
          } else {
            setFeedLoadingMore(false);
          }
        }
      }
    },
    [feedMode],
  );

  const loadPreviewStats = useCallback(async (ownerId) => {
    if (!ownerId) {
      setPreviewStats(null);
      setPreviewStatsLoading(false);
      return;
    }

    if (previewStatsCacheRef.current.has(ownerId)) {
      setPreviewStats(previewStatsCacheRef.current.get(ownerId));
      setPreviewStatsLoading(false);
      return previewUserCacheRef.current.get(ownerId) || null;
    }

    const requestId = ++previewRequestIdRef.current;

    try {
      setPreviewStatsLoading(true);

      const res = await userApi.getSummary(ownerId);
      const nextStats = buildPreviewStats(res.data?.stats);
      const nextPreviewUser = res.data?.user || null;

      previewStatsCacheRef.current.set(ownerId, nextStats);
      previewUserCacheRef.current.set(ownerId, nextPreviewUser);

      if (requestId !== previewRequestIdRef.current) return;
      setPreviewStats(nextStats);
      return nextPreviewUser;
    } catch {
      if (requestId !== previewRequestIdRef.current) return;

      setPreviewStats([
        { label: "Posts", value: "0" },
        { label: "Followers", value: "0" },
        { label: "Following", value: "0" },
      ]);
      return null;
    } finally {
      if (requestId === previewRequestIdRef.current) {
        setPreviewStatsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadFeed({ reset: true });
  }, [loadFeed, feedMode]);

  useEffect(() => {
    setPreviewUser((prev) => {
      if (!prev?.id) return prev;

      const ownerTrips = feedItems.filter((item) => {
        const itemOwnerId = item?.ownerId?._id || item?.ownerId?.id || "";
        return itemOwnerId && itemOwnerId === prev.id;
      });

      return {
        ...prev,
        previewTrips: ownerTrips,
      };
    });
  }, [feedItems]);

  async function handlePosted() {
    setOpenComposer(false);
    await loadFeed({ reset: true });
  }

  async function handlePreviewUser(user) {
    if (!user) return;

    const ownerId = user?._id || user?.id || "";
    if (!ownerId) return;

    const ownerTrips = feedItems.filter((item) => {
      const itemOwnerId = item?.ownerId?._id || item?.ownerId?.id || "";
      return itemOwnerId && itemOwnerId === ownerId;
    });

    setPreviewUser({
      id: ownerId,
      _id: ownerId,
      name: user?.name || "Traveler",
      email: user?.email || "",
      avatarUrl:
        user?.avatarUrl ||
        user?.avatar ||
        user?.profile?.avatarUrl ||
        user?.profile?.avatar ||
        "",
      previewTrips: ownerTrips,
    });

    setPreviewStats(null);
    const summaryUser = await loadPreviewStats(ownerId);

    if (summaryUser) {
      setPreviewUser((prev) => {
        if (!prev) return prev;
        const prevId = prev?._id || prev?.id || "";
        if (prevId !== ownerId) return prev;

        return {
          ...prev,
          name: summaryUser?.name || prev.name,
          email: summaryUser?.email || prev.email || "",
          avatarUrl:
            summaryUser?.avatarUrl ||
            summaryUser?.avatar ||
            summaryUser?.profile?.avatarUrl ||
            summaryUser?.profile?.avatar ||
            prev.avatarUrl ||
            "",
        };
      });
    }
  }

  function handleTripTrashed(tripId) {
    if (!tripId) return;

    setFeedItems((prev) =>
      prev.filter((item) => getTripId(item) !== tripId),
    );
  }

  function handleTripHidden(tripId) {
    if (!tripId) return;

    setFeedItems((prev) =>
      prev.filter((item) => getTripId(item) !== tripId),
    );
  }

  async function handleTripUpdated() {
    await loadFeed({ reset: true });
  }

  async function handleLoadMoreFeed() {
    if (feedLoading || feedLoadingMore || !feedHasMore || !feedCursor) {
      return;
    }

    await loadFeed({ reset: false });
  }

  function handleChangeFeedMode(nextMode) {
    if (!nextMode || nextMode === feedMode) return;
    setFeedMode(nextMode);
  }

  return (
    <div className="theme-page-shell relative min-h-screen bg-white px-0 pt-0 pb-[calc(env(safe-area-inset-bottom,0px)+92px)] md:bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] md:px-3 md:pt-3 md:pb-3 lg:px-4 lg:pt-4 lg:pb-4">
      <div className="absolute inset-0 hidden pointer-events-none md:block">
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

      <div className="theme-app-shell relative z-10 mx-auto w-full max-w-[1680px] overflow-hidden bg-[#fafafb] md:rounded-[34px] md:border md:border-white/60 md:shadow-[0_25px_80px_rgba(30,41,59,0.08)] lg:h-[calc(100vh-2rem)]">
        <div className="grid min-h-screen grid-cols-1 md:min-h-[900px] lg:h-full lg:min-h-0 lg:grid-cols-[312px_minmax(0,1fr)] xl:grid-cols-[312px_minmax(0,1fr)_344px]">
          <LeftSidebar
            previewUser={previewUser}
            previewStats={previewStats}
            previewStatsLoading={previewStatsLoading}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            tabletSidebarOpen={tabletSidebarOpen}
            onToggleTabletSidebar={() =>
              setTabletSidebarOpen((prev) => !prev)
            }
            onClearPreview={() => {
              previewRequestIdRef.current += 1;
              setPreviewUser(null);
              setPreviewStats(null);
              setPreviewStatsLoading(false);
            }}
          />

          <MainFeed
            onOpenComposer={() => setOpenComposer(true)}
            feedMode={feedMode}
            feedItems={feedItems}
            feedLoading={feedLoading}
            feedLoadingMore={feedLoadingMore}
            feedError={feedError}
            feedHasMore={feedHasMore}
            onChangeFeedMode={handleChangeFeedMode}
            onReloadFeed={() => loadFeed({ reset: true })}
            onLoadMoreFeed={handleLoadMoreFeed}
            onPreviewUser={handlePreviewUser}
            onTripTrashed={handleTripTrashed}
            onTripUpdated={handleTripUpdated}
            onTripHidden={handleTripHidden}
          />

          <RightSidebar
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
            tabletOpen={tabletSidebarOpen}
            onCloseTablet={() => setTabletSidebarOpen(false)}
          />
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
