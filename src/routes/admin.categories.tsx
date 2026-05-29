import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Pencil, X } from "lucide-react";
import {
  listAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from "@/lib/admin.functions";
import {
  ICON_KEYS,
  ICON_MAP,
  COLOR_KEYS,
  COLOR_MAP,
  type IconKey,
  type ColorKey,
} from "@/lib/category-icons";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategoriesPage,
});

type FormState = {
  id?: string;
  namePt: string;
  nameEs: string;
  nameEn: string;
  blurbPt: string;
  blurbEs: string;
  blurbEn: string;
  iconKey: IconKey;
  colorKey: ColorKey;
  sortOrder: number;
  kind: "service" | "product";
};

const EMPTY_FORM: FormState = {
  namePt: "",
  nameEs: "",
  nameEn: "",
  blurbPt: "",
  blurbEs: "",
  blurbEn: "",
  iconKey: "briefcase",
  colorKey: "slate",
  sortOrder: 0,
  kind: "service",
};

function AdminCategoriesPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const qc = useQueryClient();
  const fetchList = useServerFn(listAdminCategories);
  const createFn = useServerFn(createAdminCategory);
  const updateFn = useServerFn(updateAdminCategory);
  const deleteFn = useServerFn(deleteAdminCategory);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => fetchList(),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    qc.invalidateQueries({ queryKey: ["categories", "public"] });
  };

  const saveMut = useMutation({
    mutationFn: async (payload: FormState) => {
      if (payload.id) {
        return updateFn({ data: { ...payload, id: payload.id } });
      }
      // Strip id field for create
      const { id: _omit, ...rest } = payload;
      void _omit;
      return createFn({ data: rest });
    },
    onSuccess: () => {
      setOpen(false);
      setForm(EMPTY_FORM);
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError(null);
    setOpen(true);
  };
  const openEdit = (r: NonNullable<typeof data>["categories"][number]) => {
    setForm({
      id: r.id,
      namePt: r.namePt,
      nameEs: r.nameEs,
      nameEn: r.nameEn,
      blurbPt: r.blurbPt,
      blurbEs: r.blurbEs,
      blurbEn: r.blurbEn,
      iconKey: r.iconKey as IconKey,
      colorKey: r.colorKey as ColorKey,
      sortOrder: r.sortOrder,
      kind: (r as { kind?: "service" | "product" }).kind ?? "service",
    });
    setError(null);
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.namePt.trim()) {
      setError("Nome em português é obrigatório.");
      return;
    }
    saveMut.mutate(form);
  };

  const rows = data?.categories ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Categorias</h1>
          <p className="text-gray-500 mt-1">
            Cadastre categorias com ícone e traduções para PT / ES / EN.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-white hover:bg-gray-100 text-[#facc15] font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2"
        >
          <Plus size={16} /> Nova categoria
        </button>
      </div>

      {error && !open && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <th className="p-4 font-bold">Categoria</th>
              <th className="p-4 font-bold">Ícone</th>
              <th className="p-4 font-bold">Traduções</th>
              <th className="p-4 font-bold">Negócios</th>
              <th className="p-4 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  <Loader2 size={16} className="animate-spin inline mr-2" /> Carregando...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  Nenhuma categoria cadastrada.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const Icon =
                  ICON_MAP[
                    (r.iconKey as IconKey) in ICON_MAP ? (r.iconKey as IconKey) : "briefcase"
                  ];
                const color =
                  COLOR_MAP[
                    (r.colorKey as ColorKey) in COLOR_MAP ? (r.colorKey as ColorKey) : "slate"
                  ];
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{r.namePt}</div>
                      <p className="text-xs text-gray-400 mt-0.5">/{r.key}</p>
                      {r.blurbPt && <p className="text-xs text-gray-500 mt-1">{r.blurbPt}</p>}
                    </td>
                    <td className="p-4">
                      <div
                        className={`w-10 h-10 rounded-2xl ${color.bg} ${color.text} flex items-center justify-center`}
                      >
                        <Icon size={18} />
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-600 space-y-0.5">
                      <div>
                        <span className="font-bold text-gray-700">ES:</span>{" "}
                        {r.nameEs || <span className="text-gray-300">—</span>}
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">EN:</span>{" "}
                        {r.nameEn || <span className="text-gray-300">—</span>}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 font-semibold">{r.count}</td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openEdit(r)}
                        className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                      >
                        <Pencil size={12} /> Editar
                      </button>
                      <button
                        disabled={deleteMut.isPending}
                        onClick={() => {
                          if (confirm(`Remover "${r.namePt}"?`)) deleteMut.mutate(r.id);
                        }}
                        className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        <Trash2 size={12} /> Remover
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-auto">
          <form
            onSubmit={submit}
            className="bg-white rounded-3xl w-full max-w-3xl my-8 max-h-[90vh] overflow-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl">
              <h2 className="text-xl font-extrabold text-gray-900">
                {form.id ? "Editar categoria" : "Nova categoria"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Kind: Service vs Product */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Tipo
                </p>
                <div className="inline-flex bg-gray-100 rounded-xl p-1">
                  {(["service", "product"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setForm({ ...form, kind: k })}
                      className={`px-4 py-1.5 text-sm font-bold rounded-lg transition ${
                        form.kind === k
                          ? "bg-white text-[#facc15] shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {k === "service" ? "Serviço" : "Produto"}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Define em qual aba (Serviço / Produto) esta categoria aparece no cadastro de
                  negócios.
                </p>
              </div>

              {/* Translations */}
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Traduções
                </p>
                {(["pt", "es", "en"] as const).map((lng) => {
                  const labels = { pt: "Português", es: "Español", en: "English" }[lng];
                  const nameField = `name${lng.charAt(0).toUpperCase() + lng.slice(1)}` as
                    | "namePt"
                    | "nameEs"
                    | "nameEn";
                  const blurbField = `blurb${lng.charAt(0).toUpperCase() + lng.slice(1)}` as
                    | "blurbPt"
                    | "blurbEs"
                    | "blurbEn";
                  return (
                    <div key={lng} className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-600">
                          {labels} — Nome {lng === "pt" && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          value={form[nameField]}
                          onChange={(e) => setForm({ ...form, [nameField]: e.target.value })}
                          className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#facc15]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-600">
                          {labels} — Descrição curta
                        </label>
                        <input
                          value={form[blurbField]}
                          onChange={(e) => setForm({ ...form, [blurbField]: e.target.value })}
                          className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#facc15]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Icon picker */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Ícone
                </p>
                <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
                  {ICON_KEYS.map((k) => {
                    const I = ICON_MAP[k];
                    const active = form.iconKey === k;
                    return (
                      <button
                        type="button"
                        key={k}
                        onClick={() => setForm({ ...form, iconKey: k })}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center border transition ${
                          active
                            ? "bg-[#facc15] text-white border-[#facc15]"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#facc15]"
                        }`}
                        title={k}
                      >
                        <I size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Cor</p>
                <div className="flex flex-wrap gap-2">
                  {COLOR_KEYS.map((k) => {
                    const c = COLOR_MAP[k];
                    const active = form.colorKey === k;
                    return (
                      <button
                        type="button"
                        key={k}
                        onClick={() => setForm({ ...form, colorKey: k })}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-2 ${
                          active ? "border-[#facc15] ring-2 ring-[#facc15]/30" : "border-gray-200"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-md ${c.bg} ${c.text} flex items-center justify-center`}
                        >
                          <span className="w-2 h-2 rounded-sm bg-current" />
                        </span>
                        {k}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort order */}
              <div className="max-w-xs">
                <label className="text-xs font-bold text-gray-600">Ordem de exibição</label>
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
                  className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#facc15]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-6 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-3xl">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saveMut.isPending}
                className="bg-white hover:bg-gray-100 text-[#facc15] font-bold px-5 py-2 rounded-xl text-sm disabled:opacity-50 inline-flex items-center gap-2"
              >
                {saveMut.isPending && <Loader2 size={14} className="animate-spin" />}
                {form.id ? "Salvar alterações" : "Criar categoria"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
