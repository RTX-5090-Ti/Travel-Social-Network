import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { followApi } from "../../../api/follow.api";
import { EMPTY_ARRAY } from "./profile-page.helpers";

export function useProfileConnections({
  profileUserId,
  isVisitorProfile,
  user,
  showToast,
  applyOwnFollowingCountDelta,
}) {
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const [connectionsTab, setConnectionsTab] = useState("followers");
  const [connectionsDirection, setConnectionsDirection] = useState(0);
  const [connectionsSearch, setConnectionsSearch] = useState("");
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connectionsError, setConnectionsError] = useState("");
  const [connectionsFollowBusyId, setConnectionsFollowBusyId] = useState("");

  const [connectionLists, setConnectionLists] = useState({
    followers: { items: [], meta: null },
    following: { items: [], meta: null },
  });

  const connectionCacheRef = useRef(new Map());

  const currentConnections = useMemo(
    () => connectionLists[connectionsTab]?.items ?? EMPTY_ARRAY,
    [connectionLists, connectionsTab],
  );

  const filteredConnections = useMemo(() => {
    const keyword = connectionsSearch.trim().toLowerCase();

    if (!keyword) return currentConnections;

    return currentConnections.filter((item) => {
      const name = String(item?.name || "").toLowerCase();
      const email = String(item?.email || "").toLowerCase();

      return name.includes(keyword) || email.includes(keyword);
    });
  }, [connectionsSearch, currentConnections]);

  const loadConnectionsTab = useCallback(
    async (tab, { force = false } = {}) => {
      if (!profileUserId) return;

      const cacheKey = `${profileUserId}:${tab}`;

      if (!force && connectionCacheRef.current.has(cacheKey)) {
        const cachedPayload = connectionCacheRef.current.get(cacheKey);

        setConnectionLists((prev) => ({
          ...prev,
          [tab]: cachedPayload,
        }));
        setConnectionsError("");
        return;
      }

      try {
        setConnectionsLoading(true);
        setConnectionsError("");

        const res =
          tab === "followers"
            ? await followApi.listFollowersByUserId(profileUserId, {
                page: 1,
                limit: 50,
              })
            : await followApi.listFollowingByUserId(profileUserId, {
                page: 1,
                limit: 50,
              });

        const nextPayload = {
          items: Array.isArray(res.data?.items) ? res.data.items : [],
          meta: res.data?.meta || null,
        };

        connectionCacheRef.current.set(cacheKey, nextPayload);

        setConnectionLists((prev) => ({
          ...prev,
          [tab]: nextPayload,
        }));
      } catch (err) {
        setConnectionsError(
          err?.response?.data?.message || "Không tải được danh sách lúc này.",
        );

        setConnectionLists((prev) => ({
          ...prev,
          [tab]: { items: [], meta: null },
        }));
      } finally {
        setConnectionsLoading(false);
      }
    },
    [profileUserId],
  );

  const handleOpenConnections = useCallback(
    (tab) => {
      if (tab !== "followers" && tab !== "following") return;

      setConnectionsDirection(
        tab === connectionsTab ? 0 : tab === "following" ? 1 : -1,
      );
      setConnectionsTab(tab);
      setConnectionsSearch("");
      setIsConnectionsOpen(true);
      loadConnectionsTab(tab);
    },
    [connectionsTab, loadConnectionsTab],
  );

  const handleChangeConnectionsTab = useCallback(
    (nextTab) => {
      if (nextTab === connectionsTab) return;

      setConnectionsDirection(nextTab === "following" ? 1 : -1);
      setConnectionsTab(nextTab);
      setConnectionsSearch("");
      loadConnectionsTab(nextTab);
    },
    [connectionsTab, loadConnectionsTab],
  );

  const updateConnectionFollowState = useCallback(
    (person, nextFollowed) => {
      const targetId = person?._id || person?.id || "";
      if (!targetId) return;

      setConnectionLists((prev) => {
        const followerItems = prev.followers.items.map((item) => {
          const itemId = item?._id || item?.id || "";
          return itemId === targetId
            ? { ...item, followedByMe: nextFollowed }
            : item;
        });

        let followingItems = prev.following.items.map((item) => {
          const itemId = item?._id || item?.id || "";
          return itemId === targetId
            ? { ...item, followedByMe: nextFollowed }
            : item;
        });

        if (!isVisitorProfile && nextFollowed) {
          const existedInFollowing = followingItems.some((item) => {
            const itemId = item?._id || item?.id || "";
            return itemId === targetId;
          });

          if (!existedInFollowing) {
            followingItems = [
              { ...person, followedByMe: true },
              ...followingItems,
            ];
          }
        }

        const nextState = {
          followers: {
            ...prev.followers,
            items: followerItems,
          },
          following: {
            ...prev.following,
            items: followingItems,
          },
        };

        connectionCacheRef.current.set(
          `${profileUserId}:followers`,
          nextState.followers,
        );
        connectionCacheRef.current.set(
          `${profileUserId}:following`,
          nextState.following,
        );

        return nextState;
      });
    },
    [isVisitorProfile, profileUserId],
  );

  const handleToggleConnectionFollow = useCallback(
    async (person) => {
      const targetId = person?._id || person?.id || "";

      if (
        !targetId ||
        targetId === user?.id ||
        connectionsFollowBusyId === targetId
      ) {
        return;
      }

      const prevFollowed = !!person?.followedByMe;

      try {
        setConnectionsFollowBusyId(targetId);

        const res = prevFollowed
          ? await followApi.unfollow(targetId)
          : await followApi.follow(targetId);

        const nextFollowed =
          typeof res?.data?.followed === "boolean"
            ? res.data.followed
            : !prevFollowed;

        updateConnectionFollowState(person, nextFollowed);
        applyOwnFollowingCountDelta(prevFollowed, nextFollowed);

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
        setConnectionsFollowBusyId("");
      }
    },
    [
      applyOwnFollowingCountDelta,
      connectionsFollowBusyId,
      showToast,
      updateConnectionFollowState,
      user?.id,
    ],
  );

  useEffect(() => {
    setIsConnectionsOpen(false);
    setConnectionsTab("followers");
    setConnectionsDirection(0);
    setConnectionsSearch("");
    setConnectionsError("");
    setConnectionsFollowBusyId("");
  }, [profileUserId]);

  return {
    isConnectionsOpen,
    setIsConnectionsOpen,
    connectionsTab,
    connectionsDirection,
    connectionsSearch,
    setConnectionsSearch,
    connectionsLoading,
    connectionsError,
    connectionsFollowBusyId,
    filteredConnections,
    handleOpenConnections,
    handleChangeConnectionsTab,
    handleToggleConnectionFollow,
  };
}
