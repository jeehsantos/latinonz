import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyLeads, updateLeadStatus } from "@/lib/leads.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/leads")({
  component: LeadsPage,
});

type LeadStatus = "Pendente" | "Contatado" | "Convertido";

type LeadRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  source: string;
  status: LeadStatus;
  created_at: string;
};

function LeadsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fetchLeads = useServerFn(getMyLeads);
  const updateStatusFn = useServerFn(updateLeadStatus);

  const { data } = useQuery({
    queryKey: ["my-leads"],
    queryFn: async () => {
      try {
        return await fetchLeads();
      } catch {
        return null;
      }
    },
    retry: false,
    throwOnError: false,
  });

  const leads: LeadRow[] =
    data && (data as { ok?: boolean }).ok ? ((data as { leads: LeadRow[] }).leads ?? []) : [];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = leads.find((l) => l.id === selectedId) ?? null;

  const mutation = useMutation({
    mutationFn: (vars: { leadId: string; status: LeadStatus }) => updateStatusFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-leads"] });
    },
  });

  const statusStyles: Record<LeadStatus, string> = {
    Pendente: "bg-amber-100 text-amber-700",
    Contatado: "bg-blue-100 text-blue-700",
    Convertido: "bg-emerald-100 text-emerald-700",
  };

  const statusLabels: Record<LeadStatus, string> = {
    Pendente: t("leads.status_pending"),
    Contatado: t("leads.status_contacted"),
    Convertido: t("leads.status_converted"),
  };

  function formatDateTime(iso: string) {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">{t("leads.title")}</h1>
        <p className="text-gray-500 mt-1">{t("leads.subtitle")}</p>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-bold">{t("leads.col_client")}</th>
                <th className="p-4 font-bold">{t("leads.col_source")}</th>
                <th className="p-4 font-bold">{t("leads.col_date")}</th>
                <th className="p-4 font-bold">{t("leads.col_status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((l) => {
                const { date, time } = formatDateTime(l.created_at);
                return (
                  <tr
                    key={l.id}
                    onClick={() => setSelectedId(l.id)}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedId === l.id ? "bg-emerald-50" : ""}`}
                  >
                    <td className="p-4 font-bold text-gray-900">
                      {l.name}
                      <div className="text-xs font-normal text-gray-500">
                        {l.phone ?? l.email ?? ""}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{l.source}</td>
                    <td className="p-4 text-gray-500">
                      {date} {time}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${statusStyles[l.status]}`}
                      >
                        {statusLabels[l.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          {selected ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {selected.source}
              </p>
              <h3 className="font-extrabold text-gray-900 mt-1">{selected.name}</h3>
              <p className="text-sm text-gray-500">{selected.phone ?? selected.email ?? ""}</p>
              <p className="mt-4 text-sm text-gray-700">{selected.message ?? ""}</p>
              <div className="mt-6 flex gap-2">
                <button
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ leadId: selected.id, status: "Contatado" })}
                  className="flex-1 bg-white hover:bg-gray-100 disabled:opacity-50 text-[#facc15] font-bold rounded-xl py-2 text-sm"
                >
                  {t("leads.reply_button")}
                </button>
                <button
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ leadId: selected.id, status: "Convertido" })}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-bold rounded-xl py-2 text-sm"
                >
                  {t("leads.resolve_button")}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">{t("leads.select_hint")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
