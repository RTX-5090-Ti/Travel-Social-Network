import { BarChart3, ChevronLeft, LayoutDashboard, MapPinned, Shield, Users } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/useAuth";

const adminNavItems = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview",
  },
  {
    to: "/admin/users",
    label: "Users",
    icon: Users,
    description: "Accounts",
  },
  {
    to: "/admin/trips",
    label: "Trips",
    icon: MapPinned,
    description: "Moderation",
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="theme-page-shell min-h-screen bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] p-0 md:p-4">
      <div className="theme-app-shell mx-auto min-h-screen max-w-[1680px] overflow-hidden bg-[#fafafb] md:min-h-[calc(100vh-2rem)] md:rounded-[34px] md:border md:border-white/60 md:shadow-[0_25px_80px_rgba(30,41,59,0.08)]">
        <div className="grid min-h-screen grid-cols-1 lg:min-h-[calc(100vh-2rem)] lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="theme-sidebar border-b border-zinc-200/80 bg-white/88 px-5 py-5 backdrop-blur lg:border-b-0 lg:border-r lg:px-6 lg:py-7">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#334155)] text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                    Admin Panel
                  </p>
                  <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
                    Travel Social
                  </h1>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-600 transition hover:-translate-y-0.5 hover:bg-zinc-50"
                aria-label="Back to app"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 rounded-[26px] border border-zinc-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,244,245,0.88))] px-4 py-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(102,126,234,0.24)]">
                  {(user?.name || "A").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {user?.name || "Admin"}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {user?.email || "admin@travel-social.local"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-zinc-950 px-3 py-2 text-xs font-medium text-white">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Role: {user?.role || "admin"}</span>
              </div>
            </div>

            <nav className="mt-6 space-y-2">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-[22px] px-4 py-3 transition ${
                      active
                        ? "bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white shadow-[0_14px_28px_rgba(102,126,234,0.22)]"
                        : "text-zinc-600 hover:bg-zinc-100/80"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        active ? "bg-white/14" : "bg-white shadow-[0_8px_18px_rgba(15,23,42,0.05)]"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span
                        className={`block text-xs ${
                          active ? "text-white/75" : "text-zinc-400"
                        }`}
                      >
                        {item.description}
                      </span>
                    </span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-8">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-12 w-full items-center justify-center rounded-[18px] border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-50"
              >
                Log out
              </button>
            </div>
          </aside>

          <main className="theme-main-pane min-w-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(250,250,251,0.96))] px-5 py-5 sm:px-7 sm:py-7 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto lg:px-8 xl:px-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
