import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, FolderTree } from "lucide-react";
import { CATEGORIES } from "@/lib/mock/categories";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategoriesPage,
});

type Row = { key: string; name: string; blurb: string; count: number };

function AdminCategoriesPage() {
  const [rows, setRows] = useState<Row[]>(
    CATEGORIES.map((c) => ({ key: c.key, name: c.name, blurb: c.blurb, count: c.count })),
  );
  const [name, setName] = useState("");
  const [blurb, setBlurb] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setRows((r) => [...r, { key, name: name.trim(), blurb: blurb.trim() || "—", count: 0 }]);
    setName("");
    setBlurb("");
  };

  const remove = (key: string) => setRows((r) => r.filter((x) => x.key !== key));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Categorias</h1>
        <p className="text-gray-500 mt-1">Adicione ou remova categorias visíveis no site.</p>
      </div>

      <form
        onSubmit={add}
        className="bg-white border border-gray-200 rounded-3xl p-6 grid md:grid-cols-[1fr_1.5fr_auto] gap-3"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da categoria"
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A5336]"
        />
        <input
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
          placeholder="Descrição curta (ex: Igrejas, ONGs, Grupos…)"
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A5336]"
        />
        <button
          type="submit"
          className="bg-[#1A5336] hover:bg-[#123F27] text-white font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2"
        >
          <Plus size={16} /> Adicionar
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <th className="p-4 font-bold">Categoria</th>
              <th className="p-4 font-bold">Descrição</th>
              <th className="p-4 font-bold">Negócios</th>
              <th className="p-4 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.key} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-2 font-bold text-gray-900">
                    <FolderTree size={14} className="text-gray-400" /> {r.name}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">/{r.key}</p>
                </td>
                <td className="p-4 text-gray-600">{r.blurb}</td>
                <td className="p-4 text-gray-600 font-semibold">{r.count}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => remove(r.key)}
                    className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
