import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, DollarSign, TrendingUp, Users, Search } from "lucide-react";
import { getAdminMetrics } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/")({
  component: AdminMetricsPage,
});

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Briefcase;
  accent: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-3xl font-black text-gray-900 mt-3">{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function AdminMetricsPage() {
  const fetchMetrics = useServerFn(getAdminMetrics);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: () => fetchMetrics(),
  });

  const totals = data?.totals ?? {
    businesses: 0,
    activeBusinesses: 0,
    pendingBusinesses: 0,
    blockedBusinesses: 0,
    leads: 0,
    profileViews: 0,
    waitlist: 0,
  };
  const planCounts = data?.planCounts ?? { starter: 0, premium: 0, ultra: 0 };
  const monthly = data?.revenue.mrrNzd ?? 0;
  const yearly = data?.revenue.arrNzd ?? 0;
  const total = totals.businesses;
  const paid = (planCounts.premium ?? 0) + (planCounts.ultra ?? 0);
  const free = planCounts.starter ?? 0;

  const byCategory = data?.byCategory ?? [];
  const maxCat = Math.max(1, ...byCategory.map((c) => c.count));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Métricas do site</h1>
        <p className="text-gray-500 mt-1">
          {isLoading ? "Carregando..." : "Visão geral da plataforma Latino Connect."}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Negócios"
          value={String(total)}
          hint="cadastrados"
          icon={Briefcase}
          accent="bg-emerald-50 text-emerald-700"
        />
        <MetricCard
          label="Pagantes"
          value={String(paid)}
          hint={`${free} grátis`}
          icon={Users}
          accent="bg-blue-50 text-blue-700"
        />
        <MetricCard
          label="MRR"
          value={`NZ$ ${monthly.toLocaleString("pt-BR")}`}
          hint="receita mensal"
          icon={DollarSign}
          accent="bg-amber-50 text-amber-700"
        />
        <MetricCard
          label="ARR"
          value={`NZ$ ${yearly.toLocaleString("pt-BR")}`}
          hint="receita anual"
          icon={TrendingUp}
          accent="bg-purple-50 text-purple-700"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-gray-900">Negócios por categoria</h2>
            <span className="text-xs text-gray-400">{byCategory.length} categorias</span>
          </div>
          {byCategory.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Nenhum negócio ativo ainda.</p>
          ) : (
            <ul className="space-y-3">
              {byCategory.map((row) => {
                const pct = Math.min(100, (row.count / maxCat) * 100);
                return (
                  <li key={row.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-gray-700">{row.name}</span>
                      <span className="font-bold text-gray-900">{row.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#000000]" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-gray-900">Buscas mais populares</h2>
            <span className="text-xs text-gray-400">últimos 30 dias</span>
          </div>
          <div className="py-12 text-center text-sm text-gray-400">
            <Search size={20} className="mx-auto mb-2 text-gray-300" />
            Sem dados de busca ainda.
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Plano Starter (grátis)
          </p>
          <p className="text-2xl font-black mt-2">{planCounts.starter ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Plano Premium</p>
          <p className="text-2xl font-black mt-2">{planCounts.premium ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">NZ$ 49 / mês</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[#000000]">Plano Ultra</p>
          <p className="text-2xl font-black mt-2">{planCounts.ultra ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">NZ$ 99 / mês</p>
        </div>
      </div>
    </div>
  );
}
