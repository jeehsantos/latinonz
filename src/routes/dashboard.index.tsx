import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Eye, Inbox, Star, MousePointerClick } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { useI18n } from "@/lib/i18n";
import { getMyBusiness } from "@/lib/business.functions";
import { getAnalytics } from "@/lib/analytics.functions";
import { getMyLeads } from "@/lib/leads.functions";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  const { t } = useI18n();
  const fetchMyBusiness = useServerFn(getMyBusiness);
  const fetchAnalytics = useServerFn(getAnalytics);
  const fetchMyLeads = useServerFn(getMyLeads);

  const { data: bizRes } = useQuery({
    queryKey: ["my-business"],
    queryFn: async () => {
      try {
        return await fetchMyBusiness();
      } catch {
        return null;
      }
    },
    retry: false,
    throwOnError: false,
  });
  const { data: analyticsRes } = useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: async () => {
      try {
        return await fetchAnalytics();
      } catch {
        return null;
      }
    },
    retry: false,
    throwOnError: false,
  });
  const { data: leadsRes } = useQuery({
    queryKey: ["dashboard-leads"],
    queryFn: async () => {
      try {
        return await fetchMyLeads();
      } catch {
        return null;
      }
    },
    retry: false,
    throwOnError: false,
  });

  const business = bizRes?.ok ? bizRes.business : null;
  const analytics = analyticsRes?.ok ? analyticsRes : null;
  const leads = leadsRes?.ok ? leadsRes.leads : [];
  const businessName = business?.name ?? "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">
          {t("dashboard.greeting")}{businessName ? `, ${businessName}` : ""} 👋
        </h1>
        <p className="text-neutral-400 mt-1">{t("dashboard.overview_subtitle")}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("dashboard.stat_views")}
          value={analytics?.views?.toLocaleString() ?? "0"}
          hint="Últimos 30 dias"
          icon={Eye}
        />
        <StatCard
          label={t("dashboard.stat_leads")}
          value={analytics?.leads?.toString() ?? "0"}
          hint="Últimos 30 dias"
          icon={Inbox}
        />
        <StatCard
          label={t("dashboard.stat_clicks")}
          value={analytics?.contactClicks?.toString() ?? "0"}
          hint="Últimos 30 dias"
          icon={MousePointerClick}
        />
        <StatCard
          label={t("dashboard.stat_rating")}
          value={business?.rating ? business.rating.toFixed(1) : "0.0"}
          hint={`${business?.review_count ?? 0} avaliações`}
          icon={Star}
        />
      </div>

      <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-white">{t("dashboard.recent_leads_title")}</h2>
          <Link to="/dashboard/leads" className="text-sm font-bold text-[#facc15]">
            {t("dashboard.see_all_leads")}
          </Link>
        </div>
        <div className="mt-4 divide-y divide-gray-100">
          {leads.length === 0 ? (
            <p className="py-4 text-neutral-400 text-sm">Nenhum lead recebido ainda.</p>
          ) : (
            leads.slice(0, 3).map((l: { id: string; name: string; message: string | null; created_at: string }) => (
              <div key={l.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{l.name}</p>
                  <p className="text-sm text-neutral-400 line-clamp-1">
                    {l.message ?? "Sem mensagem"}
                  </p>
                </div>
                <span className="text-xs font-bold text-neutral-400">
                  {format(new Date(l.created_at), "dd/MM/yyyy HH:mm")}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
