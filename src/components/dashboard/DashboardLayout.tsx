import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, Image as ImageIcon, Inbox, Ticket, BarChart3,
  Settings, Sparkles, Menu, X,
} from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { useCurrentPlan } from "@/lib/dev-plan";
import { PLAN_LABELS, type PlanTier } from "@/lib/plans";
import { PlanBadge } from "@/components/PlanBadge";

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/profile", label: "Perfil do negócio", icon: Building2 },
  { to: "/dashboard/gallery", label: "Galeria", icon: ImageIcon },
  { to: "/dashboard/leads", label: "Leads", icon: Inbox },
  { to: "/dashboard/coupons", label: "Cupons", icon: Ticket },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/settings", label: "Configurações", icon: Settings },
] as const;

export function DashboardLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [plan, setPlan] = useCurrentPlan();
  const showDevSwitch = typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("dev") === "1";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Latino Connect" className="h-10 w-auto" />
          </Link>
          <button className="lg:hidden text-gray-500" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="px-3 space-y-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  active ? "bg-[#1A5336] text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={16} /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 mt-6">
          <div className="rounded-2xl bg-gradient-to-br from-[#1A5336] to-[#0F3D24] text-white p-5">
            <Sparkles size={18} />
            <p className="font-bold mt-2 text-sm">Plano atual</p>
            <p className="text-xs text-white/70">{PLAN_LABELS[plan]}</p>
            <Link
              to="/dashboard/upgrade"
              className="mt-3 block text-center bg-white text-[#1A5336] font-bold text-xs rounded-lg py-2"
            >
              Ver planos
            </Link>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-20">
          <button className="lg:hidden text-gray-700" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <PlanBadge plan={plan} />
            {showDevSwitch && (
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as PlanTier)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-amber-50"
                title="Dev plan switcher (?dev=1)"
              >
                <option value="starter">Starter</option>
                <option value="premium">Premium</option>
                <option value="ultra">Ultra</option>
              </select>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-gray-900">Tacos do Chef</p>
              <p className="text-xs text-gray-500">Auckland</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#1A5336] text-white font-bold flex items-center justify-center">
              T
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
