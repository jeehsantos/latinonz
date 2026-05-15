import { createFileRoute } from "@tanstack/react-router";
import { useCurrentPlan } from "@/lib/dev-plan";
import { can } from "@/lib/plans";
import { LockedFeatureCard } from "@/components/dashboard/LockedFeatureCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Eye, MousePointerClick, Inbox, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [plan] = useCurrentPlan();
  if (!can(plan, "analytics")) {
    return (
      <LockedFeatureCard
        title="Analytics avançado"
        description="Veja visualizações, cliques de contato, origem dos leads e tendências do seu perfil."
        requiredPlan="premium"
      />
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Performance do seu perfil nos últimos 30 dias.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Visualizações" value="1.284" icon={Eye} />
        <StatCard label="Cliques contato" value="187" icon={MousePointerClick} />
        <StatCard label="Leads" value="32" icon={Inbox} />
        <StatCard label="Conversão" value="2.5%" icon={TrendingUp} />
      </div>
      <div className="bg-white border border-gray-200 rounded-3xl p-8 h-72 flex items-center justify-center text-sm text-gray-400">
        [ Gráfico de visualizações nos próximos releases ]
      </div>
    </div>
  );
}
