import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useCurrentPlan } from "@/lib/dev-plan";
import { can } from "@/lib/plans";
import { LockedFeatureCard } from "@/components/dashboard/LockedFeatureCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Eye, MousePointerClick, Inbox, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getAnalytics } from "@/lib/analytics.functions";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

function formatNumber(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}

function AnalyticsPage() {
  const { t } = useI18n();
  const [plan] = useCurrentPlan();
  const unlocked = can(plan, "analytics");

  const fetchAnalytics = useServerFn(getAnalytics);
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetchAnalytics(),
    enabled: unlocked,
  });

  if (!unlocked) {
    return (
      <LockedFeatureCard
        title={t("analytics.locked_title")}
        description={t("analytics.locked_description")}
        requiredPlan="premium"
      />
    );
  }

  const ok = data && (data as { ok?: boolean }).ok;
  const stats = ok
    ? (data as { views: number; leads: number; contactClicks: number; conversionRate: number })
    : { views: 0, leads: 0, contactClicks: 0, conversionRate: 0 };

  const placeholder = isLoading ? "…" : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">{t("analytics.title")}</h1>
        <p className="text-gray-500 mt-1">{t("analytics.subtitle")}</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("analytics.stat_views")}
          value={ok ? formatNumber(stats.views) : placeholder}
          icon={Eye}
        />
        <StatCard
          label={t("analytics.stat_clicks")}
          value={ok ? formatNumber(stats.contactClicks) : placeholder}
          icon={MousePointerClick}
        />
        <StatCard
          label={t("analytics.stat_leads")}
          value={ok ? formatNumber(stats.leads) : placeholder}
          icon={Inbox}
        />
        <StatCard
          label={t("analytics.stat_conversion")}
          value={ok ? `${stats.conversionRate}%` : placeholder}
          icon={TrendingUp}
        />
      </div>
      <div className="bg-white border border-gray-200 rounded-3xl p-8 h-72 flex items-center justify-center text-sm text-gray-400">
        {t("analytics.chart_placeholder")}
      </div>
    </div>
  );
}
