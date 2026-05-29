import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { UserCog, KeyRound, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/account")({
  component: AdminAccountPage,
});

function AdminAccountPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      setEmail(user.email ?? null);
      const meta = (user.user_metadata ?? {}) as { full_name?: string };
      setFullName(meta.full_name ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      setRole(profile?.role ?? null);
    };
    load();
  }, []);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() || null },
    });
    setSavingProfile(false);
    if (error) {
      setProfileMsg({ type: "err", text: error.message });
    } else {
      setProfileMsg({ type: "ok", text: "Perfil atualizado com sucesso." });
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (password.length < 8) {
      setPwMsg({ type: "err", text: "A senha deve ter no mínimo 8 caracteres." });
      return;
    }
    if (password !== confirm) {
      setPwMsg({ type: "err", text: "As senhas não coincidem." });
      return;
    }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPw(false);
    if (error) {
      setPwMsg({ type: "err", text: error.message });
    } else {
      setPassword("");
      setConfirm("");
      setPwMsg({ type: "ok", text: "Senha alterada com sucesso." });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-black text-white">Minha conta</h1>
        <p className="text-neutral-400 mt-1">
          Atualize seus dados de acesso ao painel administrativo.
        </p>
      </div>

      <form
        onSubmit={saveProfile}
        className="bg-neutral-900 border border-white/10 rounded-3xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2 text-white">
          <UserCog size={18} />
          <h2 className="font-bold">Perfil</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-neutral-400">E-mail</label>
            <input
              value={email ?? ""}
              disabled
              className="mt-1 w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-neutral-400"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-neutral-400">Função</label>
            <input
              value={role ?? ""}
              disabled
              className="mt-1 w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-neutral-400 capitalize"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-neutral-400">Nome completo</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#facc15]"
          />
        </div>
        {profileMsg && (
          <p
            className={`text-sm ${profileMsg.type === "ok" ? "text-emerald-700" : "text-red-600"}`}
          >
            {profileMsg.text}
          </p>
        )}
        <button
          type="submit"
          disabled={savingProfile}
          className="bg-neutral-900 hover:bg-white/5 disabled:opacity-60 text-[#facc15] font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 text-sm"
        >
          <Save size={16} /> {savingProfile ? "Salvando..." : "Salvar perfil"}
        </button>
      </form>

      <form
        onSubmit={savePassword}
        className="bg-neutral-900 border border-white/10 rounded-3xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2 text-white">
          <KeyRound size={18} />
          <h2 className="font-bold">Alterar senha</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-neutral-400">Nova senha</label>
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#facc15]"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-neutral-400">Confirmar senha</label>
            <input
              type="password"
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#facc15]"
            />
          </div>
        </div>
        {pwMsg && (
          <p className={`text-sm ${pwMsg.type === "ok" ? "text-emerald-700" : "text-red-600"}`}>
            {pwMsg.text}
          </p>
        )}
        <button
          type="submit"
          disabled={savingPw}
          className="bg-neutral-900 hover:bg-white/5 disabled:opacity-60 text-[#facc15] font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 text-sm"
        >
          <KeyRound size={16} /> {savingPw ? "Salvando..." : "Atualizar senha"}
        </button>
      </form>
    </div>
  );
}
