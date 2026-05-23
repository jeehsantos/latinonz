import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Inbox, Star, MousePointerClick } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { useI18n } from "@/lib/i18n";
import { getMyBusiness } from "@/lib/business.functions";
import { getAnalytics } from "@/lib/analytics.functions";
import { getMyLeads } from "@/lib/leads.functions";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard/")({
  loader: async () => {
    const [bizRes, analyticsRes, leadsRes] = await Promise.all([
      getMyBusiness(),
      getAnalytics(),
      getMyLeads(),
    ]);
    return {
      business: bizRes?.ok ? bizRes.business : null,
      analytics: analyticsRes?.ok ? analyticsRes : null,
      leads: leadsRes?.ok ? leadsRes.leads : [],
    };
  },
  component: DashboardOverview,
});

function DashboardOverview() {
  const { t } = useI18n();
  const { business, analytics, leads } = Route.useLoaderData();

  const businessName = business?.name ?? "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900">
          {t("dashboard.greeting")}{businessName ? `, ${businessName}` : ""} 👋
        </h1>
        <p className="text-gray-500 mt-1">{t("dashboard.overview_subtitle")}</p>
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

      <div className="bg-white border border-gray-200 rounded-3xl p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-gray-900">{t("dashboard.recent_leads_title")}</h2>
          <Link to="/dashboard/leads" className="text-sm font-bold text-[#1A5336]">
            {t("dashboard.see_all_leads")}
          </Link>
        </div>
        <div className="mt-4 divide-y divide-gray-100">
          {leads.length === 0 ? (
            <p className="py-4 text-gray-500 text-sm">Nenhum lead recebido ainda.</p>
          ) : (
            leads.slice(0, 3).map((l) => (
              <div key={l.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{l.name}</p>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {l.message ?? "Sem mensagem"}
                  </p>
                </div>
                <span className="text-xs font-bold text-gray-500">
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
