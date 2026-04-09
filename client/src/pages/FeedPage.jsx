import { useCallback, useEffect, useRef, useState } from "react";

import FloatingShape from "../components/auth/login/FloatingShape";
import ShareJourneyModal from "../components/feed/ShareJourneyModal";
import { feedApi } from "../api/feed.api";
import { userApi } from "../api/user.api";

import { shapeStyles } from "../components/feed/page/feed.constants";

import LeftSidebar from "../components/feed/layout/LeftSidebar";
import MainFeed from "../components/feed/layout/MainFeed";
import RightSidebar from "../components/feed/layout/RightSidebar";

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
    nextMap.set(itemId, item);
  });

  return [...nextMap.values()].sort(
    (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0),
  );
}

export default function FeedPage() {
  const [openComposer, setOpenComposer] = useState(false);
  const [feedItems, setFeedItems] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [feedCursor, setFeedCursor] = useState(null);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [previewUser, setPreviewUser] = useState(null);

  const [previewStats, setPreviewStats] = useState(null);
  const [previewStatsLoading, setPreviewStatsLoading] = useState(false);

  const previewStatsCacheRef = useRef(new Map());
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
        } else {
          setFeedLoadingMore(true);
        }

        const res = await feedApi.list({
          limit: 12,
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

        if (reset) {
          setFeedItems([]);
          feedCursorRef.current = null;
          setFeedCursor(null);
          setFeedHasMore(false);
        }
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
    [],
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
      return;
    }

    const requestId = ++previewRequestIdRef.current;

    try {
      setPreviewStatsLoading(true);

      const res = await userApi.getSummary(ownerId);
      const nextStats = buildPreviewStats(res.data?.stats);

      previewStatsCacheRef.current.set(ownerId, nextStats);

      if (requestId !== previewRequestIdRef.current) return;
      setPreviewStats(nextStats);
    } catch {
      if (requestId !== previewRequestIdRef.current) return;

      setPreviewStats([
        { label: "Posts", value: "0" },
        { label: "Followers", value: "0" },
        { label: "Following", value: "0" },
      ]);
    } finally {
      if (requestId === previewRequestIdRef.current) {
        setPreviewStatsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadFeed({ reset: true });
  }, [loadFeed]);

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
    await loadPreviewStats(ownerId);
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

  return (
    <div className="relative min-h-screen bg-white md:bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] md:px-3 md:py-3 lg:px-4 lg:py-4">
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

      <div className="relative z-10 mx-auto w-full max-w-[1680px] overflow-hidden bg-[#fafafb] md:rounded-[34px] md:border md:border-white/60 md:shadow-[0_25px_80px_rgba(30,41,59,0.08)] lg:h-[calc(100vh-2rem)]">
        <div className="grid min-h-screen grid-cols-1 md:min-h-[900px] lg:h-full lg:min-h-0 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
          <LeftSidebar
            previewUser={previewUser}
            previewStats={previewStats}
            previewStatsLoading={previewStatsLoading}
            onClearPreview={() => {
              previewRequestIdRef.current += 1;
              setPreviewUser(null);
              setPreviewStats(null);
              setPreviewStatsLoading(false);
            }}
          />

          <MainFeed
            onOpenComposer={() => setOpenComposer(true)}
            feedItems={feedItems}
            feedLoading={feedLoading}
            feedLoadingMore={feedLoadingMore}
            feedError={feedError}
            feedHasMore={feedHasMore}
            onReloadFeed={() => loadFeed({ reset: true })}
            onLoadMoreFeed={handleLoadMoreFeed}
            onPreviewUser={handlePreviewUser}
            onTripTrashed={handleTripTrashed}
            onTripUpdated={handleTripUpdated}
            onTripHidden={handleTripHidden}
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
