import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Search, Users } from "lucide-react";
import { listWaitlist } from "@/lib/waitlist.functions";

export const Route = createFileRoute("/admin/waitlist")({
  component: AdminWaitlistPage,
});

type Row = {
  id: string;
  business_name: string;
  owner_name: string;
  email: string;
  whatsapp_number: string;
  service_category: string;
  created_at: string;
};

function AdminWaitlistPage() {
  const fetchList = useServerFn(listWaitlist);
  const [query, setQuery] = useState("");

  const { data: res, isLoading: loading, error: queryError } = useQuery({
    queryKey: ["admin", "waitlist"],
    queryFn: () => fetchList(),
  });

  const rows = (res?.ok ? res.rows : []) as Row[];
  const error = res && !res.ok ? res.error : queryError?.message ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.business_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.owner_name.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const exportCsv = () => {
    const header = ["Negócio", "Responsável", "WhatsApp", "E-mail", "Categoria", "Data"];
    const lines = [header.join(",")].concat(
      filtered.map((r) =>
        [
          r.business_name,
          r.owner_name,
          r.whatsapp_number,
          r.email,
          r.service_category,
          new Date(r.created_at).toISOString(),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `latinonz-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Lista de espera</h1>
          <p className="text-neutral-400 mt-1">Empresas registradas antes do lançamento.</p>
        </div>
        <div className="bg-neutral-900 px-4 py-3 rounded-xl border border-white/10 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Users size={18} className="text-[#facc15]" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-bold uppercase">Total</p>
            <p className="text-xl font-black text-white">{rows.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-neutral-950">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-2.5 text-neutral-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-sm outline-none focus:border-[#facc15]"
            />
          </div>
          <button
            onClick={exportCsv}
            className="text-sm font-semibold text-[#facc15] bg-[#EBF4ED] border border-[#facc15]/20 px-3 py-1.5 rounded-lg hover:bg-[#facc15]/10 flex items-center gap-2"
          >
            <Download size={16} /> Exportar CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-900 text-neutral-400 text-xs uppercase tracking-wider border-b border-white/10">
                <th className="p-4 font-bold">Negócio</th>
                <th className="p-4 font-bold">Responsável</th>
                <th className="p-4 font-bold">WhatsApp</th>
                <th className="p-4 font-bold">E-mail</th>
                <th className="p-4 font-bold">Categoria</th>
                <th className="p-4 font-bold">Data</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    <Loader2 size={16} className="animate-spin inline mr-2" /> Carregando...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-red-600 font-semibold">
                    {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    Nenhum registro.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-950">
                    <td className="p-4 font-bold text-white">{r.business_name}</td>
                    <td className="p-4 text-neutral-300">{r.owner_name}</td>
                    <td className="p-4 text-neutral-300 font-medium">{r.whatsapp_number}</td>
                    <td className="p-4 text-neutral-400">{r.email}</td>
                    <td className="p-4 text-neutral-400">{r.service_category}</td>
                    <td className="p-4 text-neutral-500 text-xs">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
