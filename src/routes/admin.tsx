import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Download, ExternalLink, Loader2, Lock, Search, ToggleLeft, ToggleRight, Users } from "lucide-react";
import { listWaitlist } from "@/lib/waitlist.functions";
import { getStoredSiteMode, setStoredSiteMode, type SiteMode } from "@/lib/site-mode";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Latino Connect" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AdminPage,
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

function AdminPage() {
  const fetchList = useServerFn(listWaitlist);
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetchList({ data: { password } });
      if (res.ok) {
        setRows(res.rows as Row[]);
        setAuthed(true);
      } else {
        setError(res.error);
      }
    } catch {
      setError("Erro ao conectar.");
    } finally {
      setLoading(false);
    }
  };

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

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#1A5336]/10 text-[#1A5336] flex items-center justify-center mx-auto mb-4">
            <Lock size={20} />
          </div>
          <h1 className="text-xl font-extrabold text-center text-gray-900 mb-1">Painel administrativo</h1>
          <p className="text-sm text-gray-500 text-center mb-6">Digite a senha para acessar a lista de espera.</p>
          <input
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A5336] focus:ring-1 focus:ring-[#1A5336]"
          />
          {error && <p className="text-xs font-semibold text-red-600 mt-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[#1A5336] hover:bg-[#123F27] disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Entrar
          </button>
          <Link to="/" className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-4">
            ← Voltar ao site
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-gray-500 hover:text-gray-900 font-bold text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" /> Voltar ao site
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500">Gerenciamento da Lista de Espera Latino Connect</p>
          </div>
          <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Users size={20} className="text-[#1A5336]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Total Registrados</p>
              <p className="text-xl font-black text-gray-900">{rows.length}</p>
            </div>
          </div>
        </div>

        <SiteModePanel />

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-gray-50">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar negócio, e-mail..."
                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm outline-none focus:border-[#1A5336]"
              />
            </div>
            <button
              onClick={exportCsv}
              className="text-sm font-semibold text-[#1A5336] bg-[#EBF4ED] border border-[#1A5336]/20 px-3 py-1.5 rounded-lg hover:bg-[#1A5336]/10 flex items-center gap-2 transition-colors"
            >
              <Download size={16} /> Exportar CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="p-4 font-bold">Negócio</th>
                  <th className="p-4 font-bold">Responsável</th>
                  <th className="p-4 font-bold">WhatsApp</th>
                  <th className="p-4 font-bold">E-mail</th>
                  <th className="p-4 font-bold">Categoria</th>
                  <th className="p-4 font-bold">Data</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      Nenhum registro ainda.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-900">{r.business_name}</td>
                      <td className="p-4 text-gray-600">{r.owner_name}</td>
                      <td className="p-4 text-gray-600 font-medium">{r.whatsapp_number}</td>
                      <td className="p-4 text-gray-500">{r.email}</td>
                      <td className="p-4 text-gray-500">{r.service_category}</td>
                      <td className="p-4 text-gray-400 text-xs">
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
    </div>
  );
}
