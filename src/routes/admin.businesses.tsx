import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, CheckCircle2, Lock, Unlock, ExternalLink, Filter } from "lucide-react";
import { BUSINESSES } from "@/lib/mock/businesses";
import { PlanBadge } from "@/components/PlanBadge";

export const Route = createFileRoute("/admin/businesses")({
  component: AdminBusinessesPage,
});

type Status = "approved" | "pending" | "locked";

function AdminBusinessesPage() {
  // Mock approval/lock state — front-end only
  const initial = useMemo<Record<string, Status>>(() => {
    const map: Record<string, Status> = {};
    BUSINESSES.forEach((b, i) => {
      map[b.id] = i % 5 === 0 ? "pending" : i % 7 === 0 ? "locked" : "approved";
    });
    return map;
  }, []);
  const [statuses, setStatuses] = useState<Record<string, Status>>(initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Status | "all">("all");

  const filtered = BUSINESSES.filter((b) => {
    const matchesQuery =
      !query ||
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      b.macro.toLowerCase().includes(query.toLowerCase()) ||
      b.location.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || statuses[b.id] === filter;
    return matchesQuery && matchesFilter;
  });

  const setStatus = (id: string, status: Status) =>
    setStatuses((s) => ({ ...s, [id]: status }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Negócios</h1>
          <p className="text-gray-500 mt-1">Aprove, bloqueie e gerencie os negócios cadastrados.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar nome, categoria, cidade..."
              className="bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-[#1A5336] w-72"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Status | "all")}
              className="bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm outline-none focus:border-[#1A5336]"
            >
              <option value="all">Todos</option>
              <option value="approved">Aprovados</option>
              <option value="pending">Pendentes</option>
              <option value="locked">Bloqueados</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-bold">Negócio</th>
                <th className="p-4 font-bold">Categoria</th>
                <th className="p-4 font-bold">Cidade</th>
                <th className="p-4 font-bold">Plano</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    Nenhum negócio encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const status = statuses[b.id];
                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{b.name}</p>
                        <p className="text-xs text-gray-400">{b.type}</p>
                      </td>
                      <td className="p-4 text-gray-600">{b.macro}</td>
                      <td className="p-4 text-gray-600">{b.location}</td>
                      <td className="p-4"><PlanBadge plan={b.plan} /></td>
                      <td className="p-4">
                        {status === "approved" && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={12} /> Aprovado
                          </span>
                        )}
                        {status === "pending" && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            Pendente
                          </span>
                        )}
                        {status === "locked" && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <Lock size={12} /> Bloqueado
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {status !== "approved" && (
                            <button
                              onClick={() => setStatus(b.id, "approved")}
                              className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                            >
                              <CheckCircle2 size={12} /> Aprovar
                            </button>
                          )}
                          {status !== "locked" ? (
                            <button
                              onClick={() => setStatus(b.id, "locked")}
                              className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                            >
                              <Lock size={12} /> Bloquear
                            </button>
                          ) : (
                            <button
                              onClick={() => setStatus(b.id, "approved")}
                              className="text-xs font-bold text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                            >
                              <Unlock size={12} /> Desbloquear
                            </button>
                          )}
                          <a
                            href={`/business/${b.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-gray-500 hover:text-gray-900 inline-flex items-center gap-1 px-2 py-1.5"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
