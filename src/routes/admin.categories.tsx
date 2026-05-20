import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, FolderTree, Loader2 } from "lucide-react";
import {
  listAdminCategories,
  createAdminCategory,
  deleteAdminCategory,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const [name, setName] = useState("");
  const [blurb, setBlurb] = useState("");
  const [error, setError] = useState<string | null>(null);

  const qc = useQueryClient();
  const fetchList = useServerFn(listAdminCategories);
  const createFn = useServerFn(createAdminCategory);
  const deleteFn = useServerFn(deleteAdminCategory);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => fetchList(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "categories"] });

  const createMut = useMutation({
    mutationFn: (payload: { name: string; blurb: string }) => createFn({ data: payload }),
    onSuccess: () => {
      setName(""); setBlurb(""); setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMut.mutate({ name: name.trim(), blurb: blurb.trim() });
  };

  const rows = data?.categories ?? [];

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
          disabled={createMut.isPending}
          className="bg-[#1A5336] hover:bg-[#123F27] text-white font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={16} /> {createMut.isPending ? "Adicionando..." : "Adicionar"}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

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
            {isLoading ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400">
                <Loader2 size={16} className="animate-spin inline mr-2" /> Carregando...
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhuma categoria cadastrada.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-2 font-bold text-gray-900">
                    <FolderTree size={14} className="text-gray-400" /> {r.name}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">/{r.key}</p>
                </td>
                <td className="p-4 text-gray-600">{r.blurb || "—"}</td>
                <td className="p-4 text-gray-600 font-semibold">{r.count}</td>
                <td className="p-4 text-right">
                  <button
                    disabled={deleteMut.isPending}
                    onClick={() => deleteMut.mutate(r.id)}
                    className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 disabled:opacity-50"
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
