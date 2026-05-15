import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart2, CreditCard, Image as ImageIcon, LayoutDashboard,
  MessageSquare, MoreVertical, Settings, Tag, User, X,
} from "lucide-react";
import { useCurrentPlan } from "./PlanContext";
import { PLAN_LABELS, type PlanTier } from "@/lib/plans";
import logo from "@/assets/logo.png";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/profile", label: "Meu Perfil", icon: User },
  { to: "/dashboard/gallery", label: "Galeria", icon: ImageIcon },
  { to: "/dashboard/leads", label: "Leads", icon: MessageSquare, badge: 3 },
  { to: "/dashboard/coupons", label: "Cupons", icon: Tag },
  { to: "/dashboard/analytics", label: "Análises", icon: BarChart2 },
  { to: "/dashboard/settings", label: "Configurações", icon: Settings },
] as const;

const MOBILE = [NAV[0], NAV[1], NAV[3], NAV[4]] as const;

export function DashboardLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { plan, setPlan } = useCurrentPlan();
  const [open, setOpen] = useState(false);

  const isActive = (to: string, exact?: boolean) => (exact ? path === to : path === to || path.startsWith(`${to}/`));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 h-16 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Latino Connect" className="h-9 w-auto" />
            <span className="text-gray-400 text-xs font-medium border-l border-gray-200 pl-2 hidden sm:inline">Portal</span>
          </Link>

          <div className="flex items-center gap-3">
            <DevPlanSwitcher plan={plan} onChange={setPlan} />
            <div className="w-10 h-10 bg-[#EBF4ED] rounded-full flex items-center justify-center text-[#1A5336] font-bold border border-[#1A5336]/20 shrink-0">
              TC
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        <aside className="hidden md:flex flex-col w-64 bg-[#0B2C1A] text-emerald-100/70 fixed left-0 top-16 bottom-0 z-30 overflow-y-auto">
          <div className="p-4 flex-1 space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to, item.exact);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    active ? "bg-[#1A5336] text-white font-bold" : "hover:bg-[#1A5336]/50 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={active ? "text-white" : "text-emerald-100/50"} />
                    {item.label}
                  </div>
                  {"badge" in item && item.badge && (
                    <span className="bg-[#EFC64E] text-[#0B2C1A] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
          <div className="p-4 border-t border-white/10">
            <Link
              to="/dashboard/upgrade"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive("/dashboard/upgrade")
                  ? "bg-[#EFC64E] text-gray-900 font-bold"
                  : "bg-white/5 text-[#EFC64E] hover:bg-white/10 border border-white/10 font-semibold"
              }`}
            >
              <CreditCard size={20} /> Mudar de Plano
            </Link>
          </div>
        </aside>

        <main className="flex-1 md:ml-64 pb-24 md:pb-0">
          <div className="bg-white border-b border-gray-200 p-4 sticky top-16 z-20 shadow-sm">
            <div className="max-w-6xl mx-auto px-1 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Bem-vindo de volta, Tacos do Chef</h2>
                <div className="flex items-center gap-2 text-xs mt-0.5">
                  <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${
                    plan === "starter" ? "bg-gray-100 text-gray-600 border-gray-200"
                      : plan === "premium" ? "bg-[#EFC64E]/20 text-[#8a6a16] border-[#EFC64E]/30"
                      : "bg-[#1A5336] text-white border-[#1A5336]"
                  }`}>
                    Plano {PLAN_LABELS[plan]}
                  </span>
                  <span className="text-gray-400 hidden sm:inline">Último acesso: hoje</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-8 max-w-6xl mx-auto animate-in fade-in duration-300">
            <Outlet />
          </div>
        </main>
      </div>

      {/* mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 flex justify-around p-2 shadow-[0_-4px_20px_rgb(0,0,0,0.05)]">
        {MOBILE.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center p-2 min-w-[64px] ${active ? "text-[#1A5336]" : "text-gray-500"}`}
            >
              <div className="relative">
                <Icon size={22} />
                {"badge" in item && item.badge && (
                  <span className="absolute -top-1 -right-2 bg-[#EFC64E] text-[#0B2C1A] w-4 h-4 rounded-full border border-white flex items-center justify-center text-[8px] font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-1">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col items-center justify-center p-2 min-w-[64px] text-gray-500"
        >
          <MoreVertical size={22} />
          <span className="text-[10px] font-medium mt-1">Mais</span>
        </button>
      </nav>

      {open && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setOpen(false)}>
          <div className="w-72 bg-[#0B2C1A] h-full p-4 flex flex-col text-emerald-100/80 animate-in slide-in-from-right" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 text-white">
              <span className="font-bold">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Fechar"><X size={22} /></button>
            </div>
            <div className="flex-1 space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to, item.exact);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${active ? "bg-[#1A5336] text-white" : ""}`}
                  >
                    <Icon size={20} /> {item.label}
                  </Link>
                );
              })}
            </div>
            <Link
              to="/dashboard/upgrade"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#EFC64E] text-gray-900 font-bold mt-auto"
            >
              <CreditCard size={20} /> Mudar de Plano
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function DevPlanSwitcher({ plan, onChange }: { plan: PlanTier; onChange: (p: PlanTier) => void }) {
  return (
    <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-full p-1 text-xs font-bold">
      <span className="text-gray-400 px-2">DEV</span>
      {(["starter", "premium", "ultra"] as PlanTier[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1 rounded-full transition-colors ${
            plan === p ? "bg-white shadow-sm text-[#1A5336]" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          {PLAN_LABELS[p]}
        </button>
      ))}
    </div>
  );
}
