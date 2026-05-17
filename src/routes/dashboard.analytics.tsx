import { createFileRoute } from "@tanstack/react-router";
import { useCurrentPlan } from "@/lib/dev-plan";
import { can } from "@/lib/plans";
import { LockedFeatureCard } from "@/components/dashboard/LockedFeatureCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Eye, MousePointerClick, Inbox, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { t } = useI18n();
  const [plan] = useCurrentPlan();
  if (!can(plan, "analytics")) {
    return (
      <LockedFeatureCard
        title={t("analytics.locked_title")}
        description={t("analytics.locked_description")}
        requiredPlan="premium"
      />
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">{t("analytics.title")}</h1>
        <p className="text-gray-500 mt-1">{t("analytics.subtitle")}</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t("analytics.stat_views")} value="1.284" icon={Eye} />
        <StatCard label={t("analytics.stat_clicks")} value="187" icon={MousePointerClick} />
        <StatCard label={t("analytics.stat_leads")} value="32" icon={Inbox} />
        <StatCard label={t("analytics.stat_conversion")} value="2.5%" icon={TrendingUp} />
      </div>
      <div className="bg-white border border-gray-200 rounded-3xl p-8 h-72 flex items-center justify-center text-sm text-gray-400">
        {t("analytics.chart_placeholder")}
      </div>
    </div>
  );
}
