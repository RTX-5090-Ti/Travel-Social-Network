import { useEffect, useState } from "react";
import { Activity, MessageSquareText, ShieldCheck, UserRound, Waypoints } from "lucide-react";

import { adminApi } from "../api/admin.api";

function StatCard({ title, value, icon: Icon, tone = "violet" }) {
  const tones = {
    violet:
      "from-violet-500/14 to-fuchsia-500/18 text-violet-700 dark:text-violet-300",
    emerald:
      "from-emerald-500/14 to-teal-500/18 text-emerald-700 dark:text-emerald-300",
    amber:
      "from-amber-500/14 to-orange-500/18 text-amber-700 dark:text-amber-300",
    slate:
      "from-slate-500/14 to-slate-700/18 text-slate-700 dark:text-slate-300",
  };

  return (
    <article className="theme-card rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">
            {value}
          </p>
        </div>
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br ${tones[tone]}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </article>
  );
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await adminApi.getDashboard();
        if (!alive) return;
        setData(res.data || null);
      } catch (err) {
        if (!alive) return;
        setError(err?.response?.data?.message || "Unable to load admin dashboard.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const stats = data?.stats || {};

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Admin dashboard
          </p>
          <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-zinc-900">
            Platform overview
          </h2>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-[24px] border border-red-200 bg-red-50/90 px-4 py-4 text-sm text-red-600">
          <p className="font-semibold">Unable to load dashboard</p>
          <p className="mt-1 text-red-500/90">{error}</p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total users"
          value={loading ? "..." : stats.totalUsers || 0}
          icon={UserRound}
          tone="violet"
        />
        <StatCard
          title="Active users"
          value={loading ? "..." : stats.activeUsers || 0}
          icon={ShieldCheck}
          tone="emerald"
        />
        <StatCard
          title="Total trips"
          value={loading ? "..." : stats.totalTrips || 0}
          icon={Waypoints}
          tone="amber"
        />
        <StatCard
          title="Total comments"
          value={loading ? "..." : stats.totalComments || 0}
          icon={MessageSquareText}
          tone="slate"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <article className="theme-card rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 backdrop-blur">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-violet-600" />
            <h3 className="text-lg font-semibold text-zinc-900">Account status</h3>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] bg-zinc-50 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
                Active
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {loading ? "..." : stats.activeUsers || 0}
              </p>
            </div>
            <div className="rounded-[22px] bg-zinc-50 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
                Deactivated
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {loading ? "..." : stats.deactivatedUsers || 0}
              </p>
            </div>
            <div className="rounded-[22px] bg-zinc-50 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
                Pending deletion
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {loading ? "..." : stats.pendingDeletionUsers || 0}
              </p>
            </div>
          </div>
        </article>

        <article className="theme-card rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)] ring-1 ring-zinc-200/60 backdrop-blur">
          <div className="flex items-center gap-3">
            <Waypoints className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-zinc-900">Trip visibility</h3>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-[22px] bg-zinc-50 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
                Public
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {loading ? "..." : stats.publicTrips || 0}
              </p>
            </div>
            <div className="rounded-[22px] bg-zinc-50 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
                Followers
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {loading ? "..." : stats.followerTrips || 0}
              </p>
            </div>
            <div className="rounded-[22px] bg-zinc-50 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
                Private
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {loading ? "..." : stats.privateTrips || 0}
              </p>
            </div>
            <div className="rounded-[22px] bg-zinc-50 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
                Trashed
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {loading ? "..." : stats.trashedTrips || 0}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
