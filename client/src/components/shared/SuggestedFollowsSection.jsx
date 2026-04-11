import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Plus, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { followApi } from "../../api/follow.api";
import { useToast } from "../../toast/useToast";

const DISPLAY_LIMIT = 5;

function getUserId(user) {
  return user?._id || user?.id || "";
}

function getAvatarUrl(user) {
  return (
    user?.avatarUrl ||
    user?.avatar ||
    user?.profile?.avatarUrl ||
    user?.profile?.avatar ||
    ""
  );
}

function SuggestedRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-11 w-11 animate-pulse rounded-full bg-zinc-200" />
        <div className="min-w-0 space-y-2">
          <div className="h-3.5 w-28 animate-pulse rounded-full bg-zinc-200" />
          <div className="h-3 w-36 animate-pulse rounded-full bg-zinc-100" />
        </div>
      </div>

      <div className="h-9 w-9 animate-pulse rounded-full bg-zinc-100" />
    </div>
  );
}

function SuggestedRow({
  person,
  busy = false,
  onToggleFollow = () => {},
  emailUnavailableLabel,
}) {
  const avatarUrl = getAvatarUrl(person);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={person?.name || "Traveler"}
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-[15px] font-semibold text-white">
            {(person?.name || "T").charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium text-zinc-800">
            {person?.name || "Traveler"}
          </p>
          <p className="truncate text-[12px] text-zinc-400">
            {person?.email || emailUnavailableLabel}
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => onToggleFollow(person)}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
          person?.followedByMe
            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            : "bg-blue-50 text-[#4f7cff] hover:bg-blue-100"
        } ${busy ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
      >
        {person?.followedByMe ? (
          <Check className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export default function SuggestedFollowsSection() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followBusyId, setFollowBusyId] = useState("");
  const [displayItems, setDisplayItems] = useState([]);

  const loadSuggestions = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await followApi.listSuggestions({ limit: DISPLAY_LIMIT });
      setDisplayItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch {
      setDisplayItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSuggestions();
  }, [loadSuggestions]);

  const refreshSuggestions = useCallback(() => {
    void loadSuggestions({ silent: true });
  }, [loadSuggestions]);

  const handleToggleFollow = useCallback(
    async (person) => {
      const targetId = getUserId(person);
      if (!targetId || followBusyId) return;

      const nextFollowed = !person?.followedByMe;

      try {
        setFollowBusyId(targetId);

        if (nextFollowed) {
          await followApi.follow(targetId);
          showToast(
            t("suggested.followed", {
              name: person?.name || "Traveler",
            }),
            "success",
          );
          setDisplayItems((prev) =>
            prev.map((item) =>
              getUserId(item) === targetId
                ? { ...item, followedByMe: true }
                : item,
            ),
          );
        } else {
          await followApi.unfollow(targetId);
          showToast(
            t("suggested.unfollowed", {
              name: person?.name || "Traveler",
            }),
            "info",
          );
          setDisplayItems((prev) =>
            prev.map((item) =>
              getUserId(item) === targetId
                ? { ...item, followedByMe: false }
                : item,
            ),
          );
        }
      } catch (error) {
        showToast(
          error?.response?.data?.message || t("suggested.followError"),
          "error",
        );
      } finally {
        setFollowBusyId("");
      }
    },
    [followBusyId, showToast, t],
  );

  const rows = useMemo(() => {
    if (loading) {
      return Array.from({ length: DISPLAY_LIMIT }).map((_, index) => (
        <SuggestedRowSkeleton key={`suggestion-skeleton-${index}`} />
      ));
    }

    if (!displayItems.length) {
      return (
        <div className="flex h-full items-center justify-center text-center text-[13px] text-zinc-400">
          {t("suggested.empty")}
        </div>
      );
    }

    return displayItems.map((person) => (
      <SuggestedRow
        key={person._id}
        person={person}
        busy={followBusyId === person._id}
        onToggleFollow={handleToggleFollow}
        emailUnavailableLabel={t("sidebar.emailUnavailable")}
      />
    ));
  }, [displayItems, followBusyId, handleToggleFollow, loading, t]);

  return (
    <div className="rounded-[24px] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] p-[1px] shadow-[0_18px_36px_rgba(102,126,234,0.24)]">
      <div className="theme-card rounded-[23px] bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              {t("suggested.eyebrow")}
            </p>
            <h4 className="mt-1 text-[18px] font-semibold text-zinc-900">
              {t("suggested.title")}
            </h4>
          </div>
          <button
            type="button"
            onClick={refreshSuggestions}
            disabled={refreshing}
            className={`inline-flex items-center gap-1.5 text-[13px] font-medium text-[#4f7cff] ${
              refreshing ? "cursor-not-allowed opacity-70" : "cursor-pointer"
            }`}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>{t("suggested.refresh")}</span>
          </button>
        </div>

        <div className="mt-4 flex h-[308px] flex-col space-y-4 overflow-hidden">
          {rows}
        </div>
      </div>
    </div>
  );
}
