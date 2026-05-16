import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, DollarSign, TrendingUp, Users, Search } from "lucide-react";
import { BUSINESSES } from "@/lib/mock/businesses";
import { CATEGORIES } from "@/lib/mock/categories";

export const Route = createFileRoute("/admin/")({
  component: AdminMetricsPage,
});

const PLAN_PRICE = { starter: 0, premium: 49, ultra: 99 } as const;

const TOP_SEARCHES = [
  { term: "restaurante brasileiro", count: 1248 },
  { term: "contador latino auckland", count: 982 },
  { term: "dj festa latina", count: 764 },
  { term: "salão de beleza", count: 612 },
  { term: "mecânico português", count: 489 },
  { term: "psicólogo online", count: 421 },
  { term: "imigração visto", count: 387 },
  { term: "comida mexicana wellington", count: 312 },
];

function MetricCard({
  label, value, hint, icon: Icon, accent,
}: { label: string; value: string; hint?: string; icon: typeof Briefcase; accent: string }) {
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
  const total = BUSINESSES.length;
  const paid = BUSINESSES.filter((b) => b.plan !== "starter").length;
  const free = total - paid;
  const monthly = BUSINESSES.reduce((acc, b) => acc + PLAN_PRICE[b.plan], 0);
  const yearly = monthly * 12;

  const byCategory = CATEGORIES.map((c) => ({
    name: c.name,
    count: BUSINESSES.filter((b) => b.macro === c.name).length,
    fallback: c.count,
  }));

  const maxSearch = Math.max(...TOP_SEARCHES.map((s) => s.count));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Métricas do site</h1>
        <p className="text-gray-500 mt-1">Visão geral da plataforma Latino Connect.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Negócios" value={String(total)} hint="cadastrados" icon={Briefcase} accent="bg-emerald-50 text-emerald-700" />
        <MetricCard label="Pagantes" value={String(paid)} hint={`${free} grátis`} icon={Users} accent="bg-blue-50 text-blue-700" />
        <MetricCard label="MRR" value={`NZ$ ${monthly.toLocaleString("pt-BR")}`} hint="receita mensal" icon={DollarSign} accent="bg-amber-50 text-amber-700" />
        <MetricCard label="ARR" value={`NZ$ ${yearly.toLocaleString("pt-BR")}`} hint="receita anual" icon={TrendingUp} accent="bg-purple-50 text-purple-700" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-gray-900">Negócios por categoria</h2>
            <span className="text-xs text-gray-400">{CATEGORIES.length} categorias</span>
          </div>
          <ul className="space-y-3">
            {byCategory.map((row) => {
              const value = row.count || row.fallback;
              const pct = Math.min(100, (value / 150) * 100);
              return (
                <li key={row.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-gray-700">{row.name}</span>
                    <span className="font-bold text-gray-900">{value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1A5336]" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-gray-900">Buscas mais populares</h2>
            <span className="text-xs text-gray-400">últimos 30 dias</span>
          </div>
          <ul className="space-y-3">
            {TOP_SEARCHES.map((s, i) => (
              <li key={s.term} className="flex items-center gap-3">
                <span className="w-6 text-xs font-black text-gray-400">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-gray-700 truncate flex items-center gap-2">
                      <Search size={12} className="text-gray-400" /> {s.term}
                    </span>
                    <span className="font-bold text-gray-900">{s.count.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${(s.count / maxSearch) * 100}%` }} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Plano Starter (grátis)</p>
          <p className="text-2xl font-black mt-2">{BUSINESSES.filter((b) => b.plan === "starter").length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Plano Premium</p>
          <p className="text-2xl font-black mt-2">{BUSINESSES.filter((b) => b.plan === "premium").length}</p>
          <p className="text-xs text-gray-400 mt-1">NZ$ 49 / mês</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[#1A5336]">Plano Ultra</p>
          <p className="text-2xl font-black mt-2">{BUSINESSES.filter((b) => b.plan === "ultra").length}</p>
          <p className="text-xs text-gray-400 mt-1">NZ$ 99 / mês</p>
        </div>
      </div>
    </div>
  );
}
