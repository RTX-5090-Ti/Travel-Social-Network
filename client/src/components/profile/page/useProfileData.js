import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { userApi } from "../../../api/user.api";
import { followApi } from "../../../api/follow.api";
import { formatLargeNumber, getUserAvatar } from "./profile-page.helpers";

export function useProfileData({
  user,
  userId,
  isVisitorProfile,
  routedProfileUser,
  routedProfileTrips,
  showToast,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ownTrips, setOwnTrips] = useState([]);

  const [visitorProfileUser, setVisitorProfileUser] =
    useState(routedProfileUser);
  const [visitorProfileTrips, setVisitorProfileTrips] =
    useState(routedProfileTrips);

  const [isFollowing, setIsFollowing] = useState(null);
  const [isFollowSubmitting, setIsFollowSubmitting] = useState(false);

  const [ownFollowCounts, setOwnFollowCounts] = useState({
    followersCount: 0,
    followingCount: 0,
  });

  const [visitorFollowCounts, setVisitorFollowCounts] = useState({
    followersCount: 0,
    followingCount: 0,
  });

  const [ownPostsCount, setOwnPostsCount] = useState(0);
  const [visitorPostsCount, setVisitorPostsCount] = useState(0);
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [mediaFullyLoaded, setMediaFullyLoaded] = useState(false);
  const mediaRequestIdRef = useRef(0);

  const displayUser = isVisitorProfile ? visitorProfileUser : user;
  const rawProfileTrips = isVisitorProfile ? visitorProfileTrips : ownTrips;
  const mediaOwnerId = isVisitorProfile ? userId || "" : user?.id || "";

  const pinnedTripId =
    typeof displayUser?.pinnedTripId === "string"
      ? displayUser.pinnedTripId
      : displayUser?.pinnedTripId?._id || displayUser?.pinnedTripId?.id || "";

  const profileTrips = useMemo(() => {
    if (!Array.isArray(rawProfileTrips) || rawProfileTrips.length === 0) {
      return [];
    }

    if (!pinnedTripId) {
      return rawProfileTrips;
    }

    return [...rawProfileTrips].sort((a, b) => {
      const aId = a?._id || a?.id || "";
      const bId = b?._id || b?.id || "";

      const aPinned = aId === pinnedTripId;
      const bPinned = bId === pinnedTripId;

      if (aPinned === bPinned) return 0;
      return aPinned ? -1 : 1;
    });
  }, [rawProfileTrips, pinnedTripId]);

  const profileUserId = displayUser?._id || displayUser?.id || user?.id || "";

  const loadProfileMedia = useCallback(
    async ({ limit = 4, full = false, silent = false } = {}) => {
      if (!mediaOwnerId) {
        setMediaItems([]);
        setMediaError("");
        setMediaLoading(false);
        setMediaFullyLoaded(false);
        return [];
      }

      const requestId = mediaRequestIdRef.current + 1;
      mediaRequestIdRef.current = requestId;

      try {
        setMediaLoading(true);
        setMediaError("");

        const params = {};
        if (Number.isFinite(limit) && limit > 0) {
          params.limit = limit;
        }

        const res = await userApi.getProfileMedia(mediaOwnerId, params);
        const items = Array.isArray(res.data?.items) ? res.data.items : [];

        if (mediaRequestIdRef.current !== requestId) {
          return items;
        }

        setMediaItems((prev) => {
          if (full || !prev.length) {
            return items;
          }

          return prev;
        });
        setMediaFullyLoaded(full);

        return items;
      } catch (err) {
        if (mediaRequestIdRef.current !== requestId) {
          return [];
        }

        const nextError =
          err?.response?.data?.message ||
          "Không tải được media cho profile lúc này.";

        setMediaError(nextError);
        if (!silent) {
          showToast(nextError, "error");
        }

        return [];
      } finally {
        if (mediaRequestIdRef.current === requestId) {
          setMediaLoading(false);
        }
      }
    },
    [mediaOwnerId, showToast],
  );

  const ensureFullProfileMedia = useCallback(async () => {
    if (!mediaOwnerId || mediaFullyLoaded || mediaLoading) {
      return mediaItems;
    }

    return loadProfileMedia({
      limit: null,
      full: true,
      silent: false,
    });
  }, [
    loadProfileMedia,
    mediaFullyLoaded,
    mediaItems,
    mediaLoading,
    mediaOwnerId,
  ]);

  const loadOwnTrips = useCallback(
    async ({ skipLoading = false } = {}) => {
      if (!user?.id) {
        setOwnTrips([]);
        setOwnPostsCount(0);
        setLoading(false);
        return [];
      }

      try {
        if (!skipLoading) setLoading(true);
        setError("");

        const res = await userApi.listMyTrips({ limit: 50 });
        const items = Array.isArray(res.data?.items) ? res.data.items : [];

        setOwnTrips(items);
        setOwnPostsCount(Number(res.data?.meta?.total || 0));
        if (skipLoading || mediaFullyLoaded) {
          await loadProfileMedia({
            limit: mediaFullyLoaded ? null : 4,
            full: mediaFullyLoaded,
            silent: true,
          });
        }
        return items;
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Không tải được trang cá nhân lúc này.",
        );
        setOwnTrips([]);
        setOwnPostsCount(0);
        return [];
      } finally {
        if (!skipLoading) setLoading(false);
      }
    },
    [loadProfileMedia, mediaFullyLoaded, user?.id],
  );

  const loadOwnFollowSummary = useCallback(async () => {
    if (!user?.id) {
      setOwnFollowCounts({
        followersCount: 0,
        followingCount: 0,
      });
      return;
    }

    try {
      const res = await followApi.getSummary();

      setOwnFollowCounts({
        followersCount: Number(res.data?.followersCount || 0),
        followingCount: Number(res.data?.followingCount || 0),
      });
    } catch {
      setOwnFollowCounts({
        followersCount: 0,
        followingCount: 0,
      });
    }
  }, [user?.id]);

  const loadVisitorProfile = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError("");

      const res = await userApi.getProfile(userId, { limit: 50 });

      setVisitorProfileUser(res.data?.user || null);
      setVisitorProfileTrips(
        Array.isArray(res.data?.trips) ? res.data.trips : [],
      );

      setVisitorPostsCount(Number(res.data?.meta?.totalTrips || 0));

      setVisitorFollowCounts({
        followersCount: Number(res.data?.follow?.followersCount || 0),
        followingCount: Number(res.data?.follow?.followingCount || 0),
      });

      const followed =
        typeof res.data?.follow?.followed === "boolean"
          ? res.data.follow.followed
          : false;

      setIsFollowing(followed);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Không tải được profile người dùng lúc này.",
      );
      setVisitorProfileUser(routedProfileUser || null);
      setVisitorProfileTrips(
        Array.isArray(routedProfileTrips) ? routedProfileTrips : [],
      );
      setVisitorPostsCount(0);
      setVisitorFollowCounts({
        followersCount: 0,
        followingCount: 0,
      });
      setIsFollowing(false);
    } finally {
      setLoading(false);
    }
  }, [userId, routedProfileUser, routedProfileTrips]);

  useEffect(() => {
    if (!isVisitorProfile) return;

    setVisitorProfileUser(routedProfileUser || null);
    setVisitorProfileTrips(
      Array.isArray(routedProfileTrips) ? routedProfileTrips : [],
    );
    setVisitorPostsCount(0);
    setVisitorFollowCounts({
      followersCount: 0,
      followingCount: 0,
    });
    setIsFollowing(null);
  }, [isVisitorProfile, routedProfileTrips, routedProfileUser, userId]);

  useEffect(() => {
    if (!isVisitorProfile) {
      loadOwnTrips();
      loadOwnFollowSummary();
    }
  }, [isVisitorProfile, loadOwnFollowSummary, loadOwnTrips]);

  useEffect(() => {
    if (isVisitorProfile) {
      loadVisitorProfile();
    }
  }, [isVisitorProfile, loadVisitorProfile]);

  useEffect(() => {
    mediaRequestIdRef.current += 1;
    setMediaItems([]);
    setMediaError("");
    setMediaLoading(false);
    setMediaFullyLoaded(false);

    if (!mediaOwnerId) {
      return;
    }

    loadProfileMedia({
      limit: 4,
      full: false,
      silent: true,
    });
  }, [loadProfileMedia, mediaOwnerId]);

  const stats = useMemo(() => {
    const totalJourneys = profileTrips.length;
    const totalHearts = profileTrips.reduce(
      (sum, trip) => sum + (trip?.counts?.reactions || 0),
      0,
    );
    const totalComments = profileTrips.reduce(
      (sum, trip) => sum + (trip?.counts?.comments || 0),
      0,
    );
    const totalMedia = mediaFullyLoaded
      ? mediaItems.length
      : profileTrips.reduce(
          (sum, trip) => sum + (trip?.feedPreview?.mediaCount || 0),
          0,
        );

    return {
      totalJourneys,
      totalHearts,
      totalComments,
      totalMedia,
    };
  }, [mediaFullyLoaded, mediaItems.length, profileTrips]);

  const sidebarPostsCount = isVisitorProfile
    ? visitorPostsCount
    : ownPostsCount;
  const sidebarFollowersCount = isVisitorProfile
    ? visitorFollowCounts.followersCount
    : ownFollowCounts.followersCount;
  const sidebarFollowingCount = isVisitorProfile
    ? visitorFollowCounts.followingCount
    : ownFollowCounts.followingCount;

  const sidebarStats = useMemo(() => {
    return [
      {
        label: "Posts",
        value: formatLargeNumber(sidebarPostsCount || 0),
      },
      {
        label: "Followers",
        value: formatLargeNumber(sidebarFollowersCount || 0),
      },
      {
        label: "Following",
        value: formatLargeNumber(sidebarFollowingCount || 0),
      },
    ];
  }, [sidebarFollowersCount, sidebarFollowingCount, sidebarPostsCount]);

  const highlightTrips = useMemo(() => {
    return [...profileTrips]
      .sort((a, b) => {
        const reactionsDiff =
          (b?.counts?.reactions || 0) - (a?.counts?.reactions || 0);
        if (reactionsDiff !== 0) return reactionsDiff;

        const commentsDiff =
          (b?.counts?.comments || 0) - (a?.counts?.comments || 0);
        if (commentsDiff !== 0) return commentsDiff;

        const mediaDiff =
          (b?.feedPreview?.mediaCount || 0) - (a?.feedPreview?.mediaCount || 0);
        if (mediaDiff !== 0) return mediaDiff;

        return (
          new Date(b?.createdAt || 0).getTime() -
          new Date(a?.createdAt || 0).getTime()
        );
      })
      .slice(0, 2);
  }, [profileTrips]);

  const recentCaptures = useMemo(() => mediaItems.slice(0, 4), [mediaItems]);

  const avatar = getUserAvatar(displayUser);

  const applyOwnFollowingCountDelta = useCallback(
    (prevFollowed, nextFollowed) => {
      if (prevFollowed === nextFollowed) return;

      setOwnFollowCounts((prev) => {
        const currentFollowing = Number(prev?.followingCount || 0);

        return {
          ...prev,
          followingCount: nextFollowed
            ? currentFollowing + 1
            : Math.max(0, currentFollowing - 1),
        };
      });
    },
    [],
  );

  const handleToggleFollow = useCallback(async () => {
    if (
      !isVisitorProfile ||
      !userId ||
      isFollowSubmitting ||
      isFollowing === null
    ) {
      return;
    }

    const prevFollowed = isFollowing;

    try {
      setIsFollowSubmitting(true);

      const res = prevFollowed
        ? await followApi.unfollow(userId)
        : await followApi.follow(userId);

      const nextFollowed =
        typeof res?.data?.followed === "boolean"
          ? res.data.followed
          : !prevFollowed;

      setIsFollowing(nextFollowed);
      applyOwnFollowingCountDelta(prevFollowed, nextFollowed);

      setVisitorFollowCounts((prev) => {
        const currentFollowers = Number(prev?.followersCount || 0);

        return {
          ...prev,
          followersCount: nextFollowed
            ? currentFollowers + 1
            : Math.max(0, currentFollowers - 1),
        };
      });

      showToast(
        nextFollowed ? "Đã follow người dùng." : "Đã unfollow người dùng.",
        "success",
      );
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Không cập nhật follow được.",
        "error",
      );
    } finally {
      setIsFollowSubmitting(false);
    }
  }, [
    applyOwnFollowingCountDelta,
    isFollowSubmitting,
    isFollowing,
    isVisitorProfile,
    showToast,
    userId,
  ]);

  return {
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
    mediaLoading,
    mediaError,
    mediaFullyLoaded,
    isFollowing,
    isFollowSubmitting,
    ownFollowCounts,
    applyOwnFollowingCountDelta,
    handleToggleFollow,
    loadOwnTrips,
    ensureFullProfileMedia,
  };
}
