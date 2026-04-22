import { useEffect, useState } from "react";
import { ArchiveRestore, EyeOff, Search, Trash2, Users, Waypoints } from "lucide-react";

import { adminApi } from "../api/admin.api";
import { useToast } from "../toast/useToast";

const privacyOptions = [
  { value: "", label: "All visible trips" },
  { value: "public", label: "Public" },
  { value: "followers", label: "Followers" },
  { value: "private", label: "Private" },
  { value: "trashed", label: "Trashed" },
];

export default function AdminTripsPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [privacy, setPrivacy] = useState("");
  const [data, setData] = useState({ items: [], page: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyTripId, setBusyTripId] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await adminApi.listTrips({
          search: query,
          privacy,
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
        setError(err?.response?.data?.message || "Unable to load trips.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [privacy, query]);

  function handleSubmit(event) {
    event.preventDefault();
    setQuery(search.trim());
  }

  async function handleToggleTripState(item) {
    if (!item?._id || busyTripId) return;

    try {
      setBusyTripId(item._id);
      const nextTrashed = !item.deletedAt;
      const res = await adminApi.updateTripState(item._id, {
        trashed: nextTrashed,
      });
      const nextTrip = res.data?.trip;

      setData((prev) => ({
        ...prev,
        items: prev.items.map((current) =>
          current._id === item._id
            ? {
                ...current,
                ...nextTrip,
              }
            : current,
        ),
      }));

      showToast(
        res.data?.message ||
          (nextTrashed
            ? "Trip moved to trash successfully."
            : "Trip restored successfully."),
        "success",
      );
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Unable to update this trip right now.",
        "error",
      );
    } finally {
      setBusyTripId("");
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Admin trips
          </p>
          <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-zinc-900">
            Trip moderation
          </h2>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="theme-card mt-6 grid gap-3 rounded-[28px] border border-white/70 bg-white/88 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 backdrop-blur lg:grid-cols-[minmax(0,1fr)_240px_auto]"
      >
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by trip title or caption..."
            className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm text-zinc-900 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
          />
        </div>

        <select
          value={privacy}
          onChange={(event) => setPrivacy(event.target.value)}
          className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
        >
          {privacyOptions.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(102,126,234,0.22)] transition hover:-translate-y-0.5"
        >
          Search
        </button>
      </form>

      {error ? (
        <div className="mt-6 rounded-[24px] border border-red-200 bg-red-50/90 px-4 py-4 text-sm text-red-600">
          <p className="font-semibold">Unable to load trips</p>
          <p className="mt-1 text-red-500/90">{error}</p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`trip-skeleton-${index}`}
                className="theme-card h-[168px] animate-pulse rounded-[28px] border border-white/70 bg-white/88 p-5"
              />
            ))
          : data.items.map((item) => (
              <article
                key={item._id}
                className="theme-card rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 backdrop-blur"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-zinc-900">
                        {item?.title || "Untitled trip"}
                      </h3>
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                        {item?.privacy || "public"}
                      </span>
                      {item?.deletedAt ? (
                        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                          trashed
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
                      {item?.caption || "No caption available for this trip."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700">
                        <Waypoints className="h-3.5 w-3.5" />
                        {item?.counts?.reactions || 0} reactions
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700">
                        <Users className="h-3.5 w-3.5" />
                        {item?.counts?.comments || 0} comments
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700">
                        <EyeOff className="h-3.5 w-3.5" />
                        {item?.feedPreview?.milestoneCount || 0} milestones
                      </span>
                    </div>
                  </div>

                  <div className="min-w-[160px] rounded-[24px] bg-zinc-50 px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
                      Owner
                    </p>
                    <p className="mt-2 truncate text-sm font-semibold text-zinc-900">
                      {item?.ownerId?.name || "Unknown owner"}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {item?.ownerId?.email || "Email unavailable"}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleToggleTripState(item)}
                      disabled={busyTripId === item._id}
                      className={`mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${
                        item?.deletedAt
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {item?.deletedAt ? (
                        <ArchiveRestore className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {busyTripId === item._id
                        ? "Updating..."
                        : item?.deletedAt
                          ? "Restore"
                          : "Move to trash"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
      </div>

      {!loading && !data.items.length ? (
        <div className="theme-card mt-6 rounded-[28px] border border-dashed border-zinc-200 bg-[linear-gradient(180deg,#ffffff,#fbfbff)] px-5 py-12 text-center shadow-[0_16px_34px_rgba(15,23,42,0.04)]">
          <h3 className="text-lg font-semibold text-zinc-900">No trips found</h3>
          <p className="mt-2 text-sm text-zinc-500">
            Try another keyword or switch the privacy filter.
          </p>
        </div>
      ) : null}

      {data.page ? (
        <p className="mt-6 text-sm text-zinc-500">
          Showing {data.items.length} trip(s) on page {data.page.page} of{" "}
          {data.page.totalPages}.
        </p>
      ) : null}
    </section>
  );
}
