import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Trash2, Shield } from "lucide-react";
import { getAdminManagers, inviteManager, removeManager } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/managers")({
  component: AdminManagersPage,
});

type RoleValue = "manager" | "admin";

function AdminManagersPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleValue>("manager");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const qc = useQueryClient();
  const fetchList = useServerFn(getAdminManagers);
  const inviteFn = useServerFn(inviteManager);
  const removeFn = useServerFn(removeManager);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "managers"],
    queryFn: () => fetchList(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "managers"] });

  const inviteMut = useMutation({
    mutationFn: (payload: { name: string; email: string; role: RoleValue }) =>
      inviteFn({
        data: {
          ...payload,
          redirectTo: "https://latinonz.lovable.app/auth/accept-invite",
        },
      }),
    onSuccess: (res) => {
      setName(""); setEmail(""); setRole("manager"); setError(null);
      const msg =
        res.status === "magic_link_sent"
          ? "User already had an account — a magic-link sign-in email was sent."
          : res.status === "promoted_only"
            ? res.warning ?? "User already existed; role was promoted but no email was sent."
            : "Invite email sent.";
      setInfo(msg);
      invalidate();
    },
    onError: (e: Error) => { setInfo(null); setError(e.message); },
  });

  const removeMut = useMutation({
    mutationFn: (userId: string) => removeFn({ data: { userId } }),
    onSuccess: invalidate,
    onError: (e: Error) => { setInfo(null); setError(e.message); },
  });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    inviteMut.mutate({ name: name.trim(), email: email.trim(), role });
  };

  const list = data?.managers ?? [];

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
          required
          placeholder="email@exemplo.com"
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A5336]"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as RoleValue)}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A5336]"
        >
          <option value="manager">Gerente</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          disabled={inviteMut.isPending}
          className="bg-[#1A5336] hover:bg-[#123F27] text-white font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 disabled:opacity-50"
        >
          <UserPlus size={16} /> {inviteMut.isPending ? "Convidando..." : "Convidar"}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}
      {info && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl">
          {info}
        </div>
      )}

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
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Carregando...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum gerente cadastrado.</td></tr>
            ) : list.map((m) => {
              const displayName = m.name ?? m.email ?? "—";
              const initial = (m.name ?? m.email ?? "?").charAt(0).toUpperCase();
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1A5336] text-white font-bold flex items-center justify-center text-sm">
                        {initial}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{displayName}</span>
                        {m.name && m.email && (
                          <span className="text-xs text-gray-400">{m.email}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{m.email ?? "—"}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
                        m.role === "admin"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-[#1A5336]/10 text-[#1A5336] border-[#1A5336]/20"
                      }`}
                    >
                      <Shield size={12} /> {m.role === "admin" ? "Admin" : "Gerente"}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-xs">
                    {new Date(m.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      disabled={removeMut.isPending}
                      onClick={() => removeMut.mutate(m.id)}
                      className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <Trash2 size={12} /> Remover
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
