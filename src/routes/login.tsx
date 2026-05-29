import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { useI18n, usePageMetadata } from "@/lib/i18n";
import { signIn } from "@/lib/auth.functions";
import { supabase } from "@/integrations/supabase/client";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Latino Connect" },
      { name: "description", content: "Acesse o painel do seu perfil Latino Connect." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useI18n();
  usePageMetadata("metadata.login.title", "metadata.login.description");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn({ data: { email, password } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: res.session.access_token,
        refresh_token: res.session.refresh_token,
      });
      if (sessionErr) {
        setError(sessionErr.message);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", res.user.id)
        .maybeSingle();
      const isStaff = profile?.role === "admin" || profile?.role === "manager";
      navigate({ to: isStaff ? "/admin" : "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.unexpected_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell>
      <section className="max-w-md mx-auto px-6 py-20">
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">
          <h1 className="text-2xl font-black text-white">{t("login.title")}</h1>
          <p className="text-sm text-neutral-400 mt-1">{t("login.subtitle")}</p>

          <div className="mt-6">
            <GoogleAuthButton label={t("auth.google_login")} onError={setError} />
          </div>
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs uppercase tracking-wider text-neutral-500">{t("auth.or")}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-xs font-bold uppercase text-neutral-400">
                {t("login.email")}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#facc15]/50"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-neutral-400">
                {t("login.password")}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#facc15]/50"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="block w-full text-center bg-[#facc15] hover:bg-yellow-300 disabled:opacity-60 text-black font-bold rounded-xl py-3 text-sm transition"
            >
              {loading ? "..." : t("login.submit")}
            </button>
          </form>
          <p className="text-xs text-neutral-400 text-center mt-4">
            {t("login.no_account")}{" "}
            <Link to="/cadastro" className="font-bold text-[#facc15] hover:text-yellow-300">
              {t("login.register_link")}
            </Link>
          </p>
        </div>
      </section>

    </SiteShell>
  );
}
