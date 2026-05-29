import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, CheckCircle2, Lock, Unlock, ExternalLink, Filter } from "lucide-react";
import { PlanBadge } from "@/components/PlanBadge";
import {
  getAdminBusinesses,
  approveBusiness,
  lockBusiness,
  unlockBusiness,
  setBusinessPlan,
} from "@/lib/admin.functions";
import type { PlanTier } from "@/lib/plans";

export const Route = createFileRoute("/admin/businesses")({
  component: AdminBusinessesPage,
});

type FilterValue = "all" | "pending" | "active" | "blocked";

function statusOf(b: {
  is_active: boolean;
  is_verified: boolean;
}): "approved" | "pending" | "locked" {
  if (!b.is_active) return "locked";
  if (!b.is_verified) return "pending";
  return "approved";
}

function AdminBusinessesPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [pendingPlans, setPendingPlans] = useState<Record<string, PlanTier>>({});

  const qc = useQueryClient();
  const fetchList = useServerFn(getAdminBusinesses);
  const approveFn = useServerFn(approveBusiness);
  const lockFn = useServerFn(lockBusiness);
  const unlockFn = useServerFn(unlockBusiness);
  const setPlanFn = useServerFn(setBusinessPlan);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "businesses", filter, query],
    queryFn: () => fetchList({ data: { filter, query } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "businesses"] });

  const approveMut = useMutation({
    mutationFn: (businessId: string) => approveFn({ data: { businessId } }),
    onSuccess: invalidate,
  });
  const lockMut = useMutation({
    mutationFn: (businessId: string) => lockFn({ data: { businessId } }),
    onSuccess: invalidate,
  });
  const unlockMut = useMutation({
    mutationFn: (businessId: string) => unlockFn({ data: { businessId } }),
    onSuccess: invalidate,
  });

  const setPlanMut = useMutation({
    mutationFn: ({ businessId, plan }: { businessId: string; plan: PlanTier }) =>
      setPlanFn({ data: { businessId, plan } }),
    onMutate: async ({ businessId, plan }) => {
      setPendingPlans((current) => ({ ...current, [businessId]: plan }));
    },
    onSuccess: (result) => {
      qc.setQueriesData(
        { queryKey: ["admin", "businesses"] },
        (current: typeof data | undefined) => {
          if (!current) return current;
          return {
            ...current,
            businesses: current.businesses.map((business) =>
              business.id === result.businessId
                ? { ...business, plan_tier: result.plan }
                : business,
            ),
          };
        },
      );
      invalidate();
    },
    onSettled: (_result, _error, variables) => {
      setPendingPlans((current) => {
        const next = { ...current };
        delete next[variables.businessId];
        return next;
      });
    },
  });

  const businesses = data?.businesses ?? [];
  const isAdmin = data?.viewerRole === "admin";

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
              className="bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-[#facc15] w-72"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterValue)}
              className="bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm outline-none focus:border-[#facc15]"
            >
              <option value="all">Todos</option>
              <option value="active">Aprovados</option>
              <option value="pending">Pendentes</option>
              <option value="blocked">Bloqueados</option>
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
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    Carregando...
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    Nenhum negócio encontrado.
                  </td>
                </tr>
              ) : (
                businesses.map((b) => {
                  const status = statusOf(b);
                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{b.name}</p>
                        <p className="text-xs text-gray-400">{b.subcategory ?? ""}</p>
                      </td>
                      <td className="p-4 text-gray-600">{b.macro_category}</td>
                      <td className="p-4 text-gray-600">{b.city ?? "—"}</td>
                      <td className="p-4">
                        {isAdmin ? (
                          <select
                            value={pendingPlans[b.id] ?? b.plan_tier}
                            disabled={setPlanMut.isPending && pendingPlans[b.id] !== undefined}
                            onChange={(e) =>
                              setPlanMut.mutate({
                                businessId: b.id,
                                plan: e.target.value as PlanTier,
                              })
                            }
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-[#facc15] disabled:opacity-50"
                            title="Alterar plano do negócio"
                          >
                            <option value="starter">Starter</option>
                            <option value="premium">Premium</option>
                            <option value="ultra">Ultra</option>
                          </select>
                        ) : (
                          <PlanBadge plan={b.plan_tier} />
                        )}
                      </td>

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
                              disabled={approveMut.isPending}
                              onClick={() => approveMut.mutate(b.id)}
                              className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <CheckCircle2 size={12} /> Aprovar
                            </button>
                          )}
                          {status !== "locked" ? (
                            <button
                              disabled={lockMut.isPending}
                              onClick={() => lockMut.mutate(b.id)}
                              className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <Lock size={12} /> Bloquear
                            </button>
                          ) : (
                            <button
                              disabled={unlockMut.isPending}
                              onClick={() => unlockMut.mutate(b.id)}
                              className="text-xs font-bold text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 disabled:opacity-50"
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
