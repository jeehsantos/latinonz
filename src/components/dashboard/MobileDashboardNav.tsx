import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  User,
  MessageSquare,
  Tag,
  MoreHorizontal,
  Image as ImageIcon,
  Calendar,
  BarChart2,
  Settings,
  CreditCard,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useCurrentPlan } from "@/lib/dev-plan";
import { can } from "@/lib/plans";

export function MobileDashboardNav({ pendingLeads = 0 }: { pendingLeads?: number }) {
  const { t } = useI18n();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [plan] = useCurrentPlan();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    setOpen(false);
    navigate({ to: "/login" });
  };

  const isActive = (to: string, exact = false) =>
    exact ? path === to : path.startsWith(to);

  const primary = [
    { to: "/dashboard", label: t("dashboard.nav_dashboard"), icon: LayoutDashboard, exact: true },
    { to: "/dashboard/profile", label: t("dashboard.nav_profile"), icon: User },
    { to: "/dashboard/leads", label: t("dashboard.nav_leads"), icon: MessageSquare, badge: pendingLeads },
    { to: "/dashboard/coupons", label: t("dashboard.nav_coupons"), icon: Tag },
  ];

  const more = [
    { to: "/dashboard/gallery", label: t("dashboard.nav_gallery"), icon: ImageIcon },
    ...(can(plan, "events")
      ? [{ to: "/dashboard/events", label: t("dashboard.nav_events"), icon: Calendar }]
      : []),
    { to: "/dashboard/analytics", label: t("dashboard.nav_analytics"), icon: BarChart2 },
    { to: "/dashboard/settings", label: t("dashboard.nav_settings"), icon: Settings },
    { to: "/dashboard/upgrade", label: t("dashboard.upgrade_plan"), icon: CreditCard },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-neutral-900/95 backdrop-blur-md border-t border-white/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {primary.map((it) => {
          const Icon = it.icon;
          const active = isActive(it.to, it.exact);
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className={`relative flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-[10px] font-semibold ${
                  active ? "text-[#df991b]" : "text-neutral-400"
                }`}
              >
                <Icon size={20} />
                <span className="leading-none truncate max-w-[64px]">{it.label}</span>
                {it.badge ? (
                  <span className="absolute top-1 right-1/4 bg-[#df991b] text-black text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                    {it.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
        <li>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="w-full flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-[10px] font-semibold text-neutral-400"
              >
                <MoreHorizontal size={20} />
                <span className="leading-none">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-neutral-950 border-white/10 text-white rounded-t-3xl">
              <SheetHeader>
                <SheetTitle className="text-white">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {more.map((it) => {
                  const Icon = it.icon;
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      onClick={() => setOpen(false)}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-neutral-900 border border-white/10 hover:border-[#df991b]/60 text-neutral-200"
                    >
                      <Icon size={22} className="text-[#df991b]" />
                      <span className="text-xs font-semibold text-center leading-tight">{it.label}</span>
                    </Link>
                  );
                })}
                <button
                  onClick={handleSignOut}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-neutral-900 border border-white/10 hover:border-red-400/60 text-neutral-200"
                >
                  <LogOut size={22} className="text-red-400" />
                  <span className="text-xs font-semibold text-center leading-tight">
                    {t("dashboard.sign_out")}
                  </span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
