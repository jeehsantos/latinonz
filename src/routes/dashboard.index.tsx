import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Inbox, Star, MousePointerClick } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { LEADS } from "@/lib/mock/leads";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Olá, Tacos do Chef 👋</h1>
        <p className="text-gray-500 mt-1">Aqui está um resumo do seu desempenho.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Visualizações" value="1.284" hint="+12% vs mês anterior" icon={Eye} />
        <StatCard label="Leads no mês" value="32" hint="3 pendentes" icon={Inbox} />
        <StatCard label="Cliques no contato" value="187" hint="+8% vs mês anterior" icon={MousePointerClick} />
        <StatCard label="Avaliação média" value="4.8" hint="123 avaliações" icon={Star} />
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-gray-900">Leads recentes</h2>
          <Link to="/dashboard/leads" className="text-sm font-bold text-[#1A5336]">Ver todos →</Link>
        </div>
        <div className="mt-4 divide-y divide-gray-100">
          {LEADS.slice(0, 3).map((l) => (
            <div key={l.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{l.name}</p>
                <p className="text-sm text-gray-500 line-clamp-1">{l.msg}</p>
              </div>
              <span className="text-xs font-bold text-gray-500">{l.date} {l.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
