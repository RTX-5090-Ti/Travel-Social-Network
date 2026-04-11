import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { userApi } from "../../../api/user.api";
import { MicIcon, SearchIcon } from "../page/feed.icons";

function getAvatarUrl(user) {
  return user?.avatarUrl || user?.avatar || "";
}

function getUserId(user) {
  return user?._id || user?.id || "";
}

export default function SearchBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        const res = await userApi.search({ q: trimmedQuery, limit: 6 });
        if (cancelled) return;
        setResults(Array.isArray(res.data?.items) ? res.data.items : []);
        setOpen(true);
      } catch {
        if (cancelled) return;
        setResults([]);
        setOpen(true);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectUser(user) {
    const userId = getUserId(user);
    if (!userId) return;

    setOpen(false);
    setQuery("");
    setResults([]);
    inputRef.current?.blur();
    navigate(`/profile/${userId}`, {
      state: {
        profileUser: user,
      },
    });
  }

  const shouldShowDropdown = open && query.trim().length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex h-[46px] items-center gap-2.5 rounded-[14px] bg-white px-3 shadow-[0_6px_14px_rgba(15,23,42,0.035)] ring-1 ring-zinc-200/70 dark:bg-white/5 dark:ring-white/10 sm:h-[58px] sm:gap-3 sm:rounded-[18px] sm:px-4 sm:shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
        <SearchIcon className="w-4 h-4 text-zinc-400 sm:h-5 sm:w-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (query.trim()) {
              setOpen(true);
            }
          }}
          placeholder={t("search.placeholder")}
          className="h-full flex-1 bg-transparent text-[13px] text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500 sm:text-[14px]"
        />
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15 dark:hover:text-white sm:h-10 sm:w-10"
        >
          <MicIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      {shouldShowDropdown ? (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-40 overflow-hidden rounded-[22px] border border-white/80 bg-white/96 shadow-[0_18px_40px_rgba(15,23,42,0.14)] ring-1 ring-zinc-200/70 backdrop-blur dark:border-white/10 dark:bg-slate-900/96 dark:ring-white/10">
          {loading ? (
            <div className="px-4 py-4 text-sm text-zinc-500 dark:text-zinc-300">
              {t("search.loadingUsers")}
            </div>
          ) : results.length ? (
            <div className="max-h-[320px] overflow-y-auto py-2">
              {results.map((user) => {
                const avatarUrl = getAvatarUrl(user);
                const userId = getUserId(user);

                return (
                  <button
                    key={userId}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-50 dark:hover:bg-white/5"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={user?.name || "Traveler"}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-[15px] font-semibold text-white">
                        {(user?.name || "T").charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-zinc-800 dark:text-zinc-100">
                        {user?.name || "Traveler"}
                      </p>
                      <p className="truncate text-[12px] text-zinc-400 dark:text-zinc-400">
                        {user?.email || t("search.emailUnavailable")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-zinc-500 dark:text-zinc-300">
              {t("search.emptyUsers")}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
