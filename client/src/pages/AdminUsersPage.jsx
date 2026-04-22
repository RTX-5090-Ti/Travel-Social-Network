import { useEffect, useState } from "react";
import { Power, Search, Shield, UserRound } from "lucide-react";

import { adminApi } from "../api/admin.api";
import { useToast } from "../toast/useToast";
import { useAuth } from "../auth/useAuth";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState({ items: [], page: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyUserId, setBusyUserId] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await adminApi.listUsers({
          search: query,
          page: 1,
          limit: 12,
        });

        if (!alive) return;
        setData({
          items: Array.isArray(res.data?.items) ? res.data.items : [],
          page: res.data?.page || null,
        });
      } catch (err) {
        if (!alive) return;
        setError(err?.response?.data?.message || "Unable to load users.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [query]);

  function handleSubmit(event) {
    event.preventDefault();
    setQuery(search.trim());
  }

  async function handleToggleUserState(item) {
    if (!item?._id || busyUserId) return;

    try {
      setBusyUserId(item._id);
      const nextIsActive = !item.isActive;
      const res = await adminApi.updateUserState(item._id, {
        isActive: nextIsActive,
      });

      const nextUser = res.data?.user;

      setData((prev) => ({
        ...prev,
        items: prev.items.map((current) =>
          current._id === item._id
            ? {
                ...current,
                ...nextUser,
              }
            : current,
        ),
      }));

      showToast(
        res.data?.message ||
          (nextIsActive
            ? "User reactivated successfully."
            : "User deactivated successfully."),
        "success",
      );
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Unable to update this user right now.",
        "error",
      );
    } finally {
      setBusyUserId("");
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Admin users
          </p>
          <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-zinc-900">
            User management
          </h2>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="theme-card mt-6 flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/88 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 backdrop-blur sm:flex-row sm:items-center"
      >
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email..."
            className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm text-zinc-900 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
          />
        </div>

        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(102,126,234,0.22)] transition hover:-translate-y-0.5"
        >
          Search
        </button>
      </form>

      {error ? (
        <div className="mt-6 rounded-[24px] border border-red-200 bg-red-50/90 px-4 py-4 text-sm text-red-600">
          <p className="font-semibold">Unable to load users</p>
          <p className="mt-1 text-red-500/90">{error}</p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`user-skeleton-${index}`}
                className="theme-card h-[132px] animate-pulse rounded-[28px] border border-white/70 bg-white/88 p-5"
              />
            ))
          : data.items.map((item) => (
              <article
                key={item._id}
                className="theme-card rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 backdrop-blur"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-base font-semibold text-white shadow-[0_12px_24px_rgba(102,126,234,0.24)]">
                    {item?.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt={item.name || "User avatar"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (item?.name || "U").slice(0, 1).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-zinc-900">
                        {item?.name || "Unknown user"}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          item?.role === "admin"
                            ? "bg-slate-900 text-white"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {item?.role || "user"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-zinc-500">
                      {item?.email || "Email unavailable"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          item?.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        <UserRound className="h-3.5 w-3.5" />
                        {item?.isActive ? "Active" : "Inactive"}
                      </span>
                      {item?.scheduledDeletionAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-medium text-rose-700">
                          <Shield className="h-3.5 w-3.5" />
                          Pending deletion
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleUserState(item)}
                        disabled={busyUserId === item._id || user?._id === item._id}
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${
                          item?.isActive
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <Power className="h-4 w-4" />
                        {busyUserId === item._id
                          ? "Updating..."
                          : item?.isActive
                            ? "Deactivate"
                            : "Reactivate"}
                      </button>

                      {user?._id === item._id ? (
                        <span className="inline-flex h-10 items-center rounded-2xl bg-zinc-100 px-3 text-xs font-medium text-zinc-500">
                          Your account
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            ))}
      </div>

      {!loading && !data.items.length ? (
        <div className="theme-card mt-6 rounded-[28px] border border-dashed border-zinc-200 bg-[linear-gradient(180deg,#ffffff,#fbfbff)] px-5 py-12 text-center shadow-[0_16px_34px_rgba(15,23,42,0.04)]">
          <h3 className="text-lg font-semibold text-zinc-900">No users found</h3>
          <p className="mt-2 text-sm text-zinc-500">
            Try a different keyword or clear the search box.
          </p>
        </div>
      ) : null}

      {data.page ? (
        <p className="mt-6 text-sm text-zinc-500">
          Showing {data.items.length} user(s) on page {data.page.page} of{" "}
          {data.page.totalPages}.
        </p>
      ) : null}
    </section>
  );
}
