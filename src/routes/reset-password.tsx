import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Latino Connect" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setChecking(false);
    });
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("A senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) {
        setError(updErr.message);
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate({ to: "/dashboard" }), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell>
      <section className="max-w-md mx-auto px-6 py-12 md:py-20">
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">
          <h1 className="text-2xl font-black text-white">Definir nova senha</h1>

          {checking ? (
            <div className="mt-8 flex justify-center">
              <Loader2 className="h-6 w-6 text-[#facc15] animate-spin" />
            </div>
          ) : !hasSession ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-neutral-300">
                Seu link de redefinição é inválido ou expirou. Solicite um novo link.
              </p>
              <Link
                to="/forgot-password"
                className="block w-full text-center bg-[#facc15] hover:bg-yellow-300 text-black font-bold rounded-xl py-3 text-sm transition"
              >
                Solicitar novo link
              </Link>
            </div>
          ) : success ? (
            <p className="mt-6 text-sm text-green-300">
              Senha atualizada! Redirecionando para o painel...
            </p>
          ) : (
            <form className="space-y-4 mt-6" onSubmit={onSubmit}>
              <p className="text-sm text-neutral-400">
                Escolha uma nova senha de no mínimo 8 caracteres.
              </p>
              <div>
                <label className="text-xs font-bold uppercase text-neutral-400">Nova senha</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#facc15]/50"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-neutral-400">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#facc15]/50"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="block w-full text-center bg-[#facc15] hover:bg-yellow-300 disabled:opacity-60 text-black font-bold rounded-xl py-3 text-sm transition"
              >
                {loading ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
