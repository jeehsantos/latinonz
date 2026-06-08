import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { requestPasswordReset } from "@/lib/auth.functions";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Latino Connect" },
      { name: "description", content: "Receba um link para redefinir sua senha." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await requestPasswordReset({
        data: { email, siteOrigin: window.location.origin },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell>
      <section className="max-w-md mx-auto px-6 py-12 md:py-20">
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">
          <h1 className="text-2xl font-black text-white">Recuperar senha</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Informe seu e-mail e enviaremos um link para criar uma nova senha.
          </p>

          {sent ? (
            <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">
              Se este e-mail estiver cadastrado, você receberá um link de redefinição em
              instantes. Verifique também sua caixa de spam.
            </div>
          ) : (
            <form className="space-y-4 mt-6" onSubmit={onSubmit}>
              <div>
                <label className="text-xs font-bold uppercase text-neutral-400">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#facc15]/50"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="block w-full text-center bg-[#facc15] hover:bg-yellow-300 disabled:opacity-60 text-black font-bold rounded-xl py-3 text-sm transition"
              >
                {loading ? "Enviando..." : "Enviar link de redefinição"}
              </button>
            </form>
          )}

          <p className="text-xs text-neutral-400 text-center mt-4">
            Lembrou da senha?{" "}
            <Link to="/login" className="font-bold text-[#facc15] hover:text-yellow-300">
              Entrar
            </Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
