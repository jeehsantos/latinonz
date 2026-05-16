import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, Trash2, Shield } from "lucide-react";

export const Route = createFileRoute("/admin/managers")({
  component: AdminManagersPage,
});

type Manager = {
  id: string;
  name: string;
  email: string;
  role: "manager" | "viewer";
  createdAt: string;
};

const SEED: Manager[] = [
  { id: "1", name: "Ana Silva", email: "ana@latinoconnecthub.co.nz", role: "manager", createdAt: "2026-04-12" },
  { id: "2", name: "Carlos Mendez", email: "carlos@latinoconnecthub.co.nz", role: "viewer", createdAt: "2026-05-02" },
];

function AdminManagersPage() {
  const [list, setList] = useState<Manager[]>(SEED);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Manager["role"]>("manager");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setList((l) => [
      ...l,
      { id: crypto.randomUUID(), name: name.trim(), email: email.trim(), role, createdAt: new Date().toISOString().slice(0, 10) },
    ]);
    setName("");
    setEmail("");
    setRole("manager");
  };

  const remove = (id: string) => setList((l) => l.filter((x) => x.id !== id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Gerentes do site</h1>
        <p className="text-gray-500 mt-1">
          Convide membros com acesso restrito ao painel administrativo.
        </p>
      </div>

      <form
        onSubmit={add}
        className="bg-white border border-gray-200 rounded-3xl p-6 grid md:grid-cols-[1fr_1.5fr_auto_auto] gap-3"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome"
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A5336]"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="email@exemplo.com"
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A5336]"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Manager["role"])}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A5336]"
        >
          <option value="manager">Gerente</option>
          <option value="viewer">Visualizador</option>
        </select>
        <button
          type="submit"
          className="bg-[#1A5336] hover:bg-[#123F27] text-white font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2"
        >
          <UserPlus size={16} /> Convidar
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <th className="p-4 font-bold">Pessoa</th>
              <th className="p-4 font-bold">E-mail</th>
              <th className="p-4 font-bold">Função</th>
              <th className="p-4 font-bold">Adicionado em</th>
              <th className="p-4 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {list.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1A5336] text-white font-bold flex items-center justify-center text-sm">
                      {m.name[0]}
                    </div>
                    <span className="font-bold text-gray-900">{m.name}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-600">{m.email}</td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
                      m.role === "manager"
                        ? "bg-[#1A5336]/10 text-[#1A5336] border-[#1A5336]/20"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    <Shield size={12} /> {m.role === "manager" ? "Gerente" : "Visualizador"}
                  </span>
                </td>
                <td className="p-4 text-gray-400 text-xs">
                  {new Date(m.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => remove(m.id)}
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
