import { createFileRoute } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/mock/categories";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfileEditor,
});

function ProfileEditor() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Perfil do negócio</h1>
        <p className="text-gray-500 mt-1">Como o seu negócio aparece no diretório público.</p>
      </div>
      <form className="bg-white border border-gray-200 rounded-3xl p-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="text-xs font-bold uppercase text-gray-500">Nome do negócio</label>
          <input defaultValue="Tacos do Chef" className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-gray-500">Descrição</label>
          <textarea rows={4} defaultValue="Autêntica comida mexicana com ingredientes frescos." className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Categoria</label>
            <select className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm">
              {CATEGORIES.map((c) => <option key={c.key}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Cidade</label>
            <input defaultValue="Auckland" className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Telefone</label>
            <input className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Site</label>
            <input className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
        </div>
        <button className="bg-[#1A5336] hover:bg-[#123F27] text-white font-bold rounded-xl px-6 py-2.5 text-sm">
          Salvar alterações
        </button>
      </form>
    </div>
  );
}
