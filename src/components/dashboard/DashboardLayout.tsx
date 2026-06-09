import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  User,
  Image as ImageIcon,
  MessageSquare,
  Tag,
  BarChart2,
  Settings,
  CreditCard,
  Menu,
  X,
  Calendar,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import logo from "@/assets/logo.png";
import { useCurrentPlan } from "@/lib/dev-plan";
import { type PlanTier, can } from "@/lib/plans";
import { PlanBadge } from "@/components/PlanBadge";
import { LEADS } from "@/lib/mock/leads";
import { useSidebarColor, darken, lighten } from "@/lib/sidebar-color";
import { useI18n } from "@/lib/i18n";
import { getMyBusiness } from "@/lib/business.functions";
import { supabase } from "@/integrations/supabase/client";
import { MobileDashboardNav } from "./MobileDashboardNav";

export function DashboardLayout() {
  const { t } = useI18n();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hasSession, setHasSession] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setHasSession(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  const fetchMyBusiness = useServerFn(getMyBusiness);
  const { data: myBiz } = useQuery({
    queryKey: ["my-business"],
    queryFn: async () => {
      try {
        return await fetchMyBusiness();
      } catch {
        return null;
      }
    },
    enabled: hasSession,
    staleTime: 30_000,
    retry: false,
    throwOnError: false,
  });
  const business = myBiz?.business;
  const businessName = business?.name ?? "—";
  const businessLocation =
    Array.isArray(business?.locations) && business?.locations.length
      ? String(business.locations[0])
      : "";
  const logoUrl = business?.logo_url ?? null;
  const initial = (businessName || "?").trim().charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/login" });
  };

  const [plan, setPlan] = useCurrentPlan();
  const [sidebarColor] = useSidebarColor();
  const showDevSwitch =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("dev") === "1";

  const pendingLeads = LEADS.filter((l) => l.status === "Pendente").length;

  type NavItem = {
    to: string;
    label: string;
    icon: typeof LayoutDashboard;
    exact?: boolean;
    badge?: number;
  };

  const NAV: NavItem[] = [
    { to: "/dashboard", label: t("dashboard.nav_dashboard"), icon: LayoutDashboard, exact: true },
    { to: "/dashboard/profile", label: t("dashboard.nav_profile"), icon: User },
    { to: "/dashboard/gallery", label: t("dashboard.nav_gallery"), icon: ImageIcon },
    {
      to: "/dashboard/leads",
      label: t("dashboard.nav_leads"),
      icon: MessageSquare,
      badge: pendingLeads,
    },
    { to: "/dashboard/coupons", label: t("dashboard.nav_coupons"), icon: Tag },
    ...(can(plan, "events")
      ? [{ to: "/dashboard/events", label: t("dashboard.nav_events"), icon: Calendar } as NavItem]
      : []),
    { to: "/dashboard/analytics", label: t("dashboard.nav_analytics"), icon: BarChart2 },
    { to: "/dashboard/settings", label: t("dashboard.nav_settings"), icon: Settings },
  ];

  const bg = darken(sidebarColor, 0.45);
  const activeBg = sidebarColor;
  const hoverBg = darken(sidebarColor, 0.25);
  const borderCol = darken(sidebarColor, 0.6);
  const mutedText = lighten(sidebarColor, 0.55);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col overflow-x-hidden">

      <header className="bg-neutral-900 border-b border-white/10 px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4 sticky top-0 z-30">
        <button className="lg:hidden text-neutral-200" onClick={() => setMobileOpen(true)} aria-label="Menu">
          <Menu size={20} />
        </button>
        <Link to="/" className="flex items-center shrink-0">
          <img src={logo} alt="Latino Connect" className="h-8 sm:h-10 w-auto" />
        </Link>
        <div className="hidden sm:flex items-center gap-3 ml-2">
          <PlanBadge plan={plan} />
          {showDevSwitch && (
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as PlanTier)}
              className="text-xs border border-white/10 rounded-lg px-2 py-1 bg-amber-50"
              title="Dev plan switcher (?dev=1)"
            >
              <option value="starter">Starter</option>
              <option value="premium">Premium</option>
              <option value="ultra">Ultra</option>
            </select>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-white">{businessName}</p>
            {businessLocation && <p className="text-xs text-neutral-400">{businessLocation}</p>}
          </div>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName}
              className="w-9 h-9 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-black text-[#facc15] font-bold flex items-center justify-center">
              {initial}
            </div>
          )}
          <button
            onClick={handleSignOut}
            title={t("dashboard.sign_out")}
            className="hidden sm:flex items-center gap-1.5 text-sm text-neutral-300 hover:text-white border border-white/10 rounded-lg px-2.5 py-1.5 hover:bg-neutral-950 transition"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">{t("dashboard.sign_out")}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside
          style={{ backgroundColor: bg, borderColor: borderCol }}
          className={`fixed lg:static inset-y-0 left-0 z-40 w-72 border-r flex flex-col transform transition-transform lg:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div
            className="lg:hidden flex items-center justify-between p-4 border-b"
            style={{ borderColor: borderCol }}
          >
            <img
              src={logo}
              alt="Latino Connect"
              className="h-8 w-auto bg-neutral-900 rounded px-2 py-1"
            />
            <button className="text-white/80" onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="px-3 pt-4 space-y-1 flex-1">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = n.exact ? path === n.to : path.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setMobileOpen(false)}
                  style={
                    active ? { backgroundColor: activeBg, color: "#fff" } : { color: mutedText }
                  }
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition ${
                    active ? "font-bold" : "font-medium"
                  }`}
                >
                  <Icon size={18} />
                  <span className="flex-1">{n.label}</span>
                  {n.badge ? (
                    <span className="bg-amber-400 text-[#facc15] text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                      {n.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="p-4">
            <Link
              to="/dashboard/upgrade"
              style={{ backgroundColor: darken(sidebarColor, 0.6), borderColor: borderCol }}
              className="flex items-center gap-3 border rounded-xl px-4 py-3 text-sm font-bold text-amber-300 hover:text-amber-200 transition"
            >
              <CreditCard size={18} />
              <span>{t("dashboard.upgrade_plan")}</span>
            </Link>
          </div>
        </aside>

        {mobileOpen && (
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-10 min-w-0 pb-24 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <MobileDashboardNav pendingLeads={pendingLeads} />
    </div>
  );
}
