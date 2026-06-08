import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  Users,
  Search,
  Eye,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { getAdminMetrics } from "@/lib/admin.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/")({
  component: AdminMetricsPage,
});

type Range = "today" | "week" | "month" | "year" | "all";

const RANGE_LABELS: Record<Range, string> = {
  today: "Hoje",
  week: "Últimos 7 dias",
  month: "Últimos 30 dias",
  year: "Último ano",
  all: "Todo o período",
};

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
    <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-3xl font-black text-white mt-3">{value}</p>
      {hint && <p className="text-xs text-neutral-500 mt-1">{hint}</p>}
    </div>
  );
}

function AdminMetricsPage() {
  const fetchMetrics = useServerFn(getAdminMetrics);
  const [range, setRange] = useState<Range>("month");
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "metrics", range],
    queryFn: () => fetchMetrics({ data: { range } }),
  });

  const totals = data?.totals ?? {
    businesses: 0,
    activeBusinesses: 0,
    pendingBusinesses: 0,
    blockedBusinesses: 0,
    leads: 0,
    profileViews: 0,
    waitlist: 0,
    searches: 0,
  };
  const planCounts = data?.planCounts ?? { starter: 0, premium: 0, ultra: 0 };
  const monthly = data?.revenue.mrrNzd ?? 0;
  const yearly = data?.revenue.arrNzd ?? 0;
  const total = totals.businesses;
  const paid = (planCounts.premium ?? 0) + (planCounts.ultra ?? 0);
  const free = planCounts.starter ?? 0;

  const byCategory = data?.byCategory ?? [];
  const maxCat = Math.max(1, ...byCategory.map((c) => c.count));
  const topSearches = data?.topSearches ?? [];
  const maxSearch = Math.max(1, ...topSearches.map((s) => s.count));

  const rangeLabel = RANGE_LABELS[range];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Métricas do site</h1>
          <p className="text-neutral-400 mt-1">
            {isLoading
              ? "Carregando..."
              : `Visão geral da plataforma — ${rangeLabel.toLowerCase()}.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Período
          </span>
          <Select value={range} onValueChange={(v) => setRange(v as Range)}>
            <SelectTrigger className="w-[200px] bg-neutral-900 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Últimos 30 dias</SelectItem>
              <SelectItem value="year">Último ano</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
          {isFetching && !isLoading && (
            <span className="text-xs text-neutral-500">atualizando…</span>
          )}
        </div>
      </div>

      {/* Snapshot metrics (not range-dependent) */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Negócios"
          value={String(total)}
          hint="total cadastrados"
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

      {/* Range-dependent activity metrics */}
      <div>
        <h2 className="text-xs uppercase tracking-wider font-bold text-neutral-400 mb-3">
          Atividade • {rangeLabel}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Leads"
            value={String(totals.leads)}
            hint="contatos recebidos"
            icon={MessageSquare}
            accent="bg-rose-50 text-rose-700"
          />
          <MetricCard
            label="Visualizações"
            value={String(totals.profileViews)}
            hint="perfis visitados"
            icon={Eye}
            accent="bg-sky-50 text-sky-700"
          />
          <MetricCard
            label="Buscas"
            value={String(totals.searches)}
            hint="pesquisas realizadas"
            icon={Search}
            accent="bg-indigo-50 text-indigo-700"
          />
          <MetricCard
            label="Lista de espera"
            value={String(totals.waitlist)}
            hint="novos inscritos"
            icon={UserPlus}
            accent="bg-yellow-50 text-yellow-700"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-white">Negócios por categoria</h2>
            <span className="text-xs text-neutral-500">{byCategory.length} categorias</span>
          </div>
          {byCategory.length === 0 ? (
            <p className="text-sm text-neutral-500 py-6 text-center">
              Nenhum negócio ativo ainda.
            </p>
          ) : (
            <ul className="space-y-3">
              {byCategory.map((row) => {
                const pct = Math.min(100, (row.count / maxCat) * 100);
                return (
                  <li key={row.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-neutral-200">{row.name}</span>
                      <span className="font-bold text-white">{row.count}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#facc15]" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-white">Buscas mais populares</h2>
            <span className="text-xs text-neutral-500">{rangeLabel.toLowerCase()}</span>
          </div>
          {topSearches.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-500">
              <Search size={20} className="mx-auto mb-2 text-gray-400" />
              Nenhuma busca registrada neste período.
            </div>
          ) : (
            <ul className="space-y-3">
              {topSearches.map((row) => {
                const pct = Math.min(100, (row.count / maxSearch) * 100);
                return (
                  <li key={row.term}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-neutral-200 truncate pr-3">
                        {row.term}
                      </span>
                      <span className="font-bold text-white">{row.count}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#df991b]" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Plano Starter (grátis)
          </p>
          <p className="text-2xl font-black mt-2">{planCounts.starter ?? 0}</p>
        </div>
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Plano Premium</p>
          <p className="text-2xl font-black mt-2">{planCounts.premium ?? 0}</p>
          <p className="text-xs text-neutral-500 mt-1">NZ$ 49 / mês</p>
        </div>
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[#facc15]">Plano Ultra</p>
          <p className="text-2xl font-black mt-2">{planCounts.ultra ?? 0}</p>
          <p className="text-xs text-neutral-500 mt-1">NZ$ 99 / mês</p>
        </div>
      </div>
    </div>
  );
}
