import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/accept-invite")({
  head: () => ({
    meta: [
      { title: "Aceitar convite — Latino Connect" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AcceptInvitePage,
});

type Status = "loading" | "ready" | "no-session" | "saving" | "done" | "error";

function AcceptInvitePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Supabase auto-detects the invite/recovery token in the URL hash on load.
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      // Give detectSessionInUrl a tick to consume the hash.
      await new Promise((r) => setTimeout(r, 100));
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.user) {
        setStatus("no-session");
        return;
      }
      setEmail(session.user.email ?? null);
      const meta = (session.user.user_metadata ?? {}) as { full_name?: string };
      if (meta.full_name) setFullName(meta.full_name);
      setStatus("ready");
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setStatus("saving");
    const { error: updErr } = await supabase.auth.updateUser({
      password,
      data: fullName ? { full_name: fullName } : undefined,
    });
    if (updErr) {
      setError(updErr.message);
      setStatus("ready");
      return;
    }
    setStatus("done");

    // Route by role.
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    let target: "/admin" | "/dashboard" = "/dashboard";
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      if (profile?.role === "admin" || profile?.role === "manager") target = "/admin";
    }
    navigate({ to: target });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-[#1A5336]/10 text-[#1A5336] flex items-center justify-center mb-4">
          <ShieldCheck size={20} />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Aceitar convite</h1>
        <p className="text-sm text-gray-500 mt-1">
          Defina uma senha para acessar o painel administrativo.
        </p>

        {status === "loading" && (
          <div className="mt-8 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="animate-spin" size={16} /> Validando convite...
          </div>
        )}

        {status === "no-session" && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            Convite inválido ou expirado. Peça ao administrador para reenviar o convite.
          </div>
        )}

        {(status === "ready" || status === "saving" || status === "done") && (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {email && (
              <div className="text-xs text-gray-500">
                Conta: <span className="font-semibold text-gray-900">{email}</span>
              </div>
            )}
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Nome completo</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A5336]"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Nova senha</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A5336]"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Confirmar senha</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A5336]"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={status === "saving" || status === "done"}
              className="w-full bg-[#1A5336] hover:bg-[#123F27] disabled:opacity-60 text-white font-bold rounded-xl py-3 text-sm"
            >
              {status === "saving" ? "Salvando..." : status === "done" ? "Redirecionando..." : "Definir senha e entrar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
